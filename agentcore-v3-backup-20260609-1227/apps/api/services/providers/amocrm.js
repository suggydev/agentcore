
const axios = require('axios');
const crypto = require('crypto');
const { IntegrationProvider, AppError } = require('../IntegrationProvider');
const AMOCRM_RATE_LIMIT = 7;
const AMOCRM_TOKEN_ENDPOINT = '/oauth2/access_token';
const AMOCRM_AUTH_URL = 'https://www.amocrm.ru/oauth';
const ACCESS_TOKEN_TTL_MS = 23 * 60 * 60 * 1000;
class AmoCRMProvider extends IntegrationProvider {
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
  get apiBase() {
    if (!this.domain) {
      throw new AppError('[amoCRM] Domain not configured', 400, 'MISSING_CONFIG');
    }
    return `https://${this.domain}.amocrm.ru`;
  }
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
   * Валидация credentials перед сохранением.
   * Если есть accessToken — тестовый запрос к API.
   * Если только domain + clientId — проверяем что domain существует.
   * @param {object} credentials
   * @returns {Promise<{valid: boolean, error?: string}>}
   */
  async validateCredentials(credentials) {
    if (!credentials || typeof credentials !== 'object') {
      return { valid: false, error: 'credentials должен быть объектом' };
    }
    if (!credentials.domain) {
      return { valid: false, error: 'domain обязателен (поддомен amoCRM)' };
    }
    if (credentials.accessToken) {
      try {
        const response = await axios.get(`https://${credentials.domain}.amocrm.ru/api/v4/account`, {
          headers: { Authorization: `Bearer ${credentials.accessToken}` },
          timeout: 10000,
        });
        if (response.data && response.data.id) {
          return { valid: true };
        }
        return { valid: false, error: 'Неверный accessToken' };
      } catch (err) {
        return { valid: false, error: `Неверный accessToken: ${err.response?.data?.hint || err.message}` };
      }
    }
    return { valid: true };
  }

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
  _persistTokens(data) {
    this.accessToken = data.access_token;
    this.refreshToken = data.refresh_token;
    this.tokenExpiresAt = Date.now() + (data.expires_in || 86400) * 1000 - 60000;
  }
  getTokenState() {
    return {
      accessToken: this.accessToken,
      refreshToken: this.refreshToken,
      expiresAt: this.tokenExpiresAt,
    };
  }
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
    async sendMessage(agentId, conversationId, message) {
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      throw new AppError('[amoCRM] message is required', 400, 'VALIDATION_ERROR');
    }
    const body = [{ name: message.trim() }];
    if (conversationId && !isNaN(Number(conversationId))) {
      body[0]._embedded = { contacts: [{ id: Number(conversationId) }] };
    }
    const data = await this._post('/api/v4/leads', body);
    const embedded = data._embedded || {};
    const created = (embedded.leads || [])[0] || {};
    return { id: created.id, name: created.name || message.trim() };
  }
  async handleWebhook(req, secret) {
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
  async disconnect() {
    try {
      this.accessToken = null;
      this.refreshToken = null;
      this.clientId = null;
      this.clientSecret = null;
      this.domain = null;
      this.client = null;
      this.initialized = false;
      this.log('info', 'amoCRM provider disconnected');
      return true;
    } catch (err) {
      this.log('error', 'Disconnect failed', { error: err.message });
      this.initialized = false;
      return false;
    }
  }
}
module.exports = { AmoCRMProvider };
