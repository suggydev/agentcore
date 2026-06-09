const axios = require('axios');
const { IntegrationProvider, AppError } = require('../IntegrationProvider');

const SMSRU_API_BASE = 'https://sms.ru';

/**
 * @file  apps/api/services/providers/sms.js
 * @agent #59 — SMS.ru интеграционный провайдер
 *
 * Поддерживаемые операции:
 *   - sendMessage — отправка SMS на указанный номер
 *   - handleWebhook — парсинг статусного webhook от SMS.ru
 *
 * Документация: https://sms.ru/api
 */

class SmsProvider extends IntegrationProvider {
  constructor(config = {}) {
    super({
      name: 'sms',
      displayName: 'SMS.ru',
      agentId: 59,
      version: '1.0.0'
    });
    this.apiId = config.apiId || null;
    this.sender = config.sender || null;
    this.baseUrl = SMSRU_API_BASE;
    this.client = axios.create({ baseURL: this.baseUrl, timeout: 15000 });
  }

  async initialize(credentials) {
    if (!credentials || typeof credentials !== 'object') {
      throw new AppError('[SMS.ru] credentials must be an object', 400, 'MISSING_CREDENTIALS');
    }
    if (!credentials.apiId || typeof credentials.apiId !== 'string') {
      throw new AppError('[SMS.ru] apiId is required', 400, 'MISSING_CREDENTIALS');
    }
    this.apiId = credentials.apiId;
    this.sender = credentials.sender || null;
    this.client = axios.create({ baseURL: this.baseUrl, timeout: 15000 });
    this.initialized = true;
    this.credentials = credentials;
    this.log('info', 'SmsProvider initialized');
    return true;
  }

  /**
   * Валидация credentials перед сохранением — тестовый запрос к API (get balance).
   * @param {object} credentials
   * @returns {Promise<{valid: boolean, error?: string}>}
   */
  async validateCredentials(credentials) {
    if (!credentials || typeof credentials !== 'object') {
      return { valid: false, error: 'credentials должен быть объектом' };
    }
    if (!credentials.apiId || typeof credentials.apiId !== 'string') {
      return { valid: false, error: 'apiId обязателен' };
    }
    try {
      const response = await axios.get(`${SMSRU_API_BASE}/my/balance`, {
        params: { api_id: credentials.apiId, json: 1 },
        timeout: 10000,
      });
      if (response.data && response.data.status === 'OK') {
        return { valid: true };
      }
      return { valid: false, error: 'Неверный apiId' };
    } catch (err) {
      return { valid: false, error: `Неверный apiId: ${err.response?.data?.status_text || err.message}` };
    }
  }

  ensureInitialized() {
    if (!this.initialized || !this.apiId) {
      throw new AppError('[SMS.ru] Provider not initialized', 500, 'NOT_INITIALIZED');
    }
  }

  async sendMessage(agentId, conversationId, message) {
    try {
      this.ensureInitialized();
      if (!conversationId) throw new Error('[SMS.ru] conversationId (phone number) is required');
      if (!message) throw new Error('[SMS.ru] message is required');
      return await this._sendSms(conversationId, message);
    } catch (err) {
      this.log('error', 'sendMessage failed', { error: err.message });
      throw err;
    }
  }

  async _sendSms(to, msg) {
    this.ensureInitialized();
    return this.execute(async () => {
      const params = new URLSearchParams();
      params.append('api_id', this.apiId);
      params.append('to', to);
      params.append('msg', msg);
      if (this.sender) params.append('from', this.sender);
      params.append('json', '1');
      const response = await this.client.post('/sms/send', params.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      const data = response.data;
      if (data.status === 'ERROR') {
        throw new AppError(`[SMS.ru] API error: ${data.status_text}`, 502, 'API_ERROR');
      }
      this.log('info', 'SMS sent', { to, smsId: data.sms?.[to]?.sms_id });
      return data;
    });
  }

  async handleWebhook(payload, signature) {
    try {
      if (!payload || typeof payload !== 'object') {
        throw new Error('[SMS.ru] Invalid webhook payload');
      }
      const status = payload.status;
      if (!status) return { processed: false, reason: 'no_status' };
      return {
        processed: true,
        smsId: payload.id,
        status: status,
        statusCode: payload.status_code,
        phone: payload.phone,
        timestamp: Date.now()
      };
    } catch (err) {
      this.log('error', 'Webhook handling failed', { error: err.message });
      throw err;
    }
  }

  async disconnect() {
    try {
      this.apiId = null;
      this.sender = null;
      this.initialized = false;
      this.client = null;
      this.log('info', 'SMS.ru provider disconnected');
      return true;
    } catch (err) {
      this.log('error', 'Disconnect failed', { error: err.message });
      this.initialized = false;
      return false;
    }
  }
}

module.exports = { SmsProvider };
