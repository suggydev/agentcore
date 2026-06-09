const YooKassa = require('yookassa');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const axios = require('axios');
const config = require('../config');
const { IntegrationProvider, AppError } = require('./IntegrationProvider');

const RUSSIAN_ERRORS = {
  not_configured: 'ЮKassa не настроена. Укажите shopId и секретный ключ в личном кабинете.',
  invalid_credentials: 'Неверный shopId или секретный ключ ЮKassa. Проверьте данные.',
  payment_not_found: 'Платёж не найден. Проверьте идентификатор платежа.',
  refund_not_found: 'Возврат не найден. Проверьте идентификатор возврата.',
  payment_already_captured: 'Платёж уже подтверждён — повторное списание невозможно.',
  payment_cancelled: 'Платёж уже отменён.',
  insufficient_funds: 'Недостаточно средств для возврата.',
  receipt_error: 'Ошибка формирования чека (54-ФЗ). Проверьте состав позиций.',
  subscription_error: 'Ошибка создания подписки. Проверьте способ оплаты.',
  network_error: 'Ошибка соединения с ЮKassa. Проверьте интернет-соединение.',
  rate_limit: 'Превышен лимит запросов к ЮKassa. Повторите позже.',
  api_error: 'Ошибка API ЮKassa.',
  validation_error: 'Неверные параметры запроса к ЮKassa.',
  shop_not_found: 'Магазин с указанным shopId не найден.',
  webhook_invalid: 'Неверная подпись вебхука. Запрос отклонён.',
};

function mapYooKassaError(err) {
  const status = err?.response?.status || err?.statusCode;
  const body = err?.response?.data || err?.body || {};
  const code = body?.code;

  if (status === 401 || status === 403 || code === 'authorization_error') {
    return new AppError(RUSSIAN_ERRORS.invalid_credentials, 401, 'YOOKASSA_AUTH_ERROR');
  }
  if (status === 404 || code === 'payment_not_found') {
    return new AppError(RUSSIAN_ERRORS.payment_not_found, 404, 'YOOKASSA_NOT_FOUND');
  }
  if (status === 429) {
    return new AppError(RUSSIAN_ERRORS.rate_limit, 429, 'YOOKASSA_RATE_LIMIT');
  }
  if (status === 400 && code?.includes('receipt')) {
    return new AppError(RUSSIAN_ERRORS.receipt_error, 400, 'YOOKASSA_RECEIPT_ERROR');
  }
  if (code === 'insufficient_funds') {
    return new AppError(RUSSIAN_ERRORS.insufficient_funds, 400, 'YOOKASSA_INSUFFICIENT_FUNDS');
  }
  if (code === 'invalid_payment_status') {
    return new AppError(RUSSIAN_ERRORS.payment_already_captured, 400, 'YOOKASSA_INVALID_STATUS');
  }
  if (err.code === 'ECONNREFUSED' || err.code === 'ECONNABORTED' || err.code === 'ECONNRESET') {
    return new AppError(RUSSIAN_ERRORS.network_error, 502, 'YOOKASSA_NETWORK_ERROR');
  }
  const message = body?.description || err?.message || RUSSIAN_ERRORS.api_error;
  return new AppError(message, status || 500, 'YOOKASSA_ERROR');
}

class YooKassaProvider extends IntegrationProvider {
  constructor(credentials = {}) {
    super({
      name: 'yookassa',
      displayName: 'ЮKassa',
      agentId: 51,
      version: '2.0.0',
    });

    this.shopId = credentials.shopId || config.YOOKASSA_SHOP_ID;
    this.secretKey = credentials.secretKey || config.YOOKASSA_SECRET_KEY;
    this.webhookSecret = credentials.webhookSecret || config.YOOKASSA_WEBHOOK_SECRET;
    this._client = null;
    this._axiosToken = null;
    this.credentialSource = credentials.shopId ? 'database' : 'env';
  }

