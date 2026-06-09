const axios = require('axios');
const { IntegrationProvider, AppError } = require('../IntegrationProvider');

const GDRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
const GOOGLE_OAUTH_TOKEN_URL = 'https://oauth2.googleapis.com/token';

class GoogleDriveProvider extends IntegrationProvider {
  constructor(config = {}) {
    super({
      name: 'gdrive',
      displayName: 'Google Drive',
      agentId: config.agentId || 48,
      version: '1.0.0'
    });
    this.clientId = null;
    this.clientSecret = null;
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiresAt = null;
    this.rootFolderId = 'root';
  }

  async initialize(credentials) {
    try {
      if (!credentials || typeof credentials !== 'object') {
        throw new Error('[GoogleDrive] credentials must be an object');
      }

      if (credentials.accessToken) {
        this.accessToken = credentials.accessToken;
        this.refreshToken = credentials.refreshToken || null;
      } else if (credentials.clientId && credentials.clientSecret) {
        this.clientId = credentials.clientId;
        this.clientSecret = credentials.clientSecret;
      } else {
        throw new Error('[GoogleDrive] accessToken or clientId+clientSecret required');
      }

      if (credentials.refreshToken) {
        this.refreshToken = credentials.refreshToken;
      }

      this.client = axios.create({
        baseURL: GDRIVE_API_BASE,
        timeout: 15000,
        headers: { Authorization: `Bearer ${this.accessToken}` }
      });
      this.initialized = true;
      this.log('info', 'GoogleDrive provider initialized');
      return true;
    } catch (err) {
      this.log('error', 'Initialize failed', { error: err.message });
      throw err;
    }
  }

