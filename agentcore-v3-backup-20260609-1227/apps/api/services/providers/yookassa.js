const axios = require('axios');
const { IntegrationProvider } = require('../IntegrationProvider');

const YOOKASSA_API_BASE = 'https://api.yookassa.ru/v3';

/**
 * @file  apps/api/services/providers/yookassa.js
 * @agent #46 — ЮKassa (YooKassa) интеграционный провайдер
 *
 * Поддерживаемые операции:
 *   - Создание платежа (createPayment)
 *   - Получение статуса платежа (getPaymentStatus)
 *   - Обработка webhook (payment.succeeded, payment.canceled, refund.succeeded)
 *   - Проверка доступности API (healthCheck)
 *
 * Документация: https://yookassa.ru/developers/api
 */

class YookassaProvider extends IntegrationProvider {
  constructor(config = {}) {
    super({
      name: 'yookassa',
      displayName: 'ЮKassa',
      agentId: 46,
      version: '1.0.0',
      ...config,
    });
    this.shopId = null;
    this.secretKey = null;
    this.apiKey = null;
  }

  /**
   * Инициализация провайдера с учетными данными ЮKassa.
   * @param {object} credentials
   * @param {string} credentials.shopId — ID магазина
   * @param {string} credentials.secretKey — Секретный ключ
   * @param {string} [credentials.apiKey] — API-ключ (опционально, используется secretKey)
   * @returns {Promise<boolean>}
   */
  async initialize(credentials) {
    if (!credentials || typeof credentials !== 'object') {
      throw new Error('[ЮKassa] credentials должен быть объектом');
    }
    if (!credentials.shopId || typeof credentials.shopId !== 'string') {
      throw new Error('[ЮKassa] Отсутствует обязательный параметр shopId');
    }
    if (!credentials.secretKey || typeof credentials.secretKey !== 'string') {
      throw new Error('[ЮKassa] Отсутствует обязательный параметр secretKey');
    }

    this.shopId = credentials.shopId;
    this.secretKey = credentials.secretKey;
    this.apiKey = credentials.apiKey || credentials.secretKey;
    this.credentials = credentials;
    this.initialized = true;

    this.log('info', 'ЮKassa инициализирован', { shopId: this.shopId });
    return true;
  }

  /**
   * Валидация credentials перед сохранением — тестовый запрос к API (get payment methods).
   * @param {object} credentials
   * @returns {Promise<{valid: boolean, error?: string}>}
   */
  async validateCredentials(credentials) {
    if (!credentials || typeof credentials !== 'object') {
      return { valid: false, error: 'credentials должен быть объектом' };
    }
    if (!credentials.shopId || typeof credentials.shopId !== 'string') {
      return { valid: false, error: 'shopId обязателен' };
    }
    if (!credentials.secretKey || typeof credentials.secretKey !== 'string') {
      return { valid: false, error: 'secretKey обязателен' };
    }
    try {
      const response = await axios.get(`${YOOKASSA_API_BASE}/me`, {
        auth: { username: credentials.shopId, password: credentials.secretKey },
        timeout: 10000,
      });
      if (response.data && response.data.account_id) {
        return { valid: true };
      }
      return { valid: false, error: 'Неверный shopId или secretKey' };
    } catch (err) {
      return { valid: false, error: `Неверный shopId или secretKey: ${err.response?.data?.description || err.message}` };
    }
  }

  _getAuth() {
    return {
      username: this.shopId,
      password: this.secretKey,
    };
  }

