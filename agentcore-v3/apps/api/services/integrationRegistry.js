const PROVIDERS = {
  telegram: {
    name: 'telegram',
    displayName: 'Telegram',
    category: 'messengers',
    authType: 'api_key',
    fields: [{ name: 'botToken', label: 'Bot Token', type: 'string', required: true }],
    icon: 'telegram',
    color: '#0088cc',
    status: 'available'
  },
  whatsapp: {
    name: 'whatsapp',
    displayName: 'WhatsApp Business',
    category: 'messengers',
    authType: 'oauth',
    fields: [
      { name: 'phoneNumberId', label: 'Phone Number ID', type: 'string', required: true },
      { name: 'accessToken', label: 'Access Token', type: 'string', required: true },
      { name: 'verifyToken', label: 'Verify Token', type: 'string', required: false }
    ],
    icon: 'whatsapp',
    color: '#25d366',
    status: 'available'
  },
  vk: {
    name: 'vk',
    displayName: 'VKontakte',
    category: 'messengers',
    authType: 'api_key',
    fields: [
      { name: 'accessToken', label: 'Access Token', type: 'string', required: true },
      { name: 'groupId', label: 'Group ID', type: 'string', required: true }
    ],
    icon: 'vk',
    color: '#4a76a8',
    status: 'available'
  },
  avito: {
    name: 'avito',
    displayName: 'Avito',
    category: 'messengers',
    authType: 'oauth',
    fields: [
      { name: 'clientId', label: 'Client ID', type: 'string', required: true },
      { name: 'clientSecret', label: 'Client Secret', type: 'string', required: true },
      { name: 'userId', label: 'Account ID', type: 'string', required: true }
    ],
    icon: 'avito',
    color: '#00aaff',
    status: 'available'
  },
  yandexmessenger: {
    name: 'yandexmessenger',
    displayName: 'Yandex Messenger',
    category: 'messengers',
    authType: 'oauth',
    fields: [
      { name: 'accessToken', label: 'OAuth Token', type: 'string', required: true },
      { name: 'orgId', label: 'Organization ID', type: 'string', required: true }
    ],
    icon: 'yandex',
    color: '#fc3f1d',
    status: 'available'
  },
  amocrm: {
    name: 'amocrm',
    displayName: 'amoCRM',
    category: 'crm',
    authType: 'oauth',
    fields: [
      { name: 'domain', label: 'Subdomain', type: 'string', required: true },
      { name: 'clientId', label: 'Client ID', type: 'string', required: true },
      { name: 'clientSecret', label: 'Client Secret', type: 'string', required: true },
      { name: 'redirectUri', label: 'Redirect URI', type: 'string', required: true }
    ],
    icon: 'amocrm',
    color: '#ff5c5c',
    status: 'available'
  },
  bitrix24: {
    name: 'bitrix24',
    displayName: 'Bitrix24',
    category: 'crm',
    authType: 'oauth',
    fields: [
      { name: 'domain', label: 'Domain', type: 'string', required: true },
      { name: 'webhookUserId', label: 'Webhook User ID', type: 'string', required: false },
      { name: 'webhookToken', label: 'Webhook Token', type: 'string', required: false },
      { name: 'clientId', label: 'Client ID', type: 'string', required: false },
      { name: 'clientSecret', label: 'Client Secret', type: 'string', required: false }
    ],
    icon: 'bitrix24',
    color: '#2fc6f6',
    status: 'available'
  },
  '1c': {
    name: '1c',
    displayName: '1C',
    category: 'crm',
    authType: 'basic',
    fields: [
      { name: 'baseUrl', label: '1C OData URL', type: 'string', required: true },
      { name: 'username', label: 'Username', type: 'string', required: true },
      { name: 'password', label: 'Password', type: 'string', required: true }
    ],
    icon: '1c',
    color: '#ffcc00',
    status: 'available'
  },
  mailru: {
    name: 'mailru',
    displayName: 'Mail.ru / VK Workspace',
    category: 'email',
    authType: 'basic',
    fields: [
      { name: 'email', label: 'Email', type: 'string', required: true },
      { name: 'password', label: 'App Password', type: 'string', required: true },
      { name: 'imapHost', label: 'IMAP Host', type: 'string', required: false },
      { name: 'smtpHost', label: 'SMTP Host', type: 'string', required: false }
    ],
    icon: 'mailru',
    color: '#005ff9',
    status: 'available'
  },
  yandex360: {
    name: 'yandex360',
    displayName: 'Yandex 360 / Disk',
    category: 'email',
    authType: 'oauth',
    fields: [
      { name: 'orgId', label: 'Organization ID', type: 'string', required: true },
      { name: 'clientId', label: 'Client ID', type: 'string', required: true },
      { name: 'clientSecret', label: 'Client Secret', type: 'string', required: true },
      { name: 'accessToken', label: 'Access Token', type: 'string', required: false }
    ],
    icon: 'yandex',
    color: '#fc3f1d',
    status: 'available'
  },
  unisender: {
    name: 'unisender',
    displayName: 'Unisender',
    category: 'email',
    authType: 'api_key',
    fields: [
      { name: 'apiKey', label: 'API Key', type: 'string', required: true },
      { name: 'defaultSenderEmail', label: 'Sender Email', type: 'string', required: false },
      { name: 'defaultSenderName', label: 'Sender Name', type: 'string', required: false }
    ],
    icon: 'unisender',
    color: '#1a73e8',
    status: 'available'
  },
  gdrive: {
    name: 'gdrive',
    displayName: 'Google Drive',
    category: 'automation',
    authType: 'oauth',
    fields: [
      { name: 'clientId', label: 'Client ID', type: 'string', required: true },
      { name: 'clientSecret', label: 'Client Secret', type: 'string', required: true },
      { name: 'accessToken', label: 'Access Token', type: 'string', required: false },
      { name: 'refreshToken', label: 'Refresh Token', type: 'string', required: false }
    ],
    icon: 'gdrive',
    color: '#4285f4',
    status: 'available'
  },
  albato: {
    name: 'albato',
    displayName: 'Albato',
    category: 'automation',
    authType: 'api_key',
    fields: [
      { name: 'apiToken', label: 'API Token', type: 'string', required: true },
      { name: 'workspaceId', label: 'Workspace ID', type: 'string', required: false }
    ],
    icon: 'albato',
    color: '#6c5ce7',
    status: 'available'
  },
  webhooks: {
    name: 'webhooks',
    displayName: 'Custom Webhooks',
    category: 'automation',
    authType: 'api_key',
    fields: [
      { name: 'secret', label: 'Webhook Secret', type: 'string', required: true },
      { name: 'targetUrl', label: 'Target URL', type: 'string', required: false }
    ],
    icon: 'webhook',
    color: '#636e72',
    status: 'available'
  }
};

