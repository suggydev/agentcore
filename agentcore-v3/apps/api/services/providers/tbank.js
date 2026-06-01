const axios = require('axios');
const { IntegrationProvider } = require('../IntegrationProvider');

const TBANK_API_BASE = 'https://business.tbank.ru/openapi/api/v1';

/**
 * @file  apps/api/services/providers/tbank.js
 * @agent #53 — T-Bank (Т-Банк) интеграционный провайдер
 *
 * Поддерживаемые операции:
 *   - Создание платежа / счёта (payment-order)
 *   - Получение списка счетов компании
 *   - Получение информации о компании
 *   - Получение выписки по счёту
 *   - Создание платежа контрагенту
 *
 * Документация: https://business.tbank.ru/openapi/docs/
 */

class TbankProvider extends IntegrationProvider {
  constructor(config = {}) {
    super({
      name: 'tbank',
      displayName: 'Т-Банк',
      agentId: 53,
      version: '1.0.0',
      ...config,
    });
    this.apiKey = null;
    this.accountNumber = null;
    this.defaultCompanyInn = null;
  }

  /**
   * Инициализация с API-ключом Т-Банк Бизнес.
   * @param {object} credentials
   * @param {string} credentials.apiKey — API-ключ из личного кабинета Т-Банк Бизнес
   * @param {string} [credentials.accountNumber] — номер расчётного счёта по умолчанию
   * @param {string} [credentials.defaultCompanyInn] — ИНН компании по умолчанию
   * @returns {Promise<boolean>}
   */
  async initialize(credentials) {
    if (!credentials || typeof credentials !== 'object') {
      throw new Error('[Т-Банк] credentials должен быть объектом вида { apiKey }');
    }
    if (!credentials.apiKey || typeof credentials.apiKey !== 'string' || credentials.apiKey.length < 10) {
      throw new Error('[Т-Банк] Отсутствует или некорректен обязательный параметр apiKey');
    }

    this.apiKey = credentials.apiKey;
    this.accountNumber = credentials.accountNumber || null;
    this.defaultCompanyInn = credentials.defaultCompanyInn || null;

    this.initialized = true;
    this.log('info', 'Т-Банк инициализирован');
    return true;
  }

