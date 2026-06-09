const express = require('express');
const { fetchModels } = require('../services/suggy');
const { prisma } = require('../prisma-client');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const [models, dbOk] = await Promise.all([
      fetchModels().catch(() => []),
      prisma.$queryRaw`SELECT 1`.then(() => true).catch(() => false)
    ]);

    res.json({
      status: dbOk ? 'ok' : 'degraded',
      version: '3.0.0',
      timestamp: new Date().toISOString(),
      database: dbOk ? 'connected' : 'disconnected',
      models_loaded: models.length
    });
  } catch (err) {
    console.error('Health check error:', err.message);
    res.status(500).json({
      status: 'error',
      version: '3.0.0',
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
