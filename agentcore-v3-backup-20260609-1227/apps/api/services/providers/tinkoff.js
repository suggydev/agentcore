const axios = require('axios');
const crypto = require('crypto');
const { IntegrationProvider } = require('../IntegrationProvider');

const TINKOFF_DEFAULT_API = 'https://securepay.tinkoff.ru/v2';

/**
 * @file  apps/api/services/providers/tinkoff.js
 * @agent #48 — Тинькофф (Tinkoff) интеграционный провайдер
 *
 * Поддерживаемые операции:
 *   - Инициализация платежа (initPayment)
 *   - Получение статуса платежа (getPaymentStatus)
 *   - Отмена платежа (cancelPayment)
 *   - Обработка webhook (CONFIRMED, CANCELLED, REFUNDED, REJECTED)
 *   - Проверка доступности API (healthCheck)
 *
 * Документация: https://www.tinkoff.ru/kassa/develop/api/
 */

class TinkoffProvider extends IntegrationProvider {
  constructor(config = {}) {
    super({
      name: 'tinkoff',
      displayName: 'Тинькофф',
      agentId: 48,
      version: '1.0.0',
      ...config,
    });
    this.terminalKey = null;
    this.secretKey = null;
    this.apiUrl = TINKOFF_DEFAULT_API;
  }

  /**
   * Инициализация провайдера Тинькофф с учетными данными терминала.
   * @param {object} credentials
   * @param {string} credentials.terminalKey — ключ терминала
   * @param {string} credentials.secretKey — секретный ключ для подписи
   * @param {string} [credentials.apiUrl] — кастомный URL API (по умолчанию https://securepay.tinkoff.ru/v2)
   * @returns {Promise<boolean>}
   */
  async initialize(credentials) {
    if (!credentials || typeof credentials !== 'object') {
      throw new Error('[Тинькофф] credentials должен быть объектом');
    }
    if (!credentials.terminalKey || typeof credentials.terminalKey !== 'string') {
      throw new Error('[Тинькофф] Отсутствует обязательный параметр terminalKey');
    }
    if (!credentials.secretKey || typeof credentials.secretKey !== 'string') {
      throw new Error('[Тинькофф] Отсутствует обязательный параметр secretKey');
    }

    this.terminalKey = credentials.terminalKey;
    this.secretKey = credentials.secretKey;
    this.apiUrl = credentials.apiUrl || TINKOFF_DEFAULT_API;
    this.credentials = credentials;
    this.initialized = true;

    this.log('info', 'Тинькофф инициализирован', { terminalKey: this.terminalKey });
    return true;
  }

  /**
   * Валидация credentials перед сохранением — тестовый запрос getTerminalInfo.
   * @param {object} credentials
   * @returns {Promise<{valid: boolean, error?: string}>}
   */
  async validateCredentials(credentials) {
    if (!credentials || typeof credentials !== 'object') {
      return { valid: false, error: 'credentials должен быть объектом' };
    }
    if (!credentials.terminalKey || typeof credentials.terminalKey !== 'string') {
      return { valid: false, error: 'terminalKey обязателен' };
    }
    if (!credentials.secretKey || typeof credentials.secretKey !== 'string') {
      return { valid: false, error: 'secretKey обязателен' };
    }
    try {
      const token = crypto.createHash('sha256').update(credentials.terminalKey + credentials.secretKey).digest('hex');
      const response = await axios.post(`${credentials.apiUrl || TINKOFF_DEFAULT_API}/GetTerminalInfo`, {
        TerminalKey: credentials.terminalKey,
        Token: token,
      }, { timeout: 10000 });
      if (response.data && response.data.Success) {
        return { valid: true };
      }
      return { valid: false, error: 'Неверный terminalKey или secretKey' };
    } catch (err) {
      return { valid: false, error: `Неверный terminalKey или secretKey: ${err.response?.data?.Message || err.message}` };
    }
  }