function getProvider(name) {
  try {
    const meta = PROVIDERS[name];
    if (!meta) return null;
    const ProviderClass = _loadProviderClass(name);
    if (!ProviderClass) return null;
    return { meta, ProviderClass };
  } catch (err) {
    console.error('[IntegrationRegistry] getProvider error:', err);
    return null;
  }
}

function _loadProviderClass(name) {
  const map = {
    telegram: () => require('./providers/telegram').TelegramProvider,
    whatsapp: () => require('./providers/whatsapp').WhatsAppProvider,
    vk: () => require('./providers/vk').VkProvider,
    avito: () => require('./providers/avito').AvitoProvider,
    yandexmessenger: () => require('./providers/yandexmessenger').YandexMessengerProvider,
    amocrm: () => require('./providers/amocrm').AmoCRMProvider,
    bitrix24: () => require('./providers/bitrix24').Bitrix24Provider,
    '1c': () => require('./providers/1c').OneCProvider,
    mailru: () => require('./providers/mailru').MailRuProvider,
    yandex360: () => require('./providers/yandex360').Yandex360Provider,
    unisender: () => require('./providers/unisender').UnisenderProvider,
    gdrive: () => require('./providers/gdrive').GoogleDriveProvider,
    albato: () => require('./providers/albato').AlbatoProvider,
    webhooks: () => require('./providers/webhooks').WebhooksProvider
  };
  const loader = map[name];
  return loader ? loader() : null;
}

function getProvidersByCategory(category) {
  try {
    return Object.values(PROVIDERS).filter(p => p.category === category);
  } catch (err) {
    console.error('[IntegrationRegistry] getProvidersByCategory error:', err);
    return [];
  }
}

function getProviderStatus(name) {
  try {
    const meta = PROVIDERS[name];
    if (!meta) return { available: false };
    return { available: true, authType: meta.authType, fields: meta.fields };
  } catch (err) {
    console.error('[IntegrationRegistry] getProviderStatus error:', err);
    return { available: false };
  }
}

function getAllProviders() {
  try {
    return Object.values(PROVIDERS);
  } catch (err) {
    console.error('[IntegrationRegistry] getAllProviders error:', err);
    return [];
  }
}

function createProviderInstance(name, credentials) {
  try {
    const entry = getProvider(name);
    if (!entry) return null;
    const instance = new entry.ProviderClass(credentials || {});
    return instance;
  } catch (err) {
    console.error('[IntegrationRegistry] createProviderInstance error:', err);
    return null;
  }
}

module.exports = {
  PROVIDERS,
  getProvider,
  getProvidersByCategory,
  getProviderStatus,
  getAllProviders,
  createProviderInstance
};
