const express = require('express');
const axios = require('axios');
const { z } = require('zod');
const { prisma } = require('../prisma-client');
const config = require('../config');
const { authenticate } = require('../middleware/auth');
const { checkTrial } = require('../middleware/auth');
const { generalLimiter, aiLimiter } = require('../middleware/rateLimit');
const { fetchModels, routeToModel } = require('../services/suggy');
const { safeError } = require('../utils/errors');

const createConversationSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  agentId: z.string().min(1).optional().nullable()
});

const updateConversationSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  agentId: z.string().min(1).optional().nullable()
});

const messageSchema = z.object({
  content: z.string().min(1),
  role: z.enum(['user', 'assistant', 'system']).optional().default('user'),
  model: z.string().optional()
});

const router = express.Router();

router.get('/', authenticate, generalLimiter, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;
    const [conversations, total] = await Promise.all([
      prisma.conversation.findMany({
        where: { workspaceId: req.user.workspaceId },
        include: { agent: { select: { id: true, name: true } }, _count: { select: { messages: true } } },
        orderBy: { updatedAt: 'desc' },
        skip, take: limit
      }),
      prisma.conversation.count({ where: { workspaceId: req.user.workspaceId } })
    ]);
    res.json({ data: conversations, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    safeError(res, err);
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const parsed = createConversationSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation error', details: parsed.error.flatten() });
    }
    const { title, agentId } = parsed.data;
    const conversation = await prisma.conversation.create({
      data: {
        title: title || 'New Conversation',
        workspaceId: req.user.workspaceId,
        agentId: agentId || null
      }
    });
    res.json(conversation);
  } catch (err) {
    safeError(res, err, 400, 'Failed to create conversation');
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const conversation = await prisma.conversation.findFirst({
      where: { id: req.params.id, workspaceId: req.user.workspaceId },
      include: { messages: { orderBy: { order: 'asc' } }, agent: true }
    });
    if (!conversation) return res.status(404).json({ error: 'Not found' });
    res.json(conversation);
  } catch (err) {
    safeError(res, err);
  }
});

router.post('/:id/messages', authenticate, checkTrial, aiLimiter, async (req, res) => {
  try {
    const parsed = messageSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation error', details: parsed.error.flatten() });
    }
    const { content, role, model } = parsed.data;

    const conversation = await prisma.conversation.findFirst({
      where: { id: req.params.id, workspaceId: req.user.workspaceId }
    });
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

    const count = await prisma.message.count({ where: { conversationId: req.params.id } });
    const message = await prisma.message.create({
      data: {
        content,
        role,
        model,
        order: count,
        conversationId: req.params.id
      }
    });

    if (role === 'user') {
      const models = await fetchModels();
      let selectedModel = model;

      const agent = conversation.agentId
        ? await prisma.agent.findFirst({ where: { id: conversation.agentId, workspaceId: req.user.workspaceId } })
        : null;

      if (!selectedModel && agent?.model) {
        selectedModel = agent.model;
      }

      if (!selectedModel) {
        const routed = routeToModel('chat', content, models);
        selectedModel = routed ? routed.id : 'accounts/fireworks/models/glm-5p1';
      }

      const history = await prisma.message.findMany({
        where: { conversationId: req.params.id },
        orderBy: { order: 'asc' }
      });

      const knowledgeDocs = await prisma.knowledgeDocument.findMany({
        where: { workspaceId: req.user.workspaceId },
        select: { title: true, content: true }
      });

      const messages = history.map(m => ({ role: m.role, content: m.content }));

      let systemPrompt = agent?.systemPrompt || null;

      if (knowledgeDocs.length > 0) {
        const kbContext = knowledgeDocs.map(d => `## ${d.title}\n${d.content}`).join('\n\n');
        const kbPrompt = `Ниже представлена база знаний компании. Используй эту информацию для ответов на вопросы клиентов:\n\n${kbContext}`;
        if (systemPrompt) {
          systemPrompt = `${systemPrompt}\n\n${kbPrompt}`;
        } else {
          systemPrompt = `You are a helpful AI assistant.\n\n${kbPrompt}`;
        }
      }

      if (systemPrompt) {
        messages.unshift({ role: 'system', content: systemPrompt });
      }

      try {
        const aiResponse = await axios.post(
          `${config.SUGGY_BASE_URL}/chat/completions`,
          {
            model: selectedModel,
            messages,
            temperature: 0.7,
            max_tokens: 2000
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

        const aiContent = aiResponse.data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';
        const aiMessage = await prisma.message.create({
          data: {
            content: aiContent,
            role: 'assistant',
            model: selectedModel,
            order: message.order + 1,
            conversationId: req.params.id
          }
        });

        return res.json({ userMessage: message, aiMessage, response: aiMessage.content, model_used: selectedModel });
      } catch (aiErr) {
        console.error('AI response error:', aiErr.code || aiErr.response?.status || aiErr.message);
        let errorContent;
        let httpStatus = 502;
        if (aiErr.code === 'ECONNABORTED') {
          errorContent = 'Превышено время ожидания от AI-модели';
          httpStatus = 504;
        } else if (aiErr.response?.status === 429) {
          errorContent = 'Слишком много запросов. Подождите.';
          httpStatus = 429;
        } else {
          errorContent = 'Не удалось получить ответ от AI. Попробуйте позже.';
        }
        const errorMessage = await prisma.message.create({
          data: {
            content: errorContent,
            role: 'system',
            model: selectedModel,
            order: message.order + 1,
            conversationId: req.params.id
          }
        });
        return res.status(httpStatus).json({
          userMessage: message,
          aiMessage: errorMessage,
          model_used: selectedModel,
          error: errorContent
        });
      }
    }

    res.json({ message });
  } catch (err) {
    console.error('Message error:', err);
    safeError(res, err, 400, 'Failed to send message');
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const result = await prisma.conversation.deleteMany({
      where: { id: req.params.id, workspaceId: req.user.workspaceId }
    });
    if (result.count === 0) return res.status(404).json({ error: 'Conversation not found' });
    res.json({ success: true });
  } catch (err) {
    safeError(res, err, 400, 'Failed to delete conversation');
  }
});

router.get('/:id/messages', authenticate, generalLimiter, async (req, res) => {
  try {
    const conversation = await prisma.conversation.findFirst({
      where: { id: req.params.id, workspaceId: req.user.workspaceId }
    });
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

    const messages = await prisma.message.findMany({
      where: { conversationId: req.params.id },
      orderBy: { order: 'asc' },
      take: 200
    });
    res.json({ data: messages, total: messages.length });
  } catch (err) {
    safeError(res, err);
  }
});

router.patch('/:id', authenticate, async (req, res) => {
  try {
    const parsed = updateConversationSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation error', details: parsed.error.flatten() });
    }
    const { title, agentId } = parsed.data;

    const existing = await prisma.conversation.findFirst({
      where: { id: req.params.id, workspaceId: req.user.workspaceId }
    });
    if (!existing) return res.status(404).json({ error: 'Conversation not found' });

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (agentId !== undefined) updateData.agentId = agentId || null;

    const conversation = await prisma.conversation.update({
      where: { id: req.params.id },
      data: updateData
    });
    res.json(conversation);
  } catch (err) {
    safeError(res, err, 400, 'Failed to update conversation');
  }
});

module.exports = router;
