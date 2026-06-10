const axios = require('axios');
const config = require('../config');

let modelsCache = { data: [], timestamp: 0 };

async function fetchModels() {
  const now = Date.now();
  if (now - modelsCache.timestamp < config.MODEL_CACHE_TTL && modelsCache.data.length > 0) {
    return modelsCache.data;
  }
  try {
    const response = await axios.get(`${config.SUGGY_BASE_URL}/models`, {
      headers: {
        Authorization: `Bearer ${config.SUGGY_PROJECT_KEY}`,
        'X-Account-Id': config.SUGGY_ACCOUNT_ID
      },
      timeout: 10000
    });
    modelsCache = {
      data: response.data.data || [],
      timestamp: now
    };
    return modelsCache.data;
  } catch (err) {
    console.error('Failed to fetch models:', err.message);
    if (modelsCache.data.length > 0) {
      return modelsCache.data;
    }
    console.warn('[fetchModels] Using fallback model list due to API unavailability');
    return config.FALLBACK_MODELS;
  }
}

function routeToModel(task, message, models) {
  const combined = ((task || '') + ' ' + (message || '')).toLowerCase();

  const chatModels = models.filter(m => m.supports_chat === true && !m.id.includes('flux'));
  if (chatModels.length === 0) {
    console.error('[routeToModel] No chat-capable models found!');
    return null;
  }

  if (/describe.*image|what.*in.*image|analyze.*photo|vision|look.*at.*this|photo.*of/i.test(combined) ||
      (message && (message.includes('data:image') || message.includes('http') && /\.(jpg|jpeg|png|gif|webp)/i.test(message)))) {
    return chatModels.find(m => m.supports_image_input && m.id.includes('kimi')) ||
           chatModels.find(m => m.supports_image_input) ||
           chatModels[0];
  }

  if (/analyze.*document|summarize.*long|read.*file|large.*text|book|paper|research|thesis|dissertation/i.test(combined)) {
    return chatModels.find(m => (m.context_length || 0) > 500000) ||
           chatModels.find(m => (m.context_length || 0) > 200000) ||
           chatModels[0];
  }

  if (/code|program|debug|function|script|algorithm|api|error|bug|fix|syntax|python|javascript|typescript|react|html|css|sql|database/i.test(combined)) {
    return chatModels.find(m => m.supports_chat && (m.context_length || 0) > 100000) ||
           chatModels[0];
  }

  if (/reason|logic|math|solve|prove|complex|theorem|equation|calculate|analysis/i.test(combined)) {
    return chatModels.find(m => m.supports_chat && (m.context_length || 0) > 100000) ||
           chatModels[0];
  }

  if (/write|story|poem|essay|article|blog|creative|content|marketing|copy|email|letter/i.test(combined)) {
    return chatModels.find(m => m.supports_chat && m.supports_image_input) ||
           chatModels[0];
  }

  return chatModels.find(m => (m.context_length || 0) > 128000) ||
         chatModels[0];
}

function invalidateModelCache() {
  modelsCache = { data: [], timestamp: 0 };
}

module.exports = { fetchModels, routeToModel, invalidateModelCache };
