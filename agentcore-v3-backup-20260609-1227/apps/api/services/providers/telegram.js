const axios = require('axios');
const { IntegrationProvider } = require('../IntegrationProvider');

const TELEGRAM_API_BASE = 'https://api.telegram.org';

let TelegramClient = null;
let Api = null;
try {
  const telegram = require('telegram');
  TelegramClient = telegram.TelegramClient;
  Api = telegram.Api;
} catch (e) {
  // gram.js not installed — user mode unavailable
}

/**
 * @file  apps/api/services/providers/telegram.js
 * @agent #44 — Telegram интеграционный провайдер (Bot API + MTProto user)
 *
 * Поддерживаемые режимы:
 *   - bot    — Bot API через botToken (стандарт)
 *   - user   — MTProto через apiId + apiHash + phone/session
 */

class TelegramProvider extends IntegrationProvider {
  constructor(config = {}) {
    super({
      name: 'telegram',
      displayName: 'Telegram',
      agentId: 44,
      version: '2.0.0',
    });
    this.mode = config.mode || 'bot'; // 'bot' | 'user'
    this.botToken = config.botToken || null;
    this.apiId = config.apiId || null;
    this.apiHash = config.apiHash || null;
    this.phone = config.phone || null;
    this.sessionString = config.sessionString || null;
    this.client = null;
  }

  _getBaseUrl() {
    if (!this.botToken) {
      throw new Error('[Telegram] botToken не установлен. Передайте botToken в конструктор: new TelegramProvider({ botToken })');
    }
    return `${TELEGRAM_API_BASE}/bot${this.botToken}`;
  }

  async initialize(credentials) {
    if (!credentials || typeof credentials !== 'object') {
      throw new Error('[Telegram] credentials должен быть объектом');
    }

    this.mode = credentials.mode || this.mode || 'bot';

    if (this.mode === 'user') {
      if (!TelegramClient) {
        throw new Error('[Telegram] gram.js (telegram) не установлен. Запустите: npm install telegram');
      }
      if (!credentials.apiId || !credentials.apiHash) {
        throw new Error('[Telegram] Для user-режима нужны apiId и apiHash (получить: my.telegram.org)');
      }
      this.apiId = parseInt(credentials.apiId, 10);
      this.apiHash = credentials.apiHash;
      this.phone = credentials.phone || null;
      this.sessionString = credentials.sessionString || null;
      this.credentials = credentials;

      // Initialize MTProto client (lazy — connects on first use)
      const { StringSession } = require('telegram').sessions;
      const session = new StringSession(this.sessionString || '');
      this.client = new TelegramClient(session, this.apiId, this.apiHash, {
        connectionRetries: 5,
      });
      await this.client.connect();

      if (!this.sessionString && this.phone) {
        // New login — send code
        this.log('info', 'MTProto требует авторизации. Отправьте код подтверждения.', { phone: this.phone });
      } else if (!await this.client.isUserAuthorized()) {
        throw new Error('[Telegram] MTProto сессия не авторизована. Требуется повторная авторизация.');
      }

      this.initialized = true;
      this.log('info', 'Telegram MTProto инициализирован', { phone: this.phone, authorized: await this.client.isUserAuthorized() });
      return true;
    }

    // Bot mode
    if (!credentials.botToken || typeof credentials.botToken !== 'string') {
      throw new Error('[Telegram] Отсутствует обязательный параметр botToken');
    }
    this.botToken = credentials.botToken;
    this.credentials = credentials;
    this.initialized = true;
    this.log('info', 'Telegram Bot API инициализирован');
    return true;
  }

