const express = require('express');
const axios = require('axios');
const { prisma } = require('../../prisma-client');
const config = require('../../config');
const { aiLimiter } = require('../../middleware/rateLimit');

const router = express.Router();

async function getWorkspaceByTelegramToken(token) {
  const workspaces = await prisma.workspace.findMany();
  for (const ws of workspaces) {
    const settings = (ws.settings && typeof ws.settings === 'object') ? ws.settings : {};
    const integrations = settings.integrations || {};
    if (integrations.telegram && integrations.telegram.token === token) {
      return ws;
    }
  }
  return null;
}

router.post('/webhook', aiLimiter, async (req, res) => {
  try {
    const { message, callback_query, my_chat_member } = req.body;

    if (my_chat_member) {
      const chatId = my_chat_member.chat?.id;
      console.log(`[Telegram] Chat member update from chat ${chatId}, status: ${my_chat_member.new_chat_member?.status}`);
      return res.json({ ok: true });
    }

    if (callback_query) {
      console.log(`[Telegram] Callback query from ${callback_query.from?.id}: ${callback_query.data}`);
      return res.json({ ok: true });
    }

    const msg = message || (callback_query && callback_query.message);
    if (!msg || !msg.text) return res.json({ ok: true });

    const chatId = msg.chat?.id;
    const userId = msg.from?.id;
    const text = msg.text;
    const username = msg.from?.username || msg.from?.first_name || 'User';

    console.log(`[Telegram] Message from ${chatId} (${username}): ${text}`);

    if (text === '/start') {
      try {
        const botToken = req.headers['x-telegram-bot-token'] || '';
        const workspace = await getWorkspaceByTelegramToken(botToken);

        if (!workspace) {
          await sendTelegramMessage(botToken, chatId,
            'Привет! Я AI-агент AgentCore. Как я могу вам помочь?\n\n' +
            'Просто напишите ваш вопрос, и я постараюсь ответить.'
          );
          return res.json({ ok: true });
        }

        const agent = await prisma.agent.findFirst({
          where: { workspaceId: workspace.id, isActive: true }
        });

        const greeting = agent?.systemPrompt
          ? `Привет! Я ${agent.name}. ${agent.description || 'Как я могу вам помочь?'}`
          : 'Привет! Я AI-агент AgentCore. Как я могу вам помочь?';

        await sendTelegramMessage(botToken, chatId, greeting);

        if (agent) {
          await processWithAgent(botToken, chatId, text, workspace.id, agent, username);
        }
      } catch (err) {
        console.error('[Telegram] Start handler error:', err);
      }
      return res.json({ ok: true });
    }

    try {
      const botToken = req.headers['x-telegram-bot-token'] || '';
      const workspace = await getWorkspaceByTelegramToken(botToken);

      if (workspace) {
        const agent = await prisma.agent.findFirst({
          where: { workspaceId: workspace.id, isActive: true }
        });
        if (agent) {
          await processWithAgent(botToken, chatId, text, workspace.id, agent, username);
          return res.json({ ok: true });
        }
      }

      await sendTelegramMessage(botToken, chatId,
        'Извините, я не могу обработать ваш запрос прямо сейчас. Пожалуйста, попробуйте позже.'
      );
    } catch (err) {
      console.error('[Telegram] Message processing error:', err);
      await sendTelegramMessage(
        req.headers['x-telegram-bot-token'] || '',
        chatId,
        'Произошла ошибка при обработке сообщения. Пожалуйста, попробуйте позже.'
      );
    }

    res.json({ ok: true });
  } catch (err) {
    console.error('[Telegram] Webhook error:', err);
    res.json({ ok: true });
  }
});

async function sendTelegramMessage(token, chatId, text) {
  if (!token) {
    console.error('[Telegram] No bot token available for sending message');
    return;
  }
  try {
    await axios.post(
      `https://api.telegram.org/bot${token}/sendMessage`,
      { chat_id: chatId, text, parse_mode: 'HTML' },
      { timeout: 10000 }
    );
  } catch (err) {
    console.error('[Telegram] Send message error:', err.response?.data || err.message);
  }
}

async function processWithAgent(botToken, chatId, text, workspaceId, agent, username) {
  let conversation = await prisma.conversation.findFirst({
    where: { workspaceId, title: `Telegram: ${chatId}` }
  });

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        title: `Telegram: ${chatId}`,
        workspaceId,
        agentId: agent.id
      }
    });
  }

  let messageOrder = 0;
  await prisma.$transaction(async (tx) => {
    const count = await tx.message.count({ where: { conversationId: conversation.id } });
    messageOrder = count;
    await tx.message.create({
      data: {
        content: `[${username}]: ${text}`,
        role: 'user',
        order: count,
        conversationId: conversation.id
      }
    });
  });

  try {
    const models = require('../../services/suggy').fetchModels;
    const routeToModel = require('../../services/suggy').routeToModel;
    const availableModels = await models();

    const selectedModel = agent.model ||
      (routeToModel('customer support', text, availableModels)?.id) ||
      'accounts/fireworks/models/glm-5p1';

    const history = await prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { order: 'asc' },
      take: 50
    });

    const systemPrompt = agent.systemPrompt || 'You are a helpful customer support AI assistant. Keep responses concise and friendly.';
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.map(m => ({ role: 'user', content: m.content }))
    ];

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
        timeout: 30000
      }
    );

    const aiContent = aiResponse.data.choices?.[0]?.message?.content || 'Извините, не удалось обработать запрос.';

    await prisma.message.create({
      data: {
        content: aiContent,
        role: 'assistant',
        model: selectedModel,
        order: messageOrder + 1,
        conversationId: conversation.id
      }
    });

    const maxLen = 4000;
    const finalContent = aiContent.length > maxLen
      ? aiContent.slice(0, maxLen) + '\n\n... (сокращено)'
      : aiContent;

    await sendTelegramMessage(botToken, chatId, finalContent);
  } catch (aiErr) {
    console.error('[Telegram] AI error:', aiErr.response?.data || aiErr.message);
    await sendTelegramMessage(botToken, chatId, 'Извините, произошла ошибка при обработке вашего сообщения.');
  }
}

router.get('/status', async (req, res) => {
  res.json({
    status: 'ok',
    message: 'Telegram webhook endpoint is active'
  });
});

module.exports = router;
