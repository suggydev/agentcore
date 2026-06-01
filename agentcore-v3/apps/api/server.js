require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const config = require('./config');
const { prisma } = require('./prisma-client');
const { requestIdTracking } = require('./middleware/requestId');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

app.set('trust proxy', true);

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", ...config.CORS_ORIGINS]
    }
  },
  crossOriginEmbedderPolicy: false // Allow embedding for webchat widget
}));

// Request ID tracking
app.use(requestIdTracking);

// CORS
app.use(cors({
  origin: config.CORS_ORIGINS,
  credentials: true
}));

// Body parsing
app.use(express.json({ limit: '50mb' }));

// ============================
// ROUTES
// ============================

app.use('/api/auth', require('./routes/auth'));
app.use('/api/agents', require('./routes/agents'));
app.use('/api/conversations', require('./routes/conversations'));
app.use('/api/v1/models', require('./routes/models'));
app.use('/api/v1/chat', require('./routes/chat'));
app.use('/api/channels/webchat', require('./routes/webchat'));
app.use('/api/channels/telegram', require('./routes/channels/telegram'));
app.use('/api/billing', require('./routes/billing'));
app.use('/api/crm', require('./routes/crm'));
app.use('/api/knowledge', require('./routes/knowledge'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/workspace', require('./routes/workspace'));
app.use('/api/integrations', require('./routes/integrations'));
app.use('/api/health', require('./routes/health'));

// ============================
// ERROR HANDLER (must be last)
// ============================

app.use(errorHandler);

// ============================
// START SERVER
// ============================

let server;
if (config.NODE_ENV !== 'test') {
  server = app.listen(config.PORT, '0.0.0.0', () => {
    console.log(`🚀 AgentCore v3 API running on http://0.0.0.0:${config.PORT}`);
    console.log(`🤖 Suggy API: ${config.SUGGY_BASE_URL}`);
    console.log(`📦 Models cache TTL: ${config.MODEL_CACHE_TTL}ms`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
      prisma.$disconnect();
      process.exit(0);
    });
  });
}

module.exports = { app, prisma };
