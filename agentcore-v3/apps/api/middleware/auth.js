const jwt = require('jsonwebtoken');
const { prisma } = require('../prisma-client');
const config = require('../config');

async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Требуется авторизация. Пожалуйста, войдите.', code: 'UNAUTHORIZED' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET, { algorithms: ['HS256'] });
    const userId = decoded.userId || decoded.id; // Support old tokens (id) and new (userId)
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.tokenVersion !== decoded.tokenVersion) {
      return res.status(401).json({ error: 'Сессия истекла. Пожалуйста, войдите снова.', code: 'TOKEN_EXPIRED' });
    }
    req.user = {
      userId: user.id,
      id: user.id,
      email: user.email,
      role: user.role,
      workspaceId: user.workspaceId,
      tokenVersion: user.tokenVersion,
    };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Сессия истекла. Пожалуйста, войдите снова.', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ error: 'Недействительный токен. Пожалуйста, войдите снова.', code: 'INVALID_TOKEN' });
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
    res.status(500).json({ error: `Internal server error — unable to verify trial status: ${err.message}` });
  }
}

function webchatAuth(req, res, next) {
  if (!config.WEBCHAT_API_KEY) {
    console.error('[SECURITY] WebChat: WEBCHAT_API_KEY not configured — rejecting all requests');
    return res.status(503).json({ error: 'WebChat is not configured' });
  }
  const apiKey = req.headers['x-api-key'] || req.headers['x-webchat-key'];
  if (apiKey !== config.WEBCHAT_API_KEY) {
    return res.status(401).json({ error: 'Invalid webchat API key' });
  }
  next();
}

module.exports = { authenticate, checkTrial, webchatAuth };