  async _request(method, path, data = null, params = {}) {
    return this.execute(async () => {
      const config = {
        method,
        url: `${TBANK_API_BASE}${path}`,
        timeout: 30000,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Accept': 'application/json',
          'User-Agent': 'AgentCore/3.0 (T-Bank Provider #53)',
        },
      };
      if (params && Object.keys(params).length > 0) {
        config.params = params;
      }
      if (data) {
        config.data = data;
        config.headers['Content-Type'] = 'application/json';
      }
      return axios(config);
    });
  }

  /**
   * Создаёт платёжное поручение (исходящий платёж).
   * @param {object} options
   * @param {string} options.debtorAccount — счёт списания (расчётный счёт компании)
   * @param {string} options.creditorAccount — счёт зачисления
   * @param {string} options.creditorBankBic — БИК банка получателя
   * @param {string} options.creditorName — наименование получателя
   * @param {string} options.creditorInn — ИНН получателя
   * @param {string} options.creditorKpp — КПП получателя
   * @param {number} options.amount — сумма в рублях
   * @param {string} options.purpose — назначение платежа
   * @param {string} [options.priority='5'] — очерёдность платежа (1-5)
   * @param {string} [options.paymentType='электронно'] — вид платежа
   * @returns {Promise<{paymentId: string, status: string, amount: number}>}
   */
  async createPayment({
    debtorAccount,
    creditorAccount,
    creditorBankBic,
    creditorName,
    creditorInn,
    creditorKpp,
    amount,
    purpose,
    priority = '5',
    paymentType = 'электронно',
  } = {}) {
    if (!debtorAccount) throw new Error('[Т-Банк] Параметр debtorAccount обязателен');
    if (!creditorAccount) throw new Error('[Т-Банк] Параметр creditorAccount обязателен');
    if (!creditorBankBic || !/^\d{9}$/.test(creditorBankBic)) {
      throw new Error('[Т-Банк] Параметр creditorBankBic обязателен и должен быть 9-значным БИК');
    }
    if (!creditorName) throw new Error('[Т-Банк] Параметр creditorName обязателен');
    if (!creditorInn) throw new Error('[Т-Банк] Параметр creditorInn обязателен');
    if (!creditorKpp) throw new Error('[Т-Банк] Параметр creditorKpp обязателен');
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      throw new Error('[Т-Банк] Параметр amount обязателен и должен быть положительным числом');
    }
    if (!purpose) throw new Error('[Т-Банк] Параметр purpose обязателен — назначение платежа');

    const payload = {
      debtorAccount: this.accountNumber || debtorAccount,
      creditorAccount,
      creditorBankBic,
      creditorName,
      creditorInn,
      creditorKpp,
      amount,
      purpose,
      priority,
      paymentType,
    };

    const result = await this._request('POST', '/payment-order', payload);

    this.log('info', 'Платёж создан', {
      paymentId: result.paymentId,
      amount: amount.toFixed(2),
    });

    return {
      paymentId: result.paymentId,
      status: result.status || 'created',
      amount,
    };
  }

  /**
   * Получает список счетов компании.
   * @returns {Promise<{accounts: Array<{accountNumber: string, bankBic: string, currency: string, balance: number}>, total: number}>}
   */
  async getAccounts() {
    const result = await this._request('GET', '/accounts');

    return {
      accounts: (result.accounts || result || []).map(acc => ({
        accountNumber: acc.accountNumber || acc.number || '',
        bankBic: acc.bankBic || acc.bic || '',
        bankName: acc.bankName || '',
        currency: acc.currency || 'RUB',
        balance: acc.balance || 0,
        blocked: acc.blocked || 0,
        status: acc.status || 'active',
        name: acc.name || '',
        inn: acc.inn || this.defaultCompanyInn || '',
      })),
      total: (result.accounts || result || []).length,
    };
  }

  /**
   * Получает информацию о компании по ИНН.
   * @param {string} [inn] — ИНН организации (если не указано, используется defaultCompanyInn)
   * @returns {Promise<{inn: string, name: string, kpp: string, legalAddress: string, okpo: string}>}
   */
  async getCompanyInfo(inn) {
    const targetInn = inn || this.defaultCompanyInn;
    if (!targetInn) {
      throw new Error('[Т-Банк] Не указан ИНН. Передайте inn или установите defaultCompanyInn при инициализации');
    }

    const result = await this._request('GET', `/company/${targetInn}`);

    return {
      inn: result.inn || targetInn,
      name: result.name || result.fullName || '',
      shortName: result.shortName || '',
      kpp: result.kpp || '',
      ogrn: result.ogrn || '',
      okpo: result.okpo || '',
      legalAddress: result.legalAddress || result.address || '',
      actualAddress: result.actualAddress || '',
      directorName: result.directorName || result.ceoName || '',
      phone: result.phone || '',
      email: result.email || '',
    };
  }

  /**
   * Получает выписку по счёту за указанный период.
   * @param {object} options
   * @param {string} options.accountNumber — номер счёта
   * @param {string} options.dateFrom — начальная дата (YYYY-MM-DD)
   * @param {string} options.dateTo — конечная дата (YYYY-MM-DD)
   * @returns {Promise<{transactions: Array<object>, count: number}>}
   */
  async getStatement({ accountNumber, dateFrom, dateTo } = {}) {
    const account = accountNumber || this.accountNumber;
    if (!account) {
      throw new Error('[Т-Банк] Параметр accountNumber обязателен (или укажите при инициализации)');
    }
    if (!dateFrom || !/^\d{4}-\d{2}-\d{2}$/.test(dateFrom)) {
      throw new Error('[Т-Банк] Параметр dateFrom обязателен в формате YYYY-MM-DD');
    }
    if (!dateTo || !/^\d{4}-\d{2}-\d{2}$/.test(dateTo)) {
      throw new Error('[Т-Банк] Параметр dateTo обязателен в формате YYYY-MM-DD');
    }

    const result = await this._request('GET', `/statement/${account}`, null, {
      from: dateFrom,
      to: dateTo,
    });

    return {
      transactions: (result.transactions || result.statement || []).map(tx => ({
        id: tx.id || tx.docNumber || '',
        date: tx.date || tx.operationDate || '',
        description: tx.description || tx.purpose || '',
        debit: tx.debit || tx.income || 0,
        credit: tx.credit || tx.outcome || 0,
        balance: tx.balance || 0,
        counterpartyName: tx.counterpartyName || tx.recipient || '',
        counterpartyInn: tx.counterpartyInn || '',
        counterpartyAccount: tx.counterpartyAccount || '',
        documentNumber: tx.documentNumber || tx.docNumber || '',
      })),
      count: (result.transactions || result.statement || []).length,
    };
  }

  async healthCheck() {
    try {
      const start = Date.now();
      await this._request('GET', '/ping');
      return { ok: true, latency: Date.now() - start };
    } catch (err) {
      this.log('error', 'Health-check не пройден', { error: err.message });
      return { ok: false, error: err.message };
    }
  }
}

function createTbankProvider(config) {
  return new TbankProvider(config);
}

module.exports = { TbankProvider, createTbankProvider };
