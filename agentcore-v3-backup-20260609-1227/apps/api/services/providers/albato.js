const axios = require('axios');
const { IntegrationProvider, AppError } = require('../IntegrationProvider');

const ALBATO_API_BASE = 'https://api.albato.ru/v2';

/**
 * @file  apps/api/services/providers/albato.js
 * @agent #49 — Albato интеграционный провайдер
 *
 * Поддерживаемые операции:
 *   - Запуск сценария (Webhook Trigger / Scenario run)
 *   - Получение списка активных интеграций
 *   - Получение статуса выполнения сценария
 *   - Получение логов сценария
 *   - Создание / обновление коннектора
 *
 * Документация: https://albato.ru/api/
 */

class AlbatoProvider extends IntegrationProvider {
  constructor(config = {}) {
    super({
      name: 'albato',
      displayName: 'Albato',
      agentId: 49,
      version: '1.0.0',
      ...config,
    });
    this.apiToken = null;
    this.workspaceId = null;
    this.webhookBasePath = '/webhook/run';
  }

  /**
   * Инициализация провайдера с API-токеном Albato.
   * @param {object} credentials
   * @param {string} credentials.apiToken — API-токен из личного кабинета Albato
   * @param {string|number} [credentials.workspaceId] — ID рабочего пространства
   * @returns {Promise<boolean>}
   */
  async initialize(credentials) {
    if (!credentials || typeof credentials !== 'object') {
      throw new Error('[Albato] credentials должен быть объектом вида { apiToken }');
    }
    if (!credentials.apiToken || typeof credentials.apiToken !== 'string' || credentials.apiToken.length < 8) {
      throw new Error('[Albato] Отсутствует или некорректен обязательный параметр apiToken');
    }

    this.apiToken = credentials.apiToken;
    this.workspaceId = credentials.workspaceId ? String(credentials.workspaceId) : null;

    this.initialized = true;
    this.log('info', 'Albato инициализирован', { workspaceId: this.workspaceId });
    return true;
  }

  /**
   * Валидация credentials перед сохранением — тестовый запрос к Albato API.
   * @param {object} credentials
   * @returns {Promise<{valid: boolean, error?: string}>}
   */
  async validateCredentials(credentials) {
    if (!credentials || typeof credentials !== 'object') {
      return { valid: false, error: 'credentials должен быть объектом' };
    }
    if (!credentials.apiToken || typeof credentials.apiToken !== 'string' || credentials.apiToken.length < 8) {
      return { valid: false, error: 'apiToken обязателен (минимум 8 символов)' };
    }
    try {
      const response = await axios.get(`${ALBATO_API_BASE}/user`, {
        headers: { Authorization: `Bearer ${credentials.apiToken}`, Accept: 'application/json' },
        timeout: 10000,
      });
      if (response.data && (response.data.id || response.data.email)) {
        return { valid: true };
      }
      return { valid: false, error: 'Неверный apiToken' };
    } catch (err) {
      return { valid: false, error: `Неверный apiToken: ${err.response?.data?.message || err.message}` };
    }
  }

