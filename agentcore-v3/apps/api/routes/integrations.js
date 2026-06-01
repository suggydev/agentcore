const express = require('express');
const crypto = require('crypto');
const { prisma } = require('../prisma-client');
const config = require('../config');
const { authenticate } = require('../middleware/auth');
const { generalLimiter } = require('../middleware/rateLimit');
const { safeError } = require('../utils/errors');

const router = express.Router();

const RF_INTEGRATIONS = [
  'amocrm', 'bitrix24', '1c',
  'telegram', 'whatsapp', 'vk', 'yandexmessenger', 'avito',
  'yandex360', 'mailru', 'unisender', 'gdrive',
  'albato', 'yandexcloud', 'webhooks', 'restapi',
  'yookassa', 'robokassa', 'tbank',
  'yandexcalendar',
];

function generateApiKey() {
  return 'whk_' + crypto.randomBytes(24).toString('hex');
}

function generateWebhookSecret() {
  return 'whsec_' + crypto.randomBytes(20).toString('hex');
}

router.get('/', authenticate, generalLimiter, async (req, res) => {
  try {
    const workspace = await prisma.workspace.findUnique({ where: { id: req.user.workspaceId } });
    if (!workspace) return res.status(404).json({ error: 'Workspace not found' });

    const settings = (workspace.settings && typeof workspace.settings === 'object') ? workspace.settings : {};
    const integrations = settings.integrations || {};

    if (!integrations.webchat || !integrations.webchat.apiKey) {
      integrations.webchat = {
        apiKey: config.WEBCHAT_API_KEY || generateApiKey(),
        connected: !!config.WEBCHAT_API_KEY,
        createdAt: new Date().toISOString()
      };
    }

    const crmCount = await prisma.cRMContact.count({ where: { workspaceId: req.user.workspaceId } });

    res.json({
      integrations,
      crmContactCount: crmCount,
      webchatEmbedCode: `<script>
(function() {
  var w = window.AGENTCORE || {};
  w.workspaceId = '${req.user.workspaceId}';
  w.apiKey = '${integrations.webchat?.apiKey || ''}';
  w.apiUrl = '${config.CLIENT_URL || 'https://api.agentcore.work'}/api/channels/webchat/message';
  w.widgetColor = '#7C3AED';
  w.widgetPosition = 'right';
})();
</script>
<script async src="${config.CLIENT_URL || 'https://api.agentcore.work'}/webchat/embed.js"></script>`
    });
  } catch (err) {
    console.error('Integrations GET error:', err);
    safeError(res, err);
  }
});

router.post('/:name/connect', authenticate, generalLimiter, async (req, res) => {
  try {
    const { name } = req.params;
    const key = name.toLowerCase();

    const workspace = await prisma.workspace.findUnique({ where: { id: req.user.workspaceId } });
    if (!workspace) return res.status(404).json({ error: 'Workspace not found' });

    const currentSettings = (workspace.settings && typeof workspace.settings === 'object') ? { ...workspace.settings } : {};
    const integrations = currentSettings.integrations || {};

    let integrationData = { connected: true, connectedAt: new Date().toISOString() };

    if (key === 'webchat') {
      integrationData.apiKey = config.WEBCHAT_API_KEY || generateApiKey();
      integrationData.webhookSecret = generateWebhookSecret();
    }

    if (key === 'telegram') {
      const { token } = req.body || {};
      if (token) integrationData.token = token;
      integrationData.webhookUrl = `${config.CLIENT_URL || 'https://api.agentcore.work'}/api/channels/telegram/webhook`;
    }

    if (key === 'whatsapp') {
      const { phoneNumberId, accessToken, verifyToken } = req.body || {};
      if (phoneNumberId) integrationData.phoneNumberId = phoneNumberId;
      if (accessToken) integrationData.accessToken = accessToken;
      if (verifyToken) integrationData.verifyToken = verifyToken;
    }

    if (key === 'yookassa') {
      const { shopId, secretKey } = req.body || {};
      if (shopId) integrationData.shopId = shopId;
      if (secretKey) integrationData.secretKey = secretKey;
    }

    if (['amocrm', 'bitrix24'].includes(key)) {
      const { domain, apiKey, clientId, clientSecret, redirectUri } = req.body || {};
      if (domain) integrationData.domain = domain;
      if (apiKey) integrationData.apiKey = apiKey;
      if (clientId) integrationData.clientId = clientId;
      if (clientSecret) integrationData.clientSecret = clientSecret;
      if (redirectUri) integrationData.redirectUri = redirectUri;
      integrationData.contactsSynced = await prisma.cRMContact.count({ where: { workspaceId: req.user.workspaceId } });
    }

    if (key === 'gdrive' || key === 'yandex360' || key === 'mailru') {
      const { email, token: driveToken } = req.body || {};
      if (email) integrationData.email = email;
      if (driveToken) integrationData.token = driveToken;
    }

    if (key === 'webhooks') {
      const { url } = req.body || {};
      if (url) integrationData.url = url;
    }

    integrations[key] = { ...(integrations[key] || {}), ...integrationData };
    currentSettings.integrations = integrations;

    await prisma.workspace.update({
      where: { id: req.user.workspaceId },
      data: { settings: currentSettings }
    });

    res.json({ success: true, integration: integrations[key] });
  } catch (err) {
    console.error('Integration connect error:', err);
    safeError(res, err, 400, 'Failed to connect integration');
  }
});

router.delete('/:name/disconnect', authenticate, generalLimiter, async (req, res) => {
  try {
    const { name } = req.params;
    const key = name.toLowerCase();

    const workspace = await prisma.workspace.findUnique({ where: { id: req.user.workspaceId } });
    if (!workspace) return res.status(404).json({ error: 'Workspace not found' });

    const currentSettings = (workspace.settings && typeof workspace.settings === 'object') ? { ...workspace.settings } : {};
    const integrations = currentSettings.integrations || {};

    if (integrations[key]) {
      integrations[key] = { ...integrations[key], connected: false, disconnectedAt: new Date().toISOString() };
    }

    currentSettings.integrations = integrations;
    await prisma.workspace.update({ where: { id: req.user.workspaceId }, data: { settings: currentSettings } });
    res.json({ success: true });
  } catch (err) {
    safeError(res, err, 400, 'Failed to disconnect');
  }
});

router.get('/telegram/check', authenticate, generalLimiter, async (req, res) => {
  try {
    const workspace = await prisma.workspace.findUnique({ where: { id: req.user.workspaceId } });
    if (!workspace) return res.status(404).json({ error: 'Workspace not found' });

    const settings = (workspace.settings && typeof workspace.settings === 'object') ? workspace.settings : {};
    const integrations = settings.integrations || {};
    const tg = integrations.telegram;

    if (!tg || !tg.token) return res.status(400).json({ error: 'Telegram bot token not configured' });

    try {
      const axios = require('axios');
      const response = await axios.get(`https://api.telegram.org/bot${tg.token}/getMe`, { timeout: 10000 });
      res.json({ connected: true, bot: response.data.result });
    } catch (apiErr) {
      res.status(400).json({ connected: false, error: 'Invalid bot token' });
    }
  } catch (err) {
    safeError(res, err);
  }
});

module.exports = router;
