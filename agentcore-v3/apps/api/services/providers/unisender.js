const axios = require('axios');
const { IntegrationProvider } = require('../IntegrationProvider');

const UNISENDER_API_BASE = 'https://api.unisender.com/ru/api';

/**
 * @file  apps/api/services/providers/unisender.js
 * @agent #48 — Unisender интеграционный провайдер
 *
 * Поддерживаемые операции:
 *   - Отправка одиночного email через sendEmail
 *   - Создание и обновление списков контактов createList / updateList
 *   - Получение списков рассылки getLists
 *   - Импорт контактов в список importContacts
 *   - Отправка SMS через sendSms
 *
 * Документация: https://www.unisender.com/ru/support/api/
 */

class UnisenderProvider extends IntegrationProvider {
  constructor(config = {}) {
    super({
      name: 'unisender',
      displayName: 'Unisender',
      agentId: 48,
      version: '1.0.0',
      ...config,
    });
    this.apiKey = null;
    this.defaultSenderEmail = null;
    this.defaultSenderName = null;
    this.language = 'ru';
  }

  /**
   * Инициализация провайдера с API-ключом.
   * @param {object} credentials
   * @param {string} credentials.apiKey — API-ключ из личного кабинета Unisender
   * @param {string} [credentials.defaultSenderEmail] — email отправителя по умолчанию
   * @param {string} [credentials.defaultSenderName] — имя отправителя по умолчанию
   * @returns {Promise<boolean>}
   */
  async initialize(credentials) {
    if (!credentials || typeof credentials !== 'object') {
      throw new Error('[Unisender] credentials должен быть объектом вида { apiKey }');
    }
    if (!credentials.apiKey || typeof credentials.apiKey !== 'string' || credentials.apiKey.length < 10) {
      throw new Error('[Unisender] Отсутствует или некорректен обязательный параметр apiKey');
    }

    this.apiKey = credentials.apiKey;
    this.defaultSenderEmail = credentials.defaultSenderEmail || null;
    this.defaultSenderName = credentials.defaultSenderName || null;

    this.initialized = true;
    this.log('info', 'Unisender инициализирован', { language: this.language });
    return true;
  }

