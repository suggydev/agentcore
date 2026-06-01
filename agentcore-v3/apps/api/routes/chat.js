const express = require('express');
const axios = require('axios');
const { z } = require('zod');
const { prisma } = require('../prisma-client');
const config = require('../config');
const { authenticate } = require('../middleware/auth');
const { checkTrial } = require('../middleware/auth');
const { aiLimiter } = require('../middleware/rateLimit');
const { fetchModels, routeToModel } = require('../services/suggy');
const { safeError } = require('../utils/errors');

const router = express.Router();

const messageItemSchema = z.object({
  role: z.enum(['system', 'user', 'assistant', 'tool']),
  content: z.string()
});

const completionsSchema = z.object({
  messages: z.array(messageItemSchema).min(1),
  model: z.string().optional(),
  agentId: z.string().uuid().optional(),
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

router.post('/completions', authenticate, checkTrial, aiLimiter, async (req, res) => {
  try {
    const parsed = completionsSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation error', details: parsed.error.flatten() });
    }
    const { messages, model, agentId, temperature, max_tokens: maxTokens, stream } = parsed.data;

    let selectedModel = model;

    if (!selectedModel && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      const models = await fetchModels();
      const routed = routeToModel(lastMessage.role, lastMessage.content, models);
      selectedModel = routed ? routed.id : 'accounts/fireworks/models/glm-5p1';
    }

    if (!selectedModel && agentId) {
      const agent = await prisma.agent.findFirst({
        where: { id: agentId, workspaceId: req.user.workspaceId }
      });
      if (agent && agent.model) {
        selectedModel = agent.model;
      }
    }

    const response = await axios.post(
      `${config.SUGGY_BASE_URL}/chat/completions`,
      {
        model: selectedModel,
        messages,
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

    const conversation = await prisma.conversation.create({
      data: {
        workspaceId: req.user.workspaceId,
        agentId: agentId || null,
        title: messages[0]?.content?.substring(0, 50) || 'New Chat',
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

      response.data.on('data', (chunk) => {
        const text = chunk.toString();
        const lines = text.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) fullContent += delta;
            } catch {}
          }
        }
      });

      response.data.on('end', async () => {
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
      ...response.data,
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
    if (err.response?.status === 429) {
      return res.status(429).json({ error: 'Слишком много запросов. Подождите.' });
    }
    safeError(res, err, 502, 'AI service unavailable');
  }
});

router.post('/images/generations', authenticate, checkTrial, aiLimiter, async (req, res) => {
  try {
    const parsed = imageGenSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation error', details: parsed.error.flatten() });
    }
    const { prompt, n, size, model } = parsed.data;

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
      ...response.data,
      _meta: { model_used: imageModel }
    });
  } catch (err) {
    console.error('Image generation error:', err.code || err.response?.status || err.message);
    safeError(res, err, 502, 'Image generation service unavailable');
  }
});

module.exports = router;
