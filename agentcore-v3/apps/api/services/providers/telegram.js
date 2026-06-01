const axios = require('axios');
const { IntegrationProvider } = require('../IntegrationProvider');

const TELEGRAM_API_BASE = 'https://api.telegram.org';

/**
 * @file  apps/api/services/providers/telegram.js
 * @agent #44 — Telegram Bot API интеграционный провайдер
 *
 * Поддерживаемые операции:
 *   - getMe — получение информации о боте
 *   - sendMessage — отправка сообщения
 *   - setWebhook — установка вебхука
 *   - getWebhookInfo — проверка статуса вебхука
 *   - deleteWebhook — удаление вебхука
 *
 * Документация: https://core.telegram.org/bots/api
 */

class TelegramProvider extends IntegrationProvider {
  constructor(config = {}) {
    super({
      name: 'telegram',
      displayName: 'Telegram',
      agentId: 44,
      version: '1.0.0',
    });
    this.botToken = config.botToken || null;
  }

  _getBaseUrl() {
    if (!this.botToken) {
      throw new Error('[Telegram] botToken не установлен. Передайте botToken в конструктор: new TelegramProvider({ botToken })');
    }
    return `${TELEGRAM_API_BASE}/bot${this.botToken}`;
  }

  async initialize(credentials) {
    if (!credentials || typeof credentials !== 'object') {
      throw new Error('[Telegram] credentials должен быть объектом вида { botToken }');
    }
    if (!credentials.botToken || typeof credentials.botToken !== 'string') {
      throw new Error('[Telegram] Отсутствует обязательный параметр botToken');
    }

    this.botToken = credentials.botToken;
    this.initialized = true;

    this.log('info', 'Провайдер Telegram инициализирован');
    return true;
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

  /**
   * Получает информацию о боте.
   * @returns {Promise<{ok: boolean, result: {id: number, username: string, first_name: string} | undefined}>}
   */
  async getMe() {
    return this._tgRequest('getMe');
  }

  /**
   * Отправляет текстовое сообщение в чат.
   * @param {number|string} chatId
   * @param {string} text
   * @param {object} [options] — дополнительные параметры (parse_mode, reply_markup и т.д.)
   * @returns {Promise<{ok: boolean, result: object}>}
   */
  async sendMessage(chatId, text, options = {}) {
    if (!chatId) {
      throw new Error('[Telegram] Параметр chatId обязателен');
    }
    if (!text || typeof text !== 'string') {
      throw new Error('[Telegram] Параметр text обязателен и должен быть строкой');
    }

    const body = {
      chat_id: chatId,
      text,
      parse_mode: options.parseMode || 'HTML',
      ...options,
    };

    const result = await this._tgRequest('sendMessage', body);
    if (result.ok) {
      this.log('info', 'Сообщение отправлено', { chatId, messageId: result.result?.message_id });
    }
    return result;
  }

  /**
   * Устанавливает вебхук для бота.
   * @param {string} url — URL вебхука
   * @param {object} [options]
   * @param {string} [options.secretToken] — секретный токен для верификации
   * @param {Array<string>} [options.allowedUpdates] — типы обновлений
   * @param {boolean} [options.dropPendingUpdates] — сбросить ожидающие обновления
   * @returns {Promise<{ok: boolean, result: boolean, description: string}>}
   */
  async setWebhook(url, options = {}) {
    if (!url || typeof url !== 'string') {
      throw new Error('[Telegram] Параметр url обязателен и должен быть строкой');
    }

    const body = { url };

    if (options.secretToken) {
      body.secret_token = options.secretToken;
    }
    if (options.allowedUpdates && Array.isArray(options.allowedUpdates)) {
      body.allowed_updates = options.allowedUpdates;
    }
    if (typeof options.dropPendingUpdates === 'boolean') {
      body.drop_pending_updates = options.dropPendingUpdates;
    }

    const result = await this._tgRequest('setWebhook', body);
    if (result.ok) {
      this.log('info', 'Webhook установлен', { url });
    }
    return result;
  }

  /**
   * Получает информацию о текущем вебхуке.
   * @returns {Promise<{ok: boolean, result: {url: string, has_custom_certificate: boolean, pending_update_count: number, last_error_date?: number, last_error_message?: string}}>}
   */
  async getWebhookInfo() {
    return this._tgRequest('getWebhookInfo');
  }

  /**
   * Удаляет вебхук и переключает бота на long polling.
   * @param {object} [options]
   * @param {boolean} [options.dropPendingUpdates] — сбросить ожидающие обновления
   * @returns {Promise<{ok: boolean, result: boolean, description: string}>}
   */
  async deleteWebhook(options = {}) {
    const body = {};
    if (typeof options.dropPendingUpdates === 'boolean') {
      body.drop_pending_updates = options.dropPendingUpdates;
    }

    const result = await this._tgRequest('deleteWebhook', body);
    if (result.ok) {
      this.log('info', 'Webhook удалён');
    }
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
}

function createTelegramProvider(config) {
  return new TelegramProvider(config);
}

module.exports = { TelegramProvider, createTelegramProvider };