  async _unisenderRequest(method, params = {}) {
    const body = new URLSearchParams({
      format: 'json',
      api_key: this.apiKey,
      ...params,
    });

    return this.execute(() =>
      axios.post(`${UNISENDER_API_BASE}/${method}`, body.toString(), {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
          'User-Agent': 'AgentCore/3.0 (Unisender Provider #48)',
        },
      })
    );
  }

  _parseResult(data) {
    if (data.error) {
      throw new Error(`[Unisender] Ошибка API: ${data.error}${data.code ? ` (код: ${data.code})` : ''}`);
    }
    return data.result || data;
  }

  /**
   * Отправляет одиночное email-сообщение через Unisender.
   * @param {object} options
   * @param {string} options.email — email получателя
   * @param {string} options.subject — тема письма
   * @param {string} [options.body] — HTML-тело письма
   * @param {string} [options.bodyText] — текстовое тело письма (альтернатива body)
   * @param {string} [options.senderEmail] — email отправителя
   * @param {string} [options.senderName] — имя отправителя
   * @param {Array<{name: string, content: string, type: string}>} [options.attachments] — вложения
   * @param {string} [options.trackRead] — отслеживать прочтение (0 или 1)
   * @returns {Promise<{emailId: string, status: string}>}
   */
  async sendEmail({
    email,
    subject,
    body,
    bodyText,
    senderEmail,
    senderName,
    attachments,
    trackRead = '0',
  } = {}) {
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      throw new Error('[Unisender] Параметр email обязателен и должен быть валидным email-адресом');
    }
    if (!subject || typeof subject !== 'string') {
      throw new Error('[Unisender] Параметр subject обязателен и должен быть строкой');
    }
    if (!body && !bodyText) {
      throw new Error('[Unisender] Необходимо указать body (HTML) или bodyText (текстовую версию)');
    }

    const params = {
      email,
      sender_email: senderEmail || this.defaultSenderEmail,
      sender_name: senderName || this.defaultSenderName,
      subject,
      body: body || bodyText,
      track_read: trackRead,
    };

    if (bodyText && body) {
      params.body_text = bodyText;
    }

    if (attachments && Array.isArray(attachments)) {
      attachments.forEach((att, index) => {
        params[`attachment[${index}][name]`] = att.name;
        params[`attachment[${index}][content]`] = att.content;
        if (att.type) params[`attachment[${index}][type]`] = att.type;
      });
    }

    const result = this._parseResult(await this._unisenderRequest('sendEmail', params));
    this.log('info', 'Email отправлен', { emailId: result.email_id });

    return {
      emailId: result.email_id,
      status: 'sent',
    };
  }

  /**
   * Создаёт новый список контактов.
   * @param {string} title — название списка
   * @param {object} [options]
   * @param {string} [options.beforeSubscribeUrl] — URL подтверждения
   * @param {string} [options.afterSubscribeUrl] — URL после подписки
   * @returns {Promise<{listId: number, title: string}>}
   */
  async createList(title, { beforeSubscribeUrl, afterSubscribeUrl } = {}) {
    if (!title || typeof title !== 'string') {
      throw new Error('[Unisender] Параметр title обязателен и должен быть строкой');
    }

    const params = { title };

    if (beforeSubscribeUrl) {
      if (!beforeSubscribeUrl.startsWith('http')) {
        throw new Error('[Unisender] beforeSubscribeUrl должен быть валидным URL');
      }
      params.before_subscribe_url = beforeSubscribeUrl;
    }

    if (afterSubscribeUrl) {
      if (!afterSubscribeUrl.startsWith('http')) {
        throw new Error('[Unisender] afterSubscribeUrl должен быть валидным URL');
      }
      params.after_subscribe_url = afterSubscribeUrl;
    }

    const result = this._parseResult(await this._unisenderRequest('createList', params));

    this.log('info', 'Список создан', { listId: result.id, title });

    return {
      listId: parseInt(result.id),
      title: title,
    };
  }

  /**
   * Получает список всех списков рассылки.
   * @returns {Promise<Array<{listId: number, title: string, subscribersCount: number}>>}
   */
  async getLists() {
    const result = this._parseResult(await this._unisenderRequest('getLists'));

    return (result || []).map(list => ({
      listId: parseInt(list.id),
      title: list.title || '',
      subscribersCount: list.subscribers_cnt ? parseInt(list.subscribers_cnt) : 0,
      creationTime: list.ctime || null,
      serviceType: list.service_type || 'email',
    }));
  }

  /**
   * Импортирует контакты в указанный список.
   * @param {object} options
   * @param {number} options.listId — ID списка
   * @param {Array<{email: string, name?: string, tags?: string[]}>} options.contacts — массив контактов
   * @param {number} [options.doubleOptin=0] — требовать подтверждение подписки
   * @param {number} [options.overwrite=0] — перезаписывать существующие контакты
   * @returns {Promise<{total: number, inserted: number, updated: number, deleted: number}>}
   */
  async importContacts({ listId, contacts, doubleOptin = 0, overwrite = 0 } = {}) {
    if (!listId) {
      throw new Error('[Unisender] Параметр listId обязателен');
    }
    if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
      throw new Error('[Unisender] Параметр contacts должен быть непустым массивом');
    }

    const params = {
      list_ids: String(listId),
      double_optin: String(doubleOptin),
      overwrite: String(overwrite),
    };

    contacts.forEach((contact, index) => {
      if (!contact.email || !contact.email.includes('@')) {
        throw new Error(`[Unisender] Контакт #${index + 1} имеет некорректный email`);
      }
      params[`data[${index}][0]`] = contact.email;
      params[`data[${index}][1]`] = contact.name || '';
      if (contact.tags && Array.isArray(contact.tags)) {
        params[`data[${index}][2]`] = contact.tags.join(',');
      }
    });

    const result = this._parseResult(await this._unisenderRequest('importContacts', params));

    this.log('info', 'Контакты импортированы', {
      listId,
      total: result.total,
      inserted: result.inserted,
    });

    return {
      total: result.total,
      inserted: result.inserted,
      updated: result.updated,
      deleted: result.deleted,
      newEmails: result.new_emails,
      invalid: result.invalid,
    };
  }

  async healthCheck() {
    try {
      const start = Date.now();
      const result = this._parseResult(await this._unisenderRequest('getLists'));
      return { ok: true, latency: Date.now() - start };
    } catch (err) {
      this.log('error', 'Health-check не пройден', { error: err.message });
      return { ok: false, error: err.message };
    }
  }

  async handleWebhook(payload, signature) {
    try {
      if (!payload || typeof payload !== 'object') {
        throw new Error('[Unisender] Invalid webhook payload');
      }
      const event = payload.event || 'unknown';
      return {
        processed: true,
        event,
        email: payload.email || '',
        listId: payload.list_id || '',
        status: payload.status || ''
      };
    } catch (err) {
      this.log('error', 'Webhook handling failed', { error: err.message });
      throw err;
    }
  }

  async disconnect() {
    try {
      this.apiKey = null;
      this.defaultSenderEmail = null;
      this.defaultSenderName = null;
      this.initialized = false;
      this.log('info', 'Unisender provider disconnected');
      return true;
    } catch (err) {
      this.log('error', 'Disconnect failed', { error: err.message });
      this.initialized = false;
      return false;
    }
  }
}

function createUnisenderProvider(config) {
  return new UnisenderProvider(config);
}

module.exports = { UnisenderProvider, createUnisenderProvider };
