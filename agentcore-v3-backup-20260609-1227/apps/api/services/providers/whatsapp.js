const axios = require('axios');
const { IntegrationProvider, AppError } = require('../IntegrationProvider');

let WhatsAppWeb = null;
try {
  WhatsAppWeb = require('whatsapp-web.js');
} catch (e) {
  // whatsapp-web.js not installed — web mode unavailable
}

class WhatsAppProvider extends IntegrationProvider {
  constructor(config = {}) {
    super({
      name: 'whatsapp',
      displayName: 'WhatsApp',
      agentId: config.agentId || 45,
      version: '2.0.0'
    });

    this.mode = config.mode || 'cloud'; // 'cloud' | 'web'
    this.phoneNumberId = config.phoneNumberId || null;
    this.accessToken = config.accessToken || null;
    this.apiVersion = 'v17.0';
    this.verifyToken = config.verifyToken || null;
    this.baseUrl = 'https://graph.facebook.com';
    this.client = null;
    this.webClient = null;
    this.qrCode = null;
    this.webReady = false;
    this.initialized = false;
  }

  async initialize(credentials) {
    this.mode = credentials.mode || this.mode || 'cloud';

    if (this.mode === 'web') {
      if (!WhatsAppWeb) {
        throw new AppError('[WhatsApp] whatsapp-web.js не установлен. Запустите: npm install whatsapp-web.js', 500, 'MISSING_DEPENDENCY');
      }
      this.webCredentials = credentials;
      this.initialized = true;
      this.log('info', 'WhatsApp Web mode инициализирован. Требуется QR-авторизация.');
      return { status: 'needs_qr', note: 'Требуется QR-авторизация. Вызовите startWebSession() для генерации QR-кода.' };
    }

    // Cloud mode
    if (!credentials || !credentials.phoneNumberId || !credentials.accessToken) {
      throw new AppError(
        '[WhatsApp] Для инициализации необходимы phoneNumberId и accessToken.',
        400,
        'MISSING_CREDENTIALS'
      );
    }
    this.phoneNumberId = credentials.phoneNumberId;
    this.accessToken = credentials.accessToken;
    if (credentials.verifyToken) this.verifyToken = credentials.verifyToken;
    if (credentials.apiVersion) this.apiVersion = credentials.apiVersion;
    this.client = axios.create({ baseURL: this.baseUrl, timeout: 15000 });
    this.initialized = true;
    this.credentials = credentials;
    this.log('info', 'WhatsApp Cloud API инициализирован');
    return true;
  }

  /**
   * Валидация credentials перед сохранением.
   * Web mode — только проверка наличия данных (QR требует запуска браузера).
   * Cloud mode — тестовый запрос к Meta Graph API.
   * @param {object} credentials
   * @returns {Promise<{valid: boolean, error?: string}>}
   */
  async validateCredentials(credentials) {
    if (!credentials || typeof credentials !== 'object') {
      return { valid: false, error: 'credentials должен быть объектом' };
    }
    const mode = credentials.mode || this.mode || 'cloud';
    if (mode === 'web') {
      return { valid: true };
    }
    if (!credentials.phoneNumberId || !credentials.accessToken) {
      return { valid: false, error: 'Для Cloud mode нужны phoneNumberId и accessToken' };
    }
    try {
      const response = await axios.get(`https://graph.facebook.com/v17.0/${credentials.phoneNumberId}`, {
        params: { access_token: credentials.accessToken, fields: 'id,name' },
        timeout: 10000,
      });
      if (response.data && response.data.id) {
        return { valid: true };
      }
      return { valid: false, error: 'Неверный accessToken или phoneNumberId' };
    } catch (err) {
      return { valid: false, error: `Неверный accessToken: ${err.response?.data?.error?.message || err.message}` };
    }
  }

