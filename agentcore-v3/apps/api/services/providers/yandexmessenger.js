const axios = require('axios');
const { IntegrationProvider, AppError } = require('../IntegrationProvider');

const YANDEX_MESSENGER_API = 'https://api.messenger.yandex.net/v1';
const YANDEX_OAUTH_TOKEN_URL = 'https://oauth.yandex.ru/token';

class YandexMessengerProvider extends IntegrationProvider {
  constructor(config = {}) {
    super({
      name: 'yandexmessenger',
      displayName: 'Yandex Messenger',
      agentId: config.agentId || 50,
      version: '1.0.0'
    });
    this.accessToken = null;
    this.refreshToken = null;
    this.clientId = null;
    this.clientSecret = null;
    this.orgId = null;
    this.tokenExpiresAt = null;
  }

  async initialize(credentials) {
    try {
      if (!credentials || typeof credentials !== 'object') {
        throw new Error('[YandexMessenger] credentials must be an object');
      }
      if (!credentials.orgId) {
        throw new Error('[YandexMessenger] orgId is required');
      }
      this.orgId = String(credentials.orgId);

      if (credentials.accessToken) {
        this.accessToken = credentials.accessToken;
        this.refreshToken = credentials.refreshToken || null;
      } else if (credentials.clientId && credentials.clientSecret) {
        this.clientId = credentials.clientId;
        this.clientSecret = credentials.clientSecret;
      } else {
        throw new Error('[YandexMessenger] accessToken or clientId+clientSecret required');
      }

      this.client = axios.create({
        baseURL: YANDEX_MESSENGER_API,
        timeout: 15000,
        headers: { Authorization: `OAuth ${this.accessToken}` }
      });
      this.initialized = true;
      this.log('info', 'YandexMessenger initialized', { orgId: this.orgId });
      return true;
    } catch (err) {
      this.log('error', 'Initialize failed', { error: err.message });
      throw err;
    }
  }

  async _ensureToken() {
    if (this.accessToken && this.tokenExpiresAt && Date.now() < this.tokenExpiresAt - 60000) {
      return;
    }
    if (this.clientId && this.clientSecret && this.refreshToken) {
      await this._refreshAccessToken();
      return;
    }
    if (!this.accessToken) {
      throw new Error('[YandexMessenger] No access token available');
    }
  }

  async _refreshAccessToken() {
    try {
      const response = await axios.post(YANDEX_OAUTH_TOKEN_URL, null, {
        params: {
          grant_type: 'refresh_token',
          refresh_token: this.refreshToken,
          client_id: this.clientId,
          client_secret: this.clientSecret
        },
        timeout: 10000,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      this.accessToken = response.data.access_token;
      this.refreshToken = response.data.refresh_token || this.refreshToken;
      this.tokenExpiresAt = Date.now() + (response.data.expires_in || 3600) * 1000;
      if (this.client) {
        this.client.defaults.headers.Authorization = `OAuth ${this.accessToken}`;
      }
      this.log('info', 'Token refreshed');
    } catch (err) {
      throw new Error(`[YandexMessenger] Token refresh failed: ${err.message}`);
    }
  }

  async _request(method, path, data = null) {
    await this._ensureToken();
    return this.execute(async () => {
      const config = {
        method,
        url: `${YANDEX_MESSENGER_API}${path}`,
        timeout: 15000,
        headers: {
          Authorization: `OAuth ${this.accessToken}`,
          Accept: 'application/json'
        }
      };
      if (data) {
        config.data = data;
        config.headers['Content-Type'] = 'application/json';
      }
      return axios(config);
    });
  }

  async sendMessage(agentId, conversationId, message) {
    try {
      if (!conversationId) throw new Error('[YandexMessenger] conversationId is required');
      if (!message) throw new Error('[YandexMessenger] message is required');

      const result = await this._request('POST', `/orgs/${this.orgId}/chats/${conversationId}/messages`, {
        text: message
      });
      this.log('info', 'Message sent', { conversationId });
      return { messageId: result.message_id || result.id, conversationId };
    } catch (err) {
      this.log('error', 'Send message failed', { error: err.message });
      throw err;
    }
  }

  async handleWebhook(payload, signature) {
    try {
      if (!payload || typeof payload !== 'object') {
        throw new Error('[YandexMessenger] Invalid webhook payload');
      }
      return {
        processed: true,
        chatId: payload.chat_id || payload.chatId || '',
        text: payload.text || payload.message?.text || '',
        fromUid: payload.from_uid || payload.from?.uid || '',
        event: payload.event || 'message_new'
      };
    } catch (err) {
      this.log('error', 'Webhook handling failed', { error: err.message });
      throw err;
    }
  }

  async healthCheck() {
    try {
      const start = Date.now();
      await this._request('GET', `/orgs/${this.orgId}/chats`, null);
      return { ok: true, latency: Date.now() - start };
    } catch (err) {
      this.log('error', 'Health-check failed', { error: err.message });
      return { ok: false, error: err.message };
    }
  }

  async disconnect() {
    try {
      this.accessToken = null;
      this.refreshToken = null;
      this.clientId = null;
      this.clientSecret = null;
      this.orgId = null;
      this.client = null;
      this.initialized = false;
      this.log('info', 'YandexMessenger provider disconnected');
      return true;
    } catch (err) {
      this.log('error', 'Disconnect failed', { error: err.message });
      this.initialized = false;
      return false;
    }
  }
}

module.exports = { YandexMessengerProvider };