  async _request(method, path, data = null, params = {}) {
    return this.execute(async () => {
      const config = {
        method,
        url: `${ALBATO_API_BASE}${path}`,
        timeout: 30000,
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Accept': 'application/json',
          'User-Agent': 'AgentCore/3.0 (Albato Provider #49)',
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
   * Запускает сценарий Albato через API с передачей данных.
   * @param {object} options
   * @param {string} options.scenarioId — ID сценария в Albato
   * @param {object} [options.data={}] — данные для передачи в сценарий
   * @param {boolean} [options.async=true] — асинхронный запуск
   * @returns {Promise<{executionId: string, scenarioId: string, status: string, timestamp: string}>}
   */
    async sendMessage(agentId, conversationId, message) {
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      throw new AppError('[Albato] message is required', 400, 'VALIDATION_ERROR');
    }
    const payload = {
      agentId,
      conversationId,
      message: message.trim(),
      timestamp: new Date().toISOString(),
    };
    try {
      const result = await this._request('POST', '/webhook/run', payload);
      return { triggerId: result.id || '', status: result.status || 'queued' };
    } catch (err) {
      this.log('error', 'sendMessage failed', { error: err.message });
      throw err;
    }
  }

  async runScenario({ scenarioId, data = {}, async: isAsync = true } = {}) {
    if (!scenarioId || typeof scenarioId !== 'string') {
      throw new Error('[Albato] Параметр scenarioId обязателен и должен быть строкой');
    }
    if (data && typeof data !== 'object') {
      throw new Error('[Albato] Параметр data должен быть объектом');
    }

    const payload = {
      scenarioId,
      data,
      async: isAsync,
    };

    const result = await this._request('POST', '/scenarios/run', payload);

    this.log('info', 'Сценарий запущен', { scenarioId, executionId: result.executionId || result.id });

    return {
      executionId: result.executionId || result.id || '',
      scenarioId: scenarioId,
      status: result.status || 'queued',
      timestamp: result.timestamp || new Date().toISOString(),
    };
  }

  /**
   * Получает список активных интеграций.
   * @param {object} [options]
   * @param {string} [options.type] — тип интеграции: scenario, connector, webhook
   * @param {string} [options.status] — статус: active, paused, error
   * @param {number} [options.limit=50]
   * @param {number} [options.offset=0]
   * @returns {Promise<{integrations: Array<object>, total: number}>}
   */
  async getIntegrations({ type, status, limit = 50, offset = 0 } = {}) {
    if (limit < 1 || limit > 200) {
      throw new Error('[Albato] Параметр limit должен быть от 1 до 200');
    }

    const params = { limit, offset };
    if (type) params.type = type;
    if (status) params.status = status;

    const result = await this._request('GET', '/integrations', null, params);

    return {
      integrations: (result.integrations || result.items || result.data || []).map(integration => ({
        id: integration.id,
        name: integration.name || '',
        type: integration.type || 'scenario',
        status: integration.status || 'unknown',
        createdAt: integration.createdAt || integration.created_at || '',
        updatedAt: integration.updatedAt || integration.updated_at || '',
        source: integration.source ? {
          app: integration.source.app || '',
          appName: integration.source.appName || integration.source.app_name || '',
          trigger: integration.source.trigger || '',
        } : null,
        target: integration.target ? {
          app: integration.target.app || '',
          appName: integration.target.appName || integration.target.app_name || '',
          action: integration.target.action || '',
        } : null,
        lastRunAt: integration.lastRunAt || integration.last_run_at || null,
        runsCount: integration.runsCount || integration.runs_count || 0,
        errorsCount: integration.errorsCount || integration.errors_count || 0,
      })),
      total: result.total || (result.integrations || result.items || result.data || []).length,
    };
  }

  /**
   * Получает статус конкретного выполнения сценария.
   * @param {string} executionId — ID выполнения
   * @returns {Promise<{executionId: string, status: string, startedAt: string, finishedAt: string|null, errorMessage: string|null}>}
   */
  async getExecutionStatus(executionId) {
    if (!executionId || typeof executionId !== 'string') {
      throw new Error('[Albato] Параметр executionId обязателен и должен быть строкой');
    }

    const result = await this._request('GET', `/executions/${encodeURIComponent(executionId)}`);

    return {
      executionId: result.executionId || result.id || executionId,
      scenarioId: result.scenarioId || result.scenario_id || '',
      status: result.status || 'unknown',
      startedAt: result.startedAt || result.started_at || '',
      finishedAt: result.finishedAt || result.finished_at || null,
      duration: result.duration || 0,
      errorMessage: result.errorMessage || result.error || null,
      steps: (result.steps || []).map(step => ({
        id: step.id || step.stepId || '',
        name: step.name || '',
        status: step.status || 'pending',
        startedAt: step.startedAt || step.started_at || '',
        finishedAt: step.finishedAt || step.finished_at || '',
        input: step.input || {},
        output: step.output || {},
        error: step.error || null,
      })),
    };
  }

  /**
   * Получает список доступных коннекторов (приложений для интеграции).
   * @param {object} [options]
   * @param {string} [options.category] — категория: crm, email, messenger, payment
   * @param {string} [options.search] — поиск по названию
   * @returns {Promise<{connectors: Array<object>, total: number}>}
   */
  async getConnectors({ category, search } = {}) {
    const params = {};
    if (category) params.category = category;
    if (search) params.search = search;

    const result = await this._request('GET', '/connectors', null, params);

    return {
      connectors: (result.connectors || result.items || result.data || []).map(connector => ({
        id: connector.id,
        name: connector.name || '',
        code: connector.code || '',
        description: connector.description || '',
        category: connector.category || '',
        icon: connector.icon || '',
        triggers: connector.triggers || [],
        actions: connector.actions || [],
        isConfigured: connector.isConfigured || connector.is_configured || false,
        createdAt: connector.createdAt || connector.created_at || '',
      })),
      total: result.total || (result.connectors || result.items || result.data || []).length,
    };
  }

  async healthCheck() {
    try {
      const start = Date.now();
      await this._request('GET', '/status');
      return { ok: true, latency: Date.now() - start };
    } catch (err) {
      this.log('error', 'Health-check не пройден', { error: err.message });
      return { ok: false, error: err.message };
    }
  }

  async handleWebhook(payload, signature) {
    try {
      if (!payload || typeof payload !== 'object') {
        throw new Error('[Albato] Invalid webhook payload');
      }
      return {
        processed: true,
        scenarioId: payload.scenario_id || payload.scenarioId || '',
        executionId: payload.execution_id || payload.executionId || '',
        data: payload.data || {},
        event: payload.event || 'scenario_complete'
      };
    } catch (err) {
      this.log('error', 'Webhook handling failed', { error: err.message });
      throw err;
    }
  }

  async disconnect() {
    try {
      this.apiToken = null;
      this.workspaceId = null;
      this.initialized = false;
      this.log('info', 'Albato provider disconnected');
      return true;
    } catch (err) {
      this.log('error', 'Disconnect failed', { error: err.message });
      this.initialized = false;
      return false;
    }
  }
}

function createAlbatoProvider(config) {
  return new AlbatoProvider(config);
}

module.exports = { AlbatoProvider, createAlbatoProvider };
