const express = require('express');
const axios = require('axios');
const { z } = require('zod');
const { prisma } = require('../../prisma-client');
const config = require('../../config');
const { aiLimiter, generalLimiter } = require('../../middleware/rateLimit');
const { fetchModels, routeToModel } = require('../../services/suggy');
const { safeError } = require('../../utils/errors');
const { TelegramProvider } = require('../../services/providers/telegram');
const { authenticate } = require('../../middleware/auth');

const router = express.Router();

const setupSchema = z.object({
  botToken: z.string().min(1, 'botToken обязателен'),
  webhookUrl: z.string().url('webhookUrl должен быть валидным URL').optional(),
  secretToken: z.string().optional(),
  dropPendingUpdates: z.boolean().optional()
});

async function getWorkspaceByTelegramToken(token) {
  if (!token) return null;
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

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
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
        content: `[${escapeHtml(username)}]: ${text}`,
        role: 'user',
        order: count,
        conversationId: conversation.id
      }
    });
  });

  const availableModels = await fetchModels();

  const selectedModel = agent.model ||
    (routeToModel('customer support', text, availableModels)?.id) ||
    'accounts/fireworks/models/glm-5p1';

  const history = await prisma.message.findMany({
    where: { conversationId: conversation.id },
    orderBy: { order: 'asc' },
    take: 50
  });

  const systemPrompt = agent.systemPrompt || 'Ты — полезный AI-ассистент поддержки клиентов. Отвечай дружелюбно, кратко и по делу на русском языке.';
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
      timeout: 45000
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
    ? aiContent.slice(0, maxLen) + '\n\n... (сообщение сокращено)'
    : aiContent;

  const telegramProvider = new TelegramProvider({ botToken });
  await telegramProvider.sendMessage(null, chatId, finalContent);
}

// POST /api/channels/telegram/webhook — приём сообщений от Telegram
router.post('/webhook', aiLimiter, async (req, res) => {
  try {
    const { message, callback_query, my_chat_member, channel_post } = req.body;

    if (my_chat_member) {
      console.log(`[Telegram] Chat member update: chat=${my_chat_member.chat?.id}, status=${my_chat_member.new_chat_member?.status}`);
      return res.json({ ok: true });
    }

    if (channel_post) {
      console.log(`[Telegram] Channel post from ${channel_post.chat?.id}, ignored`);
      return res.json({ ok: true });
    }

    if (callback_query) {
      const cbData = callback_query.data;
      const cbChatId = callback_query.message?.chat?.id;
      console.log(`[Telegram] Callback query from ${callback_query.from?.id}: ${cbData}`);

      if (cbData === '/start') {
        const botToken = req.headers['x-telegram-bot-token'] || '';
        const telegramProvider = new TelegramProvider({ botToken });
        await telegramProvider.sendMessage(null, cbChatId, 'Привет! Я AI-агент AgentCore. Чем могу помочь?');
      }
      return res.json({ ok: true });
    }

    const msg = message || (callback_query && callback_query.message);
    if (!msg || !msg.text) return res.json({ ok: true });

    const chatId = msg.chat?.id;
    const userId = msg.from?.id;
    const text = msg.text.trim();
    const username = msg.from?.username || msg.from?.first_name || 'Пользователь';

    console.log(`[Telegram] Входящее сообщение от ${chatId} (${username}): ${text.slice(0, 100)}`);

    const botToken = req.headers['x-telegram-bot-token'] || '';
    const telegramProvider = new TelegramProvider({ botToken });

    if (text === '/start') {
      const workspace = await getWorkspaceByTelegramToken(botToken);

      if (!workspace) {
        await telegramProvider.sendMessage(null, chatId,
          'Привет! Я AI-агент AgentCore. Как я могу вам помочь?\n\nПросто напишите ваш вопрос, и я постараюсь ответить.'
        );
        return res.json({ ok: true });
      }

      const agent = await prisma.agent.findFirst({
        where: { workspaceId: workspace.id, isActive: true }
      });

      const greeting = agent?.systemPrompt
        ? `Привет! Я ${escapeHtml(agent.name)}. ${escapeHtml(agent.description || '') || 'Как я могу вам помочь?'}`
        : 'Привет! Я AI-агент AgentCore. Как я могу вам помочь?';

      await telegramProvider.sendMessage(null, chatId, greeting);

      if (agent) {
        await processWithAgent(botToken, chatId, text, workspace.id, agent, username);
      }

      return res.json({ ok: true });
    }

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

    await telegramProvider.sendMessage(null, chatId,
      'Извините, я не могу обработать ваш запрос прямо сейчас. Пожалуйста, попробуйте позже.'
    );

    res.json({ ok: true });
  } catch (err) {
    console.error('[Telegram] Ошибка обработки webhook:', err.message);

    try {
      const chatId = (req.body?.message || req.body?.callback_query?.message)?.chat?.id;
      if (chatId) {
        const botToken = req.headers['x-telegram-bot-token'] || '';
        const telegramProvider = new TelegramProvider({ botToken });
        await telegramProvider.sendMessage(null, chatId,
          'Произошла ошибка при обработке вашего сообщения. Пожалуйста, попробуйте позже.'
        );
      }
    } catch (fallbackErr) {
      console.error('[Telegram] Ошибка отправки fallback-сообщения:', fallbackErr.message);
    }

    res.json({ ok: true });
  }
});