  /**
   * Валидация credentials перед сохранением.
   * С accessToken — тестовый запрос к Google Drive API. Без токена — проверка наличия clientId/clientSecret.
   * @param {object} credentials
   * @returns {Promise<{valid: boolean, error?: string}>}
   */
  async validateCredentials(credentials) {
    if (!credentials || typeof credentials !== 'object') {
      return { valid: false, error: 'credentials должен быть объектом' };
    }
    if (credentials.accessToken) {
      try {
        const response = await axios.get(`${GDRIVE_API_BASE}/files`, {
          headers: { Authorization: `Bearer ${credentials.accessToken}` },
          params: { pageSize: 1, fields: 'files(id)' },
          timeout: 10000,
        });
        if (response.status === 200) {
          return { valid: true };
        }
        return { valid: false, error: 'Неверный accessToken' };
      } catch (err) {
        return { valid: false, error: `Неверный accessToken: ${err.response?.data?.error?.message || err.message}` };
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
      throw new Error('[GoogleDrive] No access token available');
    }
  }

  async _refreshAccessToken() {
    try {
      const response = await axios.post(GOOGLE_OAUTH_TOKEN_URL, null, {
        params: {
          grant_type: 'refresh_token',
          refresh_token: this.refreshToken,
          client_id: this.clientId,
          client_secret: this.clientSecret
        },
        timeout: 10000,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      this.accessToken = response.data.access_token;
      this.tokenExpiresAt = Date.now() + (response.data.expires_in || 3600) * 1000;
      if (this.client) {
        this.client.defaults.headers.Authorization = `Bearer ${this.accessToken}`;
      }
      this.log('info', 'Token refreshed');
    } catch (err) {
      throw new Error(`[GoogleDrive] Token refresh failed: ${err.message}`);
    }
  }

  async _request(method, path, params = {}) {
    await this._ensureToken();
    return this.execute(async () => {
      const config = {
        method,
        url: `${GDRIVE_API_BASE}${path}`,
        timeout: 15000,
        headers: { Authorization: `Bearer ${this.accessToken}` },
        params
      };
      return axios(config);
    });
  }

  async sendMessage(agentId, conversationId, message) {
    try {
      if (!message) throw new Error('[GoogleDrive] message (file content) is required');
      const result = await this.uploadFile(conversationId || 'root', 'agentcore_message.txt', message);
      this.log('info', 'File uploaded as message', { fileId: result.id });
      return { fileId: result.id, name: result.name };
    } catch (err) {
      this.log('error', 'Send message failed', { error: err.message });
      throw err;
    }
  }

  async handleWebhook(payload, signature) {
    try {
      if (!payload || typeof payload !== 'object') {
        throw new Error('[GoogleDrive] Invalid webhook payload');
      }
      const changes = payload.changes || [];
      return {
        processed: true,
        event: 'change',
        changes: changes.map(c => ({
          fileId: c.fileId || c.file?.id,
          kind: c.kind || '',
          removed: c.removed || false
        }))
      };
    } catch (err) {
      this.log('error', 'Webhook handling failed', { error: err.message });
      throw err;
    }
  }

  async listFiles({ folderId, pageSize = 100, query = '' } = {}) {
    try {
      const parentId = folderId || this.rootFolderId;
      let q = `'${parentId}' in parents and trashed = false`;
      if (query) q += ` and name contains '${query}'`;

      const result = await this._request('GET', '/files', {
        pageSize,
        fields: 'nextPageToken,files(id,name,mimeType,size,modifiedTime,webViewLink)',
        q
      });
      return { files: result.files || [], nextPageToken: result.nextPageToken || null };
    } catch (err) {
      this.log('error', 'List files failed', { error: err.message });
      throw err;
    }
  }

  async getFile(fileId) {
    try {
      if (!fileId) throw new Error('[GoogleDrive] fileId is required');
      const result = await this._request('GET', `/files/${fileId}`, {
        fields: 'id,name,mimeType,size,modifiedTime,createdTime,webViewLink,contentHints'
      });
      return result;
    } catch (err) {
      this.log('error', 'Get file failed', { error: err.message });
      throw err;
    }
  }

  async uploadFile(folderId, name, content) {
    try {
      const parent = folderId || this.rootFolderId;
      await this._ensureToken();

      const metadata = JSON.stringify({ name, parents: [parent] });
      const boundary = '----AgentCoreFormBoundary' + Math.random().toString(36).slice(2);
      let body;
      if (Buffer.isBuffer(content)) {
        const prefix = Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n--${boundary}\r\nContent-Type: application/octet-stream\r\n\r\n`);
        const suffix = Buffer.from(`\r\n--${boundary}--`);
        body = Buffer.concat([prefix, content, suffix]);
      } else {
        body = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n--${boundary}\r\nContent-Type: application/octet-stream\r\n\r\n${content}\r\n--${boundary}--`;
      }

      const response = await this.execute(async () => {
        return axios.post(
          'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
          body,
          {
            headers: {
              Authorization: `Bearer ${this.accessToken}`,
              'Content-Type': `multipart/related; boundary=${boundary}`
            },
            timeout: 30000
          }
        );
      });
      this.log('info', 'File uploaded', { name, folderId: parent });
      return response;
    } catch (err) {
      this.log('error', 'Upload file failed', { error: err.message });
      throw err;
    }
  }

  async healthCheck() {
    try {
      const start = Date.now();
      await this._request('GET', '/files', { pageSize: 1 });
      return { ok: true, latency: Date.now() - start };
    } catch (err) {
      this.log('error', 'Health-check failed', { error: err.message });
      return { ok: false, error: err.message };
    }
  }

  async disconnect() {
    try {
      this.accessToken = null;
      this.refreshToken = null;
      this.clientId = null;
      this.clientSecret = null;
      this.client = null;
      this.initialized = false;
      this.log('info', 'GoogleDrive provider disconnected');
      return true;
    } catch (err) {
      this.log('error', 'Disconnect failed', { error: err.message });
      this.initialized = false;
      return false;
    }
  }
}

module.exports = { GoogleDriveProvider };
