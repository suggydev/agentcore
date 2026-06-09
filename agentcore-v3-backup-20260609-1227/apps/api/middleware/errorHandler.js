const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

function errorHandler(err, req, res, next) {
  // Don't handle if response already sent
  if (res.headersSent) {
    return next(err);
  }

  const requestId = req.requestId || uuidv4();
  const isDev = process.env.NODE_ENV === 'development';

  // Determine status code
  let status = err.status || err.statusCode || 500;
  if (typeof status !== 'number' || status < 100 || status > 599) {
    status = 500;
  }

  // Build response payload
  const response = {
    success: false,
    status,
    requestId
  };

  // Handle Zod validation errors
  if (err.name === 'ZodError' || err.constructor?.name === 'ZodError') {
    status = 400;
    response.error = 'Validation error';
    response.details = err.flatten ? err.flatten() : err.errors;
  } else if (status === 400) {
    response.error = err.message || 'Bad request';
    if (err.details) response.details = err.details;
    if (err.detail) response.detail = err.detail;
  } else if (status === 401) {
    response.error = 'Authentication required';
  } else if (status === 403) {
    response.error = err.message || 'Forbidden';
  } else if (status === 404) {
    response.error = 'Not found';
  } else if (status === 429) {
    response.error = err.message || 'Too many requests';
  } else if (status >= 500) {
    // In production, NEVER leak stack traces, file paths, or internal details
    response.error = isDev ? (err.message || 'Internal server error') : 'Internal server error';
  } else {
    response.error = err.message || 'Internal server error';
  }

  // Ensure response status matches the resolved status code
  response.status = status;

  // Log error details (with full stack traces for debugging, but NEVER sent to client)
  const logData = {
    requestId,
    status,
    error: err.message,
    path: req.originalUrl,
    method: req.method,
    ip: req.ip
  };

  if (status >= 500) {
    logData.stack = err.stack;
    logger.error(JSON.stringify(logData));
  } else {
    // In production, logger.warn/info are suppressed; use logger.error for 4xx to ensure visibility
    logger.error(JSON.stringify(logData));
  }

  res.status(status).json(response);
}

module.exports = { errorHandler };