// POST /api/channels/telegram/setup — установка вебхука
router.post('/setup', authenticate, generalLimiter, async (req, res) => {
  try {
    const parsed = setupSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Ошибка валидации',
        details: parsed.error.flatten().fieldErrors
      });
    }

    const { botToken, webhookUrl, secretToken, dropPendingUpdates } = parsed.data;
    const workspaceId = req.user.workspaceId;

    const telegramProvider = new TelegramProvider({ botToken });

    const botInfo = await telegramProvider.getMe();
    if (!botInfo || !botInfo.ok) {
      return res.status(400).json({
        error: 'Не удалось подключиться к Telegram API. Проверьте botToken.',
        code: 'INVALID_BOT_TOKEN'
      });
    }

    const finalWebhookUrl = webhookUrl ||
      `${config.CLIENT_URL || 'https://api.agentcore.work'}/api/channels/telegram/webhook`;

    const webhookResult = await telegramProvider.setWebhook(finalWebhookUrl, {
      secretToken,
      allowedUpdates: ['message', 'callback_query', 'my_chat_member'],
      dropPendingUpdates: dropPendingUpdates || false
    });

    if (!webhookResult || !webhookResult.ok) {
      return res.status(500).json({
        error: 'Не удалось установить webhook в Telegram API.',
        details: webhookResult
      });
    }

    const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
    if (!workspace) {
      return res.status(404).json({ error: 'Workspace не найден' });
    }

    const currentSettings = (workspace.settings && typeof workspace.settings === 'object')
      ? { ...workspace.settings }
      : {};
    const integrations = currentSettings.integrations || {};

    integrations.telegram = {
      token: botToken,
      botUsername: botInfo.result?.username || '',
      botFirstName: botInfo.result?.first_name || '',
      webhookUrl: finalWebhookUrl,
      connected: true,
      connectedAt: new Date().toISOString()
    };

    await prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        settings: { ...currentSettings, integrations }
      }
    });

    res.json({
      ok: true,
      webhook: webhookResult.result,
      bot: botInfo.result,
      message: 'Telegram бот успешно подключён. Webhook установлен.'
    });
  } catch (err) {
    console.error('[Telegram] Ошибка setup:', err.message);

    if (err.statusCode) {
      return safeError(res, err, err.statusCode, err.message);
    }

    safeError(res, err, 500, 'Не удалось настроить Telegram интеграцию.');
  }
});

// GET /api/channels/telegram/status — проверка статуса бота
router.get('/status', authenticate, async (req, res) => {
  try {
    const workspace = await prisma.workspace.findUnique({ where: { id: req.user.workspaceId } });
    if (!workspace) {
      return res.status(404).json({ error: 'Workspace не найден' });
    }

    const settings = (workspace.settings && typeof workspace.settings === 'object') ? workspace.settings : {};
    const telegram = (settings.integrations || {}).telegram;

    if (!telegram || !telegram.token) {
      return res.json({
        connected: false,
        message: 'Telegram бот не подключён'
      });
    }

    const telegramProvider = new TelegramProvider({ botToken: telegram.token });

    try {
      const webhookInfo = await telegramProvider.getWebhookInfo();
      const botInfo = await telegramProvider.getMe();

      res.json({
        connected: true,
        botUsername: botInfo.result?.username || telegram.botUsername,
        botFirstName: botInfo.result?.first_name || telegram.botFirstName,
        webhookUrl: webhookInfo.result?.url || telegram.webhookUrl,
        webhookOk: webhookInfo.ok,
        connectedAt: telegram.connectedAt || null
      });
    } catch (apiErr) {
      res.json({
        connected: false,
        error: 'Не удалось связаться с Telegram API. Возможно, token недействителен.',
        botUsername: telegram.botUsername,
        webhookUrl: telegram.webhookUrl,
        connectedAt: telegram.connectedAt || null
      });
    }
  } catch (err) {
    console.error('[Telegram] Ошибка status:', err.message);
    safeError(res, err, 500, 'Ошибка проверки статуса Telegram.');
  }
});

// POST /api/channels/telegram/disconnect — отключение бота
router.post('/disconnect', authenticate, generalLimiter, async (req, res) => {
  try {
    const workspaceId = req.user.workspaceId;
    const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });

    if (!workspace) {
      return res.status(404).json({ error: 'Workspace не найден' });
    }

    const currentSettings = (workspace.settings && typeof workspace.settings === 'object')
      ? { ...workspace.settings }
      : {};
    const integrations = currentSettings.integrations || {};

    const telegramSettings = integrations.telegram;
    if (telegramSettings && telegramSettings.token) {
      try {
        const telegramProvider = new TelegramProvider({ botToken: telegramSettings.token });
        await telegramProvider.deleteWebhook();
      } catch (webhookErr) {
        console.error('[Telegram] Ошибка удаления webhook при отключении:', webhookErr.message);
      }
    }

    delete integrations.telegram;
    currentSettings.integrations = integrations;

    await prisma.workspace.update({
      where: { id: workspaceId },
      data: { settings: currentSettings }
    });

    res.json({ ok: true, message: 'Telegram бот отключён. Webhook удалён.' });
  } catch (err) {
    console.error('[Telegram] Ошибка disconnect:', err.message);
    safeError(res, err, 500, 'Не удалось отключить Telegram интеграцию.');
  }
});

module.exports = router;
