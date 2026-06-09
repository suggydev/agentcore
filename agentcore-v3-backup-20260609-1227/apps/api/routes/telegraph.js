const express = require('express');
const { authenticate } = require('../middleware/auth');
const { safeError } = require('../utils/errors');
const config = require('../config');
const { createPage, getPage, generateGuideContent } = require('../services/telegraph');

const router = express.Router();

// In-memory cache for guide URLs (per provider)
const guideCache = new Map();

/**
 * GET /api/integrations/telegraph-guide/:provider
 * Get or create Telegraph guide for a provider
 */
router.get('/telegraph-guide/:provider', authenticate, async (req, res) => {
  try {
    const { provider } = req.params;
    const cacheKey = provider;

    // Check cache first
    if (guideCache.has(cacheKey)) {
      const cached = guideCache.get(cacheKey);
      // Verify page still exists
      try {
        const page = await getPage(cached.path);
        return res.json({ url: page.url, title: page.title });
      } catch (e) {
        guideCache.delete(cacheKey); // Page deleted, recreate
      }
    }

    // Create new page
    const accessToken = config.TELEGRAPH_ACCESS_TOKEN;
    if (!accessToken) {
      return res.status(503).json({
        error: 'Telegraph integration not configured',
        message: 'Обратитесь в поддержку для настройки инструкций'
      });
    }

    const title = `Инструкция: подключение ${provider} к AgentCore`;
    const content = generateGuideContent(provider);

    const page = await createPage(accessToken, title, content, 'AgentCore Support');
    guideCache.set(cacheKey, { path: page.path, url: page.url });

    res.json({ url: page.url, title: page.title });
  } catch (err) {
    console.error('[Telegraph] Error:', err.message);
    safeError(res, err, 500, 'Не удалось создать инструкцию. Обратитесь в поддержку.');
  }
});

module.exports = router;
