const axios = require('axios');
const crypto = require('crypto');
const { IntegrationProvider, AppError } = require('../IntegrationProvider');

const META_GRAPH_API_BASE = 'https://graph.facebook.com/v18.0';

/**
 * @file  apps/api/services/providers/instagram.js
 * @agent #55 — Instagram (Meta Graph API Messaging) интеграционный провайдер
 *
 * Поддерживаемые операции:
 *   - sendMessage — отправка текстового сообщения через Instagram Messaging API
 *   - handleWebhook — верификация подписи и парсинг входящих сообщений
 *
 * Документация: https://developers.facebook.com/docs/messenger-platform/instagram
 */

class InstagramProvider extends IntegrationProvider {
  constructor(config = {}) {
    super({
      name: 'instagram',
      displayName: 'Instagram',
      agentId: 55,
      version: '1.0.0'
    });
    this.accessToken = config.accessToken || null;
    this.businessAccountId = config.businessAccountId || null;
    this.appSecret = config.appSecret || null;
    this.baseUrl = META_GRAPH_API_BASE;
    this.client = axios.create({ baseURL: this.baseUrl, timeout: 15000 });
  }

  async initialize(credentials) {
    if (!credentials || typeof credentials !== 'object') {
      throw new AppError('[Instagram] credentials must be an object', 400, 'MISSING_CREDENTIALS');
    }
    if (!credentials.accessToken || typeof credentials.accessToken !== 'string') {
      throw new AppError('[Instagram] accessToken is required', 400, 'MISSING_CREDENTIALS');
    }
    if (!credentials.businessAccountId || typeof credentials.businessAccountId !== 'string') {
      throw new AppError('[Instagram] businessAccountId is required', 400, 'MISSING_CREDENTIALS');
    }
    this.accessToken = credentials.accessToken;
    this.businessAccountId = credentials.businessAccountId;
    this.appSecret = credentials.appSecret || null;
    this.client = axios.create({ baseURL: this.baseUrl, timeout: 15000 });
    this.initialized = true;
    this.credentials = credentials;
    this.log('info', 'InstagramProvider initialized');
    return true;
  }

  /**
   * Валидация credentials перед сохранением — тестовый запрос к Meta Graph API.
   * @param {object} credentials
   * @returns {Promise<{valid: boolean, error?: string}>}
   */
  async validateCredentials(credentials) {
    if (!credentials || typeof credentials !== 'object') {
      return { valid: false, error: 'credentials должен быть объектом' };
    }
    if (!credentials.accessToken || typeof credentials.accessToken !== 'string') {
      return { valid: false, error: 'accessToken обязателен' };
    }
    if (!credentials.businessAccountId || typeof credentials.businessAccountId !== 'string') {
      return { valid: false, error: 'businessAccountId обязателен' };
    }
    try {
      const response = await axios.get(`https://graph.facebook.com/v18.0/${credentials.businessAccountId}`, {
        params: { access_token: credentials.accessToken, fields: 'id,username' },
        timeout: 10000,
      });
      if (response.data && response.data.id) {
        return { valid: true };
      }
      return { valid: false, error: 'Неверный accessToken или businessAccountId' };
    } catch (err) {
      return { valid: false, error: `Неверный accessToken: ${err.response?.data?.error?.message || err.message}` };
    }
  }

  ensureInitialized() {
    if (!this.initialized || !this.accessToken || !this.businessAccountId) {
      throw new AppError('[Instagram] Provider not initialized', 500, 'NOT_INITIALIZED');
    }
  }

  _headers() {
    return {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json'
    };
  }

  async sendMessage(agentId, conversationId, message) {
    try {
      this.ensureInitialized();
      if (!conversationId) throw new Error('[Instagram] conversationId (recipient ID) is required');
      if (!message) throw new Error('[Instagram] message is required');
      return await this._sendInstagramMessage(conversationId, message);
    } catch (err) {
      this.log('error', 'sendMessage failed', { error: err.message });
      throw err;
    }
  }

  async _sendInstagramMessage(recipientId, text) {
    this.ensureInitialized();
    return this.execute(async () => {
      const response = await this.client.post(
        `/${this.businessAccountId}/messages`,
        {
          recipient: { id: recipientId },
          message: { text }
        },
        { headers: this._headers() }
      );
      this.log('info', 'Message sent', { recipientId, messageId: response.data?.message_id });
      return response.data;
    });
  }

  verifyWebhookSignature(body, signature) {
    if (!this.appSecret) {
      this.log('warn', 'appSecret not configured — skipping signature verification');
      return true;
    }
    if (!signature) return false;
    const expected = crypto
      .createHmac('sha256', this.appSecret)
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
        throw new Error('[Instagram] Invalid webhook payload');
      }
      let sig = signature;
      if (typeof sig === 'string' && sig.startsWith('sha256=')) {
        sig = sig.slice(7);
      }
      const bodyString = payload.__rawBody || JSON.stringify(payload);
      if (!this.verifyWebhookSignature(bodyString, sig)) {
        throw new AppError('[Instagram] Webhook signature verification failed', 401, 'INVALID_SIGNATURE');
      }
      const entry = payload.entry?.[0];
      if (!entry) return { processed: false, reason: 'no_entry' };
      const messaging = entry.messaging?.[0];
      if (!messaging) return { processed: false, reason: 'no_messaging' };
      return {
        processed: true,
        senderId: messaging.sender?.id,
        recipientId: messaging.recipient?.id,
        text: messaging.message?.text || '',
        messageId: messaging.message?.mid,
        timestamp: messaging.timestamp ? parseInt(messaging.timestamp, 10) : Date.now()
      };
    } catch (err) {
      this.log('error', 'Webhook handling failed', { error: err.message });
      throw err;
    }
  }

  async healthCheck() {
    try {
      const start = Date.now();
      await this.execute(async () => {
        return this.client.get(`/me?access_token=${this.accessToken}`, { timeout: 10000 });
      });
      return { ok: true, latency: Date.now() - start };
    } catch (err) {
      this.log('error', 'Health-check failed', { error: err.message });
      return { ok: false, error: err.message };
    }
  }

  async disconnect() {
    try {
      this.accessToken = null;
      this.businessAccountId = null;
      this.appSecret = null;
      this.initialized = false;
      this.client = null;
      this.log('info', 'Instagram provider disconnected');
      return true;
    } catch (err) {
      this.log('error', 'Disconnect failed', { error: err.message });
      this.initialized = false;
      return false;
    }
  }
}

module.exports = { InstagramProvider };
