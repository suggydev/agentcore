const rateLimit = require('express-rate-limit');

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { success: false, error: 'Too many requests. Please wait a minute.', status: 429 },
  standardHeaders: true,
  legacyHeaders: false
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, error: 'Too many attempts. Please try again later.', status: 429 },
  standardHeaders: true,
  legacyHeaders: false
});

const twoFaLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5,
  message: { success: false, error: 'Too many 2FA requests. Please try again in 5 minutes.', status: 429 },
  standardHeaders: true,
  legacyHeaders: false
});

const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { success: false, error: 'Too many requests. Please try again later.', status: 429 },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = { aiLimiter, authLimiter, twoFaLimiter, generalLimiter };
