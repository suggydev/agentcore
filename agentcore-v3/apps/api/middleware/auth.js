const jwt = require('jsonwebtoken');
const { prisma } = require('../prisma-client');
const config = require('../config');

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = authHeader.split(' ')[1];
  try {
    req.user = jwt.verify(token, config.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

async function checkTrial(req, res, next) {
  try {
    const workspace = await prisma.workspace.findUnique({ where: { id: req.user.workspaceId } });
    if (!workspace) return res.status(404).json({ error: 'Workspace not found' });

    if (workspace.plan === 'TRIAL') {
      if (!workspace.trialEndsAt) {
        return next();
      }
      if (new Date() > workspace.trialEndsAt) {
        return res.status(402).json({
          error: 'Недостаточно средств на балансе',
          message: 'Ваш пробный период истек. Пожалуйста, пополните баланс для продолжения.',
          upgrade_url: '/settings/billing'
        });
      }
    }

    next();
  } catch (err) {
    console.error('checkTrial middleware error:', err.message);
    res.status(500).json({ error: 'Internal server error — unable to verify trial status' });
  }
}

function webchatAuth(req, res, next) {
  if (!config.WEBCHAT_API_KEY) {
    console.warn('[SECURITY] WebChat: WEBCHAT_API_KEY not configured, skipping API key check for development');
    return next();
  }
  const apiKey = req.headers['x-api-key'] || req.headers['x-webchat-key'];
  if (apiKey !== config.WEBCHAT_API_KEY) {
    return res.status(401).json({ error: 'Invalid webchat API key' });
  }
  next();
}

module.exports = { authenticate, checkTrial, webchatAuth };
