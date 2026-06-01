/**
 * Bitrix24 Integration Provider — Agent #42
 * OAuth 2.0 REST API connector for Bitrix24 CRM.
 *
 * @file apps/api/services/providers/bitrix24.js
 */

const axios = require('axios');
const crypto = require('crypto');
const { IntegrationProvider, AppError } = require('../IntegrationProvider');

class Bitrix24Provider extends IntegrationProvider {
  constructor() {
    super({
      name: 'bitrix24',
      displayName: 'Bitrix24',
      agentId: 42,
      version: '1.0.0',
    });

    this.domain = null;
    this.clientId = null;
    this.clientSecret = null;
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiresAt = null;
    this.webhookUserId = null;
    this.webhookToken = null;
  }

  /**
   * Initialize with OAuth 2.0 credentials or incoming webhook.
   * Bitrix24 supports OAuth 2.0 flow AND incoming webhooks (user_id + webhook_token).
   * @param {object} credentials
   * @param {string}  credentials.domain        — your-company.bitrix24.ru
   * @param {string}  [credentials.clientId]     — application client_id (for OAuth flow)
   * @param {string}  [credentials.clientSecret] — application client_secret (for OAuth flow)
   * @param {string}  [credentials.accessToken]  — existing OAuth access_token
   * @param {string}  [credentials.refreshToken] — existing OAuth refresh_token
   * @param {number}  [credentials.webhookUserId] — user ID (for incoming webhook)
   * @param {string}  [credentials.webhookToken] — webhook token (for incoming webhook)
   */
  async initialize({ domain, clientId, clientSecret, accessToken, refreshToken, webhookUserId, webhookToken } = {}) {
    if (!domain) {
      throw new AppError('[Bitrix24] domain is required', 400, 'MISSING_DOMAIN');
    }

    this.domain = domain.replace(/\/+$/, '').replace(/^https?:\/\//, '');
    this.clientId = clientId || null;
    this.clientSecret = clientSecret || null;

    if (webhookUserId && webhookToken) {
      this.webhookUserId = webhookUserId;
      this.webhookToken = webhookToken;
      this.initialized = true;
      this.log('info', 'Bitrix24 provider initialized via webhook', { domain: this.domain });
      return;
    }

    if (accessToken) {
      this.accessToken = accessToken;
      this.refreshToken = refreshToken || null;

      const valid = await this._validateToken();
      if (!valid) {
        if (this.refreshToken && this.clientId && this.clientSecret) {
          await this._refreshAccessToken();
        } else {
          throw new AppError('[Bitrix24] Invalid access token and cannot refresh', 401, 'INVALID_TOKEN');
        }
      }
    }

    if (!this.accessToken && !this.webhookToken) {
      throw new AppError('[Bitrix24] No valid auth provided. Supply accessToken, webhook token, or use OAuth flow (getAuthUrl + exchangeCode).', 400, 'MISSING_CREDENTIALS');
    }

    this.initialized = true;
    this.log('info', 'Bitrix24 provider initialized', { domain: this.domain });
  }

  /**
   * Internal — build REST endpoint URL
   */
  _buildUrl(method) {
    if (this.webhookToken && this.webhookUserId) {
      return `https://${this.domain}/rest/${this.webhookUserId}/${this.webhookToken}/${method}`;
    }
    if (this.accessToken) {
      return `https://${this.domain}/rest/${method}`;
    }
    throw new AppError('[Bitrix24] No valid authentication configured. Provide accessToken or webhook credentials.', 401, 'NO_AUTH');
  }

  /**
   * Internal — call a single REST method
   */
  async _call(method, params = {}) {
    if (!this.accessToken && !(this.webhookToken && this.webhookUserId)) {
      throw new AppError('[Bitrix24] Cannot call REST API: no access token or webhook configured. Use getAuthUrl() + exchangeCode() first.', 401, 'NO_AUTH');
    }

    const url = this._buildUrl(method);

    const body = { ...params };

    if (this.accessToken) {
      body.auth = this.accessToken;
    }

    return this.execute(async () => {
      const response = await axios.post(url, body, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000,
      });

      if (response.data && response.data.error) {
        const errMsg = response.data.error_description || response.data.error;
        if (response.data.error === 'expired_token' && this.refreshToken) {
          await this._refreshAccessToken();
          return this._call(method, params);
        }
        throw new AppError(`[Bitrix24] API error: ${errMsg}`, 400, response.data.error);
      }

      return response.data.result || response.data;
    });
  }

