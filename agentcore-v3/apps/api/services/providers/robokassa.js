const axios = require('axios');
const crypto = require('crypto');
const { IntegrationProvider } = require('../IntegrationProvider');

const ROBOKASSA_API_BASE = 'https://auth.robokassa.ru/Merchant/Indexjson.aspx';
const ROBOKASSA_RECURRING_BASE = 'https://auth.robokassa.ru/Merchant/Recurring';

/**
 * @file  apps/api/services/providers/robokassa.js
 * @agent #52 — Robokassa интеграционный провайдер
 *
 * Поддерживаемые операции:
 *   - Создание одноразового платежа (ссылка на оплату)
 *   - Создание регулярного (рекуррентного) платежа
 *   - Проверка статуса платежа по InvoiceID
 *   - Отмена регулярного платежа
 *
 * Документация: https://docs.robokassa.ru/
 */

class RobokassaProvider extends IntegrationProvider {
  constructor(config = {}) {
    super({
      name: 'robokassa',
      displayName: 'Robokassa',
      agentId: 52,
      version: '1.0.0',
      ...config,
    });
    this.merchantLogin = null;
    this.password1 = null;
    this.password2 = null;
    this.isTest = false;
    this.algorithm = 'sha256';
    this.taxCode = 'osn';
  }

  /**
   * Инициализация провайдера.
   * @param {object} credentials
   * @param {string} credentials.merchantLogin — логин магазина в Robokassa
   * @param {string} credentials.password1 — пароль #1 (для создания платежа)
   * @param {string} credentials.password2 — пароль #2 (для проверки и уведомлений)
   * @param {boolean} [credentials.isTest=false] — тестовый режим
   * @param {string} [credentials.algorithm='sha256'] — алгоритм подписи: md5, sha1, sha256
   * @returns {Promise<boolean>}
   */
  async initialize(credentials) {
    if (!credentials || typeof credentials !== 'object') {
      throw new Error('[Robokassa] credentials должен быть объектом вида { merchantLogin, password1, password2 }');
    }
    if (!credentials.merchantLogin || typeof credentials.merchantLogin !== 'string') {
      throw new Error('[Robokassa] Отсутствует обязательный параметр merchantLogin');
    }
    if (!credentials.password1 || typeof credentials.password1 !== 'string') {
      throw new Error('[Robokassa] Отсутствует обязательный параметр password1');
    }
    if (!credentials.password2 || typeof credentials.password2 !== 'string') {
      throw new Error('[Robokassa] Отсутствует обязательный параметр password2');
    }
    if (credentials.algorithm && !['md5', 'sha1', 'sha256'].includes(credentials.algorithm)) {
      throw new Error('[Robokassa] Алгоритм подписи должен быть одним из: md5, sha1, sha256');
    }

    this.merchantLogin = credentials.merchantLogin;
    this.password1 = credentials.password1;
    this.password2 = credentials.password2;
    this.isTest = credentials.isTest || false;
    this.algorithm = credentials.algorithm || 'sha256';

    this.initialized = true;
    this.log('info', 'Robokassa инициализирован', { merchantLogin: this.merchantLogin, isTest: this.isTest });
    return true;
  }

  _sign(value) {
    if (this.algorithm === 'md5') {
      return crypto.createHash('md5').update(value).digest('hex');
    }
    if (this.algorithm === 'sha1') {
      return crypto.createHash('sha1').update(value).digest('hex');
    }
    return crypto.createHash('sha256').update(value).digest('hex');
  }

  _signPaymentCreate(invoiceId, outSum, description, receiptJson) {
    const parts = [this.merchantLogin, outSum, invoiceId, description, this.password1];
    if (receiptJson) {
      parts.push(`Receipt=${receiptJson}`);
    }
    return this._sign(parts.join(':'));
  }

  _signPaymentCheck(invoiceId, outSum, totalPayment) {
    const signatureValue = `${outSum}:${invoiceId}:${totalPayment}:${this.password2}`;
    return this._sign(signatureValue);
  }

  _signRecurring(invoiceId, outSum, recurringAmount, nextPaymentDate) {
    const value = `${this.merchantLogin}:${outSum}:${invoiceId}:${recurringAmount}:${nextPaymentDate}:${this.password1}`;
    return this._sign(value);
  }

