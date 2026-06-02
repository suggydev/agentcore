const express = require('express');
const crypto = require('crypto');
const { z } = require('zod');
const { prisma } = require('../prisma-client');
const config = require('../config');
const { authenticate } = require('../middleware/auth');
const { generalLimiter } = require('../middleware/rateLimit');
const { safeError } = require('../utils/errors');
const { encrypt, decrypt, hashSecret } = require('../utils/encryption');
const { getAllProviders, getProvider, getProviderStatus, createProviderInstance } = require('../services/integrationRegistry');
const { runHealthCheck } = require('../services/messageDispatcher');

const router = express.Router();

const connectSchema = z.object({
  agentId: z.string().min(1),
  credentials: z.record(z.string(), z.any()).optional()
});

router.get('/providers', generalLimiter, (req, res) => {
  try {
    const providers = getAllProviders();
    res.json({ providers });
  } catch (err) {
    safeError(res, err);
  }
});

router.get('/', authenticate, generalLimiter, async (req, res) => {
  try {
    const { agentId } = req.query;
    if (!agentId) return res.status(400).json({ error: 'agentId query parameter required' });

    const integrations = await prisma.integration.findMany({
      where: { agentId: String(agentId) },
      orderBy: { createdAt: 'desc' }
    });

    const result = integrations.map(i => ({
      id: i.id,
      provider: i.provider,
      status: i.status,
      webhookUrl: i.webhookUrl,
      lastHealthCheck: i.lastHealthCheck,
      lastError: i.lastError,
      createdAt: i.createdAt,
      updatedAt: i.updatedAt
    }));

    res.json({ integrations: result });
  } catch (err) {
    safeError(res, err);
  }
});

router.post('/:provider/connect', authenticate, generalLimiter, async (req, res) => {
  try {
    const { provider: providerName } = req.params;
    const parsed = connectSchema.safeParse({ agentId: req.body.agentId, credentials: req.body.credentials });
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors });
    }

    const { agentId, credentials } = parsed.data;
    const providerEntry = getProvider(providerName);
    if (!providerEntry) {
      return res.status(400).json({ error: `Unknown provider: ${providerName}` });
    }

    const agent = await prisma.agent.findFirst({
      where: { id: agentId, workspace: { users: { some: { id: req.user.userId } } } }
    });
    if (!agent) return res.status(404).json({ error: 'Agent not found' });

    const provider = createProviderInstance(providerName, credentials || {});
    if (!provider) return res.status(500).json({ error: 'Failed to create provider instance' });

    try {
      await provider.initialize(credentials || {});
    } catch (initErr) {
      return res.status(400).json({ error: `Provider initialization failed: ${initErr.message}` });
    }

    const webhookSecret = crypto.randomBytes(24).toString('hex');
    const webhookUrl = `${config.CLIENT_URL}/api/webhooks/${providerName}/${agentId}`;

    const encryptedCreds = encrypt(JSON.stringify(credentials || {}));

    const integration = await prisma.integration.upsert({
      where: { agentId_provider: { agentId, provider: providerName } },
      update: {
        credentials: encryptedCreds,
        status: 'active',
        webhookUrl,
        webhookSecret,
        lastError: null
      },
      create: {
        agentId,
        provider: providerName,
        credentials: encryptedCreds,
        status: 'active',
        webhookUrl,
        webhookSecret
      }
    });

    await prisma.integrationLog.create({
      data: {
        integrationId: integration.id,
        direction: 'inbound',
        eventType: 'message',
        payload: JSON.stringify({ action: 'connect' }),
        status: 'success'
      }
    });

    res.json({
      success: true,
      integration: {
        id: integration.id,
        provider: providerName,
        status: integration.status,
        webhookUrl: integration.webhookUrl,
        webhookSecret: integration.webhookSecret
      }
    });
  } catch (err) {
    safeError(res, err, 400, 'Failed to connect integration');
  }
});

router.delete('/:provider/disconnect', authenticate, generalLimiter, async (req, res) => {
  try {
    const { provider: providerName } = req.params;
    const { agentId } = req.body;
    if (!agentId) return res.status(400).json({ error: 'agentId is required' });

    const integration = await prisma.integration.findUnique({
      where: { agentId_provider: { agentId, provider: providerName } }
    });
    if (!integration) return res.status(404).json({ error: 'Integration not found' });

    try {
      const credsJson = decrypt(integration.credentials);
      const creds = JSON.parse(credsJson);
      const provider = createProviderInstance(providerName, creds);
      if (provider) {
        await provider.initialize(creds);
        await provider.disconnect();
      }
    } catch (err) {
        console.error('[Integrations] Disconnect cleanup error:', err);
      }

    await prisma.integration.update({
      where: { id: integration.id },
      data: { status: 'disconnected' }
    });

    await prisma.integrationLog.create({
      data: {
        integrationId: integration.id,
        direction: 'outbound',
        eventType: 'message',
        payload: JSON.stringify({ action: 'disconnect' }),
        status: 'success'
      }
    });

    res.json({ success: true });
  } catch (err) {
    safeError(res, err, 400, 'Failed to disconnect');
  }
});

router.get('/:provider/health', authenticate, generalLimiter, async (req, res) => {
  try {
    const { provider: providerName } = req.params;
    const { agentId } = req.query;
    if (!agentId) return res.status(400).json({ error: 'agentId is required' });

    const result = await runHealthCheck(String(agentId), providerName);
    res.json(result);
  } catch (err) {
    safeError(res, err);
  }
});

router.post('/:provider/test-message', authenticate, generalLimiter, async (req, res) => {
  try {
    const { provider: providerName } = req.params;
    const { agentId, conversationId, message } = req.body;
    if (!agentId || !message) {
      return res.status(400).json({ error: 'agentId and message are required' });
    }

    const integration = await prisma.integration.findUnique({
      where: { agentId_provider: { agentId, provider: providerName } }
    });
    if (!integration || integration.status !== 'active') {
      return res.status(400).json({ error: 'Integration not active' });
    }

    const credsJson = decrypt(integration.credentials);
    const creds = JSON.parse(credsJson);
    const provider = createProviderInstance(providerName, creds);
    if (!provider) return res.status(500).json({ error: 'Provider not available' });

    await provider.initialize(creds);
    const result = await provider.sendMessage(agentId, conversationId || 'test', message);

    await prisma.integrationLog.create({
      data: {
        integrationId: integration.id,
        direction: 'outbound',
        eventType: 'message',
        payload: JSON.stringify({ action: 'test_message', conversationId }),
        status: 'success'
      }
    });

    res.json({ success: true, result });
  } catch (err) {
    safeError(res, err, 400, 'Test message failed');
  }
});

module.exports = router;