  /**
   * Генерирует токен подписи для запроса к Тинькофф по алгоритму SHA-256.
   * Параметры сортируются по ключу, конкатенируются со значениями и склеиваются с secretKey.
   * @param {object} params — объект параметров запроса (без поля Token)
   * @returns {string} SHA-256 hex string
   */
  _generateToken(params) {
    if (!params || typeof params !== 'object') {
      throw new Error('[Тинькофф] params должен быть объектом для генерации токена');
    }

    const keys = Object.keys(params).filter(k => k !== 'Token' && k !== 'Receipt' && k !== 'Data').sort();
    let concatenated = '';
    for (const key of keys) {
      const value = params[key];
      if (value !== undefined && value !== null && value !== '') {
        concatenated += String(value);
      }
    }
    concatenated += this.secretKey;

    return crypto.createHash('sha256').update(concatenated).digest('hex');
  }

  _tinkoffRequest(method, path, body = {}) {
    if (method !== 'GET' && method !== 'POST') {
      throw new Error(`[Тинькофф] Неподдерживаемый HTTP метод: ${method}`);
    }

    const url = `${this.apiUrl}${path}`;

    return this.execute(() =>
      axios({
        method,
        url,
        data: body,
        timeout: 20000,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'AgentCore/3.0 (Tinkoff Provider #48)',
        },
      })
    );
  }

  /**
   * Инициализирует платеж в Тинькофф.
   * @param {object} options
   * @param {number} options.amount — сумма в копейках (например, 1000 = 10.00 руб)
   * @param {string} options.orderId — ID заказа в системе (уникальный, до 36 символов)
   * @param {string} options.description — описание платежа
   * @param {object} [options.data] — дополнительные параметры (phone, email и т.д.)
   * @param {object} [options.receipt] — данные чека (ФФД 1.05)
   * @param {string} [options.successUrl] — URL для перенаправления при успехе
   * @param {string} [options.failUrl] — URL для перенаправления при ошибке
   * @returns {Promise<{paymentId: string, orderId: string, status: string, amount: number, paymentUrl: string|null, paymentFormUrl: string|null}>}
   */
  async initPayment({ amount, orderId, description, data, receipt, successUrl, failUrl } = {}) {
    if (!this.initialized) {
      throw new Error('[Тинькофф] Провайдер не инициализирован. Вызовите initialize()');
    }
    if (amount === undefined || amount === null || typeof amount !== 'number' || amount <= 0) {
      throw new Error('[Тинькофф] Параметр amount обязателен и должен быть положительным числом (в копейках)');
    }
    if (!orderId || typeof orderId !== 'string') {
      throw new Error('[Тинькофф] Параметр orderId обязателен и должен быть строкой');
    }
    if (orderId.length > 36) {
      throw new Error('[Тинькофф] Параметр orderId не должен превышать 36 символов');
    }
    if (!description || typeof description !== 'string') {
      throw new Error('[Тинькофф] Параметр description обязателен и должен быть строкой');
    }

    const payload = {
      TerminalKey: this.terminalKey,
      Amount: amount,
      OrderId: orderId,
      Description: description,
    };

    if (data && typeof data === 'object') {
      payload.DATA = data;
    }
    if (receipt && typeof receipt === 'object') {
      payload.Receipt = receipt;
    }
    if (successUrl && typeof successUrl === 'string') {
      payload.SuccessURL = successUrl;
    }
    if (failUrl && typeof failUrl === 'string') {
      payload.FailURL = failUrl;
    }

    payload.Token = this._generateToken(payload);

    try {
      const response = await this._tinkoffRequest('POST', '/Init', payload);
      const result = response.data || response;

      if (!result.Success && result.ErrorCode !== '0') {
        throw new Error(`[Тинькофф] Ошибка инициализации платежа (${result.ErrorCode}): ${result.Message || result.Details || 'Unknown error'}`);
      }

      this.log('info', 'Платеж инициализирован', { paymentId: result.PaymentId, orderId, amount });

      return {
        paymentId: String(result.PaymentId),
        orderId: result.OrderId || orderId,
        status: result.Status || 'NEW',
        amount,
        paymentUrl: result.PaymentURL || null,
        paymentFormUrl: result.PaymentFormUrl || result.PaymentURL || null,
      };
    } catch (err) {
      this.log('error', 'Ошибка инициализации платежа', { error: err.message, orderId, amount });
      throw err;
    }
  }

  /**
   * Получает статус платежа по ID платежа в Тинькофф.
   * @param {string} paymentId — ID платежа в системе Тинькофф
   * @returns {Promise<{paymentId: string, orderId: string, status: string, amount: number, success: boolean}>}
   */
  async getPaymentStatus(paymentId) {
    if (!this.initialized) {
      throw new Error('[Тинькофф] Провайдер не инициализирован. Вызовите initialize()');
    }
    if (!paymentId || typeof paymentId !== 'string') {
      throw new Error('[Тинькофф] Параметр paymentId обязателен и должен быть строкой');
    }

    const payload = {
      TerminalKey: this.terminalKey,
      PaymentId: paymentId,
    };
    payload.Token = this._generateToken(payload);

    try {
      const response = await this._tinkoffRequest('POST', '/GetState', payload);
      const result = response.data || response;

      if (!result.Success && result.ErrorCode !== '0') {
        throw new Error(`[Тинькофф] Ошибка получения статуса (${result.ErrorCode}): ${result.Message || result.Details || 'Unknown error'}`);
      }

      const success = result.Status === 'CONFIRMED' || result.Status === 'AUTHORIZED';

      return {
        paymentId: String(result.PaymentId || paymentId),
        orderId: result.OrderId || '',
        status: result.Status || 'UNKNOWN',
        amount: typeof result.Amount === 'number' ? result.Amount : 0,
        success,
      };
    } catch (err) {
      this.log('error', 'Ошибка получения статуса платежа', { error: err.message, paymentId });
      throw err;
    }
  }

  /**
   * Отменяет платеж (возврат средств).
   * @param {string} paymentId — ID платежа в Тинькофф
   * @param {number} [amount] — сумма для возврата в копейках (если частичный)
   * @returns {Promise<{paymentId: string, status: string, originalAmount: number, refundedAmount: number}>}
   */
  async cancelPayment(paymentId, amount) {
    if (!this.initialized) {
      throw new Error('[Тинькофф] Провайдер не инициализирован. Вызовите initialize()');
    }
    if (!paymentId || typeof paymentId !== 'string') {
      throw new Error('[Тинькофф] Параметр paymentId обязателен и должен быть строкой');
    }

    const payload = {
      TerminalKey: this.terminalKey,
      PaymentId: paymentId,
    };

    if (amount !== undefined && amount !== null) {
      if (typeof amount !== 'number' || amount <= 0) {
        throw new Error('[Тинькофф] Параметр amount должен быть положительным числом (в копейках)');
      }
      payload.Amount = amount;
    }

    payload.Token = this._generateToken(payload);

    try {
      const response = await this._tinkoffRequest('POST', '/Cancel', payload);
      const result = response.data || response;

      if (!result.Success && result.ErrorCode !== '0') {
        throw new Error(`[Тинькофф] Ошибка отмены платежа (${result.ErrorCode}): ${result.Message || result.Details || 'Unknown error'}`);
      }

      this.log('info', 'Платеж отменен/возвращен', { paymentId, amount: result.Amount });

      return {
        paymentId: String(result.PaymentId || paymentId),
        status: result.Status || 'CANCELLED',
        originalAmount: typeof result.OriginalAmount === 'number' ? result.OriginalAmount : 0,
        refundedAmount: typeof result.NewAmount === 'number' ? result.NewAmount : 0,
      };
    } catch (err) {
      this.log('error', 'Ошибка отмены платежа', { error: err.message, paymentId, amount });
      throw err;
    }
  }

  /**
   * Отправляет сообщение через провайдер Тинькофф (возвращает ссылку на оплату).
   * @param {string} agentId — ID агента
   * @param {string} conversationId — ID разговора/заказа
   * @param {object} message — объект с данными платежа
   * @returns {Promise<{ok: boolean, paymentId: string, orderId: string, paymentUrl: string|null, status: string}>}
   */
  async sendMessage(agentId, conversationId, message) {
    try {
      if (!message || typeof message !== 'object') {
        throw new Error('[Тинькофф] message должен быть объектом с параметрами платежа');
      }

      const result = await this.initPayment({
        amount: message.amount,
        orderId: message.orderId || `ac-${conversationId}-${Date.now()}`,
        description: message.description || `Оплата заказа ${conversationId}`,
        data: {
          agentId: String(agentId || ''),
          conversationId: String(conversationId || ''),
          ...message.data,
        },
        receipt: message.receipt,
        successUrl: message.successUrl || 'https://agentcore.work/payment/success',
        failUrl: message.failUrl || 'https://agentcore.work/payment/fail',
      });

      return {
        ok: true,
        paymentId: result.paymentId,
        orderId: result.orderId,
        paymentUrl: result.paymentUrl,
        status: result.status,
      };
    } catch (err) {
      this.log('error', 'sendMessage failed', { error: err.message, agentId, conversationId });
      throw err;
    }
  }

  /**
   * Обрабатывает webhook от Тинькофф.
   * @param {object} payload — тело webhook
   * @param {string} signature — подпись запроса (Token из Тинькофф)
   * @returns {Promise<{processed: boolean, event: string, paymentId: string, orderId: string, status: string, success: boolean, amount: number}>}
   */
  async handleWebhook(payload, signature) {
    try {
      if (!payload || typeof payload !== 'object') {
        throw new Error('[Тинькофф] Invalid webhook payload');
      }

      const status = payload.Status || payload.status || 'UNKNOWN';
      const paymentId = String(payload.PaymentId || payload.paymentId || 'unknown');
      const orderId = payload.OrderId || payload.orderId || '';
      const amount = typeof payload.Amount === 'number' ? payload.Amount : (parseInt(payload.Amount, 10) || 0);

      const eventMap = {
        'CONFIRMED': 'payment.confirmed',
        'CANCELLED': 'payment.cancelled',
        'REFUNDED': 'payment.refunded',
        'REJECTED': 'payment.rejected',
        'AUTHORIZED': 'payment.authorized',
        'DEADLINE_EXPIRED': 'payment.expired',
        'FORM_SHOWED': 'payment.form_showed',
        'NEW': 'payment.created',
      };
      const event = eventMap[status] || 'payment.unknown';
      const success = status === 'CONFIRMED' || status === 'AUTHORIZED' || status === 'FORM_SHOWED';

      if (signature) {
        const expectedToken = this._generateToken({
          TerminalKey: payload.TerminalKey || this.terminalKey,
          PaymentId: payload.PaymentId,
          OrderId: payload.OrderId,
          Status: payload.Status,
          Success: payload.Success,
          Amount: payload.Amount,
        });
        if (signature !== expectedToken) {
          this.log('warn', 'Webhook: неверная подпись (Token)', { paymentId, orderId });
        }
      }

      this.log('info', 'Webhook: событие Тинькофф', { event, status, paymentId, orderId, amount });

      return {
        processed: true,
        event,
        paymentId,
        orderId,
        status,
        success,
        amount,
      };
    } catch (err) {
      this.log('error', 'Webhook handling failed', { error: err.message });
      throw err;
    }
  }

  async healthCheck() {
    try {
      const start = Date.now();
      const payload = {
        TerminalKey: this.terminalKey,
      };
      payload.Token = this._generateToken(payload);

      await this._tinkoffRequest('GET', '/GetState', null);
      return { ok: true, latency: Date.now() - start };
    } catch (err) {
      this.log('error', 'Health-check не пройден', { error: err.message });
      return { ok: false, error: err.message };
    }
  }

  async disconnect() {
    try {
      this.terminalKey = null;
      this.secretKey = null;
      this.apiUrl = TINKOFF_DEFAULT_API;
      this.initialized = false;
      this.credentials = null;
      this.log('info', 'Тинькофф provider disconnected');
      return true;
    } catch (err) {
      this.log('error', 'Disconnect failed', { error: err.message });
      this.initialized = false;
      return false;
    }
  }
}

function createTinkoffProvider(config) {
  return new TinkoffProvider(config);
}

module.exports = { TinkoffProvider, createTinkoffProvider };
