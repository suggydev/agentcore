const axios = require('axios');
const { IntegrationProvider } = require('../IntegrationProvider');

const YCF_API_BASE = 'https://serverless-functions.api.cloud.yandex.net';
const YCF_INVOKE_BASE = 'https://functions.yandexcloud.net';

/**
 * @file  apps/api/services/providers/yandexcloudfunctions.js
 * @agent #49 — Yandex Cloud Functions интеграционный провайдер
 *
 * Поддерживаемые операции:
 *   - Вызов функции (invokeFunction)
 *   - Список функций (listFunctions)
 *   - Обработка webhook результата вызова (handleWebhook)
 *   - Проверка доступности API (healthCheck)
 *
 * Документация: https://cloud.yandex.ru/docs/functions/
 */

class YandexCloudFunctionsProvider extends IntegrationProvider {
  constructor(config = {}) {
    super({
      name: 'yandexcloudfunctions',
      displayName: 'Yandex Cloud Functions',
      agentId: 49,
      version: '1.0.0',
      ...config,
    });
    this.iamToken = null;
    this.folderId = null;
    this.functionId = null;
    this.serviceAccountKey = null;
    this.apiBase = YCF_API_BASE;
    this.invokeBase = YCF_INVOKE_BASE;
  }

  /**
   * Инициализация провайдера Yandex Cloud Functions.
   * @param {object} credentials
   * @param {string} credentials.iamToken — IAM-токен для аутентификации
   * @param {string} credentials.folderId — ID каталога в Yandex Cloud
   * @param {string} [credentials.functionId] — ID функции по умолчанию
   * @param {object} [credentials.serviceAccountKey] — JSON с ключом сервисного аккаунта (опционально)
   * @returns {Promise<boolean>}
   */
  async initialize(credentials) {
    if (!credentials || typeof credentials !== 'object') {
      throw new Error('[YCF] credentials должен быть объектом');
    }
    if (!credentials.iamToken || typeof credentials.iamToken !== 'string') {
      throw new Error('[YCF] Отсутствует обязательный параметр iamToken');
    }
    if (!credentials.folderId || typeof credentials.folderId !== 'string') {
      throw new Error('[YCF] Отсутствует обязательный параметр folderId');
    }

    this.iamToken = credentials.iamToken;
    this.folderId = credentials.folderId;
    this.functionId = credentials.functionId || null;
    this.serviceAccountKey = credentials.serviceAccountKey || null;
    this.apiBase = credentials.apiBase || YCF_API_BASE;
    this.invokeBase = credentials.invokeBase || YCF_INVOKE_BASE;
    this.credentials = credentials;
    this.initialized = true;

    this.log('info', 'Yandex Cloud Functions инициализирован', { folderId: this.folderId });
    return true;
  }

  /**
   * Валидация credentials перед сохранением — тестовый запрос к Yandex Cloud API (list functions).
   * @param {object} credentials
   * @returns {Promise<{valid: boolean, error?: string}>}
   */
  async validateCredentials(credentials) {
    if (!credentials || typeof credentials !== 'object') {
      return { valid: false, error: 'credentials должен быть объектом' };
    }
    if (!credentials.iamToken || typeof credentials.iamToken !== 'string') {
      return { valid: false, error: 'iamToken обязателен' };
    }
    if (!credentials.folderId || typeof credentials.folderId !== 'string') {
      return { valid: false, error: 'folderId обязателен' };
    }
    try {
      const response = await axios.get(`${YCF_API_BASE}/functions/v1/functions`, {
        headers: { Authorization: `Bearer ${credentials.iamToken}` },
        params: { folderId: credentials.folderId, pageSize: 1 },
        timeout: 10000,
      });
      if (response.status === 200) {
        return { valid: true };
      }
      return { valid: false, error: 'Неверный iamToken или folderId' };
    } catch (err) {
      return { valid: false, error: `Неверный iamToken или folderId: ${err.response?.data?.message || err.message}` };
    }
  }

