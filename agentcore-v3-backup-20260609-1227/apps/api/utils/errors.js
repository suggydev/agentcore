const logger = require('./logger');

const errorDictionary = {
  // Auth
  UNAUTHORIZED: { code: 'UNAUTHORIZED', message: 'Authentication required', status: 401 },
  INVALID_TOKEN: { code: 'INVALID_TOKEN', message: 'Authentication required', status: 401 },
  INVALID_CREDENTIALS: { code: 'INVALID_CREDENTIALS', message: 'Authentication required', status: 401 },
  EMAIL_ALREADY_REGISTERED: { code: 'EMAIL_ALREADY_REGISTERED', message: 'Email already registered', status: 400 },
  REGISTRATION_FAILED: { code: 'REGISTRATION_FAILED', message: 'Registration failed', status: 400 },

  // Workspace
  WORKSPACE_NOT_FOUND: { code: 'WORKSPACE_NOT_FOUND', message: 'Not found', status: 404 },

  // Agents
  AGENT_NOT_FOUND: { code: 'AGENT_NOT_FOUND', message: 'Not found', status: 404 },
  INVALID_MODEL: { code: 'INVALID_MODEL', message: 'Invalid model selected', status: 400 },

  // Conversations
  CONVERSATION_NOT_FOUND: { code: 'CONVERSATION_NOT_FOUND', message: 'Not found', status: 404 },
  NOT_FOUND: { code: 'NOT_FOUND', message: 'Not found', status: 404 },

  // Billing
  TRIAL_EXPIRED: {
    code: 'TRIAL_EXPIRED',
    message: 'Free credits exhausted',
    detail: 'Your plan has expired. To continue, please top up your balance.',
    status: 402
  },

  // AI / External
  AI_TIMEOUT: { code: 'AI_TIMEOUT', message: 'AI model timeout', status: 504 },
  AI_RATE_LIMIT: { code: 'AI_RATE_LIMIT', message: 'Too many requests. Please wait.', status: 429 },
  AI_ERROR: { code: 'AI_ERROR', message: 'Internal server error', status: 500 },

  // WebChat
  WEBCHAT_NOT_CONFIGURED: { code: 'WEBCHAT_NOT_CONFIGURED', message: 'WebChat not configured', status: 503 },
  INVALID_WEBCHAT_KEY: { code: 'INVALID_WEBCHAT_KEY', message: 'Authentication required', status: 401 },
  MISSING_WORKSPACE_ID: { code: 'MISSING_WORKSPACE_ID', message: 'workspaceId and content are required', status: 400 },

  // General
  TOO_MANY_REQUESTS: { code: 'TOO_MANY_REQUESTS', message: 'Too many requests', status: 429 },
  TOO_MANY_ATTEMPTS: { code: 'TOO_MANY_ATTEMPTS', message: 'Too many attempts', status: 429 },
  INTERNAL_ERROR: { code: 'INTERNAL_ERROR', message: 'Internal server error', status: 500 },
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
    success: false,
    error: overrides.message || def.message,
    status: overrides.status || def.status,
    code: def.code
  };
  if (overrides.detail || def.detail) payload.detail = overrides.detail || def.detail;
  if (overrides.model) payload.model = overrides.model;
  if (overrides.requestId) payload.requestId = overrides.requestId;
  res.status(overrides.status || def.status).json(payload);
}

function safeError(res, err, status = 500, fallbackMessage = 'Internal server error') {
  const requestId = res.req?.requestId;
  const isDev = process.env.NODE_ENV === 'development';

  // In production, NEVER leak internal details for 500 errors
  const isServerError = status >= 500;
  const clientMessage = isServerError && !isDev ? 'Internal server error' : (err.message || fallbackMessage);

  const payload = {
    success: false,
    error: clientMessage,
    status
  };
  if (requestId) payload.requestId = requestId;

  if (isServerError) {
    logger.error(JSON.stringify({
      requestId,
      status,
      error: err.message,
      stack: err.stack?.split('\n').slice(0, 5).join(' | ')
    }));
  }

  res.status(status).json(payload);
}

module.exports = { errorDictionary, createError, sendError, safeError };
