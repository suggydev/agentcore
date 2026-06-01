/**
 * AmoCRM Integration Provider for AgentCore.
 * OAuth 2.0 connector to amoCRM — contacts, leads, webhooks.
 *
 * Agent #41 | API base: https://{domain}.amocrm.ru/api/v4
 * Rate limit: 7 req/sec enforced via token bucket.
 *
 * @file apps/api/services/providers/amocrm.js
 */

const axios = require('axios');
const crypto = require('crypto');
const { IntegrationProvider, AppError } = require('../IntegrationProvider');

const AMOCRM_RATE_LIMIT = 7;
const AMOCRM_TOKEN_ENDPOINT = '/oauth2/access_token';
const AMOCRM_AUTH_URL = 'https://www.amocrm.ru/oauth';
const ACCESS_TOKEN_TTL_MS = 23 * 60 * 60 * 1000;

class AmoCRMProvider extends IntegrationProvider {
  /**
   * @param {object} options
   * @param {string} options.workspaceId — workspace scoping the integration
   */
  constructor(options = {}) {
    super({
      name: 'amocrm',
      displayName: 'amoCRM',
      agentId: 41,
      version: '1.0.0',
    });
    this.domain = null;
    this.clientId = null;
    this.clientSecret = null;
    this.redirectUri = null;
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiresAt = 0;
    this.workspaceId = options.workspaceId || null;
    this._bucket = AMOCRM_RATE_LIMIT;
    this._lastRefill = Date.now();
    this._refillInterval = 1000;
  }

  /**
   * Получает базовый URL API amoCRM для текущего домена.
   * @returns {string}
   */
  get apiBase() {
    if (!this.domain) {
      throw new AppError('[amoCRM] Domain not configured', 400, 'MISSING_CONFIG');
    }
    return `https://${this.domain}.amocrm.ru`;
  }

  /**
   * Токены ограниченного доступа (token bucket) для соблюдения лимита 7 req/sec.
   * @returns {Promise<void>}
   */
  async _acquireToken() {
    const now = Date.now();
    const elapsed = now - this._lastRefill;
    const tokensToAdd = Math.floor(elapsed / this._refillInterval) * AMOCRM_RATE_LIMIT;
    if (tokensToAdd > 0) {
      this._bucket = Math.min(AMOCRM_RATE_LIMIT, this._bucket + tokensToAdd);
      this._lastRefill = now;
    }

    if (this._bucket > 0) {
      this._bucket--;
      return;
    }

    const waitMs = this._refillInterval - (elapsed % this._refillInterval);
    await this.sleep(waitMs);
    this._bucket = AMOCRM_RATE_LIMIT - 1;
    this._lastRefill = Date.now();
  }

