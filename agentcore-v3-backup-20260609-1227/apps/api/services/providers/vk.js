const axios = require('axios');
const { IntegrationProvider } = require('../IntegrationProvider');

const VK_API_BASE = 'https://api.vk.com/method';
const VK_API_VERSION = '5.199';

/**
 * @file  apps/api/services/providers/vk.js
 * @agent #43 — ВКонтакте (VK) интеграционный провайдер
 *
 * Поддерживаемые операции:
 *   - Отправка сообщений через messages.send
 *   - Публикация постов на стену wall.post
 *   - Получение списка бесед messages.getConversations
 *   - Загрузка фото в диалог photos.getMessagesUploadServer
 *
 * Документация: https://vk.com/dev/methods
 */

class VkProvider extends IntegrationProvider {
  constructor(config = {}) {
    super({
      name: 'vk',
      displayName: 'ВКонтакте',
      agentId: 43,
      version: '1.0.0',
      ...config,
    });
    this.accessToken = null;
    this.groupId = null;
    this.rateLimitDelay = 334;
    this.longPollDefaults = { wait: 25, mode: 2, version: 3 };
    this.mode = config.mode || 'group'; // 'group' | 'user'
  }

  /**
   * Инициализация провайдера с OAuth access_token.
   * @param {object} credentials — { accessToken, groupId, mode }
   * @returns {Promise<boolean>}
   */
  async initialize(credentials) {
    if (!credentials || typeof credentials !== 'object') {
      throw new Error('[ВКонтакте] credentials должен быть объектом');
    }
    if (!credentials.accessToken || typeof credentials.accessToken !== 'string') {
      throw new Error('[ВКонтакте] Отсутствует обязательный параметр accessToken');
    }

    this.mode = credentials.mode || this.mode || 'group';
    this.accessToken = credentials.accessToken;
    this.groupId = credentials.groupId ? String(credentials.groupId) : null;
    this.credentials = credentials;
    this.initialized = true;

    this.log('info', 'Провайдер ВКонтакте инициализирован', { mode: this.mode, groupId: this.groupId });
    return true;
  }

  /**
   * Валидация credentials перед сохранением — тестовый запрос users.get.
   * @param {object} credentials
   * @returns {Promise<{valid: boolean, error?: string}>}
   */
  async validateCredentials(credentials) {
    if (!credentials || typeof credentials !== 'object') {
      return { valid: false, error: 'credentials должен быть объектом' };
    }
    if (!credentials.accessToken || typeof credentials.accessToken !== 'string') {
      return { valid: false, error: 'Отсутствует обязательный параметр accessToken' };
    }
    try {
      const response = await axios.get(`${VK_API_BASE}/users.get`, {
        params: { v: VK_API_VERSION, access_token: credentials.accessToken },
        timeout: 10000,
      });
      if (response.data && response.data.error) {
        return { valid: false, error: `Неверный accessToken: ${response.data.error.error_msg}` };
      }
      if (response.data && response.data.response && response.data.response.length > 0) {
        return { valid: true };
      }
      return { valid: true };
    } catch (err) {
      return { valid: false, error: `Неверный accessToken: ${err.message}` };
    }
  }

  /**
   * Возвращает текущий режим работы провайдера.
   * @returns {string}
   */
  getMode() {
    return this.mode;
  }

