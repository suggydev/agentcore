const axios = require('axios');
const { IntegrationProvider } = require('../IntegrationProvider');

const SBP_BANK_ENDPOINTS = {
  sber: 'https://api.sberbank.ru/prod/v1/sbp',
  tinkoff: 'https://api.tinkoff.ru/sbpm/openapi/api/v1',
  tochka: 'https://api.tochka.com/api/v1/sbp',
  raiffeisen: 'https://api.raiffeisen.ru/sbp/v1',
  vtb: 'https://api.vtb.ru/sbp/v1',
  default: 'https://api.sbp.ru/v1',
};

/**
 * @file  apps/api/services/providers/sbp.js
 * @agent #47 — Система Быстрых Платежей (СБП) интеграционный провайдер
 *
 * Поддерживаемые операции:
 *   - Создание QR-платежа (createQrPayment)
 *   - Проверка статуса платежа (checkPaymentStatus)
 *   - Обработка webhook от банка-партнера
 *   - Проверка доступности API (healthCheck)
 *
 * Документация зависит от банка-партнера (sber, tinkoff, tochka и т.д.)
 */

class SbpProvider extends IntegrationProvider {
  constructor(config = {}) {
    super({
      name: 'sbp',
      displayName: 'СБП',
      agentId: 47,
      version: '1.0.0',
      ...config,
    });
    this.bankApiKey = null;
    this.bankProvider = 'sber';
    this.merchantId = null;
    this.phoneNumber = null;
    this.baseUrl = null;
  }

  /**
   * Инициализация провайдера СБП с учетными данными банка-партнера.
   * @param {object} credentials
   * @param {string} credentials.bankApiKey — API-ключ банка
   * @param {string} credentials.bankProvider — код банка: sber, tinkoff, tochka, raiffeisen, vtb
   * @param {string} credentials.merchantId — ID мерчанта в СБП
   * @param {string} credentials.phoneNumber — телефон мерчанта (для формирования QR)
   * @returns {Promise<boolean>}
   */
  /**
   * Валидация credentials перед сохранением — проверка наличия обязательных полей.
   * Реальная проверка API требует подписи и банка-специфичных эндпоинтов.
   * @param {object} credentials
   * @returns {Promise<{valid: boolean, error?: string}>}
   */
  async validateCredentials(credentials) {
    if (!credentials || typeof credentials !== 'object') {
      return { valid: false, error: 'credentials должен быть объектом' };
    }
    if (!credentials.bankApiKey || typeof credentials.bankApiKey !== 'string') {
      return { valid: false, error: 'bankApiKey обязателен' };
    }
    if (!credentials.merchantId || typeof credentials.merchantId !== 'string') {
      return { valid: false, error: 'merchantId обязателен' };
    }
    if (!credentials.phoneNumber || typeof credentials.phoneNumber !== 'string') {
      return { valid: false, error: 'phoneNumber обязателен' };
    }
    const validProviders = ['sber', 'tinkoff', 'tochka', 'raiffeisen', 'vtb', 'default'];
    if (credentials.bankProvider && !validProviders.includes(credentials.bankProvider)) {
      return { valid: false, error: `Недопустимый bankProvider: "${credentials.bankProvider}". Допустимые: ${validProviders.join(', ')}` };
    }
    return { valid: true };
  }

  async initialize(credentials) {
    if (!credentials || typeof credentials !== 'object') {
      throw new Error('[СБП] credentials должен быть объектом');
    }
    if (!credentials.bankApiKey || typeof credentials.bankApiKey !== 'string') {
      throw new Error('[СБП] Отсутствует обязательный параметр bankApiKey');
    }
    if (!credentials.merchantId || typeof credentials.merchantId !== 'string') {
      throw new Error('[СБП] Отсутствует обязательный параметр merchantId');
    }
    if (!credentials.phoneNumber || typeof credentials.phoneNumber !== 'string') {
      throw new Error('[СБП] Отсутствует обязательный параметр phoneNumber');
    }

    const validProviders = ['sber', 'tinkoff', 'tochka', 'raiffeisen', 'vtb', 'default'];
    if (credentials.bankProvider && !validProviders.includes(credentials.bankProvider)) {
      throw new Error(`[СБП] Недопустимый bankProvider: "${credentials.bankProvider}". Допустимые: ${validProviders.join(', ')}`);
    }

    this.bankApiKey = credentials.bankApiKey;
    this.bankProvider = credentials.bankProvider || 'default';
    this.merchantId = credentials.merchantId;
    this.phoneNumber = credentials.phoneNumber;
    this.baseUrl = credentials.apiUrl || SBP_BANK_ENDPOINTS[this.bankProvider] || SBP_BANK_ENDPOINTS.default;
    this.credentials = credentials;
    this.initialized = true;

    this.log('info', 'СБП инициализирован', { bankProvider: this.bankProvider, merchantId: this.merchantId });
    return true;
  }

