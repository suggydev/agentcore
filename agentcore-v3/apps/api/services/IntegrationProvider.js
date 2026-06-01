/**
 * IntegrationProvider — базовый класс для всех интеграционных коннекторов AgentCore.
 * Каждый агент-разработчик (Agent #40-#54) обязан наследовать этот класс.
 *
 * @file apps/api/services/IntegrationProvider.js
 */

const axios = require('axios');
const { EventEmitter } = require('events');

class AppError extends Error {
  constructor(message, statusCode, code) {
    super(message);
    this.statusCode = statusCode || 500;
    this.code = code || 'INTEGRATION_ERROR';
    this.isOperational = true;
  }
}

class IntegrationProvider extends EventEmitter {
  /**
   * @param {object} config — { name, displayName, agentId, version }
   */
  constructor(config) {
    super();
    this.name = config.name;
    this.displayName = config.displayName;
    this.agentId = config.agentId;
    this.version = config.version || '1.0.0';
    this.client = null;
    this.initialized = false;
    this.rateLimitQueue = [];
    this.maxRetries = 3;
    this.retryDelay = 1000;
  }

  /**
   * Инициализация провайдера (OAuth / API Key).
   * Должна быть переопределена в дочернем классе.
   * @param {object} credentials
   */
  async initialize(credentials) {
    throw new AppError(
      `[${this.displayName}] initialize() must be implemented by Agent #${this.agentId}`,
      501,
      'NOT_IMPLEMENTED'
    );
  }

  /**
   * Выполняет API-запрос с обработкой rate-limit, retry и error boundary.
   * @param {Function} requestFn — async () => axios response
   * @returns {Promise<any>}
   */
  async execute(requestFn) {
    let lastError;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await requestFn();
        this.emit('request:success', { provider: this.name, attempt });
        return response.data || response;
      } catch (err) {
        lastError = err;

        const status = err.response?.status;
        const retryAfter = parseInt(err.response?.headers?.['retry-after'] || '0');

        if (status === 429) {
          const delay = Math.max(retryAfter * 1000, this.retryDelay * attempt);
          this.emit('rateLimit:hit', { provider: this.name, delay, attempt });
          await this.sleep(delay);
          continue;
        }

        if (status >= 500 || err.code === 'ECONNABORTED' || err.code === 'ECONNRESET') {
          const delay = this.retryDelay * attempt;
          this.emit('request:retry', { provider: this.name, attempt, status, delay });
          await this.sleep(delay);
          continue;
        }

        throw new AppError(
          `[${this.displayName}] API error: ${err.message}`,
          status || 502,
          'API_ERROR'
        );
      }
    }

    throw new AppError(
      `[${this.displayName}] Failed after ${this.maxRetries} retries: ${lastError?.message}`,
      502,
      'MAX_RETRIES'
    );
  }

  /**
   * Проверка health-check провайдера.
   * @returns {Promise<{ok: boolean, latency?: number}>}
   */
  async healthCheck() {
    try {
      const start = Date.now();
      await this.execute(() => this.client.get('/health', { timeout: 5000 }));
      return { ok: true, latency: Date.now() - start };
    } catch {
      return { ok: false };
    }
  }

  /**
   * Безопасное логирование — не логирует敏感的 данные (ключи, токены).
   * @param {string} level
   * @param {string} message
   * @param {object} meta
   */
  log(level, message, meta = {}) {
    const sanitized = { ...meta };
    delete sanitized.token;
    delete sanitized.apiKey;
    delete sanitized.secretKey;
    delete sanitized.password;
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      provider: this.name,
      agentId: this.agentId,
      level,
      message,
      ...sanitized,
    }));
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = { IntegrationProvider, AppError };