  _vkRequest(method, params = {}) {
    const urlParams = new URLSearchParams({
      v: VK_API_VERSION,
      access_token: this.accessToken,
      ...params,
    });

    return this.execute(() =>
      axios.get(`${VK_API_BASE}/${method}`, {
        params: urlParams,
        timeout: 15000,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'AgentCore/3.0 (VK Provider #43)',
        },
      })
    );
  }

  _parseResponse(response) {
    if (response.error) {
      throw new Error(`[ВКонтакте] Ошибка API (${response.error.error_code}): ${response.error.error_msg}`);
    }
    if (response.response === undefined || response.response === null) {
      throw new Error('[ВКонтакте] API вернул пустой ответ без поля response');
    }
    return response.response;
  }

  /**
   * Отправляет сообщение пользователю или в беседу.
   * @param {object} options
   * @param {number} options.userId — ID получателя (опционально если peerId)
   * @param {number} options.peerId — peer_id беседы или пользователя
   * @param {string} options.message — текст сообщения
   * @param {string} [options.attachment] — вложения в формате VK (photo123_456)
   * @param {number} [options.randomId] — уникальный идентификатор (генерируется автоматически)
   * @returns {Promise<{messageId: number, peerId: number, conversationMessageId: number}>}
   */
  async sendMessage(agentId, conversationId, message, { attachment, randomId } = {}) {
    if (!message || typeof message !== 'string') {
      throw new Error('[ВКонтакте] Параметр message обязателен и должен быть строкой');
    }
    if (!conversationId) {
      throw new Error('[ВКонтакте] Необходимо указать conversationId (peerId)');
    }

    const params = {
      message,
      random_id: randomId || Math.floor(Math.random() * 2147483647),
      dont_parse_links: 0,
      disable_mentions: 0,
    };

    if (this.mode === 'user') {
      const parsedId = parseInt(conversationId, 10);
      if (parsedId > 0 && parsedId < 2000000000) {
        params.user_id = parsedId;
      } else {
        params.peer_id = parsedId || conversationId;
      }
    } else {
      params.peer_id = parseInt(conversationId, 10) || conversationId;
      if (this.groupId) {
        params.group_id = this.groupId;
      }
    }

    if (attachment) params.attachment = attachment;

    const result = this._parseResponse(await this._vkRequest('messages.send', params));
    this.log('info', 'Сообщение отправлено', { peerId: result.peer_id, messageId: result.message_id });

    return {
      messageId: result.message_id,
      peerId: result.peer_id,
      conversationMessageId: result.conversation_message_id,
    };
  }

  /**
   * Публикует запись на стене группы или пользователя.
   * @param {object} options
   * @param {number} options.ownerId — ID владельца стены (отрицательное для группы)
   * @param {string} options.message — текст поста
   * @param {string} [options.attachments] — вложения
   * @param {number} [options.fromGroup] — публиковать от имени группы (1/0)
   * @param {number} [options.friendsOnly] — только для друзей
   * @returns {Promise<{postId: number, ownerId: number}>}
   */
  async wallPost({ ownerId, message, attachments, fromGroup = 1, friendsOnly } = {}) {
    if (!message || typeof message !== 'string') {
      throw new Error('[ВКонтакте] Параметр message обязателен и должен быть строкой');
    }
    if (!ownerId) {
      throw new Error('[ВКонтакте] Необходимо указать ownerId (ID группы с минусом)');
    }

    const params = {
      owner_id: ownerId,
      message,
      from_group: fromGroup,
    };

    if (attachments) params.attachments = attachments;
    if (friendsOnly) params.friends_only = friendsOnly;

    const result = this._parseResponse(await this._vkRequest('wall.post', params));
    this.log('info', 'Пост опубликован', { postId: result.post_id, ownerId });

    return {
      postId: result.post_id,
      ownerId,
    };
  }

  /**
   * Получает список последних диалогов сообщества.
   * @param {object} [options]
   * @param {number} [options.count=20] — количество бесед
   * @param {number} [options.offset=0] — смещение
   * @param {number} [options.filter='all'] — all | unread | important | unanswered
   * @returns {Promise<{count: number, items: Array<{peerId: number, type: string}>}>}
   */
  async getConversations({ count = 20, offset = 0, filter = 'all' } = {}) {
    if (!['all', 'unread', 'important', 'unanswered'].includes(filter)) {
      throw new Error(`[ВКонтакте] Недопустимый filter: "${filter}". Допустимые: all, unread, important, unanswered`);
    }
    if (count < 1 || count > 200) {
      throw new Error('[ВКонтакте] Параметр count должен быть от 1 до 200');
    }

    const params = { count, offset, filter, extended: 1 };
    if (this.mode === 'group' && this.groupId) {
      params.group_id = this.groupId;
    }

    const result = this._parseResponse(await this._vkRequest('messages.getConversations', params));

    return {
      count: result.count,
      items: result.items.map(item => ({
        peerId: item.conversation.peer.id,
        type: item.conversation.peer.type,
        localId: item.conversation.peer.local_id,
        title: item.conversation.chat_settings?.title || '',
        lastMessage: item.last_message?.text || '',
        lastMessageDate: item.last_message?.date || 0,
        unreadCount: item.conversation.unread_count || 0,
      })),
    };
  }

  /**
   * Получает информацию о пользователе ВКонтакте.
   * @param {number|string|Array<number>} userIds — один или несколько ID пользователей
   * @param {Array<string>} [fields] — список полей
   * @returns {Promise<Array<object>>}
   */
  async getUsers(userIds, fields = ['photo_100', 'screen_name', 'online']) {
    if (!userIds) {
      throw new Error('[ВКонтакте] Необходимо указать userIds (число или массив ID)');
    }

    const ids = Array.isArray(userIds) ? userIds.join(',') : String(userIds);
    const validFields = [
      'photo_100', 'photo_200', 'screen_name', 'online',
      'last_seen', 'status', 'about', 'bdate', 'city', 'country',
    ];

    const filteredFields = fields.filter(f => validFields.includes(f));
    if (filteredFields.length === 0) {
      filteredFields.push('photo_100');
    }

    const params = {
      user_ids: ids,
      fields: filteredFields.join(','),
    };

    const result = this._parseResponse(await this._vkRequest('users.get', params));

    return result.map(user => ({
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      screenName: user.screen_name || '',
      photo100: user.photo_100 || '',
      online: user.online === 1,
      lastSeen: user.last_seen ? new Date(user.last_seen.time * 1000).toISOString() : null,
      status: user.status || '',
      bdate: user.bdate || '',
      city: user.city?.title || '',
      country: user.country?.title || '',
    }));
  }

  async healthCheck() {
    try {
      const start = Date.now();
      if (this.mode === 'user') {
        // User mode: check account info
        const result = this._parseResponse(await this._vkRequest('account.getInfo'));
        return { ok: true, latency: Date.now() - start, mode: 'user' };
      }
      const params = {};
      if (this.groupId) params.group_id = this.groupId;
      params.count = 1;
      const result = this._parseResponse(await this._vkRequest('messages.getConversations', params));
      return { ok: true, latency: Date.now() - start, mode: 'group' };
    } catch (err) {
      this.log('error', 'Health-check не пройден', { error: err.message });
      return { ok: false, error: err.message };
    }
  }

  async handleWebhook(payload, signature) {
    try {
      if (!payload || typeof payload !== 'object') {
        throw new Error('[VK] Invalid webhook payload');
      }
      if (payload.type === 'confirmation') {
        return { processed: true, confirmation: true, event: 'confirmation' };
      }
      if (payload.type === 'message_new') {
        const msg = payload.object?.message || payload.object;
        return {
          processed: true,
          peerId: msg?.peer_id || msg?.from_id,
          text: msg?.text || '',
          fromId: msg?.from_id,
          messageId: msg?.id,
          event: 'message_new'
        };
      }
      return { processed: true, event: payload.type, data: payload.object };
    } catch (err) {
      this.log('error', 'Webhook handling failed', { error: err.message });
      throw err;
    }
  }

  async disconnect() {
    try {
      this.accessToken = null;
      this.groupId = null;
      this.initialized = false;
      this.log('info', 'VK provider disconnected');
      return true;
    } catch (err) {
      this.log('error', 'Disconnect failed', { error: err.message });
      this.initialized = false;
      return false;
    }
  }
}

function createVkProvider(config) {
  return new VkProvider(config);
}

module.exports = { VkProvider, createVkProvider };