  _sbpRequest(method, path, data = null, params = null) {
    const config = {
      method,
      url: `${this.baseUrl}${path}`,
      timeout: 20000,
      headers: {
        'Authorization': `Bearer ${this.bankApiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'AgentCore/3.0 (SBP Provider #47)',
      },
    };

    if (data && typeof data === 'object') {
      config.data = data;
    }
    if (params && typeof params === 'object') {
      config.params = params;
    }

    return this.execute(() => axios(config));
  }

  /**
   * Создает QR-платеж в СБП.
   * @param {object} options
   * @param {number} options.amount — сумма в копейках (или рублях, в зависимости от банка)
   * @param {string} options.orderId — ID заказа в системе
   * @param {string} options.description — описание платежа
   * @param {string} [options.qrType] — тип QR: dynamic (по умолчанию) или static
   * @param {object} [options.payload] — дополнительные данные для конкретного банка
   * @returns {Promise<{orderId: string, qrUrl: string|null, qrCode: string|null, status: string, amount: number, createdAt: string}>}
   */
  async createQrPayment({ amount, orderId, description, qrType = 'dynamic', payload } = {}) {
    if (!this.initialized) {
      throw new Error('[СБП] Провайдер не инициализирован. Вызовите initialize()');
    }
    if (amount === undefined || amount === null || typeof amount !== 'number' || amount <= 0) {
      throw new Error('[СБП] Параметр amount обязателен и должен быть положительным числом');
    }
    if (!orderId || typeof orderId !== 'string') {
      throw new Error('[СБП] Параметр orderId обязателен и должен быть строкой');
    }
    if (!description || typeof description !== 'string') {
      throw new Error('[СБП] Параметр description обязателен и должен быть строкой');
    }
    if (!['dynamic', 'static'].includes(qrType)) {
      throw new Error('[СБП] qrType должен быть dynamic или static');
    }

    const requestBody = {
      merchantId: this.merchantId,
      orderId,
      amount,
      description,
      qrType,
      phoneNumber: this.phoneNumber,
    };

    if (payload && typeof payload === 'object') {
      Object.assign(requestBody, payload);
    }

    try {
      const response = await this._sbpRequest('POST', '/qr/generate', requestBody);
      const data = response.data || response;

      this.log('info', 'QR-платеж создан', { orderId, amount, bankProvider: this.bankProvider });

      return {
        orderId: data.orderId || orderId,
        qrUrl: data.qrUrl || data.qrUrlData || null,
        qrCode: data.qrCode || data.qrData || null,
        status: data.status || 'pending',
        amount,
        createdAt: data.createdAt || new Date().toISOString(),
      };
    } catch (err) {
      this.log('error', 'Ошибка создания QR-платежа', { error: err.message, orderId, amount });
      throw err;
    }
  }

  /**
   * Проверяет статус платежа по ID заказа.
   * @param {string} orderId — ID заказа в системе
   * @returns {Promise<{orderId: string, status: string, amount: number, paid: boolean, paidAt: string|null, bankOrderId: string|null}>}
   */
  async checkPaymentStatus(orderId) {
    if (!this.initialized) {
      throw new Error('[СБП] Провайдер не инициализирован. Вызовите initialize()');
    }
    if (!orderId || typeof orderId !== 'string') {
      throw new Error('[СБП] Параметр orderId обязателен и должен быть строкой');
    }

    try {
      const response = await this._sbpRequest('GET', `/orders/${orderId}/status`, null, { merchantId: this.merchantId });
      const data = response.data || response;

      const status = data.status || 'unknown';
      const paid = status === 'success' || status === 'confirmed' || status === 'completed';

      return {
        orderId,
        status,
        amount: typeof data.amount === 'number' ? data.amount : 0,
        paid,
        paidAt: data.paidAt || data.completedAt || null,
        bankOrderId: data.bankOrderId || data.operationId || null,
      };
    } catch (err) {
      this.log('error', 'Ошибка проверки статуса платежа', { error: err.message, orderId });
      throw err;
    }
  }

  /**
   * Отправляет сообщение через провайдер СБП (возвращает ссылку/QR на оплату).
   * @param {string} agentId — ID агента
   * @param {string} conversationId — ID разговора/заказа
   * @param {object} message — объект с данными платежа
   * @returns {Promise<{ok: boolean, orderId: string, qrUrl: string|null, status: string}>}
   */
  async sendMessage(agentId, conversationId, message) {
    try {
      if (!message || typeof message !== 'object') {
        throw new Error('[СБП] message должен быть объектом с параметрами платежа');
      }

      const result = await this.createQrPayment({
        amount: message.amount,
        orderId: message.orderId || `ac-${conversationId}-${Date.now()}`,
        description: message.description || `Оплата заказа ${conversationId}`,
        qrType: message.qrType || 'dynamic',
      });

      return {
        ok: true,
        orderId: result.orderId,
        qrUrl: result.qrUrl,
        qrCode: result.qrCode,
        status: result.status,
      };
    } catch (err) {
      this.log('error', 'sendMessage failed', { error: err.message, agentId, conversationId });
      throw err;
    }
  }

  /**
   * Обрабатывает webhook от банка-партнера СБП.
   * @param {object} payload — тело webhook
   * @param {string} signature — подпись запроса
   * @returns {Promise<{processed: boolean, event: string, orderId: string, status: string, amount: number, paid: boolean}>}
   */
  async handleWebhook(payload, signature) {
    try {
      if (!payload || typeof payload !== 'object') {
        throw new Error('[СБП] Invalid webhook payload');
      }

      const event = payload.event || payload.type || 'unknown';
      const orderId = payload.orderId || payload.order_id || payload.merchantOrderId || 'unknown';
      const status = payload.status || payload.paymentStatus || 'unknown';
      const amount = typeof payload.amount === 'number' ? payload.amount : (parseFloat(payload.amount) || 0);
      const paid = status === 'success' || status === 'confirmed' || status === 'completed' || payload.paid === true;

      if (event === 'payment.success' || event === 'payment.completed' || paid) {
        this.log('info', 'Webhook: платеж СБП подтвержден', { orderId, amount, status });
      } else if (event === 'payment.canceled' || event === 'payment.failed') {
        this.log('info', 'Webhook: платеж СБП отменен/неуспешен', { orderId, status });
      } else {
        this.log('info', 'Webhook: событие СБП', { event, orderId, status });
      }

      return {
        processed: true,
        event,
        orderId: String(orderId),
        status: String(status),
        amount,
        paid,
      };
    } catch (err) {
      this.log('error', 'Webhook handling failed', { error: err.message });
      throw err;
    }
  }

  async healthCheck() {
    try {
      const start = Date.now();
      if (this.bankProvider === 'sber') {
        await this._sbpRequest('GET', '/health', null, { merchantId: this.merchantId });
      } else if (this.bankProvider === 'tinkoff') {
        await this._sbpRequest('GET', '/api/v1/health', null, { merchantId: this.merchantId });
      } else {
        await this._sbpRequest('GET', '/health', null, { merchantId: this.merchantId });
      }
      return { ok: true, latency: Date.now() - start, bankProvider: this.bankProvider };
    } catch (err) {
      this.log('error', 'Health-check не пройден', { error: err.message, bankProvider: this.bankProvider });
      return { ok: false, error: err.message, bankProvider: this.bankProvider };
    }
  }

  async disconnect() {
    try {
      this.bankApiKey = null;
      this.merchantId = null;
      this.phoneNumber = null;
      this.baseUrl = null;
      this.initialized = false;
      this.credentials = null;
      this.log('info', 'СБП provider disconnected');
      return true;
    } catch (err) {
      this.log('error', 'Disconnect failed', { error: err.message });
      this.initialized = false;
      return false;
    }
  }
}

function createSbpProvider(config) {
  return new SbpProvider(config);
}

module.exports = { SbpProvider, createSbpProvider };