  get client() {
    if (!this._client) {
      if (!this.shopId || !this.secretKey) {
        throw new AppError(RUSSIAN_ERRORS.not_configured, 500, 'YOOKASSA_NOT_CONFIGURED');
      }
      this._client = new YooKassa({
        shopId: this.shopId,
        secretKey: this.secretKey,
        timeout: 120000,
      });
      this.initialized = true;
      this.log('info', 'YooKassa client initialized', { shopId: this.shopId });
    }
    return this._client;
  }

  set client(value) {
    this._client = value;
  }

  get authToken() {
    if (!this._axiosToken) {
      this._axiosToken = Buffer.from(`${this.shopId}:${this.secretKey}`).toString('base64');
    }
    return this._axiosToken;
  }

  async rawApiCall(method, path, body = null, idempotenceKey = null) {
    if (!this.shopId || !this.secretKey) {
      throw new AppError(RUSSIAN_ERRORS.not_configured, 500, 'YOOKASSA_NOT_CONFIGURED');
    }

    const key = idempotenceKey || uuidv4();

    try {
      const response = await this.execute(async () => {
        const res = await axios({
          method,
          url: `https://api.yookassa.ru/v3${path}`,
          headers: {
            Authorization: `Basic ${this.authToken}`,
            'Content-Type': 'application/json',
            'Idempotence-Key': key,
          },
          data: body,
          timeout: 30000,
          validateStatus: null,
        });

        if (res.status >= 200 && res.status < 300) {
          return { data: res.data };
        }

        const apiErr = new Error(res.data?.description || `HTTP ${res.status}`);
        apiErr.response = { status: res.status, data: res.data };
        throw apiErr;
      });

      return response;
    } catch (err) {
      if (err instanceof AppError && err.code?.startsWith('YOOKASSA_')) {
        throw err;
      }
      if (err.isOperational) throw err;
      throw mapYooKassaError(err);
    }
  }

  initialize(credentials = {}) {
    if (credentials.shopId) this.shopId = credentials.shopId;
    if (credentials.secretKey) this.secretKey = credentials.secretKey;
    if (credentials.webhookSecret) this.webhookSecret = credentials.webhookSecret;
    this._client = null;
    this._axiosToken = null;
    this.credentialSource = 'database';
    this.initialized = false;
    this.log('info', 'YooKassa credentials updated');
  }

  verifyWebhookSignature(body, signature) {
    if (!this.webhookSecret) {
      throw new AppError(RUSSIAN_ERRORS.not_configured, 500, 'YOOKASSA_NOT_CONFIGURED');
    }

    const rawBody = typeof body === 'string' ? body : JSON.stringify(body);
    const computed = crypto.createHmac('sha256', this.webhookSecret).update(rawBody, 'utf8').digest('hex');

    const isValid = crypto.timingSafeEqual(
      Buffer.from(computed, 'hex'),
      Buffer.from(signature, 'hex')
    );

    if (!isValid) {
      this.log('warn', 'Invalid webhook signature');
      throw new AppError(RUSSIAN_ERRORS.webhook_invalid, 403, 'YOOKASSA_INVALID_SIGNATURE');
    }

    return true;
  }

