const express = require('express');
const crypto = require('crypto');
const { prisma } = require('../prisma-client');
const config = require('../config');
const { verifyHmac, decrypt } = require('../utils/encryption');
const { getProvider, createProviderInstance } = require('../services/integrationRegistry');
const { processIncomingMessage } = require('../services/messageDispatcher');
const { safeError } = require('../utils/errors');

const router = express.Router();

async function _logWebhook(integrationId, providerName, payload, parsed) {
  try {
    await prisma.integrationLog.create({
      data: {
        integrationId,
        direction: 'inbound',
        eventType: parsed.event || 'webhook',
        payload: JSON.stringify({ provider: providerName, parsed, raw: payload }),
        status: 'success'
      }
    });
  } catch (err) {
    console.error('[Webhooks] Failed to log webhook:', err);
  }
}

const _signatureVerifiers = {
  telegram: (payload, signature, secret) => {
    try {
      if (!signature) return false;
      const body = typeof payload === 'string' ? payload : JSON.stringify(payload);
      const computed = crypto.createHmac('sha256', secret).update(body).digest('hex');
      return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(signature, 'hex'));
    } catch {
      return false;
    }
  },
  whatsapp: (payload, signature, secret) => {
    try {
      if (!signature) return false;
      const body = typeof payload === 'string' ? payload : JSON.stringify(payload);
      const computed = crypto.createHmac('sha256', secret).update(body).digest('hex');
      return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(signature, 'hex'));
    } catch {
      return false;
    }
  },
  vk: (payload, signature, secret) => {
    try {
      if (!signature) return false;
      const body = typeof payload === 'string' ? payload : JSON.stringify(payload);
      const computed = crypto.createHmac('sha256', secret).update(body).digest('hex');
      return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(signature, 'hex'));
    } catch {
      return false;
    }
  },
  webhooks: (payload, signature, secret) => {
    try {
      const body = typeof payload === 'string' ? payload : JSON.stringify(payload);
      return verifyHmac(body, signature, secret);
    } catch {
      return false;
    }
  },
  amocrm: (payload, signature, secret) => {
    try {
      if (!signature) return false;
      const body = typeof payload === 'string' ? payload : JSON.stringify(payload);
      const computed = crypto.createHmac('sha256', secret).update(body).digest('hex');
      return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(signature, 'hex'));
    } catch {
      return false;
    }
  },
  bitrix24: (payload, signature, secret) => {
    try {
      if (!signature) return false;
      const body = typeof payload === 'string' ? payload : JSON.stringify(payload);
      const computed = crypto.createHmac('sha256', secret).update(body).digest('hex');
      return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(signature, 'hex'));
    } catch {
      return false;
    }
  }
};

function _getDefaultVerifier(payload, signature, secret) {
  try {
    if (!signature || !secret) return false;
    const body = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const computed = crypto.createHmac('sha256', secret).update(body).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(signature, 'hex'));
  } catch {
    return false;
  }
}