  /**
   * Builds the authorization URL used to redirect the user for OAuth consent.
   * @returns {string}
   */
  getAuthorizationUrl() {
    if (!this.clientId || !this.redirectUri) {
      throw new AppError('[amoCRM] clientId and redirectUri are required for OAuth flow', 400, 'MISSING_CONFIG');
    }
    const state = crypto.randomBytes(16).toString('hex');
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      mode: 'post_message',
      state,
    });
    return `${AMOCRM_AUTH_URL}?${params.toString()}`;
  }

  /**
   * Инициализация провайдера. Если передан code — выполняет обмен на токены.
   * Если передан объект с сохранёнными токенами — восстанавливает сессию.
   *
   * @param {object} credentials
   * @param {string}  credentials.domain       — поддомен amoCRM (напр. "mycompany")
   * @param {string}  credentials.clientId     — client_id интеграции
   * @param {string}  credentials.clientSecret — client_secret интеграции
   * @param {string}  credentials.redirectUri  — redirect_uri для OAuth
   * @param {string}  [credentials.code]       — код авторизации (если step 2)
   * @param {string}  [credentials.accessToken]— для восстановления сессии
   * @param {string}  [credentials.refreshToken]
   * @param {number}  [credentials.expiresAt]
   * @returns {Promise<{authUrl?: string, authorized: boolean}>}
   */
  async initialize(credentials) {
    const { domain, clientId, clientSecret, redirectUri, code, accessToken, refreshToken, expiresAt } = credentials;

    if (!domain) {
      throw new AppError('[amoCRM] domain is required', 400, 'MISSING_CONFIG');
    }
    this.domain = domain;
    this.clientId = clientId || null;
    this.clientSecret = clientSecret || null;
    this.redirectUri = redirectUri || null;

    if (accessToken && refreshToken) {
      this.accessToken = accessToken;
      this.refreshToken = refreshToken;
      this.tokenExpiresAt = expiresAt || 0;
      this.initialized = true;
      this.client = axios.create({
        baseURL: this.apiBase,
        timeout: 15000,
        headers: { Authorization: `Bearer ${this.accessToken}` },
      });
      this.log('info', 'Session restored from saved tokens');

      if (Date.now() >= this.tokenExpiresAt) {
        await this._refreshAccessToken();
      }
      return { authorized: true };
    }

    if (!clientId || !clientSecret || !redirectUri) {
      throw new AppError('[amoCRM] clientId, clientSecret, redirectUri are required for OAuth init', 400, 'MISSING_CONFIG');
    }

    if (!code) {
      const authUrl = this.getAuthorizationUrl();
      this.log('info', 'OAuth flow started — redirect user to authorization URL');
      return { authUrl, authorized: false };
    }

    await this._exchangeCode(code);
    return { authorized: true };
  }

  /**
   * Обменивает временный authorization code на access_token + refresh_token.
   * @param {string} code
   * @returns {Promise<void>}
   */
  async _exchangeCode(code) {
    try {
      const response = await axios.post(`${this.apiBase}${AMOCRM_TOKEN_ENDPOINT}`, {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.redirectUri,
      }, { timeout: 15000 });

      this._persistTokens(response.data);
      this.initialized = true;
      this.client = axios.create({
        baseURL: this.apiBase,
        timeout: 15000,
        headers: { Authorization: `Bearer ${this.accessToken}` },
      });
      this.log('info', 'OAuth authorization code exchanged successfully');
    } catch (err) {
      const status = err.response?.status || 0;
      const detail = err.response?.data?.hint || err.response?.data?.title || err.message;
      throw new AppError(
        `[amoCRM] Token exchange failed (HTTP ${status}): ${detail}`,
        502,
        'OAUTH_EXCHANGE_FAILED'
      );
    }
  }

  /**
   * Обновляет access_token используя refresh_token.
   * @returns {Promise<void>}
   */
  async _refreshAccessToken() {
    if (!this.refreshToken) {
      throw new AppError('[amoCRM] No refresh token available — re-authorization required', 401, 'TOKEN_EXPIRED');
    }

    try {
      const response = await axios.post(`${this.apiBase}${AMOCRM_TOKEN_ENDPOINT}`, {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'refresh_token',
        refresh_token: this.refreshToken,
        redirect_uri: this.redirectUri,
      }, { timeout: 15000 });

      this._persistTokens(response.data);
      if (this.client) {
        this.client.defaults.headers.Authorization = `Bearer ${this.accessToken}`;
      }
      this.log('info', 'Access token refreshed');
    } catch (err) {
      this.initialized = false;
      const status = err.response?.status || 0;
      throw new AppError(
        `[amoCRM] Token refresh failed (HTTP ${status}): ${err.message}`,
        502,
        'TOKEN_REFRESH_FAILED'
      );
    }
  }

  /**
   * Сохраняет токены и вычисляет время истечения.
   * @param {object} data — ответ от /oauth2/access_token
   * @param {string} data.access_token
   * @param {string} data.refresh_token
   * @param {number} data.expires_in
   */
  _persistTokens(data) {
    this.accessToken = data.access_token;
    this.refreshToken = data.refresh_token;
    this.tokenExpiresAt = Date.now() + (data.expires_in || 86400) * 1000 - 60000;
  }

  /**
   * Возвращает сериализуемое состояние токенов для сохранения в БД.
   * @returns {{accessToken: string, refreshToken: string, expiresAt: number}}
   */
  getTokenState() {
    return {
      accessToken: this.accessToken,
      refreshToken: this.refreshToken,
      expiresAt: this.tokenExpiresAt,
    };
  }

  /**
   * Выполняет GET-запрос к API amoCRM с rate-limit и авто-обновлением токена.
   * @param {string} path   — относительный путь (напр. "/api/v4/contacts")
   * @param {object} [params] — query-параметры
   * @returns {Promise<any>}
   */
  async _get(path, params = {}) {
    await this._acquireToken();
    try {
      return await this.execute(() => this.client.get(path, { params }));
    } catch (err) {
      if (err.statusCode === 401 || (err.response && err.response.status === 401)) {
        await this._refreshAccessToken();
        await this._acquireToken();
        return this.execute(() => this.client.get(path, { params }));
      }
      throw err;
    }
  }

  /**
   * Выполняет POST-запрос к API amoCRM с rate-limit и авто-обновлением токена.
   * @param {string} path
   * @param {object} [body]
   * @returns {Promise<any>}
   */
  async _post(path, body = {}) {
    await this._acquireToken();
    try {
      return await this.execute(() => this.client.post(path, body));
    } catch (err) {
      if (err.statusCode === 401 || (err.response && err.response.status === 401)) {
        await this._refreshAccessToken();
        await this._acquireToken();
        return this.execute(() => this.client.post(path, body));
      }
      throw err;
    }
  }

  /**
   * Выполняет PATCH-запрос к API amoCRM.
   * @param {string} path
   * @param {object} [body]
   * @returns {Promise<any>}
   */
  async _patch(path, body = {}) {
    await this._acquireToken();
    try {
      return await this.execute(() => this.client.patch(path, body));
    } catch (err) {
      if (err.statusCode === 401 || (err.response && err.response.status === 401)) {
        await this._refreshAccessToken();
        await this._acquireToken();
        return this.execute(() => this.client.patch(path, body));
      }
      throw err;
    }
  }

  // ─── Public API ────────────────────────────────────────────────

  /**
   * Получает список контактов из amoCRM.
   * Поддерживает пагинацию — по умолчанию возвращает до 250 записей.
   *
   * @param {object} [options]
   * @param {number} [options.limit=250]  — количество контактов на странице (max 250)
   * @param {number} [options.page=1]     — номер страницы
   * @param {string} [options.query]      — поисковый запрос по имени/email
   * @returns {Promise<{contacts: Array, total: number, page: number}>}
   */
  async getContacts(options = {}) {
    if (!this.initialized) {
      throw new AppError('[amoCRM] Provider not initialized — call initialize() first', 400, 'NOT_INITIALIZED');
    }

    const limit = Math.min(options.limit || 250, 250);
    const page = options.page || 1;
    const params = {
      limit,
      page,
      with: 'leads',
    };

    if (options.query) {
      params.query = options.query;
    }

    const data = await this._get('/api/v4/contacts', params);

    const embedded = data._embedded || {};
    const rawContacts = embedded.contacts || [];

    const contacts = rawContacts.map(c => ({
      id: c.id,
      name: c.name || '',
      email: this._extractCustomField(c.custom_fields_values, 'EMAIL', 'WORK'),
      phone: this._extractCustomField(c.custom_fields_values, 'PHONE', 'WORK'),
      createdAt: c.created_at,
      updatedAt: c.updated_at,
    }));

    this.log('info', `Fetched ${contacts.length} contacts (page ${page})`);
    return {
      contacts,
      total: embedded.total_count || contacts.length,
      page,
    };
  }

  /**
   * Создаёт контакт в amoCRM.
   *
   * @param {object} contact
   * @param {string} contact.name  — имя контакта (обязательно)
   * @param {string} [contact.email]
   * @param {string} [contact.phone]
   * @returns {Promise<{id: number, name: string}>}
   */
  async createContact({ name, email, phone }) {
    if (!this.initialized) {
      throw new AppError('[amoCRM] Provider not initialized — call initialize() first', 400, 'NOT_INITIALIZED');
    }
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      throw new AppError('[amoCRM] Contact name is required', 400, 'VALIDATION_ERROR');
    }

    const customFieldsValues = [];
    if (email) {
      customFieldsValues.push({
        field_code: 'EMAIL',
        values: [{ value: email, enum_code: 'WORK' }],
      });
    }
    if (phone) {
      customFieldsValues.push({
        field_code: 'PHONE',
        values: [{ value: phone, enum_code: 'WORK' }],
      });
    }

    const body = [{ name: name.trim() }];
    if (customFieldsValues.length > 0) {
      body[0].custom_fields_values = customFieldsValues;
    }

    const data = await this._post('/api/v4/contacts', body);
    const embedded = data._embedded || {};
    const created = (embedded.contacts || [])[0] || {};

    this.log('info', `Contact created: ${created.id}`);
    return { id: created.id, name: created.name || name };
  }

  /**
   * Создаёт сделку (lead) в amoCRM.
   *
   * @param {object} lead
   * @param {string} lead.name        — название сделки (обязательно)
   * @param {number} [lead.price]     — бюджет сделки
   * @param {number} [lead.pipelineId] — ID воронки
   * @param {number} [lead.statusId]   — ID статуса внутри воронки
   * @param {number} [lead.contactId]  — ID контакта для привязки
   * @returns {Promise<{id: number, name: string, price?: number}>}
   */
  async createLead({ name, price, pipelineId, statusId, contactId }) {
    if (!this.initialized) {
      throw new AppError('[amoCRM] Provider not initialized — call initialize() first', 400, 'NOT_INITIALIZED');
    }
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      throw new AppError('[amoCRM] Lead name is required', 400, 'VALIDATION_ERROR');
    }

    const lead = { name: name.trim() };
    if (typeof price === 'number') lead.price = Math.round(price);
    if (typeof pipelineId === 'number') lead.pipeline_id = pipelineId;
    if (typeof statusId === 'number') lead.status_id = statusId;

    if (typeof contactId === 'number') {
      lead._embedded = {
        contacts: [{ id: contactId }],
      };
    }

    const body = [lead];
    const data = await this._post('/api/v4/leads', body);
    const embedded = data._embedded || {};
    const created = (embedded.leads || [])[0] || {};

    this.log('info', `Lead created: ${created.id}`);
    return {
      id: created.id,
      name: created.name || name,
      price: created.price,
    };
  }

  /**
   * Получает список сделок (leads) из amoCRM.
   *
   * @param {object} [options]
   * @param {number} [options.limit=250]
   * @param {number} [options.page=1]
   * @param {number} [options.pipelineId]
   * @param {number} [options.statusId]
   * @returns {Promise<{leads: Array, total: number, page: number}>}
   */
  async getLeads(options = {}) {
    if (!this.initialized) {
      throw new AppError('[amoCRM] Provider not initialized — call initialize() first', 400, 'NOT_INITIALIZED');
    }

    const limit = Math.min(options.limit || 250, 250);
    const page = options.page || 1;
    const params = { limit, page, with: 'contacts' };

    if (typeof options.pipelineId === 'number') {
      params['filter[pipeline_id]'] = options.pipelineId;
    }
    if (typeof options.statusId === 'number') {
      params['filter[status_id]'] = options.statusId;
    }

    const data = await this._get('/api/v4/leads', params);
    const embedded = data._embedded || {};
    const rawLeads = embedded.leads || [];

    const leads = rawLeads.map(l => ({
      id: l.id,
      name: l.name || '',
      price: l.price,
      statusId: l.status_id,
      pipelineId: l.pipeline_id,
      createdAt: l.created_at,
      updatedAt: l.updated_at,
    }));

    this.log('info', `Fetched ${leads.length} leads (page ${page})`);
    return { leads, total: embedded.total_count || leads.length, page };
  }

  /**
   * Обрабатывает входящий webhook от amoCRM.
   * Проверяет подпись и разбирает события (update/delete/add).
   *
   * @param {object} req — Express request object
   * @param {string} [secret] — секрет для HMAC-проверки подписи
   * @returns {Promise<{type: string, events: Array}>}
   */
  async webhookHandler(req, secret) {
    const body = req.body;

    if (!body || typeof body !== 'object') {
      throw new AppError('[amoCRM] Invalid webhook payload', 400, 'INVALID_PAYLOAD');
    }

    if (secret) {
      const signature = req.headers['x-amocrm-signature'];
      if (!signature) {
        throw new AppError('[amoCRM] Missing webhook signature header', 401, 'MISSING_SIGNATURE');
      }
      const computed = crypto.createHmac('sha256', secret).update(JSON.stringify(body)).digest('hex');
      if (signature !== computed) {
        throw new AppError('[amoCRM] Invalid webhook signature', 403, 'INVALID_SIGNATURE');
      }
    }

    const eventType = body.action || body.event || 'unknown';
    const events = [];

    if (body.contacts) {
      if (body.contacts.add) {
        for (const c of body.contacts.add) {
          events.push({ entity: 'contact', action: 'add', id: c.id, data: c });
        }
      }
      if (body.contacts.update) {
        for (const c of body.contacts.update) {
          events.push({ entity: 'contact', action: 'update', id: c.id, data: c });
        }
      }
      if (body.contacts.delete) {
        for (const c of body.contacts.delete) {
          events.push({ entity: 'contact', action: 'delete', id: c.id, data: c });
        }
      }
    }

    if (body.leads) {
      if (body.leads.add) {
        for (const l of body.leads.add) {
          events.push({ entity: 'lead', action: 'add', id: l.id, data: l });
        }
      }
      if (body.leads.update) {
        for (const l of body.leads.update) {
          events.push({ entity: 'lead', action: 'update', id: l.id, data: l });
        }
      }
      if (body.leads.delete) {
        for (const l of body.leads.delete) {
          events.push({ entity: 'lead', action: 'delete', id: l.id, data: l });
        }
      }
    }

    if (!events.length && body.account) {
      events.push({
        entity: 'account',
        action: body.account.subdomain ? 'settings_changed' : 'uninstalled',
        data: body.account,
      });
    }

    this.log('info', `Webhook received: ${eventType}, ${events.length} events`);
    this.emit('webhook', { type: eventType, events });

    return { type: eventType, events };
  }

  /**
   * Выполняет health-check: проверяет авторизацию простым запросом к API.
   * @returns {Promise<{ok: boolean, latency?: number, account?: object}>}
   */
  async healthCheck() {
    if (!this.initialized) return { ok: false };

    try {
      const start = Date.now();
      const data = await this._get('/api/v4/account');
      return { ok: true, latency: Date.now() - start, account: data };
    } catch {
      return { ok: false };
    }
  }

  /**
   * Извлекает значение кастомного поля из массива custom_fields_values amoCRM.
   * @param {Array|null} fields
   * @param {string} fieldCode
   * @param {string} [enumCode]
   * @returns {string|null}
   */
  _extractCustomField(fields, fieldCode, enumCode) {
    if (!Array.isArray(fields)) return null;
    const field = fields.find(f => f.field_code === fieldCode);
    if (!field || !Array.isArray(field.values)) return null;

    if (enumCode) {
      const match = field.values.find(v => v.enum_code === enumCode);
      return match ? match.value : null;
    }
    return field.values[0] ? field.values[0].value : null;
  }

  /**
   * Синхронизирует контакты из amoCRM в локальную БД AgentCore.
   * @param {string} workspaceId — ID рабочего пространства
   * @param {object} prisma — экземпляр PrismaClient
   * @returns {Promise<{created: number, skipped: number}>}
   */
  async syncContactsToDB(workspaceId, prisma) {
    if (!this.initialized) {
      throw new AppError('[amoCRM] Provider not initialized — call initialize() first', 400, 'NOT_INITIALIZED');
    }

    let created = 0;
    let skipped = 0;
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const result = await this.getContacts({ page, limit: 250 });
      for (const contact of result.contacts) {
        try {
          const existing = await prisma.cRMContact.findFirst({
            where: { workspaceId, email: contact.email || undefined },
          });
          if (existing) {
            skipped++;
            continue;
          }

          await prisma.cRMContact.create({
            data: {
              name: contact.name || 'Без имени',
              email: contact.email || null,
              phone: contact.phone || null,
              status: 'lead',
              workspaceId,
            },
          });
          created++;
        } catch {
          skipped++;
        }
      }

      hasMore = result.contacts.length >= 250;
      page++;
    }

    this.log('info', `Sync complete: ${created} created, ${skipped} skipped`);
    return { created, skipped };
  }
}

module.exports = { AmoCRMProvider };
