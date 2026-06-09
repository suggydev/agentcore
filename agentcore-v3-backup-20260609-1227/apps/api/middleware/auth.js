const jwt = require('jsonwebtoken');
const { prisma } = require('../prisma-client');
const config = require('../config');
const { createError } = require('../utils/errors');

async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return next(createError('UNAUTHORIZED'));
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET, { algorithms: ['HS256'] });
    const userId = decoded.userId || decoded.id; // Support old tokens (id) and new (userId)
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.tokenVersion !== decoded.tokenVersion) {
      return next(createError('INVALID_TOKEN'));
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
      return next(createError('INVALID_TOKEN'));
    }
    return next(createError('INVALID_TOKEN'));
  }
}

function webchatAuth(req, res, next) {
  if (!config.WEBCHAT_API_KEY) {
    console.error('[SECURITY] WebChat: WEBCHAT_API_KEY not configured — rejecting all requests');
    return next(createError('WEBCHAT_NOT_CONFIGURED'));
  }
  const apiKey = req.headers['x-api-key'] || req.headers['x-webchat-key'];
  if (apiKey !== config.WEBCHAT_API_KEY) {
    return next(createError('INVALID_WEBCHAT_KEY'));
  }
  next();
}

module.exports = { authenticate, webchatAuth };
