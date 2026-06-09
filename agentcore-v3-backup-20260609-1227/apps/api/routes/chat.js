const express = require('express');
const axios = require('axios');
const { z } = require('zod');
const { prisma } = require('../prisma-client');
const config = require('../config');
const { authenticate } = require('../middleware/auth');
const { aiLimiter } = require('../middleware/rateLimit');
const { fetchModels, routeToModel } = require('../services/suggy');
const { safeError } = require('../utils/errors');
const { checkAndDeductCredits } = require('../utils/credits');

const router = express.Router();

const messageItemSchema = z.object({
  role: z.enum(['system', 'user', 'assistant', 'tool']),
  content: z.string()
});

const completionsSchema = z.object({
  messages: z.array(messageItemSchema).min(1),
  model: z.string().optional(),
  agentId: z.string().min(1).optional(),
  temperature: z.number().min(0).max(2).optional().default(0.7),
  max_tokens: z.number().int().min(1).max(32000).optional().default(2000),
  stream: z.boolean().optional().default(false)
});

const imageGenSchema = z.object({
  prompt: z.string().min(1).max(4000),
  n: z.number().int().min(1).max(10).optional().default(1),
  size: z.string().optional().default('1024x1024'),
  model: z.string().optional()
});

// Helper: estimate cost in rubles based on tokens
function estimateCost(usage, model) {
  if (!usage) return 5; // default fallback cost
  const inputTokens = usage.prompt_tokens || 0;
  const outputTokens = usage.completion_tokens || 0;
  // Rough estimation: ~0.001 RUB per token average
  return Math.max(1, Math.round((inputTokens + outputTokens) * 0.001 * 100) / 100);
}

router.post('/completions', authenticate, aiLimiter, async (req, res) => {
  try {
    const parsed = completionsSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation error', details: parsed.error.flatten() });
    }
    const { messages, model, agentId, temperature, max_tokens: maxTokens, stream } = parsed.data;

    let selectedModel = model;

    if (!selectedModel && agentId) {
      const agent = await prisma.agent.findFirst({
        where: { id: agentId, workspaceId: req.user.workspaceId }
      });
      if (agent && agent.model) {
        selectedModel = agent.model;
      }
    }

    if (!selectedModel && messages.length > 0) {
      const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
      const contentToRoute = lastUserMessage?.content || messages[messages.length - 1].content;
      const models = await fetchModels();
      const routed = routeToModel(null, contentToRoute, models);
      selectedModel = routed ? routed.id : 'accounts/fireworks/models/glm-5p1';
    }

    // Inject knowledge base into system message
    let enrichedMessages = messages;
    if (agentId) {
      const knowledgeDocs = await prisma.knowledgeDocument.findMany({
        where: {
          workspaceId: req.user.workspaceId,
          OR: [
            { agentId },
            { agentId: null }
          ]
        },
        select: { content: true },
        take: 20
      });
      if (knowledgeDocs.length > 0) {
        const kbContent = knowledgeDocs.map(d => d.content).join('\n\n');
        const systemMsg = messages.find(m => m.role === 'system');
        if (systemMsg) {
          systemMsg.content = `${systemMsg.content}\n\n=== База знаний ===\n${kbContent}`;
        } else {
          enrichedMessages = [{ role: 'system', content: `=== База знаний ===\n${kbContent}` }, ...messages];
        }
      }
    }

    // Filter out unsupported roles for Suggy API
    const safeMessages = enrichedMessages.filter(m => !['tool'].includes(m.role));
    
    console.log('[Suggy Request]', {
      model: selectedModel,
      messagesCount: safeMessages.length,
      temperature,
      maxTokens,
      accountId: config.SUGGY_ACCOUNT_ID
    });

    const response = await axios.post(
      `${config.SUGGY_BASE_URL}/chat/completions`,
      {
        model: selectedModel,
        messages: safeMessages,
        temperature,
        max_tokens: maxTokens,
        stream
      },
      {
        headers: {
          'Authorization': `Bearer ${config.SUGGY_PROJECT_KEY}`,
          'Content-Type': 'application/json',
          'X-Account-Id': config.SUGGY_ACCOUNT_ID
        },
        timeout: 45000,
        responseType: stream ? 'stream' : 'json'
      }
    );

    const hasCredits = await checkAndDeductCredits(req.user.workspaceId, agentId, 5);
    if (!hasCredits) {
      return res.status(402).json({
        error: 'Недостаточно AI-кредитов',
        message: 'Пополните баланс или подождите следующего месяца для новых бесплатных кредитов.',
        topup_url: '/dashboard/billing'
      });
    }

    // Calculate actual cost and adjust if needed
    const actualCost = estimateCost(response.data?.usage, selectedModel);
    if (actualCost > 5) {
      // Additional deduction for expensive requests
      await prisma.creditConsumptionLog.create({
        data: {
          workspaceId: req.user.workspaceId,
          agentId: agentId || null,
          amount: actualCost - 5,
          reason: 'ai_request_extra',
          model: selectedModel
        }
      });
    }

    const firstUserMsg = messages.find(m => m.role === 'user');
    const title = firstUserMsg?.content?.substring(0, 50) || 'New Chat';
    const conversation = await prisma.conversation.create({
      data: {
        workspaceId: req.user.workspaceId,
        agentId: agentId || null,
        title,
        messages: {
          create: messages.map((m, idx) => ({
            role: m.role,
            content: m.content,
            model: selectedModel,
            order: idx
          }))
        }
      },
      include: { messages: true }
    });

    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      let assistantOrder = messages.length;
      let streamEnded = false;
      let fullContent = '';

      const saveAssistantMessage = async (content) => {
        try {
          await prisma.message.create({
            data: {
              content,
              role: 'assistant',
              model: selectedModel,
              order: assistantOrder,
              conversationId: conversation.id
            }
          });
        } catch (e) {
          console.error('Failed to save streaming message:', e.message);
        }
      };

      let buffer = '';
      response.data.on('data', (chunk) => {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop(); // keep incomplete line in buffer
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) fullContent += delta;
            } catch (parseErr) { console.warn('[Chat] Failed to parse streaming chunk:', data, parseErr.message); }
          }
        }
      });

      response.data.on('end', async () => {
        if (buffer) {
          // process final buffered line
          const line = buffer.trim();
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data !== '[DONE]') {
              try {
                const parsed = JSON.parse(data);
                const delta = parsed.choices?.[0]?.delta?.content;
                if (delta) fullContent += delta;
              } catch (parseErr) { /* ignore final parse error */ }
            }
          }
        }
        if (!streamEnded) {
          streamEnded = true;
          await saveAssistantMessage(fullContent || '[Streaming response - no content received]');
        }
      });

      response.data.on('error', async (err) => {
        console.error('Streaming error:', err.message);
        if (!streamEnded) {
          streamEnded = true;
          await saveAssistantMessage(fullContent || '[Streaming error]');
        }
      });

      response.data.pipe(res);
      return;
    }

    const aiMessage = response.data.choices?.[0]?.message;
    if (aiMessage) {
      await prisma.message.create({
        data: {
          content: aiMessage.content || '',
          role: 'assistant',
          model: selectedModel,
          order: messages.length,
          conversationId: conversation.id
        }
      });
    }

    res.json({
      id: response.data.id,
      object: response.data.object,
      created: response.data.created,
      model: response.data.model,
      choices: response.data.choices,
      usage: response.data.usage,
      _meta: {
        model_used: selectedModel,
        conversation_id: conversation.id
      }
    });
  } catch (err) {
    console.error('Chat completion error:', err.code || err.response?.status || err.message);
    if (err.code === 'ECONNABORTED') {
      return res.status(504).json({ error: 'Превышено время ожидания от AI-модели' });
    }
    const upstreamStatus = err.response?.status;
    if (upstreamStatus === 429 || err.response?.status === 429) {
      return res.status(429).json({ error: 'Слишком много запросов. Подождите.' });
    }
    if (upstreamStatus === 400) {
      return res.status(400).json({ error: 'Invalid request to AI provider', detail: err.response?.data?.error?.message });
    }
    safeError(res, err, upstreamStatus || 502, 'AI service unavailable');
  }
});

