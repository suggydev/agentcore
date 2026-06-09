const PROVIDERS = {
  telegram: {
    name: 'telegram',
    displayName: 'Telegram',
    category: 'messengers',
    authType: 'api_key',
    modes: [
      { id: 'bot', label: 'Бот', fields: [{ name: 'botToken', label: 'Bot Token', type: 'string', required: true }] },
      { id: 'user', label: 'Пользователь (Userbot)', fields: [
        { name: 'apiId', label: 'API ID (my.telegram.org)', type: 'string', required: true },
        { name: 'apiHash', label: 'API Hash', type: 'string', required: true },
        { name: 'phone', label: 'Номер телефона', type: 'string', required: true },
        { name: 'sessionString', label: 'Session String (опционально)', type: 'string', required: false }
      ]}
    ],
    defaultMode: 'bot',
    icon: 'telegram',
    color: '#0088cc',
    status: 'available'
  },
  whatsapp: {
    name: 'whatsapp',
    displayName: 'WhatsApp',
    category: 'messengers',
    authType: 'oauth',
    modes: [
      { id: 'cloud', label: 'Cloud API', fields: [
        { name: 'phoneNumberId', label: 'Phone Number ID', type: 'string', required: true },
        { name: 'accessToken', label: 'Access Token', type: 'string', required: true },
        { name: 'verifyToken', label: 'Verify Token', type: 'string', required: false }
      ]},
      { id: 'web', label: 'Web (QR-код)', fields: [
        { name: 'sessionName', label: 'Имя сессии', type: 'string', required: false }
      ]}
    ],
    defaultMode: 'cloud',
    icon: 'whatsapp',
    color: '#25d366',
    status: 'available'
  },
  vk: {
    name: 'vk',
    displayName: 'VKontakte',
    category: 'messengers',
    authType: 'api_key',
    modes: [
      { id: 'group', label: 'Сообщество', fields: [
        { name: 'accessToken', label: 'Access Token (группы)', type: 'string', required: true },
        { name: 'groupId', label: 'Group ID', type: 'string', required: true },
        { name: 'confirmationCode', label: 'Код подтверждения (для webhook)', type: 'string', required: false }
      ]},
      { id: 'user', label: 'Пользователь', fields: [
        { name: 'accessToken', label: 'Access Token (пользователя)', type: 'string', required: true }
      ]}
    ],
    defaultMode: 'group',
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
  },
  instagram: {
    name: 'instagram',
    displayName: 'Instagram',
    category: 'messengers',
    authType: 'api_key',
    fields: [
      { name: 'accessToken', label: 'Access Token', type: 'string', required: true },
      { name: 'businessAccountId', label: 'Business Account ID', type: 'string', required: true },
      { name: 'appSecret', label: 'App Secret', type: 'string', required: false }
    ],
    icon: 'instagram',
    color: '#e1306c',
    status: 'available'
  },
  facebook: {
    name: 'facebook',
    displayName: 'Facebook Messenger',
    category: 'messengers',
    authType: 'api_key',
    fields: [
      { name: 'pageAccessToken', label: 'Page Access Token', type: 'string', required: true },
      { name: 'pageId', label: 'Page ID', type: 'string', required: false },
      { name: 'appSecret', label: 'App Secret', type: 'string', required: false }
    ],
    icon: 'facebook',
    color: '#1877f2',
    status: 'available'
  },
  discord: {
    name: 'discord',
    displayName: 'Discord',
    category: 'messengers',
    authType: 'api_key',
    fields: [
      { name: 'botToken', label: 'Bot Token', type: 'string', required: true },
      { name: 'channelId', label: 'Default Channel ID', type: 'string', required: false },
      { name: 'publicKey', label: 'Public Key', type: 'string', required: false }
    ],
    icon: 'discord',
    color: '#5865f2',
    status: 'available'
  },
  viber: {
    name: 'viber',
    displayName: 'Viber',
    category: 'messengers',
    authType: 'api_key',
    fields: [
      { name: 'authToken', label: 'Auth Token', type: 'string', required: true },
      { name: 'webhookUrl', label: 'Webhook URL', type: 'string', required: false }
    ],
    icon: 'viber',
    color: '#7360f2',
    status: 'available'
  },
  sms: {
    name: 'sms',
    displayName: 'SMS.ru',
    category: 'messengers',
    authType: 'api_key',
    fields: [
      { name: 'apiId', label: 'API ID', type: 'string', required: true },
      { name: 'sender', label: 'Sender Name', type: 'string', required: false }
    ],
    icon: 'sms',
    color: '#00bfa5',
    status: 'available'
  },
  yandexcalendar: {
    name: 'yandexcalendar',
    displayName: 'Яндекс Календарь',
    category: 'automation',
    authType: 'oauth',
    fields: [
      { name: 'clientId', label: 'Client ID', type: 'string', required: false },
      { name: 'clientSecret', label: 'Client Secret', type: 'string', required: false },
      { name: 'accessToken', label: 'Access Token', type: 'string', required: false },
      { name: 'refreshToken', label: 'Refresh Token', type: 'string', required: false },
      { name: 'defaultCalendarId', label: 'Default Calendar ID', type: 'string', required: false }
    ],
    icon: 'yandex',
    color: '#fc3f1d',
    status: 'available'
  },
  tbank: {
    name: 'tbank',
    displayName: 'Т-Банк',
    category: 'automation',
    authType: 'api_key',
    fields: [
      { name: 'apiKey', label: 'API Key', type: 'string', required: true },
      { name: 'accountNumber', label: 'Account Number', type: 'string', required: false },
      { name: 'defaultCompanyInn', label: 'Company INN', type: 'string', required: false }
    ],
    icon: 'bank',
    color: '#2b2b2b',
    status: 'available'
  },
  robokassa: {
    name: 'robokassa',
    displayName: 'Robokassa',
    category: 'automation',
    authType: 'api_key',
    fields: [
      { name: 'merchantLogin', label: 'Merchant Login', type: 'string', required: true },
      { name: 'password1', label: 'Password #1', type: 'string', required: true },
      { name: 'password2', label: 'Password #2', type: 'string', required: true },
      { name: 'isTest', label: 'Test Mode', type: 'boolean', required: false }
    ],
    icon: 'robokassa',
    color: '#ff6b6b',
    status: 'available'
  },
  yookassa: {
    name: 'yookassa',
    displayName: 'ЮKassa',
    category: 'payments',
    authType: 'api_key',
    fields: [
      { name: 'shopId', label: 'Shop ID', type: 'string', required: true },
      { name: 'secretKey', label: 'Secret Key', type: 'string', required: true },
      { name: 'apiKey', label: 'API Key', type: 'string', required: false }
    ],
    icon: 'yookassa',
    color: '#00aaff',
    status: 'available'
  },
  sbp: {
    name: 'sbp',
    displayName: 'СБП',
    category: 'payments',
    authType: 'api_key',
    fields: [
      { name: 'bankApiKey', label: 'Bank API Key', type: 'string', required: true },
      { name: 'bankProvider', label: 'Bank Provider', type: 'string', required: false },
      { name: 'merchantId', label: 'Merchant ID', type: 'string', required: true },
      { name: 'phoneNumber', label: 'Phone Number', type: 'string', required: true }
    ],
    icon: 'sbp',
    color: '#2b2b2b',
    status: 'available'
  },
  tinkoff: {
    name: 'tinkoff',
    displayName: 'Тинькофф',
    category: 'payments',
    authType: 'api_key',
    fields: [
      { name: 'terminalKey', label: 'Terminal Key', type: 'string', required: true },
      { name: 'secretKey', label: 'Secret Key', type: 'string', required: true },
      { name: 'apiUrl', label: 'API URL', type: 'string', required: false }
    ],
    icon: 'tinkoff',
    color: '#ffdd2d',
    status: 'available'
  },
  yandexcloudfunctions: {
    name: 'yandexcloudfunctions',
    displayName: 'Yandex Cloud Functions',
    category: 'automation',
    authType: 'api_key',
    fields: [
      { name: 'iamToken', label: 'IAM Token', type: 'string', required: true },
      { name: 'folderId', label: 'Folder ID', type: 'string', required: true },
      { name: 'functionId', label: 'Function ID', type: 'string', required: false },
      { name: 'serviceAccountKey', label: 'Service Account Key (JSON)', type: 'string', required: false }
    ],
    icon: 'yandex',
    color: '#fc3f1d',
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
    webhooks: () => require('./providers/webhooks').WebhooksProvider,
    instagram: () => require('./providers/instagram').InstagramProvider,
    facebook: () => require('./providers/facebook').FacebookProvider,
    discord: () => require('./providers/discord').DiscordProvider,
    viber: () => require('./providers/viber').ViberProvider,
    sms: () => require('./providers/sms').SmsProvider,
    yandexcalendar: () => require('./providers/yandexcalendar').YandexCalendarProvider,
    tbank: () => require('./providers/tbank').TbankProvider,
    robokassa: () => require('./providers/robokassa').RobokassaProvider,
    yookassa: () => require('./providers/yookassa').YookassaProvider,
    sbp: () => require('./providers/sbp').SbpProvider,
    tinkoff: () => require('./providers/tinkoff').TinkoffProvider,
    yandexcloudfunctions: () => require('./providers/yandexcloudfunctions').YandexCloudFunctionsProvider
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