  async createPayment({
    amount,
    currency = 'RUB',
    description,
    orderId,
    returnUrl,
    customerEmail,
    receipt,
    capture = true,
    savePaymentMethod = false,
    paymentMethodId,
  }) {
    if (!this.shopId || !this.secretKey) {
      throw new AppError(RUSSIAN_ERRORS.not_configured, 500, 'YOOKASSA_NOT_CONFIGURED');
    }

    const idempotenceKey = uuidv4();
    if (!Number.isFinite(amount)) {
      throw new AppError(RUSSIAN_ERRORS.validation_error, 400, 'YOOKASSA_VALIDATION_ERROR');
    }

    const payload = {
      amount: { value: amount.toFixed(2), currency },
      capture,
      confirmation: {
        type: 'redirect',
        return_url: returnUrl || config.CLIENT_URL || 'http://localhost:3000',
      },
      description: description || `Заказ #${orderId}`,
      metadata: { orderId: String(orderId) },
    };

    if (customerEmail || receipt) {
      payload.receipt = {
        customer: {
          email: customerEmail || undefined,
        },
        items: receipt?.items || [
          {
            description: description || `Заказ #${orderId}`,
            quantity: '1',
            amount: { value: amount.toFixed(2), currency },
            vat_code: 1,
          },
        ],
      };

      if (receipt?.taxSystemCode) {
        payload.receipt.tax_system_code = receipt.taxSystemCode;
      }
    }

    if (savePaymentMethod) {
      payload.save_payment_method = true;
    }

    if (paymentMethodId) {
      payload.payment_method_id = paymentMethodId;
    }

    try {
      const result = await this.client.createPayment(payload, idempotenceKey);
      return result;
    } catch (err) {
      throw mapYooKassaError(err);
    }
  }

  async getPayment(paymentId) {
    if (!this.shopId || !this.secretKey) {
      throw new AppError(RUSSIAN_ERRORS.not_configured, 500, 'YOOKASSA_NOT_CONFIGURED');
    }

    try {
      const result = await this.client.getPayment(paymentId);
      return result;
    } catch (err) {
      throw mapYooKassaError(err);
    }
  }

  async capturePayment(paymentId, amount) {
    if (!this.shopId || !this.secretKey) {
      throw new AppError(RUSSIAN_ERRORS.not_configured, 500, 'YOOKASSA_NOT_CONFIGURED');
    }

    const idempotenceKey = uuidv4();
    let payload;

    if (amount !== undefined && Number.isFinite(amount)) {
      payload = { amount: { value: amount.toFixed(2), currency: 'RUB' } };
    }

    try {
      const result = await this.client.capturePayment(paymentId, payload || undefined, idempotenceKey);
      return result;
    } catch (err) {
      throw mapYooKassaError(err);
    }
  }

  async cancelPayment(paymentId) {
    if (!this.shopId || !this.secretKey) {
      throw new AppError(RUSSIAN_ERRORS.not_configured, 500, 'YOOKASSA_NOT_CONFIGURED');
    }

    try {
      const result = await this.client.cancelPayment(paymentId);
      return result;
    } catch (err) {
      throw mapYooKassaError(err);
    }
  }

  async createRefund({ paymentId, amount, currency = 'RUB', description }) {
    if (!this.shopId || !this.secretKey) {
      throw new AppError(RUSSIAN_ERRORS.not_configured, 500, 'YOOKASSA_NOT_CONFIGURED');
    }
    if (!Number.isFinite(amount)) {
      throw new AppError(RUSSIAN_ERRORS.validation_error, 400, 'YOOKASSA_VALIDATION_ERROR');
    }

    const idempotenceKey = uuidv4();
    const payload = {
      amount: { value: amount.toFixed(2), currency },
    };

    if (description) {
      payload.description = description;
    }

    try {
      const result = await this.client.createRefund(paymentId, payload, idempotenceKey);
      return result;
    } catch (err) {
      throw mapYooKassaError(err);
    }
  }