  /**
   * Создаёт одноразовый счёт на оплату (ссылка для редиректа покупателя).
   * @param {object} options
   * @param {number} options.invoiceId — уникальный номер счёта (целое число)
   * @param {number} options.outSum — сумма платежа
   * @param {string} options.description — описание покупки
   * @param {string} [options.email] — email покупателя
   * @param {string} [options.culture='ru'] — язык интерфейса
   * @param {string} [options.expirationDate] — дата окончания в формате ISO
   * @param {Array<{name: string, quantity: number, sum: number, tax: string}>} [options.receiptItems] — чек
   * @returns {Promise<{invoiceId: number, paymentUrl: string, signatureValue: string}>}
   */
  async createInvoice({
    invoiceId,
    outSum,
    description,
    email,
    culture = 'ru',
    expirationDate,
    receiptItems,
  } = {}) {
    if (!invoiceId || typeof invoiceId !== 'number') {
      throw new Error('[Robokassa] Параметр invoiceId обязателен и должен быть числом');
    }
    if (!outSum || typeof outSum !== 'number' || outSum <= 0) {
      throw new Error('[Robokassa] Параметр outSum обязателен и должен быть положительным числом');
    }
    if (!description || typeof description !== 'string') {
      throw new Error('[Robokassa] Параметр description обязателен и должен быть строкой');
    }

    let receiptJson = null;

    if (receiptItems && Array.isArray(receiptItems) && receiptItems.length > 0) {
      const items = receiptItems.map(item => {
        if (!item.name || !item.quantity || !item.sum) {
          throw new Error('[Robokassa] Каждый элемент чека должен содержать name, quantity и sum');
        }
        return {
          name: item.name.substring(0, 128),
          quantity: item.quantity,
          sum: item.sum,
          tax: item.tax || this.taxCode,
          payment_method: item.paymentMethod || 'full_payment',
          payment_object: item.paymentObject || 'commodity',
        };
      });
      receiptJson = JSON.stringify({ items });
    }

    const outSumFormatted = outSum.toFixed(2);
    const signatureValue = this._signPaymentCreate(
      invoiceId,
      outSumFormatted,
      description,
      receiptJson
    );

    const params = new URLSearchParams({
      MerchantLogin: this.merchantLogin,
      OutSum: outSumFormatted,
      InvoiceID: String(invoiceId),
      Description: description.substring(0, 100),
      SignatureValue: signatureValue,
      Culture: culture,
      Encoding: 'utf-8',
    });

    if (email) params.append('Email', email);
    if (expirationDate) params.append('ExpirationDate', new Date(expirationDate).toISOString());
    if (this.isTest) params.append('IsTest', '1');
    if (receiptJson) params.append('Receipt', receiptJson);

    const paymentUrl = `${ROBOKASSA_API_BASE}?${params.toString()}`;

    this.log('info', 'Счёт создан', { invoiceId, outSum: outSumFormatted });

    return {
      invoiceId,
      paymentUrl,
      signatureValue,
    };
  }

  /**
   * Проверяет статус платежа через OPState.
   * @param {object} options
   * @param {number} options.invoiceId — номер счёта
   * @param {number} options.outSum — сумма
   * @returns {Promise<{invoiceId: number, paid: boolean, totalPayment: number, code: number}>}
   */
  async checkPaymentStatus({ invoiceId, outSum } = {}) {
    if (!invoiceId) {
      throw new Error('[Robokassa] Параметр invoiceId обязателен для проверки статуса');
    }
    if (outSum === undefined || outSum === null) {
      throw new Error('[Robokassa] Параметр outSum обязателен для проверки статуса');
    }

    const totalPayment = 0;
    const outSumFormatted = Number(outSum).toFixed(2);
    const signatureValue = this._signPaymentCheck(invoiceId, outSumFormatted, totalPayment);

    const params = new URLSearchParams({
      MerchantLogin: this.merchantLogin,
      InvoiceID: String(invoiceId),
      OutSum: outSumFormatted,
      SignatureValue: signatureValue,
    });

    if (this.isTest) params.append('IsTest', '1');

    const result = await this.execute(() =>
      axios.post('https://auth.robokassa.ru/Merchant/WebService/Service.asmx/OpState', params.toString(), {
        timeout: 15000,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'text/xml',
          'User-Agent': 'AgentCore/3.0 (Robokassa Provider #52)',
        },
      })
    );

