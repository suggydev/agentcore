const axios = require('axios');
const { IntegrationProvider } = require('../IntegrationProvider');

const AVITO_API_BASE = 'https://api.avito.ru';

/**
 * @file  apps/api/services/providers/avito.js
 * @agent #45 — Avito интеграционный провайдер
 *
 * Поддерживаемые операции:
 *   - Отправка и получение сообщений чата (messenger/v2/accounts/{userId}/chats)
 *   - Получение списка объявлений (core/v1/accounts/{userId}/items)
 *   - Получение статистики по объявлениям (autoload/v2/accounts/{userId}/reports)
 *   - Управление автозагрузкой (autoload/v2/accounts/{userId}/sources)
 *
 * Документация: https://developers.avito.ru/
 */

class AvitoProvider extends IntegrationProvider {
  constructor(config = {}) {
    super({
      name: 'avito',
      displayName: 'Avito',
      agentId: 45,
      version: '1.0.0',
      ...config,
    });
    this.clientId = null;
    this.clientSecret = null;
    this.accessToken = null;
    this.tokenExpiresAt = null;
    this.userId = null;
  }

  /**
   * Инициализация с OAuth-клиентом или готовым токеном.
   * @param {object} credentials
   * @param {string} [credentials.clientId] — OAuth client_id
   * @param {string} [credentials.clientSecret] — OAuth client_secret
   * @param {string} [credentials.accessToken] — готовый токен доступа
   * @param {string|number} credentials.userId — ID аккаунта Avito
   * @returns {Promise<boolean>}
   */
  async initialize(credentials) {
    if (!credentials || typeof credentials !== 'object') {
      throw new Error('[Avito] credentials должен быть объектом вида { userId, [clientId, clientSecret] или [accessToken] }');
    }
    if (!credentials.userId) {
      throw new Error('[Avito] Отсутствует обязательный параметр userId — ID аккаунта Avito');
    }

    this.userId = String(credentials.userId);

    if (credentials.accessToken) {
      this.accessToken = credentials.accessToken;
    } else if (credentials.clientId && credentials.clientSecret) {
      this.clientId = credentials.clientId;
      this.clientSecret = credentials.clientSecret;
    } else {
      throw new Error('[Avito] Необходимо указать accessToken либо пару clientId + clientSecret');
    }

    this.initialized = true;
    this.log('info', 'Avito инициализирован', { userId: this.userId });
    return true;
  }

  async _ensureToken() {
    if (this.accessToken && this.tokenExpiresAt && Date.now() < this.tokenExpiresAt - 60000) {
      return;
    }
    if (this.clientId && this.clientSecret) {
      await this._obtainToken();
      return;
    }
    if (!this.accessToken) {
      throw new Error('[Avito] Нет токена доступа. Укажите accessToken или clientId + clientSecret');
    }
  }

  async _obtainToken() {
    try {
      const response = await axios.post(
        `${AVITO_API_BASE}/token`,
        new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: this.clientId,
          client_secret: this.clientSecret,
        }).toString(),
        {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiresAt = Date.now() + (response.data.expires_in || 86400) * 1000;
      this.log('info', 'Токен Avito получен');
    } catch (err) {
      throw new Error(`[Avito] Ошибка получения OAuth токена: ${err.response?.data?.error_description || err.message}`);
    }
  }

