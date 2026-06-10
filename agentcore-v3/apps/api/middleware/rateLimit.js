const rateLimit = require('express-rate-limit');

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { error: 'Too many requests' },
  standardHeaders: true,
  legacyHeaders: false
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: (req) => {
    // Allow more requests for test users
    const email = req.body?.email || '';
    if (email.includes('test') && email.includes('agentcore.work')) {
      return 100;
    }
    return 10;
  },
  message: { error: 'Too many attempts' },
  standardHeaders: true,
  legacyHeaders: false
});

const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = { aiLimiter, authLimiter, generalLimiter };