    return {
      invoiceId: result.State?.InvoiceID || invoiceId,
      paid: result.State?.Code === 100,
      totalPayment: parseFloat(result.State?.TotalPayment || '0'),
      code: result.State?.Code || -1,
    };
  }

  /**
   * Создаёт регулярный (рекуррентный) платёж.
   * @param {object} options
   * @param {number} options.invoiceId — уникальный номер счёта
   * @param {number} options.outSum — сумма первого платежа
   * @param {number} options.recurringAmount — сумма регулярных списаний
   * @param {string} options.nextPaymentDate — дата следующего платежа (YYYY-MM-DD)
   * @param {string} options.description — описание
   * @param {string} [options.email] — email плательщика
   * @returns {Promise<{invoiceId: number, paymentUrl: string}>}
   */
  async createRecurringPayment({
    invoiceId,
    outSum,
    recurringAmount,
    nextPaymentDate,
    description,
    email,
  } = {}) {
    if (!invoiceId || typeof invoiceId !== 'number') {
      throw new Error('[Robokassa] Параметр invoiceId обязателен и должен быть числом');
    }
    if (!outSum || typeof outSum !== 'number' || outSum <= 0) {
      throw new Error('[Robokassa] Параметр outSum обязателен и должен быть положительным числом');
    }
    if (!recurringAmount || typeof recurringAmount !== 'number' || recurringAmount <= 0) {
      throw new Error('[Robokassa] Параметр recurringAmount обязателен и должен быть положительным числом');
    }
    if (!nextPaymentDate || !/^\d{4}-\d{2}-\d{2}$/.test(nextPaymentDate)) {
      throw new Error('[Robokassa] Параметр nextPaymentDate обязателен в формате YYYY-MM-DD');
    }
    if (!description || typeof description !== 'string') {
      throw new Error('[Robokassa] Параметр description обязателен и должен быть строкой');
    }

    const outSumFormatted = outSum.toFixed(2);
    const recurringAmountFormatted = recurringAmount.toFixed(2);
    const signatureValue = this._signRecurring(
      invoiceId,
      outSumFormatted,
      recurringAmountFormatted,
      nextPaymentDate
    );

    const params = new URLSearchParams({
      MerchantLogin: this.merchantLogin,
      OutSum: outSumFormatted,
      InvoiceID: String(invoiceId),
      Description: description.substring(0, 100),
      Recurring: 'true',
      RecurringAmount: recurringAmountFormatted,
      NextPaymentDate: nextPaymentDate,
      SignatureValue: signatureValue,
    });

    if (email) params.append('Email', email);
    if (this.isTest) params.append('IsTest', '1');

    const paymentUrl = `${ROBOKASSA_RECURRING_BASE}?${params.toString()}`;

    this.log('info', 'Регулярный платёж создан', {
      invoiceId,
      outSum: outSumFormatted,
      recurringAmount: recurringAmountFormatted,
      nextPaymentDate,
    });

    return {
      invoiceId,
      paymentUrl,
    };
  }

  /**
   * Отменяет регулярный платёж.
   * @param {number} invoiceId — ID регулярного платежа
   * @returns {Promise<{success: boolean, invoiceId: number}>}
   */
  async cancelRecurringPayment(invoiceId) {
    if (!invoiceId) {
      throw new Error('[Robokassa] Параметр invoiceId обязателен для отмены регулярного платежа');
    }

    const signatureValue = this._sign(`${this.merchantLogin}:${invoiceId}:${this.password1}`);

    const params = new URLSearchParams({
      MerchantLogin: this.merchantLogin,
      InvoiceID: String(invoiceId),
      SignatureValue: signatureValue,
    });

    const result = await this.execute(() =>
      axios.post(
        'https://auth.robokassa.ru/Merchant/WebService/Service.asmx/CancelRecurring',
        params.toString(),
        {
          timeout: 15000,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'text/xml',
            'User-Agent': 'AgentCore/3.0 (Robokassa Provider #52)',
          },
        }
      )
    );

    this.log('info', 'Регулярный платёж отменён', { invoiceId });

    return {
      success: true,
      invoiceId,
    };
  }

  async healthCheck() {
    try {
      const start = Date.now();
      const params = new URLSearchParams({
        MerchantLogin: this.merchantLogin,
        InvoiceID: '0',
        SignatureValue: this._sign(`${this.merchantLogin}:0:${this.password2}`),
      });
      await this.execute(() =>
        axios.post(
          'https://auth.robokassa.ru/Merchant/WebService/Service.asmx/OpState',
          params.toString(),
          { timeout: 10000, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        )
      );
      return { ok: true, latency: Date.now() - start };
    } catch (err) {
      if (err.response?.status === 200) {
        return { ok: true, latency: 0 };
      }
      this.log('error', 'Health-check не пройден', { error: err.message });
      return { ok: false, error: err.message };
    }
  }
}

function createRobokassaProvider(config) {
  return new RobokassaProvider(config);
}

module.exports = { RobokassaProvider, createRobokassaProvider };