  async startWebSession(onQr = null, onReady = null) {
    if (this.mode !== 'web') throw new AppError('[WhatsApp] Web mode не активирован', 400, 'WRONG_MODE');
    if (!WhatsAppWeb) throw new AppError('[WhatsApp] whatsapp-web.js не установлен', 500, 'MISSING_DEPENDENCY');

    const { Client, LocalAuth } = WhatsAppWeb;
    this.webClient = new Client({
      authStrategy: new LocalAuth({ dataPath: '/tmp/whatsapp-auth' }),
      puppeteer: {
        headless: true,
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
      }
    });

    this.webClient.on('qr', (qr) => {
      this.qrCode = qr;
      this.log('info', 'WhatsApp Web QR сгенерирован');
      if (onQr) onQr(qr);
    });

    this.webClient.on('ready', () => {
      this.webReady = true;
      this.log('info', 'WhatsApp Web готов');
      if (onReady) onReady();
    });

    this.webClient.on('message_create', async (msg) => {
      if (msg.fromMe) return;
      this.log('info', 'WhatsApp Web входящее', { from: msg.from, body: msg.body });
    });

    await this.webClient.initialize();
    return { status: 'initializing', note: 'Ожидайте QR-код' };
  }

  /**
   * Возвращает текущий QR-код для web-режима.
   * @returns {string|null}
   */
  getQrCode() {
    return this.qrCode;
  }

  /**
   * Проверяет, готов ли web-клиент (QR отсканирован).
   * @returns {boolean}
   */
  isWebReady() {
    return this.webReady === true;
  }

  async sendMessage(agentId, conversationId, message) {
    try {
      this.ensureInitialized();
      if (!conversationId) throw new Error('[WhatsApp] conversationId (phone number) is required');
      if (!message) throw new Error('[WhatsApp] message is required');

      if (this.mode === 'web' && this.webClient && this.webReady) {
        const chatId = conversationId.includes('@c.us') ? conversationId : `${conversationId}@c.us`;
        const result = await this.webClient.sendMessage(chatId, message);
        this.log('info', 'WhatsApp Web сообщение отправлено', { chatId, msgId: result.id?._serialized });
        return { ok: true, result: { id: result.id?._serialized } };
      }

      return await this._sendWhatsAppMessage(conversationId, message);
    } catch (err) {
      this.log('error', 'sendMessage failed', { error: err.message });
      throw err;
    }
  }

  ensureInitialized() {
    if (!this.initialized) {
      throw new AppError('[WhatsApp] Провайдер не инициализирован. Вызовите initialize().', 500, 'NOT_INITIALIZED');
    }
  }

  _headers() {
    return { 'Authorization': `Bearer ${this.accessToken}`, 'Content-Type': 'application/json' };
  }

  _recipient(to) {
    return { recipient_type: 'individual', to };
  }

