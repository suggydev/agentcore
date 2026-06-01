const express = require('express');
const { fetchModels } = require('../services/suggy');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const models = await fetchModels();
    res.json({ object: 'list', data: models });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
