const express = require('express');
const { fetchModels } = require('../services/suggy');
const { authenticate } = require('../middleware/auth');
const { generalLimiter } = require('../middleware/rateLimit');
const { safeError } = require('../utils/errors');

const router = express.Router();

router.get('/', authenticate, generalLimiter, async (req, res) => {
  try {
    const models = await fetchModels();
    res.json({ object: 'list', data: models });
  } catch (err) {
    safeError(res, err, 502, 'Failed to fetch models');
  }
});

module.exports = router;