  _generateIdempotencyKey() {
    return `ac-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  _yookassaRequest(method, path, data = null) {
    const url = `${YOOKASSA_API_BASE}${path}`;
    const idempotencyKey = this._generateIdempotencyKey();

    return this.execute(() =>
      axios({
        method,
        url,
        data,
        auth: this._getAuth(),
        timeout: 20000,
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
          'User-Agent': 'AgentCore/3.0 (YooKassa Provider #46)',
        },
      })
    );
  }

  /**
   * Создает платеж в ЮKassa.
   * @param {object} options
   * @param {number} options.amount — сумма платежа
   * @param {string} options.currency — валюта (RUB, USD, EUR и т.д.)
   * @param {string} options.description — описание платежа
   * @param {string} options.returnUrl — URL для возврата после оплаты
   * @param {boolean} [options.capture=true] — автоматическое подтверждение
   * @param {object} [options.metadata] — произвольные метаданные
   * @param {object} [options.receipt] — данные чека (ФФД 1.05)
   * @returns {Promise<{paymentId: string, status: string, amount: number, currency: string, confirmationUrl: string|null, createdAt: string}>}
   */
  async createPayment({ amount, currency, description, returnUrl, capture = true, metadata, receipt } = {}) {
    if (!this.initialized) {
      throw new Error('[ЮKassa] Провайдер не инициализирован. Вызовите initialize()');
    }
    if (amount === undefined || amount === null || typeof amount !== 'number' || amount <= 0) {
      throw new Error('[ЮKassa] Параметр amount обязателен и должен быть положительным числом');
    }
    if (!currency || typeof currency !== 'string') {
      throw new Error('[ЮKassa] Параметр currency обязателен и должен быть строкой');
    }
    if (!description || typeof description !== 'string') {
      throw new Error('[ЮKassa] Параметр description обязателен и должен быть строкой');
    }
    if (!returnUrl || typeof returnUrl !== 'string') {
      throw new Error('[ЮKassa] Параметр returnUrl обязателен и должен быть строкой');
    }

    const payload = {
      amount: {
        value: amount.toFixed(2),
        currency: currency.toUpperCase(),
      },
      capture,
      description,
      confirmation: {
        type: 'redirect',
        return_url: returnUrl,
      },
    };

    if (metadata && typeof metadata === 'object') {
      payload.metadata = metadata;
    }

    if (receipt && typeof receipt === 'object') {
      payload.receipt = receipt;
    }

    try {
      const response = await this._yookassaRequest('POST', '/payments', payload);
      const data = response.data || response;

      const confirmationUrl = data.confirmation?.confirmation_url || null;

      this.log('info', 'Платеж создан', { paymentId: data.id, amount, currency });

      return {
        paymentId: data.id,
        status: data.status,
        amount: parseFloat(data.amount?.value || amount),
        currency: data.amount?.currency || currency,
        confirmationUrl,
        createdAt: data.created_at || new Date().toISOString(),
      };
    } catch (err) {
      this.log('error', 'Ошибка создания платежа', { error: err.message, amount, currency });
      throw err;
    }
  }

  /**
   * Получает статус платежа по ID.
   * @param {string} paymentId — ID платежа в ЮKassa
   * @returns {Promise<{paymentId: string, status: string, amount: number, currency: string, paid: boolean, metadata: object|null}>}
   */
  async getPaymentStatus(paymentId) {
    if (!this.initialized) {
      throw new Error('[ЮKassa] Провайдер не инициализирован. Вызовите initialize()');
    }
    if (!paymentId || typeof paymentId !== 'string') {
      throw new Error('[ЮKassa] Параметр paymentId обязателен и должен быть строкой');
    }

    try {
      const response = await this._yookassaRequest('GET', `/payments/${paymentId}`);
      const data = response.data || response;

      return {
        paymentId: data.id,
        status: data.status,
        amount: parseFloat(data.amount?.value || 0),
        currency: data.amount?.currency || 'RUB',
        paid: data.paid === true,
        metadata: data.metadata || null,
      };
    } catch (err) {
      this.log('error', 'Ошибка получения статуса платежа', { error: err.message, paymentId });
      throw err;
    }
  }

  /**
   * Отправляет сообщение через провайдер платежа (возвращает ссылку на оплату).
   * @param {string} agentId — ID агента
   * @param {string} conversationId — ID разговора/заказа
   * @param {object} message — объект с данными платежа
   * @returns {Promise<{ok: boolean, paymentId: string, confirmationUrl: string, status: string}>}
   */
  async sendMessage(agentId, conversationId, message) {
    try {
      if (!message || typeof message !== 'object') {
        throw new Error('[ЮKassa] message должен быть объектом с параметрами платежа');
      }

      const result = await this.createPayment({
        amount: message.amount,
        currency: message.currency || 'RUB',
        description: message.description || `Оплата заказа ${conversationId}`,
        returnUrl: message.returnUrl || 'https://agentcore.work/payment/success',
        capture: message.capture !== false,
        metadata: {
          agentId: String(agentId || ''),
          conversationId: String(conversationId || ''),
          ...message.metadata,
        },
      });

      return {
        ok: true,
        paymentId: result.paymentId,
        confirmationUrl: result.confirmationUrl,
        status: result.status,
      };
    } catch (err) {
      this.log('error', 'sendMessage failed', { error: err.message, agentId, conversationId });
      throw err;
    }
  }

  /**
   * Обрабатывает webhook от ЮKassa.
   * @param {object} payload — тело webhook
   * @param {string} signature — подпись запроса (IP-адрес или секретный заголовок)
   * @returns {Promise<{processed: boolean, event: string, paymentId: string, status: string, object: object}>}
   */
  async handleWebhook(payload, signature) {
    try {
      if (!payload || typeof payload !== 'object') {
        throw new Error('[ЮKassa] Invalid webhook payload');
      }

      const event = payload.event || 'unknown';
      const object = payload.object || {};

      if (event === 'payment.succeeded') {
        this.log('info', 'Webhook: платеж успешно оплачен', { paymentId: object.id, amount: object.amount?.value });
      } else if (event === 'payment.canceled') {
        this.log('info', 'Webhook: платеж отменен', { paymentId: object.id, cancellationDetails: object.cancellation_details });
      } else if (event === 'refund.succeeded') {
        this.log('info', 'Webhook: возврат выполнен', { refundId: object.id, paymentId: object.payment_id });
      } else {
        this.log('info', 'Webhook: получено событие', { event, paymentId: object.id });
      }

      return {
        processed: true,
        event,
        paymentId: object.id || null,
        status: object.status || 'unknown',
        object,
      };
    } catch (err) {
      this.log('error', 'Webhook handling failed', { error: err.message });
      throw err;
    }
  }

  async healthCheck() {
    try {
      const start = Date.now();
      await this._yookassaRequest('GET', '/me');
      return { ok: true, latency: Date.now() - start };
    } catch (err) {
      this.log('error', 'Health-check не пройден', { error: err.message });
      return { ok: false, error: err.message };
    }
  }

  async disconnect() {
    try {
      this.shopId = null;
      this.secretKey = null;
      this.apiKey = null;
      this.initialized = false;
      this.credentials = null;
      this.log('info', 'ЮKassa provider disconnected');
      return true;
    } catch (err) {
      this.log('error', 'Disconnect failed', { error: err.message });
      this.initialized = false;
      return false;
    }
  }
}

function createYookassaProvider(config) {
  return new YookassaProvider(config);
}

module.exports = { YookassaProvider, createYookassaProvider };