  _ycfHeaders() {
    return {
      'Authorization': `Bearer ${this.iamToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'AgentCore/3.0 (YCF Provider #49)',
    };
  }

  _ycfRequest(method, path, data = null, params = null, useInvokeBase = false) {
    const base = useInvokeBase ? this.invokeBase : this.apiBase;
    const config = {
      method,
      url: `${base}${path}`,
      timeout: 30000,
      headers: this._ycfHeaders(),
    };

    if (data && typeof data === 'object') {
      config.data = data;
    }
    if (params && typeof params === 'object') {
      config.params = params;
    }

    return this.execute(() => axios(config));
  }

  /**
   * Вызывает функцию Yandex Cloud Functions.
   * @param {object} options
   * @param {string} options.functionId — ID функции (или используется functionId из credentials)
   * @param {object} options.payload — JSON-полезная нагрузка для функции
   * @param {string} [options.versionId] — ID конкретной версии функции
   * @param {object} [options.tags] — теги вызова (опционально)
   * @param {boolean} [options.async=false] — асинхронный вызов
   * @returns {Promise<{functionId: string, result: any, statusCode: number, executionTime: number, logs: string|null}>}
   */
  async invokeFunction({ functionId, payload, versionId, tags, async = false } = {}) {
    if (!this.initialized) {
      throw new Error('[YCF] Провайдер не инициализирован. Вызовите initialize()');
    }

    const targetFunctionId = functionId || this.functionId;
    if (!targetFunctionId || typeof targetFunctionId !== 'string') {
      throw new Error('[YCF] Параметр functionId обязателен и должен быть строкой');
    }
    if (!payload || typeof payload !== 'object') {
      throw new Error('[YCF] Параметр payload обязателен и должен быть объектом');
    }

    const startTime = Date.now();

    try {
      let path = `/${targetFunctionId}`;
      if (versionId) {
        path += `?versionId=${encodeURIComponent(versionId)}`;
      }
      if (async) {
        path += versionId ? '&async=true' : '?async=true';
      }

      const response = await this._ycfRequest('POST', path, payload, null, true);
      const data = response.data || response;
      const statusCode = response.status || 200;

      this.log('info', 'Функция вызвана', { functionId: targetFunctionId, statusCode, duration: Date.now() - startTime });

      return {
        functionId: targetFunctionId,
        result: data,
        statusCode,
        executionTime: Date.now() - startTime,
        logs: data?.logs || data?.log || null,
      };
    } catch (err) {
      this.log('error', 'Ошибка вызова функции', { error: err.message, functionId: targetFunctionId });
      throw err;
    }
  }

  /**
   * Получает список функций в каталоге Yandex Cloud.
   * @param {string} [folderId] — ID каталога (или используется folderId из credentials)
   * @param {object} [options]
   * @param {number} [options.pageSize=50] — размер страницы
   * @param {string} [options.pageToken] — токен следующей страницы
   * @returns {Promise<{functions: Array<{id: string, name: string, description: string, status: string, createdAt: string}>, nextPageToken: string|null}>}
   */
  async listFunctions(folderId, { pageSize = 50, pageToken } = {}) {
    if (!this.initialized) {
      throw new Error('[YCF] Провайдер не инициализирован. Вызовите initialize()');
    }

    const targetFolderId = folderId || this.folderId;
    if (!targetFolderId || typeof targetFolderId !== 'string') {
      throw new Error('[YCF] Параметр folderId обязателен и должен быть строкой');
    }
    if (typeof pageSize !== 'number' || pageSize < 1 || pageSize > 100) {
      throw new Error('[YCF] Параметр pageSize должен быть числом от 1 до 100');
    }

    const params = {
      folderId: targetFolderId,
      pageSize,
    };
    if (pageToken && typeof pageToken === 'string') {
      params.pageToken = pageToken;
    }

    try {
      const response = await this._ycfRequest('GET', '/functions/v1/functions', null, params);
      const data = response.data || response;

      const functions = (data.functions || []).map(fn => ({
        id: fn.id || '',
        name: fn.name || '',
        description: fn.description || '',
        status: fn.status || 'unknown',
        createdAt: fn.createdAt || '',
      }));

      return {
        functions,
        nextPageToken: data.nextPageToken || null,
      };
    } catch (err) {
      this.log('error', 'Ошибка получения списка функций', { error: err.message, folderId: targetFolderId });
      throw err;
    }
  }

  /**
   * Отправляет сообщение через провайдер YCF (вызывает функцию с payload).
   * @param {string} agentId — ID агента
   * @param {string} conversationId — ID разговора/контекста
   * @param {object} message — payload для функции
   * @returns {Promise<{ok: boolean, functionId: string, result: any, statusCode: number}>}
   */
  async sendMessage(agentId, conversationId, message) {
    try {
      if (!message || typeof message !== 'object') {
        throw new Error('[YCF] message должен быть объектом с payload для функции');
      }

      const result = await this.invokeFunction({
        functionId: message.functionId || this.functionId,
        payload: {
          agentId: String(agentId || ''),
          conversationId: String(conversationId || ''),
          ...message.payload,
        },
        versionId: message.versionId,
        async: message.async === true,
      });

      return {
        ok: true,
        functionId: result.functionId,
        result: result.result,
        statusCode: result.statusCode,
        executionTime: result.executionTime,
      };
    } catch (err) {
      this.log('error', 'sendMessage failed', { error: err.message, agentId, conversationId });
      throw err;
    }
  }

  /**
   * Обрабатывает webhook от Yandex Cloud Functions (результат асинхронного вызова).
   * @param {object} payload — тело webhook
   * @param {string} signature — подпись запроса (IAM или API-ключ)
   * @returns {Promise<{processed: boolean, event: string, functionId: string, statusCode: number, result: any, invocationId: string|null}>}
   */
  async handleWebhook(payload, signature) {
    try {
      if (!payload || typeof payload !== 'object') {
        throw new Error('[YCF] Invalid webhook payload');
      }

      const event = payload.event || payload.type || 'function.result';
      const functionId = payload.functionId || payload.function_id || payload.details?.functionId || 'unknown';
      const statusCode = payload.statusCode || payload.status_code || payload.response?.statusCode || 200;
      const result = payload.result || payload.response || payload.data || null;
      const invocationId = payload.invocationId || payload.invocation_id || payload.id || null;

      this.log('info', 'Webhook: результат вызова функции', { event, functionId, statusCode, invocationId });

      return {
        processed: true,
        event: String(event),
        functionId: String(functionId),
        statusCode: typeof statusCode === 'number' ? statusCode : 200,
        result,
        invocationId: invocationId ? String(invocationId) : null,
      };
    } catch (err) {
      this.log('error', 'Webhook handling failed', { error: err.message });
      throw err;
    }
  }

  async healthCheck() {
    try {
      const start = Date.now();
      if (this.functionId) {
        await this.invokeFunction({
          functionId: this.functionId,
          payload: { healthCheck: true, timestamp: Date.now() },
        });
      } else {
        await this.listFunctions(this.folderId, { pageSize: 1 });
      }
      return { ok: true, latency: Date.now() - start };
    } catch (err) {
      this.log('error', 'Health-check не пройден', { error: err.message });
      return { ok: false, error: err.message };
    }
  }

  async disconnect() {
    try {
      this.iamToken = null;
      this.folderId = null;
      this.functionId = null;
      this.serviceAccountKey = null;
      this.initialized = false;
      this.credentials = null;
      this.log('info', 'Yandex Cloud Functions provider disconnected');
      return true;
    } catch (err) {
      this.log('error', 'Disconnect failed', { error: err.message });
      this.initialized = false;
      return false;
    }
  }
}

function createYandexCloudFunctionsProvider(config) {
  return new YandexCloudFunctionsProvider(config);
}

module.exports = { YandexCloudFunctionsProvider, createYandexCloudFunctionsProvider };
