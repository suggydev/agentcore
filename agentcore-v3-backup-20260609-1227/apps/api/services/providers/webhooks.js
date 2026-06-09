const crypto = require('crypto');
const axios = require('axios');
const { IntegrationProvider, AppError } = require('../IntegrationProvider');

class WebhooksProvider extends IntegrationProvider {
  constructor(config = {}) {
    super({
      name: 'webhooks',
      displayName: 'Custom Webhooks',
      agentId: config.agentId || 55,
      version: '1.0.0'
    });
    this.secret = null;
    this.targetUrl = null;
    this.webhookId = null;
  }

  async initialize(credentials) {
    try {
      if (!credentials || typeof credentials !== 'object') {
        throw new Error('[Webhooks] credentials must be an object');
      }
      if (!credentials.secret) {
        throw new Error('[Webhooks] secret is required for HMAC verification');
      }

      this.secret = credentials.secret;
      this.targetUrl = credentials.targetUrl || null;
      this.webhookId = credentials.webhookId || `whk_${crypto.randomBytes(12).toString('hex')}`;
      this.initialized = true;
      this.log('info', 'Webhooks provider initialized', { webhookId: this.webhookId });
      return true;
    } catch (err) {
      this.log('error', 'Initialize failed', { error: err.message });
      throw err;
    }
  }

  /**
   * Валидация credentials перед сохранением — проверка наличия secret.
   * @param {object} credentials
   * @returns {Promise<{valid: boolean, error?: string}>}
   */
  async validateCredentials(credentials) {
    if (!credentials || typeof credentials !== 'object') {
      return { valid: false, error: 'credentials должен быть объектом' };
    }
    if (!credentials.secret || typeof credentials.secret !== 'string') {
      return { valid: false, error: 'secret обязателен для подписи webhook' };
    }
    return { valid: true };
  }

  generateWebhookUrl(baseUrl, agentId) {
    try {
      const base = baseUrl || 'https://api.agentcore.work';
      return `${base}/api/webhooks/webhooks/${agentId}`;
    } catch (err) {
      this.log('error', 'Generate webhook URL failed', { error: err.message });
      throw err;
    }
  }

  computeSignature(payload) {
    try {
      const body = typeof payload === 'string' ? payload : JSON.stringify(payload);
      return crypto.createHmac('sha256', this.secret).update(body).digest('hex');
    } catch (err) {
      throw new Error(`[Webhooks] Signature computation failed: ${err.message}`);
    }
  }

  verifySignature(payload, signature) {
    try {
      const computed = this.computeSignature(payload);
      if (!signature) return false;
      return crypto.timingSafeEqual(
        Buffer.from(computed, 'hex'),
        Buffer.from(signature, 'hex')
      );
    } catch {
      return false;
    }
  }

  async sendMessage(agentId, conversationId, message) {
    try {
      if (!this.targetUrl) {
        throw new Error('[Webhooks] No target URL configured for outbound webhooks');
      }
      if (!message) throw new Error('[Webhooks] message is required');

      const payload = {
        agentId,
        conversationId,
        text: message,
        timestamp: new Date().toISOString(),
        source: 'agentcore'
      };
      const signature = this.computeSignature(payload);

      const result = await this.execute(async () => {
        return axios.post(this.targetUrl, payload, {
          timeout: 15000,
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Signature': signature,
            'X-Webhook-Id': this.webhookId
          }
        });
      });
      this.log('info', 'Webhook sent', { targetUrl: this.targetUrl });
      return { success: true, statusCode: result.status || 200 };
    } catch (err) {
      this.log('error', 'Send webhook failed', { error: err.message });
      throw err;
    }
  }

  async handleWebhook(payload, signature) {
    try {
      if (!payload || typeof payload !== 'object') {
        throw new Error('[Webhooks] Invalid webhook payload');
      }
      if (!this.verifySignature(payload, signature)) {
        throw new AppError('[Webhooks] Invalid webhook signature', 403, 'INVALID_SIGNATURE');
      }

      return {
        processed: true,
        event: payload.event || 'custom',
        data: payload.data || payload,
        agentId: payload.agentId || null,
        timestamp: payload.timestamp || new Date().toISOString()
      };
    } catch (err) {
      this.log('error', 'Webhook handling failed', { error: err.message });
      throw err;
    }
  }

  async healthCheck() {
    try {
      if (!this.targetUrl) {
        return { ok: true, latency: 0, note: 'No target URL - receive only' };
      }
      const start = Date.now();
      const payload = { ping: true, timestamp: new Date().toISOString() };
      const signature = this.computeSignature(payload);
      await this.execute(async () => {
        return axios.post(this.targetUrl, payload, {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Signature': signature,
            'X-Webhook-Event': 'health_check'
          }
        });
      });
      return { ok: true, latency: Date.now() - start };
    } catch (err) {
      this.log('error', 'Health-check failed', { error: err.message });
      return { ok: false, error: err.message };
    }
  }

  async disconnect() {
    try {
      this.secret = null;
      this.targetUrl = null;
      this.webhookId = null;
      this.initialized = false;
      this.log('info', 'Webhooks provider disconnected');
      return true;
    } catch (err) {
      this.log('error', 'Disconnect failed', { error: err.message });
      this.initialized = false;
      return false;
    }
  }
}

module.exports = { WebhooksProvider };
