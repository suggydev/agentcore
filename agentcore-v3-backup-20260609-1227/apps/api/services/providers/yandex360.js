const axios = require('axios');
const { IntegrationProvider, AppError } = require('../IntegrationProvider');

const YANDEX360_API_BASE = 'https://api360.yandex.net';
const YANDEX_OAUTH_TOKEN_URL = 'https://oauth.yandex.ru/token';

/**
 * @file  apps/api/services/providers/yandex360.js
 * @agent #46 — Яндекс 360 интеграционный провайдер
 *
 * Поддерживаемые операции:
 *   - Работа с почтой (Ya360 Mail API): отправка/получение писем, управление ящиками
 *   - Управление организацией: пользователи, группы, домены
 *   - Работа с Яндекс Диском организации
 *
 * Документация: https://yandex.ru/dev/api360
 */

class Yandex360Provider extends IntegrationProvider {
  constructor(config = {}) {
    super({
      name: 'yandex360',
      displayName: 'Яндекс 360',
      agentId: 46,
      version: '1.0.0',
      ...config,
    });
    this.clientId = null;
    this.clientSecret = null;
    this.orgId = null;
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiresAt = null;
  }

  /**
   * Инициализация с clientId + clientSecret или готовым accessToken.
   * @param {object} credentials
   * @param {string} credentials.clientId — OAuth client_id приложения
   * @param {string} credentials.clientSecret — OAuth client_secret
   * @param {number} credentials.orgId — ID организации в Яндекс 360
   * @param {string} [credentials.accessToken] — готовый токен доступа
   * @param {string} [credentials.refreshToken] — refresh-токен
   * @returns {Promise<boolean>}
   */
  async initialize(credentials) {
    if (!credentials || typeof credentials !== 'object') {
      throw new AppError('[Яндекс 360] credentials должен быть объектом вида { clientId, clientSecret, orgId }', 400, 'MISSING_CONFIG');
    }
    if (!credentials.orgId || (typeof credentials.orgId !== 'string' && typeof credentials.orgId !== 'number')) {
      throw new AppError('[Яндекс 360] Отсутствует обязательный параметр orgId — ID организации', 400, 'MISSING_CONFIG');
    }

    this.orgId = String(credentials.orgId);

    if (credentials.accessToken) {
      this.accessToken = credentials.accessToken;
      this.refreshToken = credentials.refreshToken || null;
      this.log('info', 'Яндекс 360 инициализирован с готовым токеном', { orgId: this.orgId });
    } else {
      if (!credentials.clientId || !credentials.clientSecret) {
        throw new AppError('[Яндекс 360] Необходимо указать clientId и clientSecret, либо готовый accessToken', 400, 'MISSING_CONFIG');
      }
      this.clientId = credentials.clientId;
      this.clientSecret = credentials.clientSecret;
      this.log('info', 'Яндекс 360 инициализирован с clientId/clientSecret', { orgId: this.orgId });
    }

    this.initialized = true;
    return true;
  }

  /**
   * Валидация credentials перед сохранением.
   * С accessToken — тестовый запрос к API. Без токена — проверка наличия clientId/clientSecret.
   * @param {object} credentials
   * @returns {Promise<{valid: boolean, error?: string}>}
   */
  async validateCredentials(credentials) {
    if (!credentials || typeof credentials !== 'object') {
      return { valid: false, error: 'credentials должен быть объектом' };
    }
    if (!credentials.orgId) {
      return { valid: false, error: 'orgId обязателен' };
    }
    if (credentials.accessToken) {
      try {
        const response = await axios.get(`${YANDEX360_API_BASE}/v1/org/${credentials.orgId}/users`, {
          headers: { Authorization: `OAuth ${credentials.accessToken}` },
          params: { limit: 1 },
          timeout: 10000,
        });
        if (response.status === 200) {
          return { valid: true };
        }
        return { valid: false, error: 'Неверный accessToken' };
      } catch (err) {
        return { valid: false, error: `Неверный accessToken: ${err.response?.data?.error_description || err.message}` };
      }
    }
    if (!credentials.clientId || !credentials.clientSecret) {
      return { valid: false, error: 'Необходимо указать accessToken или пару clientId + clientSecret' };
    }
    return { valid: true };
  }

