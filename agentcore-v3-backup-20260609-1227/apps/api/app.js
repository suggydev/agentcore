const express = require('express');
const config = require('./config');
const logger = require('./utils/logger');
const { requestIdTracking } = require('./middleware/requestId');
const { errorHandler } = require('./middleware/errorHandler');
const { generalLimiter } = require('./middleware/rateLimit');

const app = express();

app.set('trust proxy', 1);

const helmet = require('helmet');
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "https://mc.yandex.ru"],
      imgSrc: ["'self'", "data:", "https:", "https://mc.yandex.ru"],
      connectSrc: ["'self'", ...config.CORS_ORIGINS, "https://mc.yandex.ru"],
      frameSrc: ["'self'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
    }
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));

const cors = require('cors');
app.use(cors({
  origin: config.CORS_ORIGINS,
  credentials: true
}));

app.use(requestIdTracking);

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(JSON.stringify({
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`
    }));
  });
  next();
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(generalLimiter);

app.use('/api/auth', require('./routes/auth'));
app.use('/api/agents/generate', require('./routes/agentGenerate'));
app.use('/api/agents', require('./routes/agents'));
app.use('/api/conversations', require('./routes/conversations'));
app.use('/api/v1/models', require('./routes/models'));
app.use('/api/v1/chat', require('./routes/chat'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/channels/webchat', require('./routes/webchat'));
app.use('/api/channels/telegram', require('./routes/channels/telegram'));
app.use('/api/billing', require('./routes/billing'));
app.use('/api/crm', require('./routes/crm'));
app.use('/api/knowledge', require('./routes/knowledge'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/workspace', require('./routes/workspace'));
app.use('/api/integrations', require('./routes/integrations'));
app.use('/api/telegraph', require('./routes/telegraph'));
app.use('/api/webhooks', require('./routes/webhooks'));
app.use('/api/health', require('./routes/health'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/legal', require('./routes/legal'));
app.use('/api/support', require('./routes/support'));

// Catch-all 404 handler for unmatched routes
app.use((req, res, next) => {
  const err = new Error(`Not found: ${req.method} ${req.originalUrl}`);
  err.status = 404;
  next(err);
});

app.use(errorHandler);

module.exports = { app };
