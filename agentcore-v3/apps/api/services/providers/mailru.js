const axios = require('axios');
const { IntegrationProvider, AppError } = require('../IntegrationProvider');

const MAILRU_API_BASE = 'https://api.mail.ru';
const DEFAULT_IMAP_HOST = 'imap.mail.ru';
const DEFAULT_SMTP_HOST = 'smtp.mail.ru';

class MailRuProvider extends IntegrationProvider {
  constructor(config = {}) {
    super({
      name: 'mailru',
      displayName: 'Mail.ru / VK Workspace',
      agentId: config.agentId || 51,
      version: '1.0.0'
    });
    this.email = null;
    this.password = null;
    this.accessToken = null;
    this.imapHost = DEFAULT_IMAP_HOST;
    this.smtpHost = DEFAULT_SMTP_HOST;
    this.imapPort = 993;
    this.smtpPort = 465;
  }

  async initialize(credentials) {
    try {
      if (!credentials || typeof credentials !== 'object') {
        throw new Error('[Mail.ru] credentials must be an object');
      }
      if (!credentials.email) {
        throw new Error('[Mail.ru] email is required');
      }
      if (!credentials.password && !credentials.accessToken) {
        throw new Error('[Mail.ru] password or accessToken is required');
      }

      this.email = credentials.email;
      this.password = credentials.password || null;
      this.accessToken = credentials.accessToken || null;
      this.imapHost = credentials.imapHost || DEFAULT_IMAP_HOST;
      this.smtpHost = credentials.smtpHost || DEFAULT_SMTP_HOST;
      this.imapPort = credentials.imapPort || 993;
      this.smtpPort = credentials.smtpPort || 465;

      this.initialized = true;
      this.log('info', 'Mail.ru provider initialized', { email: this.email });
      return true;
    } catch (err) {
      this.log('error', 'Initialize failed', { error: err.message });
      throw err;
    }
  }

  async _request(method, path, data = null) {
    const headers = { Accept: 'application/json' };
    if (this.accessToken) {
      headers.Authorization = `Bearer ${this.accessToken}`;
    }

    return this.execute(async () => {
      const config = {
        method,
        url: `${MAILRU_API_BASE}${path}`,
        timeout: 15000,
        headers
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
      if (!message) throw new Error('[Mail.ru] message is required');

      const result = await this._request('POST', '/api/v1/messages/send', {
        from: this.email,
        to: conversationId,
        subject: 'AgentCore Reply',
        text: message
      });
      this.log('info', 'Email sent', { to: conversationId });
      return { messageId: result.id, to: conversationId };
    } catch (err) {
      this.log('error', 'Send message failed', { error: err.message });
      throw err;
    }
  }

  async handleWebhook(payload, signature) {
    try {
      if (!payload || typeof payload !== 'object') {
        throw new Error('[Mail.ru] Invalid webhook payload');
      }
      return {
        processed: true,
        event: payload.event || 'new_message',
        from: payload.from || payload.sender || '',
        subject: payload.subject || '',
        text: payload.text || payload.body || '',
        messageId: payload.message_id || payload.id || ''
      };
    } catch (err) {
      this.log('error', 'Webhook handling failed', { error: err.message });
      throw err;
    }
  }

  async getCalendarEvents({ from, to } = {}) {
    try {
      const params = {};
      if (from) params.from = from;
      if (to) params.to = to;
      const result = await this._request('GET', '/api/v1/calendar/events', null);
      return { events: result.events || [] };
    } catch (err) {
      this.log('error', 'Get calendar events failed', { error: err.message });
      throw err;
    }
  }

  async healthCheck() {
    try {
      const start = Date.now();
      if (this.accessToken) {
        await this._request('GET', '/api/v1/user/info');
      } else {
        const tls = require('tls');
        const net = require('net');
        await new Promise((resolve, reject) => {
          const socket = net.connect(this.imapPort, this.imapHost, () => {
            socket.destroy();
            resolve();
          });
          socket.on('error', reject);
          socket.setTimeout(5000, () => {
            socket.destroy();
            reject(new Error('IMAP connection timeout'));
          });
        });
      }
      return { ok: true, latency: Date.now() - start };
    } catch (err) {
      this.log('error', 'Health-check failed', { error: err.message });
      return { ok: false, error: err.message };
    }
  }

  async disconnect() {
    try {
      this.email = null;
      this.password = null;
      this.accessToken = null;
      this.initialized = false;
      this.log('info', 'Mail.ru provider disconnected');
      return true;
    } catch (err) {
      this.log('error', 'Disconnect failed', { error: err.message });
      this.initialized = false;
      return false;
    }
  }
}

module.exports = { MailRuProvider };