  async _ensureToken() {
    if (this.accessToken && this.tokenExpiresAt && Date.now() < this.tokenExpiresAt - 60000) {
      return;
    }
    if (this.clientId && this.clientSecret && this.refreshToken) {
      await this._refreshAccessToken();
      return;
    }
    if (!this.accessToken) {
      throw new AppError('[Яндекс 360] Нет токена доступа. Вызовите initialize() или установите clientId/clientSecret', 401, 'TOKEN_MISSING');
    }
  }

  async _refreshAccessToken() {
    try {
      const body = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: this.refreshToken,
        client_id: this.clientId,
        client_secret: this.clientSecret,
      });
      const response = await axios.post(YANDEX_OAUTH_TOKEN_URL, body.toString(), {
        timeout: 10000,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      this.accessToken = response.data.access_token;
      this.refreshToken = response.data.refresh_token || this.refreshToken;
      this.tokenExpiresAt = Date.now() + (response.data.expires_in || 3600) * 1000;
      this.log('info', 'Refresh-токен успешно обновлён');
    } catch (err) {
      throw new AppError(`[Яндекс 360] Ошибка обновления токена: ${err.response?.data?.error_description || err.message}`, 502, 'TOKEN_REFRESH_FAILED');
    }
  }

  async _request(method, path, data = null, params = {}) {
    await this._ensureToken();

    return this.execute(async () => {
      const config = {
        method,
        url: `${YANDEX360_API_BASE}${path}`,
        timeout: 20000,
        headers: {
          'Authorization': `OAuth ${this.accessToken}`,
          'Accept': 'application/json',
          'User-Agent': 'AgentCore/3.0 (Yandex360 Provider #46)',
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
   * Получает список сотрудников организации.
   * @param {object} [options]
   * @param {number} [options.page=1] — страница
   * @param {number} [options.perPage=100] — записей на страницу
   * @returns {Promise<{users: Array<object>, total: number, page: number}>}
   */
    async sendMessage(agentId, conversationId, message) {
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      throw new AppError('[Яндекс 360] message is required', 400, 'VALIDATION_ERROR');
    }
    if (!this.orgId) {
      throw new AppError('[Яндекс 360] orgId is required', 400, 'MISSING_CONFIG');
    }
    try {
      const payload = {
        to: conversationId,
        subject: 'AgentCore message',
        body: message.trim(),
      };
      const result = await this._request('POST', `/admin/v1/org/${this.orgId}/mail/send`, payload);
      return { sent: true, messageId: result.id || '' };
    } catch (err) {
      this.log('error', 'sendMessage failed', { error: err.message });
      throw new AppError(`[Яндекс 360] Failed to send message: ${err.message}`, 502, 'SEND_FAILED');
    }
  }

  async getUsers({ page = 1, perPage = 100 } = {}) {
    if (page < 1) throw new Error('[Яндекс 360] Параметр page должен быть >= 1');
    if (perPage < 1 || perPage > 100) throw new Error('[Яндекс 360] Параметр perPage должен быть от 1 до 100');

    const response = await this._request('GET', `/directory/v1/org/${this.orgId}/users`, null, {
      page,
      per_page: perPage,
    });

    return {
      users: (response.users || []).map(user => ({
        id: user.id,
        email: user.email,
        nickName: user.name?.first || '',
        lastName: user.name?.last || '',
        displayName: user.display_name || '',
        gender: user.gender || '',
        position: user.position || '',
        departmentId: user.department_id ?? null,
        isAdmin: user.is_admin || false,
        isEnabled: user.is_enabled !== false,
        avatarId: user.avatar_id || '',
        birthday: user.birthday || '',
      })),
      total: response.total || 0,
      page: response.page || page,
      perPage: response.per_page || perPage,
    };
  }

  /**
   * Получает список доменов организации.
   * @param {object} [options]
   * @param {number} [options.page=1]
   * @param {number} [options.perPage=50]
   * @returns {Promise<{domains: Array<object>, total: number, page: number}>}
   */
  async getDomains({ page = 1, perPage = 50 } = {}) {
    if (page < 1) throw new Error('[Яндекс 360] Параметр page должен быть >= 1');
    if (perPage < 1 || perPage > 100) throw new Error('[Яндекс 360] Параметр perPage должен быть от 1 до 100');

    const response = await this._request('GET', `/directory/v1/org/${this.orgId}/domains`, null, {
      page,
      per_page: perPage,
    });

    return {
      domains: (response.domains || []).map(domain => ({
        name: domain.name,
        verified: domain.verified || false,
        default: domain.default || false,
        master: domain.master || false,
        mx: domain.mx || false,
      })),
      total: response.total || 0,
      page: response.page || page,
    };
  }

  /**
   * Получает список отделов (подразделений) организации.
   * @param {object} [options]
   * @param {number} [options.page=1]
   * @param {number} [options.perPage=100]
   * @param {number} [options.parentId] — ID родительского отдела
   * @returns {Promise<{departments: Array<object>, total: number, page: number}>}
   */
  async getDepartments({ page = 1, perPage = 100, parentId } = {}) {
    if (page < 1) throw new Error('[Яндекс 360] Параметр page должен быть >= 1');
    if (perPage < 1 || perPage > 100) throw new Error('[Яндекс 360] Параметр perPage должен быть от 1 до 100');

    const params = { page, per_page: perPage };
    if (parentId !== undefined) params.parent_id = parentId;

    const response = await this._request('GET', `/directory/v1/org/${this.orgId}/departments`, null, params);

    return {
      departments: (response.departments || []).map(dept => ({
        id: dept.id,
        name: dept.name,
        label: dept.label || '',
        parentId: dept.parent_id ?? null,
        email: dept.email || '',
        headId: dept.head_id ?? null,
        membersCount: dept.members_count || 0,
        externalId: dept.external_id || '',
      })),
      total: response.total || 0,
      page: response.page || page,
    };
  }

  /**
   * Получает список групп организации.
   * @param {object} [options]
   * @param {number} [options.page=1]
   * @param {number} [options.perPage=100]
   * @returns {Promise<{groups: Array<object>, total: number, page: number}>}
   */
  async getGroups({ page = 1, perPage = 100 } = {}) {
    if (page < 1) throw new Error('[Яндекс 360] Параметр page должен быть >= 1');
    if (perPage < 1 || perPage > 100) throw new Error('[Яндекс 360] Параметр perPage должен быть от 1 до 100');

    const response = await this._request('GET', `/directory/v1/org/${this.orgId}/groups`, null, {
      page,
      per_page: perPage,
    });

    return {
      groups: (response.groups || []).map(group => ({
        id: group.id,
        name: group.name,
        label: group.label || '',
        email: group.email || '',
        description: group.description || '',
        type: group.type || 'generic',
        membersCount: group.members_count || 0,
        externalId: group.external_id || '',
        adminIds: group.admin_ids || [],
      })),
      total: response.total || 0,
      page: response.page || page,
    };
  }

  async healthCheck() {
    try {
      const start = Date.now();
      await this._request('GET', `/directory/v1/org/${this.orgId}`, null, {});
      return { ok: true, latency: Date.now() - start };
    } catch (err) {
      this.log('error', 'Health-check не пройден', { error: err.message });
      return { ok: false, error: err.message };
    }
  }

  async handleWebhook(payload, signature) {
    try {
      if (!payload || typeof payload !== 'object') {
        throw new Error('[Yandex360] Invalid webhook payload');
      }
      return { processed: true, event: payload.event || 'unknown', data: payload };
    } catch (err) {
      this.log('error', 'Webhook handling failed', { error: err.message });
      throw err;
    }
  }

  async disconnect() {
    try {
      this.accessToken = null;
      this.refreshToken = null;
      this.clientId = null;
      this.clientSecret = null;
      this.orgId = null;
      this.initialized = false;
      this.log('info', 'Yandex360 provider disconnected');
      return true;
    } catch (err) {
      this.log('error', 'Disconnect failed', { error: err.message });
      this.initialized = false;
      return false;
    }
  }
}

function createYandex360Provider(config) {
  return new Yandex360Provider(config);
}

module.exports = { Yandex360Provider, createYandex360Provider };
