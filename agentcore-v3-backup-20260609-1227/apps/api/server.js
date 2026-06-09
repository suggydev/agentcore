require('dotenv').config();

const config = require('./config');
const logger = require('./utils/logger');
const { prisma } = require('./prisma-client');
const { app } = require('./app');
const { setupGracefulShutdown } = require('./utils/shutdown');

let server;

if (config.NODE_ENV !== 'test') {
  server = app.listen(config.PORT, '0.0.0.0', () => {
    logger.info(`AgentCore v3 API running on http://0.0.0.0:${config.PORT}`);
    logger.info(`Suggy API: ${config.SUGGY_BASE_URL}`);
    logger.info(`Models cache TTL: ${config.MODEL_CACHE_TTL}ms`);
  });

  setupGracefulShutdown(server, prisma);
}

module.exports = { app, prisma };
