const axios = require('axios');
const { IntegrationProvider, AppError } = require('../IntegrationProvider');

class WhatsAppProvider extends IntegrationProvider {
  constructor(config = {}) {
    super({
      name: 'whatsapp',
      displayName: 'WhatsApp Cloud API',
      agentId: config.agentId || 45,
      version: '1.0.0'
    });

    this.phoneNumberId = config.phoneNumberId || null;
    this.accessToken = config.accessToken || null;
    this.apiVersion = 'v17.0';
    this.verifyToken = config.verifyToken || null;
    this.baseUrl = 'https://graph.facebook.com';
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 15000
    });
    this.initialized = !!(this.phoneNumberId && this.accessToken);
  }

  async initialize(credentials) {
    if (!credentials || !credentials.phoneNumberId || !credentials.accessToken) {
      throw new AppError(
        '[WhatsApp] Для инициализации необходимы phoneNumberId и accessToken.',
        400,
        'MISSING_CREDENTIALS'
      );
    }
    this.phoneNumberId = credentials.phoneNumberId;
    this.accessToken = credentials.accessToken;
    if (credentials.verifyToken) {
      this.verifyToken = credentials.verifyToken;
    }
    if (credentials.apiVersion) {
      this.apiVersion = credentials.apiVersion;
    }
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 15000
    });
    this.initialized = true;
    this.log('info', 'WhatsAppProvider инициализирован');
  }

  ensureInitialized() {
    if (!this.initialized || !this.phoneNumberId || !this.accessToken) {
      throw new AppError(
        '[WhatsApp] Провайдер не инициализирован. Вызовите initialize() с phoneNumberId и accessToken.',
        500,
        'NOT_INITIALIZED'
      );
    }
  }

  _headers() {
    return {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json'
    };
  }

  _recipient(to) {
    return { recipient_type: 'individual', to };
  }

  sendMessage(to, text) {
    this.ensureInitialized();

    return this.execute(async () => {
      const response = await this.client.post(
        `/${this.apiVersion}/${this.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          ...this._recipient(to),
          type: 'text',
          text: {
            preview_url: false,
            body: text
          }
        },
        { headers: this._headers() }
      );

      return response.data;
    });
  }

  sendTemplate(to, templateName, languageCode = 'ru', components = []) {
    this.ensureInitialized();

    return this.execute(async () => {
      const payload = {
        messaging_product: 'whatsapp',
        ...this._recipient(to),
        type: 'template',
        template: {
          name: templateName,
          language: { code: languageCode }
        }
      };

      if (components.length > 0) {
        payload.template.components = components;
      }

      const response = await this.client.post(
        `/${this.apiVersion}/${this.phoneNumberId}/messages`,
        payload,
        { headers: this._headers() }
      );

      return response.data;
    });
  }

  sendImage(to, imageUrl, caption = '') {
    this.ensureInitialized();

    return this.execute(async () => {
      const payload = {
        messaging_product: 'whatsapp',
        ...this._recipient(to),
        type: 'image',
        image: { link: imageUrl }
      };

      if (caption) {
        payload.image.caption = caption;
      }

      const response = await this.client.post(
        `/${this.apiVersion}/${this.phoneNumberId}/messages`,
        payload,
        { headers: this._headers() }
      );

      return response.data;
    });
  }

  sendDocument(to, documentUrl, filename = '', caption = '') {
    this.ensureInitialized();

    return this.execute(async () => {
      const payload = {
        messaging_product: 'whatsapp',
        ...this._recipient(to),
        type: 'document',
        document: { link: documentUrl }
      };

      if (filename) payload.document.filename = filename;
      if (caption) payload.document.caption = caption;

      const response = await this.client.post(
        `/${this.apiVersion}/${this.phoneNumberId}/messages`,
        payload,
        { headers: this._headers() }
      );

      return response.data;
    });
  }

  markAsRead(messageId) {
    this.ensureInitialized();

    return this.execute(async () => {
      const response = await this.client.post(
        `/${this.apiVersion}/${this.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          status: 'read',
          message_id: messageId
        },
        { headers: this._headers() }
      );

      return response.data;
    });
  }

  verifyWebhook(mode, token, challenge) {
    if (!this.verifyToken) {
      this.log('error', '[WhatsApp] verifyToken не настроен — верификация невозможна');
      return null;
    }

    if (mode === 'subscribe' && token === this.verifyToken) {
      this.log('info', 'Webhook верифицирован успешно');
      return challenge;
    }

    this.log('error', `Верификация webhook не удалась: mode=${mode}, token совпадает=${token === this.verifyToken}`);
    return null;
  }

  parseIncomingMessage(body) {
    if (!body || !body.entry || !Array.isArray(body.entry)) {
      return null;
    }

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

  async getMediaUrl(mediaId) {
    this.ensureInitialized();

    return this.execute(async () => {
      const response = await this.client.get(
        `/${this.apiVersion}/${mediaId}`,
        { headers: this._headers() }
      );
      return response.data;
    });
  }
}

module.exports = { WhatsAppProvider };