  /**
   * Internal — batch multiple REST methods in a single request
   */
  async _batch(calls) {
    const cmd = {};
    calls.forEach((call, idx) => {
      cmd[`cmd${idx}`] = `${call.method}?${new URLSearchParams(call.params || {}).toString()}`;
    });

    const url = this.webhookToken && this.webhookUserId
      ? `https://${this.domain}/rest/${this.webhookUserId}/${this.webhookToken}/batch`
      : `https://${this.domain}/rest/batch`;

    const body = { cmd };

    if (this.accessToken) {
      body.auth = this.accessToken;
    }

    return this.execute(async () => {
      const response = await axios.post(url, body, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000,
      });

      if (response.data && response.data.error) {
        const errMsg = response.data.error_description || response.data.error;
        if (response.data.error === 'expired_token' && this.refreshToken) {
          await this._refreshAccessToken();
          return this._batch(calls);
        }
        throw new AppError(`[Bitrix24] Batch API error: ${errMsg}`, 400, response.data.error);
      }

      const result = response.data.result || response.data;
      const aggregated = {};
      Object.keys(result.result || {}).forEach((key) => {
        aggregated[key] = result.result[key];
      });

      return aggregated;
    });
  }

  /**
   * Validate current access token
   */
  async _validateToken() {
    if (!this.accessToken) return false;
    try {
      const data = await this.execute(async () => {
        const response = await axios.post(
          `https://${this.domain}/rest/user.current`,
          { auth: this.accessToken },
          { headers: { 'Content-Type': 'application/json' }, timeout: 10000 }
        );
        if (response.data && response.data.error) {
          throw new AppError(response.data.error_description || response.data.error, 400, response.data.error);
        }
        return response.data;
      });

      return !!(data && !data.error && data.result);
    } catch {
      return false;
    }
  }

  /**
   * Refresh OAuth 2.0 access token
   */
  async _refreshAccessToken() {
    if (!this.refreshToken || !this.clientId || !this.clientSecret) {
      throw new AppError('[Bitrix24] Cannot refresh token: missing refresh_token or client credentials', 400, 'REFRESH_FAILED');
    }

    try {
      const response = await axios.get(`https://oauth.bitrix.info/oauth/token/`, {
        params: {
          grant_type: 'refresh_token',
          client_id: this.clientId,
          client_secret: this.clientSecret,
          refresh_token: this.refreshToken,
        },
        timeout: 10000,
      });

      if (response.data && response.data.error) {
        throw new AppError(
          `[Bitrix24] Token refresh failed: ${response.data.error_description || response.data.error}`,
          400,
          response.data.error
        );
      }

      const { access_token, refresh_token, expires_in } = response.data;
      this.accessToken = access_token;
      this.refreshToken = refresh_token || this.refreshToken;
      this.tokenExpiresAt = expires_in ? Date.now() + expires_in * 1000 : null;

      this.emit('token:refreshed', { provider: this.name });
      this.log('info', 'Access token refreshed');

      return true;
    } catch (err) {
      this.log('error', 'Token refresh failed', { error: err.message });
      throw new AppError(`[Bitrix24] Token refresh failed: ${err.message}`, 401, 'REFRESH_FAILED');
    }
  }

  /**
   * Get OAuth 2.0 authorization URL
   */
  getAuthUrl(redirectUri, scope = ['crm', 'tasks', 'user']) {
    if (!this.domain || !this.clientId) {
      throw new AppError('[Bitrix24] Domain and clientId required for OAuth flow', 400, 'MISSING_PARAMS');
    }
    const state = crypto.randomBytes(16).toString('hex');
    return {
      url: `https://${this.domain}/oauth/authorize/?client_id=${encodeURIComponent(this.clientId)}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope.join(','))}&state=${state}`,
      state,
    };
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCode(code, redirectUri) {
    if (!this.clientId || !this.clientSecret) {
      throw new AppError('[Bitrix24] clientId and clientSecret required to exchange code', 400, 'MISSING_CREDENTIALS');
    }

    try {
      const response = await axios.get(`https://oauth.bitrix.info/oauth/token/`, {
        params: {
          grant_type: 'authorization_code',
          client_id: this.clientId,
          client_secret: this.clientSecret,
          code,
          redirect_uri: redirectUri,
        },
        timeout: 10000,
      });

      if (response.data && response.data.error) {
        throw new AppError(
          `[Bitrix24] Code exchange failed: ${response.data.error_description || response.data.error}`,
          400,
          response.data.error
        );
      }

      const { access_token, refresh_token, expires_in, user_id } = response.data;
      this.accessToken = access_token;
      this.refreshToken = refresh_token;
      this.tokenExpiresAt = expires_in ? Date.now() + expires_in * 1000 : null;

      return {
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresIn: expires_in,
        userId: user_id,
      };
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError(`[Bitrix24] Code exchange failed: ${err.message}`, 400, 'CODE_EXCHANGE_FAILED');
    }
  }

  // ─── CRM Methods ────────────────────────────────────────

  /**
   * Fetch leads
   * @param {object} [options]
   * @param {number} [options.limit] — max results per page
   * @param {number} [options.start] — offset
   * @returns {Promise<Array>}
   */
  async getLeads(options = {}) {
    const limit = options.limit || 50;
    const start = options.start || 0;

    try {
      const result = await this._call('crm.lead.list', {
        select: ['ID', 'TITLE', 'NAME', 'PHONE', 'EMAIL', 'STATUS_ID', 'DATE_CREATE', 'UF_CRM_*'],
        filter: {},
        order: { DATE_CREATE: 'DESC' },
        start,
      });

      if (!Array.isArray(result)) {
        return [];
      }

      return result.map((lead) => ({
        id: lead.ID,
        title: lead.TITLE || '',
        name: (lead.NAME || '').trim() || null,
        phone: this._extractPhone(lead.PHONE) || null,
        email: this._extractEmail(lead.EMAIL) || null,
        statusId: lead.STATUS_ID || null,
        createdAt: lead.DATE_CREATE || null,
      }));
    } catch (err) {
      this.log('error', 'Failed to fetch leads', { error: err.message });
      throw err;
    }
  }

  /**
   * Create a lead
   * @param {object} data
   * @param {string} data.title  — lead title
   * @param {string} [data.name] — contact name
   * @param {string} [data.phone] — phone number
   * @param {string} [data.email] — email address
   * @returns {Promise<object>}
   */
  async createLead({ title, name, phone, email } = {}) {
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      throw new AppError('[Bitrix24] Lead title is required', 400, 'MISSING_TITLE');
    }

    const fields = { TITLE: title.trim(), OPENED: 'Y' };

    if (name && name.trim()) {
      fields.NAME = name.trim();
    }

    if (phone) {
      const cleanedPhone = phone.replace(/[^\d+]/g, '');
      if (cleanedPhone.length < 5) {
        throw new AppError('[Bitrix24] Invalid phone number', 400, 'INVALID_PHONE');
      }
      fields.PHONE = [{ VALUE: cleanedPhone, VALUE_TYPE: 'WORK' }];
    }

    if (email) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new AppError('[Bitrix24] Invalid email address', 400, 'INVALID_EMAIL');
      }
      fields.EMAIL = [{ VALUE: email, VALUE_TYPE: 'WORK' }];
    }

    try {
      const result = await this._call('crm.lead.add', { fields });

      return {
        id: result,
        title: title.trim(),
        name: name || null,
        phone: phone || null,
        email: email || null,
        url: `https://${this.domain}/crm/lead/details/${result}/`,
      };
    } catch (err) {
      this.log('error', 'Failed to create lead', { error: err.message, title });
      throw err;
    }
  }

  /**
   * Fetch deals
   * @param {object} [options]
   * @param {number} [options.limit]
   * @param {number} [options.start]
   * @returns {Promise<Array>}
   */
  async getDeals(options = {}) {
    const limit = options.limit || 50;
    const start = options.start || 0;

    try {
      const result = await this._call('crm.deal.list', {
        select: ['ID', 'TITLE', 'STAGE_ID', 'OPPORTUNITY', 'CURRENCY_ID', 'CONTACT_ID', 'COMPANY_ID', 'DATE_CREATE', 'CLOSEDATE'],
        filter: {},
        order: { DATE_CREATE: 'DESC' },
        start,
      });

      if (!Array.isArray(result)) {
        return [];
      }

      return result.map((deal) => ({
        id: deal.ID,
        title: deal.TITLE || '',
        stageId: deal.STAGE_ID || null,
        opportunity: deal.OPPORTUNITY ? parseFloat(deal.OPPORTUNITY) : null,
        currencyId: deal.CURRENCY_ID || null,
        contactId: deal.CONTACT_ID ? parseInt(deal.CONTACT_ID) : null,
        companyId: deal.COMPANY_ID ? parseInt(deal.COMPANY_ID) : null,
        createdAt: deal.DATE_CREATE || null,
        closeDate: deal.CLOSEDATE || null,
      }));
    } catch (err) {
      this.log('error', 'Failed to fetch deals', { error: err.message });
      throw err;
    }
  }

  /**
   * Create a task
   * @param {object} data
   * @param {string} data.title
   * @param {string} [data.description]
   * @param {number} [data.responsibleId] — user ID for task assignment
   * @returns {Promise<object>}
   */
  async createTask({ title, description, responsibleId } = {}) {
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      throw new AppError('[Bitrix24] Task title is required', 400, 'MISSING_TITLE');
    }

    const fields = {
      TITLE: title.trim(),
      DESCRIPTION: (description || '').trim(),
    };

    if (responsibleId) {
      const rid = parseInt(responsibleId);
      if (isNaN(rid) || rid <= 0) {
        throw new AppError('[Bitrix24] Invalid responsibleId', 400, 'INVALID_RESPONSIBLE_ID');
      }
      fields.RESPONSIBLE_ID = rid;
    }

    try {
      const result = await this._call('tasks.task.add', { fields });

      return {
        id: result && result.task ? result.task.id : result,
        title: title.trim(),
        description: description || '',
        responsibleId: responsibleId || null,
        url: result && result.task ? `https://${this.domain}/company/personal/user/${result.task.responsibleId || responsibleId}/tasks/task/view/${result.task.id}/` : null,
      };
    } catch (err) {
      this.log('error', 'Failed to create task', { error: err.message, title });
      throw err;
    }
  }

  /**
   * Fetch contacts
   * @param {object} [options]
   * @param {number} [options.limit]
   * @param {number} [options.start]
   * @returns {Promise<Array>}
   */
  async getContacts(options = {}) {
    const limit = options.limit || 50;
    const start = options.start || 0;

    try {
      const result = await this._call('crm.contact.list', {
        select: ['ID', 'NAME', 'LAST_NAME', 'PHONE', 'EMAIL', 'COMPANY_ID', 'DATE_CREATE', 'UF_CRM_*'],
        filter: {},
        order: { DATE_CREATE: 'DESC' },
        start,
      });

      if (!Array.isArray(result)) {
        return [];
      }

      return result.map((contact) => ({
        id: contact.ID,
        name: contact.NAME || '',
        lastName: contact.LAST_NAME || '',
        fullName: [contact.NAME, contact.LAST_NAME].filter(Boolean).join(' ') || null,
        phone: this._extractPhone(contact.PHONE) || null,
        email: this._extractEmail(contact.EMAIL) || null,
        companyId: contact.COMPANY_ID ? parseInt(contact.COMPANY_ID) : null,
        createdAt: contact.DATE_CREATE || null,
      }));
    } catch (err) {
      this.log('error', 'Failed to fetch contacts', { error: err.message });
      throw err;
    }
  }

  /**
   * Batch fetch leads, deals, and contacts simultaneously
   */
  async getCrmOverview() {
    const result = await this._batch([
      { method: 'crm.lead.list', params: { select: ['ID', 'TITLE', 'NAME', 'STATUS_ID', 'DATE_CREATE'], order: { DATE_CREATE: 'DESC' } } },
      { method: 'crm.deal.list', params: { select: ['ID', 'TITLE', 'STAGE_ID', 'OPPORTUNITY', 'DATE_CREATE'], order: { DATE_CREATE: 'DESC' } } },
      { method: 'crm.contact.list', params: { select: ['ID', 'NAME', 'LAST_NAME', 'DATE_CREATE'], order: { DATE_CREATE: 'DESC' } } },
    ]);

    const leads = result.cmd0 || [];
    const deals = result.cmd1 || [];
    const contacts = result.cmd2 || [];

    return {
      leadsCount: Array.isArray(leads) ? leads.length : 0,
      dealsCount: Array.isArray(deals) ? deals.length : 0,
      contactsCount: Array.isArray(contacts) ? contacts.length : 0,
    };
  }

  // ─── HELPERS ────────────────────────────────────────────

  _extractPhone(phoneField) {
    if (!phoneField) return null;
    if (typeof phoneField === 'string') return phoneField.trim() || null;
    if (Array.isArray(phoneField) && phoneField.length > 0) {
      return phoneField[0].VALUE || null;
    }
    return null;
  }

  _extractEmail(emailField) {
    if (!emailField) return null;
    if (typeof emailField === 'string') return emailField.trim() || null;
    if (Array.isArray(emailField) && emailField.length > 0) {
      return emailField[0].VALUE || null;
    }
    return null;
  }
}

module.exports = { Bitrix24Provider };