  /**
   * Валидация credentials перед сохранением интеграции.
   * Bot mode — тестовый запрос getMe.
   * User mode — проверка наличия apiId/apiHash (реальная авторизация требует SMS).
   * @param {object} credentials
   * @returns {Promise<{valid: boolean, error?: string}>}
   */
  async validateCredentials(credentials) {
    if (!credentials || typeof credentials !== 'object') {
      return { valid: false, error: 'credentials должен быть объектом' };
    }
    const mode = credentials.mode || this.mode || 'bot';

    if (mode === 'user') {
      if (!credentials.apiId || !credentials.apiHash) {
        return { valid: false, error: 'Для user-режима нужны apiId и apiHash (получить: my.telegram.org)' };
      }
      return { valid: true };
    }

    // Bot mode — test token via getMe
    if (!credentials.botToken || typeof credentials.botToken !== 'string') {
      return { valid: false, error: 'Отсутствует обязательный параметр botToken' };
    }
    try {
      const response = await axios.get(`${TELEGRAM_API_BASE}/bot${credentials.botToken}/getMe`, { timeout: 10000 });
      if (response.data && response.data.ok && response.data.result && response.data.result.id) {
        return { valid: true };
      }
      return { valid: false, error: 'Неверный botToken: Telegram API вернул ошибку' };
    } catch (err) {
      return { valid: false, error: `Неверный botToken: ${err.message}` };
    }
  }

  /**
   * Возвращает текущий режим работы провайдера.
   * @returns {string}
   */
  getMode() {
    return this.mode;
  }

  /**
   * Запускает QR-авторизацию для MTProto user-режима.
   * Если пользователь уже авторизован, возвращает статус сразу.
   * @returns {Promise<{ok: boolean, authorized: boolean, token?: string, qrData?: string, note: string}>}
   */
  async startQrAuth() {
    try {
      if (this.mode !== 'user') {
        throw new Error('[Telegram] startQrAuth доступен только в user-режиме');
      }
      if (!this.client) {
        throw new Error('[Telegram] MTProto клиент не инициализирован. Вызовите initialize() с mode=user');
      }
      if (!TelegramClient || !Api) {
        throw new Error('[Telegram] gram.js (telegram) не установлен. Запустите: npm install telegram');
      }

      if (await this.client.isUserAuthorized()) {
        return { ok: true, authorized: true, note: 'Пользователь уже авторизован' };
      }

      const exportResult = await this.client.invoke(new Api.auth.ExportLoginToken({
        apiId: this.apiId,
        apiHash: this.apiHash,
        exceptIds: [],
      }));

      if (exportResult instanceof Api.auth.LoginToken) {
        const token = Buffer.from(exportResult.token).toString('base64');
        return {
          ok: true,
          authorized: false,
          token,
          qrData: `tg://login?token=${encodeURIComponent(token)}`,
          note: 'Отсканируйте QR-код в Telegram > Settings > Devices > Link Desktop Device'
        };
      }

      if (exportResult instanceof Api.auth.LoginTokenSuccess) {
        return { ok: true, authorized: true, note: 'Авторизация через QR успешна' };
      }

      if (exportResult instanceof Api.auth.LoginTokenMigrateTo) {
        return {
          ok: false,
          authorized: false,
          note: 'Требуется миграция на другой дата-центр. Повторите попытку.',
          migrateToDc: exportResult.dcId
        };
      }

      return { ok: false, authorized: false, note: 'Неизвестный ответ от сервера авторизации' };
    } catch (err) {
      this.log('error', 'startQrAuth failed', { error: err.message });
      throw err;
    }
  }

  async sendMessage(agentId, conversationId, message) {
    try {
      if (!conversationId) throw new Error('[Telegram] conversationId (chatId) is required');
      if (!message) throw new Error('[Telegram] message is required');
      const chatId = typeof conversationId === 'number' ? conversationId : parseInt(conversationId, 10) || conversationId;

      if (this.mode === 'user' && this.client) {
        // MTProto user send
        const result = await this.client.invoke(new Api.messages.SendMessage({
          peer: chatId,
          message,
          randomId: BigInt(Math.floor(Math.random() * 1e15)),
        }));
        this.log('info', 'MTProto сообщение отправлено', { chatId, msgId: result.id });
        return { ok: true, result };
      }

      return await this._sendTelegramMessage(chatId, message);
    } catch (err) {
      this.log('error', 'sendMessage failed', { error: err.message });
      throw err;
    }
  }

