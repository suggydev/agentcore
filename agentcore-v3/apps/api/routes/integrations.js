const express = require('express');
const crypto = require('crypto');
const { prisma } = require('../prisma-client');
const config = require('../config');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

const KNOWN_INTEGRATIONS = [
  'hubspot', 'salesforce', 'pipedrive', 'zoho', 'bitrix24', 'amocrm',
  'telegram', 'whatsapp', 'slack', 'discord', 'instagram', 'messenger',
  'gmail', 'outlook', 'sendgrid',
  'notion', 'gdrive', 'dropbox', 'airtable',
  'zapier', 'make', 'webhooks', 'restapi',
  'stripe', 'shopify', 'woocommerce',
  'gcal', 'calendly'
];

function generateApiKey() {
  return 'whk_' + crypto.randomBytes(24).toString('hex');
}

function generateWebhookSecret() {
  return 'whsec_' + crypto.randomBytes(20).toString('hex');
}

router.get('/', authenticate, async (req, res) => {
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

    const telegramWebhookUrl = `${config.CLIENT_URL || 'https://api.agentcore.work'}/api/channels/telegram/webhook`;

    res.json({
      integrations,
      crmContactCount: crmCount,
      telegramWebhookUrl,
      webchatEmbedCode: `<script>
(function() {
  var w = window.WEBBYRT || {};
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
    res.status(500).json({ error: err.message });
  }
});

router.post('/:name/connect', authenticate, async (req, res) => {
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

    if (key === 'gmail' || key === 'outlook' || key === 'sendgrid') {
      const { email, smtpHost, smtpPort, imapHost, imapPort } = req.body || {};
      if (email) integrationData.email = email;
      if (smtpHost) integrationData.smtpHost = smtpHost;
      if (smtpPort) integrationData.smtpPort = smtpPort;
      if (imapHost) integrationData.imapHost = imapHost;
      if (imapPort) integrationData.imapPort = imapPort;
    }

    if (['hubspot', 'salesforce', 'pipedrive'].includes(key)) {
      const { apiKey, instanceUrl } = req.body || {};
      if (apiKey) integrationData.apiKey = apiKey;
      if (instanceUrl) integrationData.instanceUrl = instanceUrl;
      integrationData.contactsSynced = await prisma.cRMContact.count({ where: { workspaceId: req.user.workspaceId } });
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
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:name/disconnect', authenticate, async (req, res) => {
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

    await prisma.workspace.update({
      where: { id: req.user.workspaceId },
      data: { settings: currentSettings }
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Integration disconnect error:', err);
    res.status(400).json({ error: err.message });
  }
});

router.get('/telegram/check', authenticate, async (req, res) => {
  try {
    const workspace = await prisma.workspace.findUnique({ where: { id: req.user.workspaceId } });
    if (!workspace) return res.status(404).json({ error: 'Workspace not found' });

    const settings = (workspace.settings && typeof workspace.settings === 'object') ? workspace.settings : {};
    const integrations = settings.integrations || {};
    const tg = integrations.telegram;

    if (!tg || !tg.token) {
      return res.status(400).json({ error: 'Telegram bot token not configured' });
    }

    try {
      const axios = require('axios');
      const response = await axios.get(`https://api.telegram.org/bot${tg.token}/getMe`, { timeout: 10000 });
      res.json({ connected: true, bot: response.data.result, webhookUrl: tg.webhookUrl });
    } catch (apiErr) {
      res.status(400).json({ connected: false, error: 'Invalid bot token or Telegram API unreachable' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
