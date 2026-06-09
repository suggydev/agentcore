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
  mode: z.string().optional(),
  credentials: z.any().optional()
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
      mode: i.mode,
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
    const parsed = connectSchema.safeParse({ agentId: req.body.agentId, mode: req.body.mode || req.body.credentials?.mode, credentials: req.body.credentials });
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors });
    }

    const { agentId, mode, credentials } = parsed.data;
    const providerEntry = getProvider(providerName);
    if (!providerEntry) {
      return res.status(400).json({ error: `Unknown provider: ${providerName}` });
    }

    const agent = await prisma.agent.findFirst({
      where: { id: agentId, workspace: { users: { some: { id: req.user.userId } } } }
    });
    if (!agent) return res.status(404).json({ error: 'Agent not found' });

    const provider = createProviderInstance(providerName, credentials || {});
    if (!provider) return res.status(500).json({ error: `Failed to create ${providerName} provider instance: constructor returned null or missing dependencies` });

    // Validate credentials with a real API test call before saving
    let validationResult;
    try {
      validationResult = await provider.validateCredentials(credentials || {});
    } catch (valErr) {
      return res.status(400).json({ error: `Ошибка проверки ключа: ${valErr.message}` });
    }
    if (!validationResult.valid) {
      return res.status(400).json({ error: validationResult.error || 'Неверный API ключ или токен. Проверьте введённые данные.' });
    }

    let initResult;
    try {
      initResult = await provider.initialize(credentials || {});
    } catch (initErr) {
      return res.status(400).json({ error: `Provider initialization failed: ${initErr.message}` });
    }

    const webhookSecret = crypto.randomBytes(24).toString('hex');
    const webhookUrl = `${config.API_URL}/api/webhooks/${providerName}/${agentId}`;

    const encryptedCreds = encrypt(JSON.stringify(credentials || {}));

    const integration = await prisma.integration.upsert({
      where: { agentId_provider: { agentId, provider: providerName } },
      update: {
        credentials: encryptedCreds,
        status: 'active',
        mode: mode || null,
        webhookUrl,
        webhookSecret,
        lastError: null
      },
      create: {
        agentId,
        provider: providerName,
        mode: mode || null,
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
    if (!provider) return res.status(500).json({ error: `Provider ${providerName} not available: integration inactive or credentials invalid` });

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

// GET /api/integrations/:provider/qr — получить QR-код для WhatsApp Web
router.get('/:provider/qr', authenticate, generalLimiter, async (req, res) => {
  try {
    const { provider: providerName } = req.params;
    const { agentId } = req.query;
    if (!agentId) return res.status(400).json({ error: 'agentId is required' });
    if (providerName !== 'whatsapp') return res.status(400).json({ error: 'QR endpoint only available for WhatsApp' });

    const integration = await prisma.integration.findUnique({
      where: { agentId_provider: { agentId, provider: providerName } }
    });
    if (!integration) return res.status(404).json({ error: 'Integration not found' });

    const credsJson = decrypt(integration.credentials);
    const creds = JSON.parse(credsJson);
    const provider = createProviderInstance(providerName, creds);
    if (!provider) return res.status(500).json({ error: 'Provider not available' });

    await provider.initialize(creds);
    const qr = provider.getQrCode ? provider.getQrCode() : null;
    const ready = provider.isWebReady ? provider.isWebReady() : false;

    res.json({ qr, ready });
  } catch (err) {
    safeError(res, err, 400, 'Failed to get QR code');
  }
});

// GET /api/integrations/:provider/mode — получить/сменить mode
router.get('/:provider/mode', authenticate, generalLimiter, async (req, res) => {
  try {
    const { provider: providerName } = req.params;
    const { agentId } = req.query;
    if (!agentId) return res.status(400).json({ error: 'agentId is required' });

    const integration = await prisma.integration.findUnique({
      where: { agentId_provider: { agentId, provider: providerName } }
    });
    if (!integration) return res.status(404).json({ error: 'Integration not found' });

    res.json({ mode: integration.mode, provider: providerName });
  } catch (err) {
    safeError(res, err);
  }
});

// POST /api/integrations/request — запрос на новую интеграцию
router.post('/request', authenticate, generalLimiter, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || text.trim().length < 3) {
      return res.status(400).json({ error: 'Опишите запрос (минимум 3 символа)' });
    }

    // Save to workspace settings as pending request
    const workspace = await prisma.workspace.findUnique({
      where: { id: req.user.workspaceId }
    });
    if (!workspace) return res.status(404).json({ error: 'Workspace not found' });

    const settings = (workspace.settings && typeof workspace.settings === 'object')
      ? { ...workspace.settings }
      : {};
    const requests = settings.integrationRequests || [];
    requests.push({
      id: Date.now().toString(),
      text: text.trim(),
      userId: req.user.userId,
      createdAt: new Date().toISOString(),
      status: 'pending'
    });
    settings.integrationRequests = requests;

    await prisma.workspace.update({
      where: { id: req.user.workspaceId },
      data: { settings }
    });

    res.json({ ok: true, message: 'Запрос отправлен. Мы рассмотрим его в ближайшее время.' });
  } catch (err) {
    safeError(res, err, 500, 'Не удалось отправить запрос.');
  }
});

module.exports = router;