router.post('/images/generations', authenticate, aiLimiter, async (req, res) => {
  try {
    const parsed = imageGenSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation error', details: parsed.error.flatten() });
    }
    const { prompt, n, size, model } = parsed.data;

    // Image generation costs 15 RUB
    const hasCredits = await checkAndDeductCredits(req.user.workspaceId, null, 15);
    if (!hasCredits) {
      return res.status(402).json({
        error: 'Недостаточно AI-кредитов',
        message: 'Пополните баланс для генерации изображений.',
        topup_url: '/dashboard/credits'
      });
    }

    const models = await fetchModels();
    const imageModel = model ||
      models.find(m => m.id.includes('flux-1-dev'))?.id ||
      models.find(m => m.id.includes('flux'))?.id ||
      'accounts/fireworks/models/flux-1-dev-fp8';

    const response = await axios.post(
      `${config.SUGGY_BASE_URL}/images/generations`,
      { prompt, n, size, model: imageModel },
      {
        headers: {
          'Authorization': `Bearer ${config.SUGGY_PROJECT_KEY}`,
          'Content-Type': 'application/json',
          'X-Account-Id': config.SUGGY_ACCOUNT_ID
        },
        timeout: 45000
      }
    );

    res.json({
      created: response.data.created,
      data: response.data.data,
      _meta: { model_used: imageModel }
    });
  } catch (err) {
    console.error('Image generation error:', err.code || err.response?.status || err.message);
    const upstreamStatus = err.response?.status;
    if (upstreamStatus === 400) {
      return res.status(400).json({ error: 'Invalid request to image provider', detail: err.response?.data?.error?.message });
    }
    safeError(res, err, upstreamStatus || 502, 'Image generation service unavailable');
  }
});

module.exports = router;
