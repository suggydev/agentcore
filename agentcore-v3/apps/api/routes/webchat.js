const express = require('express');
const axios = require('axios');
const { prisma } = require('../prisma-client');
const config = require('../config');
const { webchatAuth } = require('../middleware/auth');
const { aiLimiter } = require('../middleware/rateLimit');
const { fetchModels, routeToModel } = require('../services/suggy');

const router = express.Router();

router.post('/message', webchatAuth, aiLimiter, async (req, res) => {
  try {
    const { workspaceId, agentId, sessionId, content, customerName, customerEmail } = req.body;

    if (!workspaceId || !content) {
      return res.status(400).json({ error: 'workspaceId and content are required' });
    }

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
      console.error('WebChat AI error:', aiErr.response?.data || aiErr.message);
      if (aiErr.code === 'ECONNABORTED') {
        return res.status(504).json({ error: 'Превышено время ожидания от AI-модели', model_used: selectedModel });
      }
      if (aiErr.response?.status === 429) {
        return res.status(429).json({ error: 'Слишком много запросов. Подождите.', model_used: selectedModel });
      }
      res.status(500).json({
        error: aiErr.response?.data?.error?.message || aiErr.message,
        model_used: selectedModel
      });
    }
  } catch (err) {
    console.error('WebChat error:', err);
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
