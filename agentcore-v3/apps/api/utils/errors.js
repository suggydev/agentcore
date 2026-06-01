const errorDictionary = {
  // Auth
  UNAUTHORIZED: { code: 'UNAUTHORIZED', message: 'Unauthorized', status: 401 },
  INVALID_TOKEN: { code: 'INVALID_TOKEN', message: 'Invalid token', status: 401 },
  INVALID_CREDENTIALS: { code: 'INVALID_CREDENTIALS', message: 'Invalid credentials', status: 401 },
  EMAIL_ALREADY_REGISTERED: { code: 'EMAIL_ALREADY_REGISTERED', message: 'Email already registered', status: 400 },
  REGISTRATION_FAILED: { code: 'REGISTRATION_FAILED', message: 'Registration failed', status: 400 },

  // Workspace
  WORKSPACE_NOT_FOUND: { code: 'WORKSPACE_NOT_FOUND', message: 'Workspace not found', status: 404 },

  // Agents
  AGENT_NOT_FOUND: { code: 'AGENT_NOT_FOUND', message: 'Agent not found', status: 404 },
  INVALID_MODEL: { code: 'INVALID_MODEL', message: 'Invalid model selected', status: 400 },

  // Conversations
  CONVERSATION_NOT_FOUND: { code: 'CONVERSATION_NOT_FOUND', message: 'Conversation not found', status: 404 },
  NOT_FOUND: { code: 'NOT_FOUND', message: 'Not found', status: 404 },

  // Billing
  TRIAL_EXPIRED: {
    code: 'TRIAL_EXPIRED',
    message: 'Недостаточно средств на балансе',
    detail: 'Ваш пробный период истек. Пожалуйста, пополните баланс для продолжения.',
    status: 402
  },

  // AI / External
  AI_TIMEOUT: { code: 'AI_TIMEOUT', message: 'Превышено время ожидания от AI-модели', status: 504 },
  AI_RATE_LIMIT: { code: 'AI_RATE_LIMIT', message: 'Слишком много запросов. Подождите.', status: 429 },
  AI_ERROR: { code: 'AI_ERROR', message: 'AI service error', status: 500 },

  // WebChat
  WEBCHAT_NOT_CONFIGURED: { code: 'WEBCHAT_NOT_CONFIGURED', message: 'WebChat is not configured', status: 503 },
  INVALID_WEBCHAT_KEY: { code: 'INVALID_WEBCHAT_KEY', message: 'Invalid webchat API key', status: 401 },
  MISSING_WORKSPACE_ID: { code: 'MISSING_WORKSPACE_ID', message: 'workspaceId and content are required', status: 400 },

  // General
  TOO_MANY_REQUESTS: { code: 'TOO_MANY_REQUESTS', message: 'Too many requests', status: 429 },
  TOO_MANY_ATTEMPTS: { code: 'TOO_MANY_ATTEMPTS', message: 'Too many attempts', status: 429 },
  INTERNAL_ERROR: { code: 'INTERNAL_ERROR', message: 'Внутренняя ошибка сервера', status: 500 },
  VALIDATION_ERROR: { code: 'VALIDATION_ERROR', message: 'Validation error', status: 400 }
};

function createError(key, overrides = {}) {
  const def = errorDictionary[key] || errorDictionary.INTERNAL_ERROR;
  const err = new Error(overrides.message || def.message);
  err.status = overrides.status || def.status;
  err.code = def.code;
  err.detail = overrides.detail || def.detail;
  return err;
}

function sendError(res, key, overrides = {}) {
  const def = errorDictionary[key] || errorDictionary.INTERNAL_ERROR;
  const payload = {
    error: overrides.message || def.message,
    code: def.code
  };
  if (overrides.detail || def.detail) payload.detail = overrides.detail || def.detail;
  if (overrides.model) payload.model = overrides.model;
  if (overrides.errorId) payload.errorId = overrides.errorId;
  res.status(overrides.status || def.status).json(payload);
}

module.exports = { errorDictionary, createError, sendError };