router.post('/:provider/:agentId', async (req, res) => {
  try {
    const { provider: providerName, agentId } = req.params;
    const payload = req.body;

    if (!payload || typeof payload !== 'object') {
      return res.status(400).json({ error: 'Invalid payload' });
    }

    // WhatsApp Cloud API webhook verification
    if (providerName === 'whatsapp' && req.query['hub.mode'] === 'subscribe') {
      const verifyToken = req.query['hub.verify_token'];
      const challenge = req.query['hub.challenge'];
      const integration = await prisma.integration.findUnique({
        where: { agentId_provider: { agentId, provider: 'whatsapp' } }
      });
      if (!integration) return res.status(404).json({ error: 'Integration not found' });

      const creds = JSON.parse(decrypt(integration.credentials));
      if (verifyToken === creds.verifyToken) {
        return res.send(challenge);
      }
      return res.status(403).json({ error: 'Verification failed' });
    }

    // VK confirmation webhook
    if (providerName === 'vk' && payload.type === 'confirmation') {
      const vkIntegration = await prisma.integration.findUnique({
        where: { agentId_provider: { agentId, provider: 'vk' } }
      });
      if (!vkIntegration) return res.status(404).json({ error: 'Integration not found' });
      const creds = JSON.parse(decrypt(vkIntegration.credentials));
      return res.send(creds.confirmationCode || 'ok');
    }

    const integration = await prisma.integration.findUnique({
      where: { agentId_provider: { agentId, provider: providerName } }
    });

    if (!integration || integration.status !== 'active') {
      return res.status(404).json({ error: 'Integration not found or inactive' });
    }

    const signature = req.headers['x-hub-signature-256']
      || req.headers['x-signature']
      || req.headers['x-amocrm-signature']
      || req.headers['x-webhook-signature']
      || req.headers['x-telegram-bot-api-secret-token']
      || '';

    // YooKassa webhook (no signature header, uses IP whitelist + event type)
    if (providerName === 'yookassa') {
      res.status(200).json({ ok: true });
      setImmediate(async () => {
        try {
          const creds = JSON.parse(decrypt(integration.credentials));
          const provider = createProviderInstance(providerName, creds);
          if (provider) {
            await provider.initialize(creds);
            const parsed = await provider.handleWebhook(payload, signature);
            if (parsed && parsed.processed) {
              await _logWebhook(integration.id, providerName, payload, parsed);
            }
          }
        } catch (err) {
          console.error('[Webhooks] YooKassa processing error:', err);
        }
      });
      return;
    }

    // Tinkoff webhook (no signature, uses token in body)
    if (providerName === 'tinkoff') {
      res.status(200).json({ ok: true });
      setImmediate(async () => {
        try {
          const creds = JSON.parse(decrypt(integration.credentials));
          const provider = createProviderInstance(providerName, creds);
          if (provider) {
            await provider.initialize(creds);
            const parsed = await provider.handleWebhook(payload, signature);
            if (parsed && parsed.processed) {
              await _logWebhook(integration.id, providerName, payload, parsed);
            }
          }
        } catch (err) {
          console.error('[Webhooks] Tinkoff processing error:', err);
        }
      });
      return;
    }

    // SBP webhook
    if (providerName === 'sbp') {
      res.status(200).json({ ok: true });
      setImmediate(async () => {
        try {
          const creds = JSON.parse(decrypt(integration.credentials));
          const provider = createProviderInstance(providerName, creds);
          if (provider) {
            await provider.initialize(creds);
            const parsed = await provider.handleWebhook(payload, signature);
            if (parsed && parsed.processed) {
              await _logWebhook(integration.id, providerName, payload, parsed);
            }
          }
        } catch (err) {
          console.error('[Webhooks] SBP processing error:', err);
        }
      });
      return;
    }

    // Robokassa webhook (ResultURL / SuccessURL / FailURL)
    if (providerName === 'robokassa') {
      res.status(200).json({ ok: true });
      setImmediate(async () => {
        try {
          const creds = JSON.parse(decrypt(integration.credentials));
          const provider = createProviderInstance(providerName, creds);
          if (provider) {
            await provider.initialize(creds);
            const parsed = await provider.handleWebhook(payload, signature);
            if (parsed && parsed.processed) {
              await _logWebhook(integration.id, providerName, payload, parsed);
            }
          }
        } catch (err) {
          console.error('[Webhooks] Robokassa processing error:', err);
        }
      });
      return;
    }

    const verifier = _signatureVerifiers[providerName] || _getDefaultVerifier;
    const bodyStr = JSON.stringify(payload);
    const isValid = verifier(payload, signature, integration.webhookSecret || '');

    if (!isValid && integration.webhookSecret) {
      await prisma.integrationLog.create({
        data: {
          integrationId: integration.id,
          direction: 'inbound',
          eventType: 'error',
          payload: JSON.stringify({ error: 'Invalid signature', provider: providerName }),
          status: 'error'
        }
      });
      return res.status(403).json({ error: 'Invalid signature' });
    }

    res.status(200).json({ ok: true });

    setImmediate(async () => {
      try {
        const creds = JSON.parse(decrypt(integration.credentials));
        const provider = createProviderInstance(providerName, creds);
        if (!provider) return;

        await provider.initialize(creds);
        const parsed = await provider.handleWebhook(payload, signature);

        if (parsed && parsed.processed) {
          let chatId = '';
          let text = '';

          // Messenger providers
          if (providerName === 'telegram') {
            chatId = String(parsed.chatId || '');
            text = parsed.text || '';
          } else if (providerName === 'whatsapp') {
            if (parsed.messages && parsed.messages.length > 0) {
              chatId = parsed.messages[0].from;
              text = parsed.messages[0].text || '';
            }
          } else if (providerName === 'vk') {
            chatId = String(parsed.peerId || '');
            text = parsed.text || '';
          } else if (providerName === 'avito') {
            chatId = parsed.chatId || '';
            text = parsed.text || '';
          } else if (providerName === 'yandexmessenger') {
            chatId = parsed.chatId || '';
            text = parsed.text || '';
          } else if (providerName === 'instagram') {
            chatId = parsed.from || parsed.senderId || '';
            text = parsed.text || '';
          } else if (providerName === 'facebook') {
            chatId = parsed.from || parsed.senderId || '';
            text = parsed.text || '';
          } else if (providerName === 'discord') {
            chatId = parsed.channelId || parsed.from || '';
            text = parsed.text || '';
          } else if (providerName === 'viber') {
            chatId = parsed.from || parsed.userId || '';
            text = parsed.text || '';
          } else if (providerName === 'sms') {
            chatId = parsed.from || parsed.phone || '';
            text = parsed.text || '';
          } else if (providerName === 'mailru') {
            chatId = parsed.from || '';
            text = parsed.text || '';
          } else {
            chatId = parsed.chatId || parsed.from || parsed.senderId || parsed.userId || parsed.phone || parsed.channelId || '';
            text = parsed.text || '';
          }

          if (chatId && text) {
            await processIncomingMessage(providerName, agentId, chatId, text, parsed);
          }
        }

        await _logWebhook(integration.id, providerName, payload, parsed);
      } catch (err) {
        try {
          await prisma.integrationLog.create({
            data: {
              integrationId: integration.id,
              direction: 'inbound',
              eventType: 'error',
              payload: JSON.stringify({ error: err.message }),
              status: 'error'
            }
          });
        } catch (logErr) {
           console.error('[Webhooks] Failed to log error:', logErr);
         }
      }
    });
  } catch (err) {
    if (!res.headersSent) {
      safeError(res, err);
    }
  }
});

module.exports = router;
