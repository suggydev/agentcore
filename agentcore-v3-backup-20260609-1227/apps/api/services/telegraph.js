const axios = require('axios');

const TELEGRAPH_API = 'https://api.telegra.ph';

/**
 * Create or get Telegraph account
 * @param {string} accessToken
 * @returns {Promise<{access_token: string, auth_url: string}>}
 */
async function createAccount(shortName = 'AgentCore', authorName = 'AgentCore Support') {
  const { data } = await axios.get(`${TELEGRAPH_API}/createAccount`, {
    params: { short_name: shortName, author_name: authorName }
  });
  if (!data.ok) throw new Error(data.error || 'Failed to create Telegraph account');
  return data.result;
}

/**
 * Create a Telegraph page with rich content
 * @param {string} accessToken
 * @param {string} title
 * @param {Array} content - Telegraph Node array
 * @param {string} authorName
 * @returns {Promise<{path: string, url: string}>}
 */
async function createPage(accessToken, title, content, authorName = 'AgentCore Support') {
  const { data } = await axios.post(`${TELEGRAPH_API}/createPage`, {
    access_token: accessToken,
    title,
    author_name: authorName,
    content: JSON.stringify(content)
  });
  if (!data.ok) throw new Error(data.error || 'Failed to create Telegraph page');
  return data.result;
}

/**
 * Get page info
 * @param {string} path
 * @returns {Promise<{path: string, url: string, title: string}>}
 */
async function getPage(path) {
  const { data } = await axios.get(`${TELEGRAPH_API}/getPage/${path}`, {
    params: { return_content: false }
  });
  if (!data.ok) throw new Error(data.error || 'Failed to get Telegraph page');
  return data.result;
}

/**
 * Generate integration guide content for a provider
 * @param {string} providerId
 * @returns {Array} Telegraph Node array
 */
function generateGuideContent(providerId) {
  const guides = {
    telegram: [
      { tag: 'h3', children: ['Как подключить Telegram'] },
      { tag: 'p', children: ['1. Перейдите в @BotFather в Telegram и создайте нового бота.'] },
      { tag: 'p', children: ['2. Получите Bot Token — он выглядит как 123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11'] },
      { tag: 'p', children: ['3. В AgentCore выберите Telegram → Bot API и вставьте токен.'] },
      { tag: 'p', children: ['Для личного аккаунта (MTProto):'] },
      { tag: 'p', children: ['1. Введите номер телефона в формате +79991234567'] },
      { tag: 'p', children: ['2. Получите код в Telegram и введите его'] },
      { tag: 'p', children: ['3. Если включен 2FA — введите пароль'] },
      { tag: 'p', children: ['⚠️ Внимание: использование личного аккаунта может привести к блокировке со стороны Telegram.'] }
    ],
    whatsapp: [
      { tag: 'h3', children: ['Как подключить WhatsApp'] },
      { tag: 'p', children: ['Рекомендуем использовать WhatsApp Business API через Meta Business:'] },
      { tag: 'p', children: ['1. Создайте Business Account в Meta Business Manager'] },
      { tag: 'p', children: ['2. Добавьте номер телефона и получите Phone Number ID'] },
      { tag: 'p', children: ['3. Создайте Permanent Access Token'] },
      { tag: 'p', children: ['4. Вставьте Phone Number ID и Access Token в AgentCore'] },
      { tag: 'p', children: ['⚠️ WhatsApp может ограничить номер при нарушении правил.'] }
    ],
    vk: [
      { tag: 'h3', children: ['Как подключить VK'] },
      { tag: 'p', children: ['1. Создайте сообщество в VK или используйте существующее'] },
      { tag: 'p', children: ['2. В настройках сообщества включите сообщения'] },
      { tag: 'p', children: ['3. Получите Access Token в настройках API (Управление → Работа с API)'] },
      { tag: 'p', children: ['4. В AgentCore выберите режим "Сообщество" или "Пользователь"'] },
      { tag: 'p', children: ['⚠️ VK может ограничить токен при нарушении правил сообщества.'] }
    ],
    instagram: [
      { tag: 'h3', children: ['Как подключить Instagram'] },
      { tag: 'p', children: ['1. Создайте Business Account в Instagram'] },
      { tag: 'p', children: ['2. Привяжите его к Facebook Page'] },
      { tag: 'p', children: ['3. Получите Instagram Graph API Access Token'] },
      { tag: 'p', children: ['4. Вставьте токен в AgentCore'] },
      { tag: 'p', children: ['⚠️ Meta может ограничить аккаунт за автоматизацию.'] }
    ],
    avito: [
      { tag: 'h3', children: ['Как подключить Avito'] },
      { tag: 'p', children: ['1. Создайте приложение в Avito Developer'] },
      { tag: 'p', children: ['2. Получите Client ID и Client Secret'] },
      { tag: 'p', children: ['3. Узнайте свой User ID в профиле Avito'] },
      { tag: 'p', children: ['4. Вставьте данные в AgentCore'] }
    ],
    'yandex-messenger': [
      { tag: 'h3', children: ['Как подключить Яндекс Мессенджер'] },
      { tag: 'p', children: ['1. Получите OAuth Token в Яндекс ID'] },
      { tag: 'p', children: ['2. Узнайте Organization ID в Яндекс Мессенджер'] },
      { tag: 'p', children: ['3. Вставьте данные в AgentCore'] }
    ],
    facebook: [
      { tag: 'h3', children: ['Как подключить Facebook Messenger'] },
      { tag: 'p', children: ['1. Создайте Facebook Page'] },
      { tag: 'p', children: ['2. В настройках Page получите Page Access Token'] },
      { tag: 'p', children: ['3. Вставьте токен в AgentCore'] },
      { tag: 'p', children: ['⚠️ Meta может ограничить страницу за автоматизацию.'] }
    ],
    discord: [
      { tag: 'h3', children: ['Как подключить Discord'] },
      { tag: 'p', children: ['1. Создайте бота в Discord Developer Portal'] },
      { tag: 'p', children: ['2. Скопируйте Bot Token'] },
      { tag: 'p', children: ['3. Вставьте токен в AgentCore'] }
    ],
    viber: [
      { tag: 'h3', children: ['Как подключить Viber'] },
      { tag: 'p', children: ['1. Создайте бота в Viber Admin Panel'] },
      { tag: 'p', children: ['2. Получите Bot Token (Auth Token)'] },
      { tag: 'p', children: ['3. Вставьте токен в AgentCore'] }
    ],
    sms: [
      { tag: 'h3', children: ['Как подключить SMS'] },
      { tag: 'p', children: ['1. Выберите SMS-провайдер (SMS.ru, Twilio и др.)'] },
      { tag: 'p', children: ['2. Получите API ключ'] },
      { tag: 'p', children: ['3. Вставьте ключ в AgentCore'] }
    ]
  };

  return guides[providerId] || [
    { tag: 'h3', children: ['Инструкция по подключению'] },
    { tag: 'p', children: ['Для этого канала инструкция будет добавлена позже.'] }
  ];
}

module.exports = { createAccount, createPage, getPage, generateGuideContent };
