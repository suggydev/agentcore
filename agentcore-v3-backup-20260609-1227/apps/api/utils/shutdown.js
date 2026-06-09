const logger = require('./logger');

function setupGracefulShutdown(server, prisma) {
  const shutdown = (signal) => {
    logger.info(`${signal} received, shutting down gracefully`);
    if (server) {
      server.close(() => {
        logger.info('HTTP server closed');
        prisma.$disconnect().then(() => {
          logger.info('Database connection closed');
          process.exit(0);
        }).catch((err) => {
          logger.error('Error disconnecting from database:', err.message);
          process.exit(1);
        });
      });
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000).unref();
    } else {
      prisma.$disconnect().then(() => process.exit(0));
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

module.exports = { setupGracefulShutdown };