  async _tgRequest(method, body = {}) {
    return this.execute(() =>
      axios.post(`${this._getBaseUrl()}/${method}`, body, {
        timeout: 15000,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'AgentCore/3.0 (Telegram Provider #44)',
        },
      })
    );
  }

  async getMe() {
    if (this.mode === 'user' && this.client) {
      const me = await this.client.getMe();
      return { ok: true, result: { id: me.id, username: me.username, first_name: me.firstName } };
    }
    return this._tgRequest('getMe');
  }

  async _sendTelegramMessage(chatId, text, options = {}) {
    if (!chatId) throw new Error('[Telegram] Параметр chatId обязателен');
    if (!text || typeof text !== 'string') throw new Error('[Telegram] Параметр text обязателен');

    const body = { chat_id: chatId, text, parse_mode: options.parseMode || 'HTML', ...options };
    const result = await this._tgRequest('sendMessage', body);
    if (result.ok) {
      this.log('info', 'Сообщение отправлено', { chatId, messageId: result.result?.message_id });
    }
    return result;
  }

  async setWebhook(url, options = {}) {
    if (this.mode === 'user') {
      throw new Error('[Telegram] Webhook не поддерживается в user-режиме. Используйте polling.');
    }
    if (!url || typeof url !== 'string') throw new Error('[Telegram] Параметр url обязателен');

    const body = { url };
    if (options.secretToken) body.secret_token = options.secretToken;
    if (options.allowedUpdates && Array.isArray(options.allowedUpdates)) body.allowed_updates = options.allowedUpdates;
    if (typeof options.dropPendingUpdates === 'boolean') body.drop_pending_updates = options.dropPendingUpdates;

    const result = await this._tgRequest('setWebhook', body);
    if (result.ok) this.log('info', 'Webhook установлен', { url });
    return result;
  }

  async getWebhookInfo() {
    if (this.mode === 'user') return { ok: true, result: { mode: 'user', note: 'MTProto не использует webhook' } };
    return this._tgRequest('getWebhookInfo');
  }

  async deleteWebhook(options = {}) {
    if (this.mode === 'user') return { ok: true, result: true };
    const body = {};
    if (typeof options.dropPendingUpdates === 'boolean') body.drop_pending_updates = options.dropPendingUpdates;
    const result = await this._tgRequest('deleteWebhook', body);
    if (result.ok) this.log('info', 'Webhook удалён');
    return result;
  }

  async healthCheck() {
    try {
      const start = Date.now();
      const result = await this.getMe();
      return { ok: result.ok, latency: Date.now() - start };
    } catch (err) {
      this.log('error', 'Health-check не пройден', { error: err.message });
      return { ok: false, error: err.message };
    }
  }

  async handleWebhook(payload, signature) {
    try {
      if (this.mode === 'user') {
        return {
          processed: false,
          reason: 'user_mode_uses_polling',
          note: 'User-режим использует MTProto polling, webhook не поддерживается'
        };
      }
      if (!payload || typeof payload !== 'object') throw new Error('[Telegram] Invalid webhook payload');
      const message = payload.message || payload.callback_query?.message;
      if (!message) return { processed: false, reason: 'no_message' };
      return {
        processed: true,
        chatId: message.chat?.id,
        text: message.text || '',
        from: message.from?.username || message.from?.first_name || '',
        userId: message.from?.id
      };
    } catch (err) {
      this.log('error', 'Webhook handling failed', { error: err.message });
      throw err;
    }
  }

  async disconnect() {
    try {
      if (this.mode === 'user' && this.client) {
        await this.client.disconnect();
        this.client = null;
        this.log('info', 'Telegram MTProto отключен');
      }
      if (this.mode === 'bot' && this.botToken) {
        await this.deleteWebhook({ dropPendingUpdates: true });
      }
      this.botToken = null;
      this.initialized = false;
      this.log('info', 'Telegram Bot API отключен');
      return true;
    } catch (err) {
      this.log('error', 'Disconnect failed', { error: err.message });
      this.botToken = null;
      this.initialized = false;
      return false;
    }
  }
}

function createTelegramProvider(config) {
  return new TelegramProvider(config);
}

module.exports = { TelegramProvider, createTelegramProvider };
