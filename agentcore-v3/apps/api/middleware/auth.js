const crypto = require('crypto');
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
    let user;
    try {
      user = await prisma.user.findUnique({ where: { id: userId } });
    } catch (findErr) {
      // Handle case where SUPERADMIN role doesn't exist in enum
      if (findErr.message && findErr.message.includes('SUPERADMIN')) {
        console.warn('[Auth] SUPERADMIN role not in enum, using raw query fallback');
        const users = await prisma.$queryRaw`SELECT id, email, name, role, "workspaceId", "tokenVersion" FROM "User" WHERE id = ${userId}`;
        user = users[0] || null;
      } else {
        throw findErr;
      }
    }
    if (!user || (user.tokenVersion || 0) !== decoded.tokenVersion) {
      return res.status(401).json({ error: 'Сессия истекла. Пожалуйста, войдите снова.', code: 'TOKEN_EXPIRED' });
    }
    req.user = {
      userId: user.id,
      id: user.id,
      email: user.email,
      role: user.role || 'OWNER',
      workspaceId: user.workspaceId,
      tokenVersion: user.tokenVersion || 0,
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
    let workspace;
    try {
      workspace = await prisma.workspace.findUnique({ where: { id: req.user.workspaceId } });
    } catch (wsErr) {
      if (wsErr.message && wsErr.message.includes('plan')) {
        console.warn('[Auth] plan column not in database, skipping trial check');
        return next();
      }
      throw wsErr;
    }
    if (!workspace) return res.status(404).json({ error: 'Workspace not found' });

    if ((workspace.plan || 'TRIAL') === 'TRIAL') {
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
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
}

function webchatAuth(req, res, next) {
  if (!config.WEBCHAT_API_KEY) {
    console.error('[SECURITY] WebChat: WEBCHAT_API_KEY not configured — rejecting all requests');
    return res.status(503).json({ error: 'WebChat is not configured' });
  }
  const apiKey = req.headers['x-api-key'] || req.headers['x-webchat-key'];
  if (!apiKey || apiKey.length !== config.WEBCHAT_API_KEY.length || !crypto.timingSafeEqual(Buffer.from(apiKey), Buffer.from(config.WEBCHAT_API_KEY))) {
    return res.status(401).json({ error: 'Invalid webchat API key' });
  }
  next();
}

module.exports = { authenticate, checkTrial, webchatAuth };
