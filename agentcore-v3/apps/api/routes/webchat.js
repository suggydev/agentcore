const express = require('express');
const axios = require('axios');
const { z } = require('zod');
const { prisma } = require('../prisma-client');
const config = require('../config');
const { webchatAuth } = require('../middleware/auth');
const { aiLimiter } = require('../middleware/rateLimit');
const { fetchModels, routeToModel } = require('../services/suggy');
const { safeError } = require('../utils/errors');

const router = express.Router();

const webchatMessageSchema = z.object({
  workspaceId: z.string().min(1),
  agentId: z.string().optional(),
  sessionId: z.string().optional(),
  content: z.string().min(1),
  customerName: z.string().optional(),
  customerEmail: z.string().email().optional().or(z.literal(''))
});

router.get('/config', async (req, res) => {
  try {
    const workspaceId = req.query.workspaceId;
    if (!workspaceId) return res.status(400).json({ error: 'workspaceId required' });

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { id: true, name: true, settings: true }
    });
    if (!workspace) return res.status(404).json({ error: 'Workspace not found' });

    const settings = workspace.settings && typeof workspace.settings === 'object' ? workspace.settings : {};
    res.json({
      workspaceId: workspace.id,
      workspaceName: workspace.name,
      theme: settings.theme || 'light',
      primaryColor: settings.primaryColor || '#6E56CF',
      welcomeMessage: settings.welcomeMessage || 'Привет! Чем могу помочь?',
      agentName: settings.agentName || 'AI-ассистент',
    });
  } catch (err) {
    safeError(res, err);
  }
});

router.post('/message', webchatAuth, aiLimiter, async (req, res) => {
  try {
    const parsed = webchatMessageSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation error', details: parsed.error.flatten() });
    }
    const { workspaceId, agentId, sessionId, content } = parsed.data;

    let agent;
    if (agentId) {
      agent = await prisma.agent.findFirst({ where: { id: agentId, workspaceId } });
    }
    if (!agent) {
      agent = await prisma.agent.findFirst({ where: { workspaceId, isActive: true } });
    }

    let conversation = await prisma.conversation.findFirst({
      where: { workspaceId, title: `WebChat: ${sessionId || 'anonymous'}` }
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          title: `WebChat: ${sessionId || 'anonymous'}`,
          workspaceId,
          agentId: agent?.id || null
        }
      });
    }

    const count = await prisma.message.count({ where: { conversationId: conversation.id } });
    await prisma.message.create({
      data: {
        content,
        role: 'user',
        order: count,
        conversationId: conversation.id
      }
    });

    const models = await fetchModels();
    const selectedModel = agent?.model ||
      (routeToModel('customer support', content, models)?.id) ||
      'accounts/fireworks/models/glm-5p1';

    const history = await prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { order: 'asc' }
    });

    let systemPrompt = agent?.systemPrompt || 'You are a helpful customer support AI assistant. Be friendly, concise, and helpful.';

    const knowledgeDocs = await prisma.knowledgeDocument.findMany({
      where: { workspaceId },
      select: { title: true, content: true }
    });

    if (knowledgeDocs.length > 0) {
      const kbContext = knowledgeDocs.map(d => `## ${d.title}\n${d.content}`).join('\n\n');
      const kbPrompt = `Ниже представлена база знаний компании. Используй эту информацию для ответов на вопросы клиентов:\n\n${kbContext}`;
      systemPrompt = `${systemPrompt}\n\n${kbPrompt}`;
    }

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.map(m => ({ role: m.role, content: m.content }))
    ];

    try {
      const aiResponse = await axios.post(
        `${config.SUGGY_BASE_URL}/chat/completions`,
        {
          model: selectedModel,
          messages,
          temperature: 0.7,
          max_tokens: 1500
        },
        {
          headers: {
            'Authorization': `Bearer ${config.SUGGY_PROJECT_KEY}`,
            'Content-Type': 'application/json',
            'X-Account-Id': config.SUGGY_ACCOUNT_ID
          },
          timeout: 45000
        }
      );

      const aiContent = aiResponse.data.choices?.[0]?.message?.content || 'Sorry, I could not process your request.';
      await prisma.message.create({
        data: {
          content: aiContent,
          role: 'assistant',
          model: selectedModel,
          order: count + 1,
          conversationId: conversation.id
        }
      });

      res.json({ response: aiContent, model_used: selectedModel, conversationId: conversation.id });
    } catch (aiErr) {
      console.error('WebChat AI error:', aiErr.code || aiErr.response?.status || aiErr.message);
      if (aiErr.code === 'ECONNABORTED') {
        return res.status(504).json({ error: 'Превышено время ожидания от AI-модели' });
      }
      if (aiErr.response?.status === 429) {
        return res.status(429).json({ error: 'Слишком много запросов. Подождите.' });
      }
      safeError(res, aiErr, 502, 'AI service unavailable');
    }
  } catch (err) {
    console.error('WebChat error:', err);
    safeError(res, err, 400, 'Failed to process webchat message');
  }
});

module.exports = router;
