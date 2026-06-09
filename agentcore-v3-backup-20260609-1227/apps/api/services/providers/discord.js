const axios = require('axios');
const crypto = require('crypto');
const { IntegrationProvider, AppError } = require('../IntegrationProvider');

const DISCORD_API_BASE = 'https://discord.com/api/v10';

/**
 * @file  apps/api/services/providers/discord.js
 * @agent #57 — Discord Bot API интеграционный провайдер
 *
 * Поддерживаемые операции:
 *   - sendMessage — отправка сообщения в канал через Bot API
 *   - handleWebhook — верификация Ed25519-подписи и парсинг Interaction payload
 *
 * Документация: https://discord.com/developers/docs
 */

class DiscordProvider extends IntegrationProvider {
  constructor(config = {}) {
    super({
      name: 'discord',
      displayName: 'Discord',
      agentId: 57,
      version: '1.0.0'
    });
    this.botToken = config.botToken || null;
    this.channelId = config.channelId || null;
    this.publicKey = config.publicKey || null;
    this.baseUrl = DISCORD_API_BASE;
    this.client = axios.create({ baseURL: this.baseUrl, timeout: 15000 });
  }

  async initialize(credentials) {
    if (!credentials || typeof credentials !== 'object') {
      throw new AppError('[Discord] credentials must be an object', 400, 'MISSING_CREDENTIALS');
    }
    if (!credentials.botToken || typeof credentials.botToken !== 'string') {
      throw new AppError('[Discord] botToken is required', 400, 'MISSING_CREDENTIALS');
    }
    this.botToken = credentials.botToken;
    this.channelId = credentials.channelId || null;
    this.publicKey = credentials.publicKey || null;
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 15000,
      headers: {
        'Authorization': `Bot ${this.botToken}`,
        'Content-Type': 'application/json'
      }
    });
    this.initialized = true;
    this.credentials = credentials;
    this.log('info', 'DiscordProvider initialized');
    return true;
  }

  /**
   * Валидация credentials перед сохранением — тестовый запрос к Discord API (get current user).
   * @param {object} credentials
   * @returns {Promise<{valid: boolean, error?: string}>}
   */
  async validateCredentials(credentials) {
    if (!credentials || typeof credentials !== 'object') {
      return { valid: false, error: 'credentials должен быть объектом' };
    }
    if (!credentials.botToken || typeof credentials.botToken !== 'string') {
      return { valid: false, error: 'botToken обязателен' };
    }
    try {
      const response = await axios.get(`${DISCORD_API_BASE}/users/@me`, {
        headers: { 'Authorization': `Bot ${credentials.botToken}` },
        timeout: 10000,
      });
      if (response.data && response.data.id) {
        return { valid: true };
      }
      return { valid: false, error: 'Неверный botToken' };
    } catch (err) {
      return { valid: false, error: `Неверный botToken: ${err.response?.data?.message || err.message}` };
    }
  }

  ensureInitialized() {
    if (!this.initialized || !this.botToken) {
      throw new AppError('[Discord] Provider not initialized', 500, 'NOT_INITIALIZED');
    }
  }

  async sendMessage(agentId, conversationId, message) {
    try {
      this.ensureInitialized();
      const channelId = conversationId || this.channelId;
      if (!channelId) throw new Error('[Discord] conversationId or channelId is required');
      if (!message) throw new Error('[Discord] message is required');
      return await this._sendDiscordMessage(channelId, message);
    } catch (err) {
      this.log('error', 'sendMessage failed', { error: err.message });
      throw err;
    }
  }

  async _sendDiscordMessage(channelId, text) {
    this.ensureInitialized();
    return this.execute(async () => {
      const response = await this.client.post(
        `/channels/${channelId}/messages`,
        { content: text }
      );
      this.log('info', 'Message sent', { channelId, messageId: response.data?.id });
      return response.data;
    });
  }

  verifyWebhookSignature(body, signature, timestamp, publicKey) {
    if (!publicKey) {
      this.log('warn', 'publicKey not configured — skipping Discord signature verification');
      return true;
    }
    if (!signature || !timestamp) return false;
    try {
      const message = Buffer.from(timestamp + body, 'utf8');
      const sig = Buffer.from(signature, 'hex');
      const key = Buffer.from(publicKey, 'hex');
      const pubKey = crypto.createPublicKey({ key, format: 'raw' });
      return crypto.verify(null, message, pubKey, sig);
    } catch (err) {
      this.log('error', 'Discord signature verification error', { error: err.message });
      return false;
    }
  }

  async handleWebhook(payload, signature) {
    try {
      if (!payload || typeof payload !== 'object') {
        throw new Error('[Discord] Invalid webhook payload');
      }
      const sig = signature || payload.__signature;
      const ts = payload.__timestamp;
      const pk = this.publicKey || payload.__publicKey;
      const rawBody = payload.__rawBody || JSON.stringify(payload);
      if (!this.verifyWebhookSignature(rawBody, sig, ts, pk)) {
        throw new AppError('[Discord] Webhook signature verification failed', 401, 'INVALID_SIGNATURE');
      }
      return {
        processed: true,
        id: payload.id,
        type: payload.type,
        applicationId: payload.application_id,
        guildId: payload.guild_id,
        channelId: payload.channel_id,
        userId: payload.member?.user?.id || payload.user?.id,
        username: payload.member?.user?.username || payload.user?.username,
        commandName: payload.data?.name,
        content: payload.data?.options,
        timestamp: ts ? parseInt(ts, 10) * 1000 : Date.now()
      };
    } catch (err) {
      this.log('error', 'Webhook handling failed', { error: err.message });
      throw err;
    }
  }

  async disconnect() {
    try {
      this.botToken = null;
      this.channelId = null;
      this.publicKey = null;
      this.initialized = false;
      this.client = null;
      this.log('info', 'Discord provider disconnected');
      return true;
    } catch (err) {
      this.log('error', 'Disconnect failed', { error: err.message });
      this.initialized = false;
      return false;
    }
  }
}

module.exports = { DiscordProvider };