  _sendWhatsAppMessage(to, text) {
    this.ensureInitialized();
    if (this.mode === 'web') throw new AppError('[WhatsApp] Web client не готов. Просканируйте QR-код.', 503, 'WEB_NOT_READY');

    return this.execute(async () => {
      const response = await this.client.post(
        `/${this.apiVersion}/${this.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          ...this._recipient(to),
          type: 'text',
          text: { preview_url: false, body: text }
        },
        { headers: this._headers() }
      );
      return response.data;
    });
  }

  sendTemplate(to, templateName, languageCode = 'ru', components = []) {
    this.ensureInitialized();
    if (this.mode === 'web') throw new AppError('[WhatsApp] Templates не поддерживаются в web-режиме', 400, 'NOT_SUPPORTED');

    return this.execute(async () => {
      const payload = {
        messaging_product: 'whatsapp',
        ...this._recipient(to),
        type: 'template',
        template: { name: templateName, language: { code: languageCode } }
      };
      if (components.length > 0) payload.template.components = components;
      const response = await this.client.post(`/${this.apiVersion}/${this.phoneNumberId}/messages`, payload, { headers: this._headers() });
      return response.data;
    });
  }

  sendImage(to, imageUrl, caption = '') {
    this.ensureInitialized();
    if (this.mode === 'web') {
      const chatId = to.includes('@c.us') ? to : `${to}@c.us`;
      return this.execute(async () => {
        const result = await this.webClient.sendMessage(chatId, caption, { media: imageUrl });
        return { ok: true, result: { id: result.id?._serialized } };
      });
    }

    return this.execute(async () => {
      const payload = { messaging_product: 'whatsapp', ...this._recipient(to), type: 'image', image: { link: imageUrl } };
      if (caption) payload.image.caption = caption;
      const response = await this.client.post(`/${this.apiVersion}/${this.phoneNumberId}/messages`, payload, { headers: this._headers() });
      return response.data;
    });
  }

  markAsRead(messageId) {
    this.ensureInitialized();
    if (this.mode === 'web') return { ok: true, note: 'Web mode не требует markAsRead' };

    return this.execute(async () => {
      const response = await this.client.post(
        `/${this.apiVersion}/${this.phoneNumberId}/messages`,
        { messaging_product: 'whatsapp', status: 'read', message_id: messageId },
        { headers: this._headers() }
      );
      return response.data;
    });
  }

  verifyWebhook(mode, token, challenge) {
    if (this.mode === 'web') return null;
    if (!this.verifyToken) {
      this.log('error', '[WhatsApp] verifyToken не настроен — верификация невозможна');
      return null;
    }
    if (mode === 'subscribe' && token === this.verifyToken) {
      this.log('info', 'Webhook верифицирован успешно');
      return challenge;
    }
    this.log('error', `Верификация webhook не удалась`);
    return null;
  }

  parseIncomingMessage(body) {
    if (!body || !body.entry || !Array.isArray(body.entry)) return null;
    const messages = [];
    for (const entry of body.entry) {
      if (!entry.changes || !Array.isArray(entry.changes)) continue;
      for (const change of entry.changes) {
        if (change.field !== 'messages') continue;
        const value = change.value;
        if (!value || !value.messages || !Array.isArray(value.messages)) continue;
        for (const msg of value.messages) {
          const metadata = value.metadata || {};
          messages.push({
            messageId: msg.id,
            from: msg.from,
            timestamp: parseInt(msg.timestamp) * 1000 || Date.now(),
            type: msg.type,
            text: msg.text?.body || null,
            phoneNumberId: metadata.phone_number_id,
            displayPhoneNumber: metadata.display_phone_number,
            context: msg.context || null
          });
        }
      }
    }
    return messages;
  }

  async healthCheck() {
    try {
      const start = Date.now();
      if (this.mode === 'web') {
        return { ok: this.webReady, latency: Date.now() - start, mode: 'web', qrGenerated: !!this.qrCode };
      }
      await this.execute(async () => {
        return this.client.get(`/${this.apiVersion}/${this.phoneNumberId}`, { headers: this._headers(), timeout: 10000 });
      });
      return { ok: true, latency: Date.now() - start, mode: 'cloud' };
    } catch (err) {
      this.log('error', 'Health-check failed', { error: err.message });
      return { ok: false, error: err.message };
    }
  }

  async handleWebhook(payload, signature) {
    try {
      if (this.mode === 'web') {
        // For web mode, webhook isn't used — messages come through event emitter
        return { processed: false, reason: 'web_mode_uses_events', note: 'Web-режим использует события, webhook не поддерживается' };
      }
      if (!payload || typeof payload !== 'object') throw new Error('[WhatsApp] Invalid webhook payload');
      const messages = this.parseIncomingMessage(payload);
      if (!messages || messages.length === 0) return { processed: false, reason: 'no_messages' };
      return {
        processed: true,
        messages: messages.map(m => ({
          from: m.from, text: m.text, type: m.type, messageId: m.messageId, timestamp: m.timestamp
        }))
      };
    } catch (err) {
      this.log('error', 'Webhook handling failed', { error: err.message });
      throw err;
    }
  }

  async disconnect() {
    try {
      if (this.mode === 'web' && this.webClient) {
        await this.webClient.destroy();
        this.webClient = null;
        this.webReady = false;
        this.qrCode = null;
      }
      this.phoneNumberId = null;
      this.accessToken = null;
      this.verifyToken = null;
      this.initialized = false;
      this.client = null;
      this.log('info', 'WhatsApp provider disconnected');
      return true;
    } catch (err) {
      this.log('error', 'Disconnect failed', { error: err.message });
      this.initialized = false;
      return false;
    }
  }
}

module.exports = { WhatsAppProvider };