  async createRefundWithReceipt({
    paymentId,
    amount,
    currency = 'RUB',
    description,
    receiptItems,
    customerEmail,
  }) {
    if (!this.shopId || !this.secretKey) {
      throw new AppError(RUSSIAN_ERRORS.not_configured, 500, 'YOOKASSA_NOT_CONFIGURED');
    }
    if (!Array.isArray(receiptItems)) {
      throw new AppError(RUSSIAN_ERRORS.validation_error, 400, 'YOOKASSA_VALIDATION_ERROR');
    }
    if (!Number.isFinite(amount)) {
      throw new AppError(RUSSIAN_ERRORS.validation_error, 400, 'YOOKASSA_VALIDATION_ERROR');
    }

    const idempotenceKey = uuidv4();
    const payload = {
      amount: { value: amount.toFixed(2), currency },
    };

    if (description) {
      payload.description = description;
    }

    payload.receipt = {
      customer: { email: customerEmail || undefined },
      items: receiptItems.map(item => ({
        description: item.description,
        quantity: String(item.quantity),
        amount: {
          value: Number(item.amount).toFixed(2),
          currency: currency,
        },
        vat_code: item.vat_code ?? 1,
      })),
      type: 'refund',
    };

    try {
      const result = await this.client.createRefund(paymentId, payload, idempotenceKey);
      return result;
    } catch (err) {
      throw mapYooKassaError(err);
    }
  }

  async getRefund(refundId) {
    if (!this.shopId || !this.secretKey) {
      throw new AppError(RUSSIAN_ERRORS.not_configured, 500, 'YOOKASSA_NOT_CONFIGURED');
    }

    try {
      const result = await this.client.getRefund(refundId);
      return result;
    } catch (err) {
      throw mapYooKassaError(err);
    }
  }

