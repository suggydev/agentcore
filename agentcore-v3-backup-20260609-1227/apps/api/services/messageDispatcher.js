const axios = require('axios');
const { prisma } = require('../prisma-client');
const config = require('../config');
const { decrypt } = require('../utils/encryption');
const { getProvider, createProviderInstance } = require('./integrationRegistry');

const MAX_RETRIES = 3;
const RETRY_BASE_DELAY = 1000;

const _rateLimiter = new Map();

function _checkRateLimit(agentId) {
  const now = Date.now();
  const window = 60000;
  const maxRequests = 30;

  for (const [key, entry] of _rateLimiter.entries()) {
    if (now - entry.windowStart > window) {
      _rateLimiter.delete(key);
    }
  }

  const entry = _rateLimiter.get(agentId) || { count: 0, windowStart: now };

  if (now - entry.windowStart > window) {
    entry.count = 1;
    entry.windowStart = now;
  } else {
    entry.count++;
  }

  _rateLimiter.set(agentId, entry);

  if (entry.count > maxRequests) {
    throw new Error(`Rate limit exceeded for agent ${agentId}`);
  }
}

async function _logIntegration(integrationId, direction, eventType, payload, status) {
  try {
    const sanitized = { ...payload };
    delete sanitized.token;
    delete sanitized.apiKey;
    delete sanitized.secret;
    delete sanitized.password;
    delete sanitized.accessToken;

    await prisma.integrationLog.create({
      data: {
        integrationId,
        direction,
        eventType,
        payload: JSON.stringify(sanitized),
        status
      }
    });
  } catch (err) {
    console.error('[MessageDispatcher] Failed to log integration:', err);
  }
}

async function processIncomingMessage(providerName, agentId, externalChatId, text, metadata = {}) {
  let lastError;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      _checkRateLimit(agentId);

      const integration = await prisma.integration.findUnique({
        where: { agentId_provider: { agentId, provider: providerName } }
      });

      if (!integration || integration.status !== 'active') {
        throw new Error(`Integration ${providerName} not active for agent ${agentId}`);
      }

      const agent = await prisma.agent.findUnique({ where: { id: agentId } });
      if (!agent || !agent.isActive) {
        throw new Error(`Agent ${agentId} not found or inactive`);
      }

      let conversation = await prisma.conversation.findFirst({
        where: {
          agentId,
          title: `${providerName}:${externalChatId}`
        }
      });

      if (!conversation) {
        const workspace = await prisma.workspace.findFirst({
          where: { agents: { some: { id: agentId } } }
        });
        if (!workspace) throw new Error('Workspace not found for agent');

        conversation = await prisma.conversation.create({
          data: {
            title: `${providerName}:${externalChatId}`,
            workspaceId: workspace.id,
            agentId
          }
        });
      }

      const msgCount = await prisma.message.count({
        where: { conversationId: conversation.id }
      });

      await prisma.message.create({
        data: {
          content: text,
          role: 'user',
          order: msgCount,
          conversationId: conversation.id
        }
      });

      await _logIntegration(integration.id, 'inbound', 'message', { chatId: externalChatId, textLength: text.length }, 'success');

      const history = await prisma.message.findMany({
        where: { conversationId: conversation.id },
        orderBy: { order: 'asc' },
        take: 50
      });

      const systemPrompt = agent.systemPrompt || 'You are a helpful AI assistant.';
      const messages = [
        { role: 'system', content: systemPrompt },
        ...history.map(m => ({ role: m.role, content: m.content }))
      ];

      const aiResponse = await axios.post(
        `${config.SUGGY_BASE_URL}/chat/completions`,
        {
          model: agent.model || 'accounts/fireworks/models/glm-5p1',
          messages,
          temperature: agent.temperature || 0.7,
          max_tokens: agent.maxTokens || 2000
        },
        {
          headers: {
            Authorization: `Bearer ${config.SUGGY_PROJECT_KEY}`,
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
          model: agent.model,
          order: msgCount + 1,
          conversationId: conversation.id
        }
      });

      let creds;
      try {
        const credsJson = decrypt(integration.credentials);
        creds = JSON.parse(credsJson);
      } catch (decErr) {
        throw new Error(`Failed to decrypt/parse credentials: ${decErr.message}`);
      }

      const provider = createProviderInstance(providerName, creds);
      if (provider) {
        try {
          await provider.initialize(creds);
          const channelMaxLen = {
            telegram: 4096,
            whatsapp: 4000,
            vk: 4000,
            viber: 7000,
            instagram: 1000,
            facebook: 2000,
            discord: 2000,
            sms: 160,
            avito: 4000,
            yandexmessenger: 4000,
            mailru: 10000,
          }[providerName] || 4000;
          const replyText = aiContent.length > channelMaxLen
            ? aiContent.slice(0, channelMaxLen - 3) + '...'
            : aiContent;
          await provider.sendMessage(agentId, externalChatId, replyText);
        } catch (sendErr) {
          console.error('[MessageDispatcher] Outbound send failed:', sendErr);
          await _logIntegration(integration.id, 'outbound', 'send_error', { chatId: externalChatId, error: sendErr.message }, 'error');
        }
      }

      await _logIntegration(integration.id, 'outbound', 'message', { chatId: externalChatId, textLength: aiContent.length }, 'success');

      return { success: true, conversationId: conversation.id };
    } catch (err) {
      lastError = err;
      try {
        const integration = await prisma.integration.findUnique({
          where: { agentId_provider: { agentId, provider: providerName } }
        });
        if (integration) {
          await _logIntegration(integration.id, 'inbound', 'error', { error: err.message }, 'retry');
        }
      } catch (logErr) {
        console.error('[MessageDispatcher] Retry log error:', logErr);
      }

      if (attempt < MAX_RETRIES - 1) {
        const delay = RETRY_BASE_DELAY * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  try {
    await prisma.integration.update({
      where: { agentId_provider: { agentId, provider: providerName } },
      data: { lastError: lastError?.message || 'Unknown error', status: 'error' }
    });
  } catch (err) {
    console.error('[MessageDispatcher] Failed to update integration error status:', err);
  }

  throw lastError || new Error('Message processing failed');
}

async function runHealthCheck(agentId, providerName) {
  try {
    const integration = await prisma.integration.findUnique({
      where: { agentId_provider: { agentId, provider: providerName } }
    });
    if (!integration) return { ok: false, error: 'Integration not found' };

    const credsJson = decrypt(integration.credentials);
    const creds = JSON.parse(credsJson);
    const provider = createProviderInstance(providerName, creds);
    if (!provider) return { ok: false, error: 'Provider not available' };

    await provider.initialize(creds);
    const result = await provider.healthCheck();

    await prisma.integration.update({
      where: { id: integration.id },
      data: { lastHealthCheck: new Date(), status: result.ok ? 'active' : 'error' }
    });

    return result;
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

module.exports = { processIncomingMessage, runHealthCheck, _logIntegration };