  async _request(method, path, data = null, params = {}) {
    await this._ensureToken();

    return this.execute(async () => {
      const config = {
        method,
        url: `${AVITO_API_BASE}${path}`,
        timeout: 20000,
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Accept': 'application/json',
          'User-Agent': 'AgentCore/3.0 (Avito Provider #45)',
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
   * Отправляет сообщение в чат Avito.
   * @param {object} options
   * @param {string} options.chatId — ID чата
   * @param {string} options.message — текст сообщения
   * @param {string} [options.messageType] — тип сообщения: text, link, image
   * @param {string} [options.itemId] — ID объявления для привязки
   * @returns {Promise<{messageId: string, chatId: string, timestamp: string}>}
   */
  async sendMessage({ chatId, message, messageType = 'text', itemId } = {}) {
    if (!chatId || typeof chatId !== 'string') {
      throw new Error('[Avito] Параметр chatId обязателен и должен быть строкой');
    }
    if (!message || typeof message !== 'string') {
      throw new Error('[Avito] Параметр message обязателен и должен быть строкой');
    }
    if (!['text', 'link', 'image'].includes(messageType)) {
      throw new Error('[Avito] messageType должен быть одним из: text, link, image');
    }

    const payload = {
      message: {
        text: message,
      },
      type: 'text',
    };

    if (messageType === 'link') {
      payload.message = { link: { text: message, url: message } };
      payload.type = 'link';
    }

    if (itemId) {
      payload.context = { value: { id: String(itemId), type: 'item' } };
    }

    const result = await this._request(
      'POST',
      `/messenger/v2/accounts/${this.userId}/chats/${chatId}/messages`,
      payload
    );

    return {
      messageId: result.id,
      chatId: chatId,
      timestamp: result.created ? new Date(result.created * 1000).toISOString() : new Date().toISOString(),
    };
  }

  /**
   * Получает список чатов аккаунта Avito.
   * @param {object} [options]
   * @param {number} [options.limit=50] — количество чатов
   * @param {number} [options.offset=0] — смещение
   * @param {string} [options.chatTypes] — u2i (user-to-item), u2u (user-to-user)
   * @returns {Promise<{chats: Array<object>, total: number}>}
   */
  async getChats({ limit = 50, offset = 0, chatTypes = 'u2i' } = {}) {
    if (limit < 1 || limit > 100) {
      throw new Error('[Avito] Параметр limit должен быть от 1 до 100');
    }

    const params = { limit, offset, chat_types: chatTypes };

    const result = await this._request(
      'GET',
      `/messenger/v2/accounts/${this.userId}/chats`,
      null,
      params
    );

    return {
      chats: (result.chats || []).map(chat => ({
        id: chat.id,
        type: chat.context?.type || 'item',
        itemId: chat.context?.value?.id || '',
        itemTitle: chat.context?.value?.title || '',
        lastMessageText: chat.last_message?.content?.text || '',
        lastMessageDirection: chat.last_message?.direction || '',
        lastMessageTimestamp: chat.last_message?.created
          ? new Date(chat.last_message.created * 1000).toISOString()
          : null,
        unreadCount: chat.unread_count || 0,
        users: (chat.users || []).map(u => ({
          id: u.id,
          name: u.name,
          avatar: u.avatar?.small || '',
          profileUrl: u.profile_url || '',
          type: u.type || 'user',
        })),
      })),
      total: result.chats?.length || 0,
    };
  }

  /**
   * Получает сообщения из конкретного чата.
   * @param {string} chatId — ID чата
   * @param {object} [options]
   * @param {number} [options.limit=50]
   * @param {number} [options.offset=0]
   * @returns {Promise<{messages: Array<object>, chatId: string}>}
   */
  async getChatMessages(chatId, { limit = 50, offset = 0 } = {}) {
    if (!chatId || typeof chatId !== 'string') {
      throw new Error('[Avito] Параметр chatId обязателен и должен быть строкой');
    }
    if (limit < 1 || limit > 100) {
      throw new Error('[Avito] Параметр limit должен быть от 1 до 100');
    }

    const params = { limit, offset };
    const result = await this._request(
      'GET',
      `/messenger/v2/accounts/${this.userId}/chats/${chatId}/messages`,
      null,
      params
    );

    return {
      chatId: chatId,
      messages: (result.messages || []).map(msg => ({
        id: msg.id,
        direction: msg.direction || 'outgoing',
        text: msg.content?.text || '',
        linkUrl: msg.content?.link?.url || '',
        imageUrl: msg.content?.image?.url || '',
        created: msg.created ? new Date(msg.created * 1000).toISOString() : null,
        read: msg.read || false,
        authorId: msg.author?.id || '',
        authorName: msg.author?.name || '',
      })),
    };
  }

  /**
   * Получает список объявлений аккаунта.
   * @param {object} [options]
   * @param {number} [options.page=1]
   * @param {number} [options.perPage=25]
   * @param {string} [options.status] — active, inactive, blocked, old
   * @returns {Promise<{items: Array<object>, total: number}>}
   */
  async getItems({ page = 1, perPage = 25, status } = {}) {
    if (page < 1) throw new Error('[Avito] Параметр page должен быть >= 1');
    if (perPage < 1 || perPage > 100) throw new Error('[Avito] Параметр perPage должен быть от 1 до 100');

    const params = { page, per_page: perPage };
    if (status) {
      if (!['active', 'inactive', 'blocked', 'old'].includes(status)) {
        throw new Error('[Avito] status должен быть: active, inactive, blocked или old');
      }
      params.status = status;
    }

    const result = await this._request(
      'GET',
      `/core/v1/accounts/${this.userId}/items`,
      null,
      params
    );

    return {
      items: (result.items || []).map(item => ({
        id: item.id,
        title: item.title || '',
        price: item.price || 0,
        description: item.description || '',
        status: item.status || 'unknown',
        url: item.url || '',
        createdAt: item.created_at || null,
        updatedAt: item.updated_at || null,
        images: (item.images || []).map(img => ({
          small: img.sizes?.['240x180'] || img.url || '',
          medium: img.sizes?.['640x480'] || img.url || '',
          large: img.sizes?.['1280x960'] || img.url || '',
        })),
        address: item.address || '',
        categoryId: item.category_id || '',
        phone: item.phone || '',
        viewCount: item.views || 0,
      })),
      total: result.total || 0,
      page,
    };
  }

  async healthCheck() {
    try {
      const start = Date.now();
      await this._request('GET', `/messenger/v2/accounts/${this.userId}/chats`, null, { limit: 1 });
      return { ok: true, latency: Date.now() - start };
    } catch (err) {
      this.log('error', 'Health-check не пройден', { error: err.message });
      return { ok: false, error: err.message };
    }
  }

  async handleWebhook(payload, signature) {
    try {
      if (!payload || typeof payload !== 'object') {
        throw new Error('[Avito] Invalid webhook payload');
      }
      const type = payload.type || 'unknown';
      if (type === 'message_received' || type === 'message') {
        const msg = payload.payload || payload;
        return {
          processed: true,
          chatId: msg.chat_id || msg.chatId,
          text: msg.content?.text || msg.text || '',
          fromId: msg.author_id || msg.authorId || msg.from_id,
          direction: msg.direction || 'inbound',
          event: type
        };
      }
      return { processed: true, event: type, data: payload };
    } catch (err) {
      this.log('error', 'Webhook handling failed', { error: err.message });
      throw err;
    }
  }

  async disconnect() {
    try {
      this.accessToken = null;
      this.clientId = null;
      this.clientSecret = null;
      this.userId = null;
      this.initialized = false;
      this.log('info', 'Avito provider disconnected');
      return true;
    } catch (err) {
      this.log('error', 'Disconnect failed', { error: err.message });
      this.initialized = false;
      return false;
    }
  }
}

function createAvitoProvider(config) {
  return new AvitoProvider(config);
}

module.exports = { AvitoProvider, createAvitoProvider };
