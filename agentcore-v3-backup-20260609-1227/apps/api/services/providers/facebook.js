const axios = require('axios');
const crypto = require('crypto');
const { IntegrationProvider, AppError } = require('../IntegrationProvider');

const META_GRAPH_API_BASE = 'https://graph.facebook.com/v18.0';

/**
 * @file  apps/api/services/providers/facebook.js
 * @agent #56 — Facebook Messenger (Page Access Token) интеграционный провайдер
 *
 * Поддерживаемые операции:
 *   - sendMessage — отправка текстового сообщения пользователю
 *   - handleWebhook — верификация подписи и парсинг входящих сообщений
 *
 * Документация: https://developers.facebook.com/docs/messenger-platform
 */

class FacebookProvider extends IntegrationProvider {
  constructor(config = {}) {
    super({
      name: 'facebook',
      displayName: 'Facebook Messenger',
      agentId: 56,
      version: '1.0.0'
    });
    this.pageAccessToken = config.pageAccessToken || null;
    this.pageId = config.pageId || null;
    this.appSecret = config.appSecret || null;
    this.baseUrl = META_GRAPH_API_BASE;
    this.client = axios.create({ baseURL: this.baseUrl, timeout: 15000 });
  }

  async initialize(credentials) {
    if (!credentials || typeof credentials !== 'object') {
      throw new AppError('[Facebook] credentials must be an object', 400, 'MISSING_CREDENTIALS');
    }
    if (!credentials.pageAccessToken || typeof credentials.pageAccessToken !== 'string') {
      throw new AppError('[Facebook] pageAccessToken is required', 400, 'MISSING_CREDENTIALS');
    }
    this.pageAccessToken = credentials.pageAccessToken;
    this.pageId = credentials.pageId || null;
    this.appSecret = credentials.appSecret || null;
    this.client = axios.create({ baseURL: this.baseUrl, timeout: 15000 });
    this.initialized = true;
    this.credentials = credentials;
    this.log('info', 'FacebookProvider initialized');
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
    if (!credentials.pageAccessToken || typeof credentials.pageAccessToken !== 'string') {
      return { valid: false, error: 'pageAccessToken обязателен' };
    }
    try {
      const response = await axios.get(`${META_GRAPH_API_BASE}/me`, {
        params: { access_token: credentials.pageAccessToken, fields: 'id,name' },
        timeout: 10000,
      });
      if (response.data && response.data.id) {
        return { valid: true };
      }
      return { valid: false, error: 'Неверный pageAccessToken' };
    } catch (err) {
      return { valid: false, error: `Неверный pageAccessToken: ${err.response?.data?.error?.message || err.message}` };
    }
  }

  ensureInitialized() {
    if (!this.initialized || !this.pageAccessToken) {
      throw new AppError('[Facebook] Provider not initialized', 500, 'NOT_INITIALIZED');
    }
  }

  _headers() {
    return {
      'Authorization': `Bearer ${this.pageAccessToken}`,
      'Content-Type': 'application/json'
    };
  }

  async sendMessage(agentId, conversationId, message) {
    try {
      this.ensureInitialized();
      if (!conversationId) throw new Error('[Facebook] conversationId (PSID) is required');
      if (!message) throw new Error('[Facebook] message is required');
      return await this._sendFacebookMessage(conversationId, message);
    } catch (err) {
      this.log('error', 'sendMessage failed', { error: err.message });
      throw err;
    }
  }

  async _sendFacebookMessage(psid, text) {
    this.ensureInitialized();
    return this.execute(async () => {
      const response = await this.client.post(
        '/me/messages',
        {
          recipient: { id: psid },
          message: { text }
        },
        { headers: this._headers() }
      );
      this.log('info', 'Message sent', { psid, messageId: response.data?.message_id });
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
        throw new Error('[Facebook] Invalid webhook payload');
      }
      let sig = signature;
      if (typeof sig === 'string' && sig.startsWith('sha256=')) {
        sig = sig.slice(7);
      }
      const bodyString = payload.__rawBody || JSON.stringify(payload);
      if (!this.verifyWebhookSignature(bodyString, sig)) {
        throw new AppError('[Facebook] Webhook signature verification failed', 401, 'INVALID_SIGNATURE');
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
        return this.client.get(`/me?access_token=${this.pageAccessToken}`, { timeout: 10000 });
      });
      return { ok: true, latency: Date.now() - start };
    } catch (err) {
      this.log('error', 'Health-check failed', { error: err.message });
      return { ok: false, error: err.message };
    }
  }

  async disconnect() {
    try {
      this.pageAccessToken = null;
      this.pageId = null;
      this.appSecret = null;
      this.initialized = false;
      this.client = null;
      this.log('info', 'Facebook provider disconnected');
      return true;
    } catch (err) {
      this.log('error', 'Disconnect failed', { error: err.message });
      this.initialized = false;
      return false;
    }
  }
}

module.exports = { FacebookProvider };
