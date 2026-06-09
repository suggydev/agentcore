const axios = require('axios');
const crypto = require('crypto');
const { IntegrationProvider, AppError } = require('../IntegrationProvider');

const VIBER_API_BASE = 'https://chatapi.viber.com/pa';

/**
 * @file  apps/api/services/providers/viber.js
 * @agent #58 — Viber REST API интеграционный провайдер
 *
 * Поддерживаемые операции:
 *   - sendMessage — отправка текстового сообщения пользователю
 *   - handleWebhook — верификация HMAC и парсинг входящих событий
 *
 * Документация: https://developers.viber.com/docs/api/rest-bot-api/
 */

class ViberProvider extends IntegrationProvider {
  constructor(config = {}) {
    super({
      name: 'viber',
      displayName: 'Viber',
      agentId: 58,
      version: '1.0.0'
    });
    this.authToken = config.authToken || null;
    this.webhookUrl = config.webhookUrl || null;
    this.baseUrl = VIBER_API_BASE;
    this.client = axios.create({ baseURL: this.baseUrl, timeout: 15000 });
  }

  async initialize(credentials) {
    if (!credentials || typeof credentials !== 'object') {
      throw new AppError('[Viber] credentials must be an object', 400, 'MISSING_CREDENTIALS');
    }
    if (!credentials.authToken || typeof credentials.authToken !== 'string') {
      throw new AppError('[Viber] authToken is required', 400, 'MISSING_CREDENTIALS');
    }
    this.authToken = credentials.authToken;
    this.webhookUrl = credentials.webhookUrl || null;
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 15000,
      headers: {
        'X-Viber-Auth-Token': this.authToken,
        'Content-Type': 'application/json'
      }
    });
    this.initialized = true;
    this.credentials = credentials;
    this.log('info', 'ViberProvider initialized');
    return true;
  }

  /**
   * Валидация credentials перед сохранением — тестовый запрос get_account_info.
   * @param {object} credentials
   * @returns {Promise<{valid: boolean, error?: string}>}
   */
  async validateCredentials(credentials) {
    if (!credentials || typeof credentials !== 'object') {
      return { valid: false, error: 'credentials должен быть объектом' };
    }
    if (!credentials.authToken || typeof credentials.authToken !== 'string') {
      return { valid: false, error: 'authToken обязателен' };
    }
    try {
      const response = await axios.post(`${VIBER_API_BASE}/get_account_info`, {}, {
        headers: { 'X-Viber-Auth-Token': credentials.authToken, 'Content-Type': 'application/json' },
        timeout: 10000,
      });
      if (response.data && response.data.status === 0 && response.data.id) {
        return { valid: true };
      }
      return { valid: false, error: 'Неверный authToken' };
    } catch (err) {
      return { valid: false, error: `Неверный authToken: ${err.response?.data?.status_message || err.message}` };
    }
  }

  ensureInitialized() {
    if (!this.initialized || !this.authToken) {
      throw new AppError('[Viber] Provider not initialized', 500, 'NOT_INITIALIZED');
    }
  }

  async sendMessage(agentId, conversationId, message) {
    try {
      this.ensureInitialized();
      if (!conversationId) throw new Error('[Viber] conversationId (user_id) is required');
      if (!message) throw new Error('[Viber] message is required');
      return await this._sendViberMessage(conversationId, message);
    } catch (err) {
      this.log('error', 'sendMessage failed', { error: err.message });
      throw err;
    }
  }

  async _sendViberMessage(userId, text) {
    this.ensureInitialized();
    return this.execute(async () => {
      const response = await this.client.post('/send_message', {
        receiver: userId,
        type: 'text',
        text,
        sender: { name: 'AgentCore' }
      });
      this.log('info', 'Message sent', { userId, status: response.data?.status });
      return response.data;
    });
  }

  verifyWebhookSignature(body, signature) {
    if (!this.authToken) return false;
    if (!signature) return false;
    const expected = crypto
      .createHmac('sha256', this.authToken)
      .update(body, 'utf8')
      .digest('hex');
    try {
      return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    } catch {
      return false;
    }
  }

  async handleWebhook(payload, signature) {
    try {
      if (!payload || typeof payload !== 'object') {
        throw new Error('[Viber] Invalid webhook payload');
      }
      const rawBody = payload.__rawBody || JSON.stringify(payload);
      if (!this.verifyWebhookSignature(rawBody, signature)) {
        throw new AppError('[Viber] Webhook signature verification failed', 401, 'INVALID_SIGNATURE');
      }
      const event = payload.event;
      if (event === 'webhook') return { processed: true, type: 'webhook_confirmation' };
      const message = payload.message;
      if (!message) return { processed: false, reason: 'no_message' };
      return {
        processed: true,
        event: event,
        userId: payload.sender?.id,
        text: message.text || '',
        messageType: message.type,
        timestamp: payload.timestamp ? parseInt(payload.timestamp, 10) : Date.now(),
        senderName: payload.sender?.name
      };
    } catch (err) {
      this.log('error', 'Webhook handling failed', { error: err.message });
      throw err;
    }
  }

  async disconnect() {
    try {
      this.authToken = null;
      this.webhookUrl = null;
      this.initialized = false;
      this.client = null;
      this.log('info', 'Viber provider disconnected');
      return true;
    } catch (err) {
      this.log('error', 'Disconnect failed', { error: err.message });
      this.initialized = false;
      return false;
    }
  }
}

module.exports = { ViberProvider };