  async createReceipt({ paymentId, items, email, phone, type = 'payment' }) {
    if (!this.shopId || !this.secretKey) {
      throw new AppError(RUSSIAN_ERRORS.not_configured, 500, 'YOOKASSA_NOT_CONFIGURED');
    }

    if (!paymentId) {
      throw new AppError(
        'Не указан payment_id для чека',
        400,
        'YOOKASSA_VALIDATION_ERROR'
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new AppError(
        'Список позиций чека пуст. Укажите хотя бы одну позицию.',
        400,
        'YOOKASSA_VALIDATION_ERROR'
      );
    }

    const total = items.reduce((sum, item) => {
      const amount = Number(item.amount);
      const quantity = Number(item.quantity);
      if (!Number.isFinite(amount) || !Number.isFinite(quantity)) {
        throw new AppError(RUSSIAN_ERRORS.receipt_error, 400, 'YOOKASSA_RECEIPT_ERROR');
      }
      return sum + amount * quantity;
    }, 0);

    const payload = {
      type: type === 'refund' ? 'refund' : 'payment',
      payment_id: paymentId,
      customer: {},
      items: items.map(item => ({
        description: item.description,
        quantity: String(item.quantity),
        amount: {
          value: Number(item.amount).toFixed(2),
          currency: 'RUB',
        },
        vat_code: item.vat_code ?? 1,
        payment_mode: item.payment_mode || 'full_prepayment',
        payment_subject: item.payment_subject || 'commodity',
      })),
      settlements: [
        {
          type: 'cashless',
          amount: {
            value: total.toFixed(2),
            currency: 'RUB',
          },
        },
      ],
    };

    if (email) payload.customer.email = email;
    if (phone) payload.customer.phone = phone;

    try {
      const result = await this.rawApiCall('POST', '/receipts', payload);
      this.log('info', 'Receipt created', { paymentId, type, status: result?.status });
      return result;
    } catch (err) {
      if (err instanceof AppError && err.code?.startsWith('YOOKASSA_')) throw err;
      throw mapYooKassaError(err);
    }
  }

  async createSubscriptionPayment({
    amount,
    currency = 'RUB',
    description,
    orderId,
    returnUrl,
    customerEmail,
    receipt,
  }) {
    if (!this.shopId || !this.secretKey) {
      throw new AppError(RUSSIAN_ERRORS.not_configured, 500, 'YOOKASSA_NOT_CONFIGURED');
    }

    return this.createPayment({
      amount,
      currency,
      description: description || `Подписка #${orderId}`,
      orderId,
      returnUrl,
      customerEmail,
      receipt,
      capture: true,
      savePaymentMethod: true,
    });
  }

  async makeRecurrentPayment({
    paymentMethodId,
    amount,
    currency = 'RUB',
    description,
    orderId,
    customerEmail,
    receipt,
  }) {
    if (!this.shopId || !this.secretKey) {
      throw new AppError(RUSSIAN_ERRORS.not_configured, 500, 'YOOKASSA_NOT_CONFIGURED');
    }

    if (!paymentMethodId) {
      throw new AppError(
        'Не указан payment_method_id для рекуррентного платежа',
        400,
        'YOOKASSA_VALIDATION_ERROR'
      );
    }

    if (!Number.isFinite(amount)) {
      throw new AppError(RUSSIAN_ERRORS.validation_error, 400, 'YOOKASSA_VALIDATION_ERROR');
    }

    const idempotenceKey = uuidv4();
    const payload = {
      amount: { value: amount.toFixed(2), currency },
      capture: true,
      payment_method_id: paymentMethodId,
      description: description || `Автоплатёж #${orderId}`,
      metadata: { orderId: String(orderId), recurring: 'true' },
    };

    if (customerEmail || receipt) {
      payload.receipt = {
        customer: { email: customerEmail || undefined },
        items: receipt?.items || [
          {
            description: description || `Автоплатёж #${orderId}`,
            quantity: '1',
            amount: { value: amount.toFixed(2), currency },
            vat_code: 1,
          },
        ],
      };
    }

    try {
      const result = await this.client.createPayment(payload, idempotenceKey);
      this.log('info', 'Recurrent payment created', { orderId, paymentMethodId });
      return result;
    } catch (err) {
      throw mapYooKassaError(err);
    }
  }

  async getBalance() {
    if (!this.shopId || !this.secretKey) {
      throw new AppError(RUSSIAN_ERRORS.not_configured, 500, 'YOOKASSA_NOT_CONFIGURED');
    }

    try {
      const response = await this.rawApiCall('GET', '/me');
      const { data } = response;

      const accounts = Array.isArray(data?.accounts) ? data.accounts : [];
      const account = accounts.find(a => a.currency === 'RUB') || accounts[0] || {};

      return {
        accountId: data?.account_id || null,
        status: data?.status || 'unknown',
        test: data?.test || false,
        fiscalization: data?.fiscalization || null,
        balance: account.balance ? {
          value: Number(account.balance.value),
          currency: account.balance.currency || 'RUB',
        } : null,
        payoutBalance: account.payout_balance ? {
          value: Number(account.payout_balance.value),
          currency: account.payout_balance.currency || 'RUB',
        } : null,
        allAccounts: accounts,
      };
    } catch (err) {
      if (err instanceof AppError && err.code?.startsWith('YOOKASSA_')) throw err;
      throw mapYooKassaError(err);
    }
  }
}

function getProvider(credentials = {}) {
  return new YooKassaProvider(credentials);
}

module.exports = {
  YooKassaProvider,
  AppError,

  createPayment: (opts) => getProvider().createPayment(opts),
  getPayment: (paymentId) => getProvider().getPayment(paymentId),
  capturePayment: (paymentId, amount) => getProvider().capturePayment(paymentId, amount),
  cancelPayment: (paymentId) => getProvider().cancelPayment(paymentId),

  createRefund: (opts) => getProvider().createRefund(opts),
  getRefund: (refundId) => getProvider().getRefund(refundId),

  createReceipt: (opts) => getProvider().createReceipt(opts),
  createRefundWithReceipt: (opts) => getProvider().createRefundWithReceipt(opts),

  createSubscriptionPayment: (opts) => getProvider().createSubscriptionPayment(opts),
  makeRecurrentPayment: (opts) => getProvider().makeRecurrentPayment(opts),

  verifyWebhookSignature: (body, signature) => getProvider().verifyWebhookSignature(body, signature),
  getBalance: () => getProvider().getBalance(),

  getProvider,
};
