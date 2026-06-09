const axios = require('axios');
const { IntegrationProvider, AppError } = require('../IntegrationProvider');

const YANDEX_CALENDAR_API_BASE = 'https://api.calendar.yandex.net/v3';
const YANDEX_OAUTH_TOKEN_URL = 'https://oauth.yandex.ru/token';

/**
 * @file  apps/api/services/providers/yandexcalendar.js
 * @agent #54 — Яндекс Календарь интеграционный провайдер
 *
 * Поддерживаемые операции:
 *   - Получение списка календарей пользователя
 *   - Получение событий календаря
 *   - Создание события в календаре
 *   - Обновление / удаление события
 *   - Получение списка доступных часов (free/busy)
 *
 * Документация: https://yandex.ru/dev/calendar/
 */

class YandexCalendarProvider extends IntegrationProvider {
  constructor(config = {}) {
    super({
      name: 'yandexcalendar',
      displayName: 'Яндекс Календарь',
      agentId: 54,
      version: '1.0.0',
      ...config,
    });
    this.clientId = null;
    this.clientSecret = null;
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiresAt = null;
    this.defaultCalendarId = null;
  }

  /**
   * Инициализация с OAuth токеном или client-креденшелами.
   * @param {object} credentials
   * @param {string} [credentials.clientId] — OAuth client_id приложения Яндекса
   * @param {string} [credentials.clientSecret] — OAuth client_secret
   * @param {string} [credentials.accessToken] — готовый токен доступа
   * @param {string} [credentials.refreshToken] — refresh-токен
   * @param {string} [credentials.defaultCalendarId] — ID календаря по умолчанию
   * @returns {Promise<boolean>}
   */
  async initialize(credentials) {
    if (!credentials || typeof credentials !== 'object') {
      throw new Error('[Яндекс Календарь] credentials должен быть объектом вида { accessToken } или { clientId, clientSecret }');
    }

    if (credentials.accessToken) {
      this.accessToken = credentials.accessToken;
      this.refreshToken = credentials.refreshToken || null;
    } else if (credentials.clientId && credentials.clientSecret) {
      this.clientId = credentials.clientId;
      this.clientSecret = credentials.clientSecret;
    } else {
      throw new Error('[Яндекс Календарь] Необходимо указать accessToken или пару clientId + clientSecret');
    }

    this.defaultCalendarId = credentials.defaultCalendarId || null;

    this.initialized = true;
    this.log('info', 'Яндекс Календарь инициализирован');
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
    if (credentials.accessToken) {
      try {
        const response = await axios.get(`${YANDEX_CALENDAR_API_BASE}/calendars`, {
          headers: { Authorization: `OAuth ${credentials.accessToken}` },
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
    if (this.clientId && this.clientSecret) {
      await this._obtainToken();
      return;
    }
    if (!this.accessToken) {
      throw new Error('[Яндекс Календарь] Нет токена доступа. Вызовите initialize() с accessToken');
    }
  }

  async _obtainToken() {
    try {
      const response = await axios.post(YANDEX_OAUTH_TOKEN_URL, null, {
        params: {
          grant_type: 'refresh_token',
          refresh_token: this.refreshToken,
          client_id: this.clientId,
          client_secret: this.clientSecret,
        },
        timeout: 10000,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      this.accessToken = response.data.access_token;
      this.refreshToken = response.data.refresh_token || this.refreshToken;
      this.tokenExpiresAt = Date.now() + (response.data.expires_in || 3600) * 1000;
      this.log('info', 'Токен Яндекс Календарь обновлён');
    } catch (err) {
      throw new Error(`[Яндекс Календарь] Ошибка обновления токена: ${err.response?.data?.error_description || err.message}`);
    }
  }

  async _request(method, path, data = null, params = {}) {
    await this._ensureToken();

    return this.execute(async () => {
      const config = {
        method,
        url: `${YANDEX_CALENDAR_API_BASE}${path}`,
        timeout: 20000,
        headers: {
          'Authorization': `OAuth ${this.accessToken}`,
          'Accept': 'application/json',
          'User-Agent': 'AgentCore/3.0 (YandexCalendar Provider #54)',
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
   * Получает список календарей пользователя.
   * @returns {Promise<{calendars: Array<{id: string, name: string, description: string, timezone: string}>}>}
   */
    async sendMessage(agentId, conversationId, message) {
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      throw new AppError('[Яндекс Календарь] message is required', 400, 'VALIDATION_ERROR');
    }
    const now = new Date();
    const end = new Date(now.getTime() + 60 * 60 * 1000);
    return this.createEvent({
      calendarId: conversationId,
      summary: 'AgentCore message',
      description: message.trim(),
      startDateTime: now.toISOString(),
      endDateTime: end.toISOString(),
    });
  }

  async getCalendars() {
    const result = await this._request('GET', '/me/calendars');

    return {
      calendars: (result.calendars || result || []).map(cal => ({
        id: cal.id,
        summary: cal.summary || cal.name || 'Без названия',
        description: cal.description || '',
        timezone: cal.timezone || 'Europe/Moscow',
        location: cal.location || '',
        accessRole: cal.access_role || 'owner',
        backgroundColor: cal.background_color || '#9a9cff',
        primary: cal.primary || false,
        selected: cal.selected || false,
      })),
    };
  }

  /**
   * Получает события из указанного календаря.
   * @param {object} options
   * @param {string} [options.calendarId] — ID календаря (если не указан — defaultCalendarId)
   * @param {string} [options.timeMin] — ISO-дата начала периода
   * @param {string} [options.timeMax] — ISO-дата окончания периода
   * @param {number} [options.maxResults=100] — макс. количество событий
   * @param {string} [options.orderBy='startTime'] — сортировка: startTime | updated
   * @returns {Promise<{events: Array<object>, calendarId: string}>}
   */
  async getEvents({
    calendarId,
    timeMin,
    timeMax,
    maxResults = 100,
    orderBy = 'startTime',
  } = {}) {
    const calId = calendarId || this.defaultCalendarId;
    if (!calId) {
      throw new Error('[Яндекс Календарь] Параметр calendarId обязателен (или укажите defaultCalendarId при инициализации)');
    }
    if (maxResults < 1 || maxResults > 2500) {
      throw new Error('[Яндекс Календарь] maxResults должен быть от 1 до 2500');
    }
    if (!['startTime', 'updated'].includes(orderBy)) {
      throw new Error('[Яндекс Календарь] orderBy должен быть startTime или updated');
    }

    const params = {
      maxResults,
      orderBy,
      singleEvents: true,
    };

    if (timeMin) params.timeMin = timeMin;
    if (timeMax) params.timeMax = timeMax;

    const result = await this._request('GET', `/me/calendars/${encodeURIComponent(calId)}/events`, null, params);

    return {
      calendarId: calId,
      events: (result.events || result.items || []).map(event => ({
        id: event.id,
        summary: event.summary || '',
        description: event.description || '',
        location: event.location || '',
        start: {
          dateTime: event.start?.dateTime || event.start?.date || null,
          timeZone: event.start?.timeZone || 'Europe/Moscow',
        },
        end: {
          dateTime: event.end?.dateTime || event.end?.date || null,
          timeZone: event.end?.timeZone || 'Europe/Moscow',
        },
        allDay: !!(event.start?.date),
        status: event.status || 'confirmed',
        created: event.created || '',
        updated: event.updated || '',
        organizer: event.organizer ? {
          email: event.organizer.email || '',
          displayName: event.organizer.displayName || event.organizer.name || '',
          self: event.organizer.self || false,
        } : null,
        attendees: (event.attendees || []).map(a => ({
          email: a.email || '',
          displayName: a.displayName || a.name || '',
          responseStatus: a.responseStatus || 'needsAction',
        })),
        reminders: {
          useDefault: event.reminders?.useDefault !== false,
          overrides: (event.reminders?.overrides || []).map(r => ({
            method: r.method || 'popup',
            minutes: r.minutes || 10,
          })),
        },
        recurrence: event.recurrence || [],
        recurringEventId: event.recurringEventId || '',
      })),
    };
  }

  /**
   * Создаёт новое событие в календаре.
   * @param {object} options
   * @param {string} [options.calendarId] — ID календаря
   * @param {string} options.summary — название события
   * @param {string} [options.description] — описание
   * @param {string} [options.location] — место проведения
   * @param {string} options.startDateTime — ISO-дата начала
   * @param {string} options.endDateTime — ISO-дата окончания
   * @param {string} [options.timeZone='Europe/Moscow'] — временная зона
   * @param {Array<{email: string}>} [options.attendees] — участники
   * @param {Array<{method: string, minutes: number}>} [options.reminders] — напоминания
   * @param {string} [options.colorId] — цвет события
   * @returns {Promise<{id: string, summary: string, htmlLink: string}>}
   */
  async createEvent({
    calendarId,
    summary,
    description,
    location,
    startDateTime,
    endDateTime,
    timeZone = 'Europe/Moscow',
    attendees,
    reminders,
    colorId,
  } = {}) {
    const calId = calendarId || this.defaultCalendarId;
    if (!calId) {
      throw new Error('[Яндекс Календарь] Параметр calendarId обязателен (или укажите defaultCalendarId при инициализации)');
    }
    if (!summary || typeof summary !== 'string') {
      throw new Error('[Яндекс Календарь] Параметр summary обязателен и должен быть строкой');
    }
    if (!startDateTime) {
      throw new Error('[Яндекс Календарь] Параметр startDateTime обязателен');
    }
    if (!endDateTime) {
      throw new Error('[Яндекс Календарь] Параметр endDateTime обязателен');
    }

    const eventData = {
      summary,
      start: { dateTime: startDateTime, timeZone },
      end: { dateTime: endDateTime, timeZone },
    };

    if (description) eventData.description = description;
    if (location) eventData.location = location;
    if (colorId) eventData.colorId = colorId;

    if (attendees && Array.isArray(attendees)) {
      eventData.attendees = attendees.map(a => ({
        email: a.email,
        displayName: a.displayName || a.name || '',
      }));
    }

    if (reminders && Array.isArray(reminders)) {
      eventData.reminders = {
        useDefault: false,
        overrides: reminders.map(r => ({
          method: r.method || 'popup',
          minutes: r.minutes,
        })),
      };
    }

    const result = await this._request(
      'POST',
      `/me/calendars/${encodeURIComponent(calId)}/events`,
      eventData
    );

    this.log('info', 'Событие создано', { id: result.id, summary });

    return {
      id: result.id,
      summary: result.summary,
      htmlLink: result.htmlLink || `https://calendar.yandex.ru/event?event_id=${result.id}`,
      created: result.created,
      status: result.status || 'confirmed',
    };
  }

  /**
   * Удаляет событие из календаря.
   * @param {object} options
   * @param {string} options.eventId — ID события
   * @param {string} [options.calendarId] — ID календаря
   * @returns {Promise<{deleted: boolean, eventId: string}>}
   */
  async deleteEvent({ eventId, calendarId } = {}) {
    if (!eventId) {
      throw new Error('[Яндекс Календарь] Параметр eventId обязателен');
    }
    const calId = calendarId || this.defaultCalendarId;
    if (!calId) {
      throw new Error('[Яндекс Календарь] Параметр calendarId обязателен');
    }

    await this._request('DELETE', `/me/calendars/${encodeURIComponent(calId)}/events/${encodeURIComponent(eventId)}`);

    this.log('info', 'Событие удалено', { eventId });

    return { deleted: true, eventId };
  }

    async handleWebhook(payload, signature) {
    try {
      if (!payload || typeof payload !== 'object') {
        throw new AppError('[Яндекс Календарь] Invalid webhook payload', 400, 'INVALID_PAYLOAD');
      }
      return { processed: true, event: payload.event || 'unknown', data: payload };
    } catch (err) {
      this.log('error', 'Webhook handling failed', { error: err.message });
      throw err;
    }
  }

  async healthCheck() {
    try {
      const start = Date.now();
      await this._request('GET', '/me/calendars');
      return { ok: true, latency: Date.now() - start };
    } catch (err) {
      this.log('error', 'Health-check не пройден', { error: err.message });
      return { ok: false, error: err.message };
    }
  }
}

function createYandexCalendarProvider(config) {
  return new YandexCalendarProvider(config);
}

module.exports = { YandexCalendarProvider, createYandexCalendarProvider };
