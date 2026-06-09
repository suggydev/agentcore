const axios = require('axios');
const { IntegrationProvider, AppError } = require('../IntegrationProvider');

class OneCProvider extends IntegrationProvider {
  constructor(config = {}) {
    super({
      name: '1c',
      displayName: '1C',
      agentId: config.agentId || 47,
      version: '1.0.0'
    });
    this.baseUrl = null;
    this.username = null;
    this.password = null;
    this.pollIntervalMs = 60000;
    this._lastSyncAt = null;
  }

  async initialize(credentials) {
    try {
      if (!credentials || typeof credentials !== 'object') {
        throw new Error('[1C] credentials must be an object');
      }
      if (!credentials.baseUrl) {
        throw new Error('[1C] baseUrl (OData endpoint) is required');
      }
      if (!credentials.username) {
        throw new Error('[1C] username is required');
      }
      if (!credentials.password) {
        throw new Error('[1C] password is required');
      }

      this.baseUrl = credentials.baseUrl.replace(/\/+$/, '');
      this.username = credentials.username;
      this.password = credentials.password;
      this.pollIntervalMs = credentials.pollIntervalMs || 60000;

      this.client = axios.create({
        baseURL: this.baseUrl,
        timeout: 30000,
        auth: { username: this.username, password: this.password },
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        }
      });
      this.initialized = true;
      this.log('info', '1C provider initialized', { baseUrl: this.baseUrl });
      return true;
    } catch (err) {
      this.log('error', 'Initialize failed', { error: err.message });
      throw err;
    }
  }

  /**
   * Валидация credentials перед сохранением — тестовый запрос к OData endpoint.
   * @param {object} credentials
   * @returns {Promise<{valid: boolean, error?: string}>}
   */
  async validateCredentials(credentials) {
    if (!credentials || typeof credentials !== 'object') {
      return { valid: false, error: 'credentials должен быть объектом' };
    }
    if (!credentials.baseUrl || typeof credentials.baseUrl !== 'string') {
      return { valid: false, error: 'baseUrl (OData endpoint) обязателен' };
    }
    if (!credentials.username || typeof credentials.username !== 'string') {
      return { valid: false, error: 'username обязателен' };
    }
    if (!credentials.password || typeof credentials.password !== 'string') {
      return { valid: false, error: 'password обязателен' };
    }
    try {
      const baseUrl = credentials.baseUrl.replace(/\/+$/, '');
      const response = await axios.get(`${baseUrl}/Catalog_Номенклатура?$top=1`, {
        auth: { username: credentials.username, password: credentials.password },
        timeout: 15000,
        headers: { Accept: 'application/json' },
      });
      if (response.status === 200) {
        return { valid: true };
      }
      return { valid: false, error: 'Неверные учётные данные или URL' };
    } catch (err) {
      return { valid: false, error: `Неверные учётные данные или URL: ${err.response?.statusText || err.message}` };
    }
  }

  async _request(method, path, data = null, params = {}) {
    return this.execute(async () => {
      const config = {
        method,
        url: `${this.baseUrl}${path}`,
        timeout: 30000,
        auth: { username: this.username, password: this.password },
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        }
      };
      if (Object.keys(params).length > 0) config.params = params;
      if (data) config.data = data;
      return axios(config);
    });
  }

  async sendMessage(agentId, conversationId, message) {
    try {
      const result = await this._request('POST', '/Document_Message', {
        Description: message,
        ConversationRef: conversationId || ''
      });
      this.log('info', '1C message created', { conversationId });
      return { success: true, ref: result.Ref || result.id };
    } catch (err) {
      this.log('error', 'Send message failed', { error: err.message });
      throw err;
    }
  }

  async handleWebhook(payload, signature) {
    try {
      if (!payload || typeof payload !== 'object') {
        throw new Error('[1C] Invalid webhook payload');
      }
      return {
        processed: true,
        entity: payload.entity || payload.ObjectName || '',
        action: payload.action || payload.EventType || 'sync',
        data: payload.data || payload
      };
    } catch (err) {
      this.log('error', 'Webhook handling failed', { error: err.message });
      throw err;
    }
  }

  async getCatalog(name, { top = 100, skip = 0, filter = '' } = {}) {
    try {
      const params = { $top: top, $skip: skip };
      if (filter) params.$filter = filter;
      const result = await this._request('GET', `/Catalog_${name}`, null, params);
      return { value: result.value || [], count: result['@odata.count'] || 0 };
    } catch (err) {
      this.log('error', 'Get catalog failed', { error: err.message, catalog: name });
      throw err;
    }
  }

  async getCustomers({ top = 100, skip = 0, filter = '' } = {}) {
    try {
      return this.getCatalog('Контрагенты', { top, skip, filter });
    } catch (err) {
      this.log('error', 'Get customers failed', { error: err.message });
      throw err;
    }
  }

  async syncData(entityName) {
    try {
      const result = await this.getCatalog(entityName, { top: 1000 });
      this._lastSyncAt = new Date();
      this.log('info', 'Data synced', { entity: entityName, count: result.count });
      return result;
    } catch (err) {
      this.log('error', 'Sync failed', { error: err.message, entity: entityName });
      throw err;
    }
  }

  async healthCheck() {
    try {
      const start = Date.now();
      await this._request('GET', '/', null, { $top: 1 });
      return { ok: true, latency: Date.now() - start };
    } catch (err) {
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        this.log('error', 'Health-check auth failed', { status: err.response.status });
        return { ok: false, error: 'Authentication failed' };
      }
      this.log('error', 'Health-check failed', { error: err.message });
      return { ok: false, error: err.message };
    }
  }

  async disconnect() {
    try {
      this.baseUrl = null;
      this.username = null;
      this.password = null;
      this.client = null;
      this.initialized = false;
      this.log('info', '1C provider disconnected');
      return true;
    } catch (err) {
      this.log('error', 'Disconnect failed', { error: err.message });
      this.initialized = false;
      return false;
    }
  }
}

module.exports = { OneCProvider };
