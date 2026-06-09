// Central configuration - single source of truth for all env-derived values
require('dotenv').config();

const { z } = require('zod');
const logger = require('../utils/logger');

const envSchema = z.object({
  PORT: z.string().default('4000').transform(Number).refine(
    (port) => port >= 1024 && port <= 65535,
    { message: 'PORT must be between 1024 and 65535' }
  ),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  SUGGY_PROJECT_KEY: z.string().min(1, 'SUGGY_PROJECT_KEY is required'),
  SUGGY_BASE_URL: z.string().default('https://api.suggy.lol/v1'),
  MODEL_CACHE_TTL: z.string().default('60000').transform(Number),
  CORS_ORIGINS: z.string().default('http://localhost:3000').refine(
    (val) => {
      const origins = val.split(',').map(s => s.trim()).filter(Boolean);
      return origins.length > 0 && origins.every(o => {
        try {
          const url = new URL(o);
          return url.protocol === 'http:' || url.protocol === 'https:';
        } catch {
          return false;
        }
      });
    },
    { message: 'CORS_ORIGINS must be a comma-separated list of valid HTTP/HTTPS URLs' }
  ),
  WEBCHAT_API_KEY: z.string().optional(),
  NODE_ENV: z.string().default('development'),
  YOOKASSA_SHOP_ID: z.string().optional(),
  YOOKASSA_SECRET_KEY: z.string().optional(),
  YOOKASSA_WEBHOOK_SECRET: z.string().optional(),
  SUGGY_ACCOUNT_ID: z.string().optional(),
  CLIENT_URL: z.string().default('http://localhost:3000'),
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().default('noreply@agentcore.work'),
  ENCRYPTION_KEY: z.string().min(32, 'ENCRYPTION_KEY must be at least 32 characters'),
  TELEGRAPH_ACCESS_TOKEN: z.string().optional(),
  TELEGRAM_API_ID: z.string().optional(),
  TELEGRAM_API_HASH: z.string().optional(),
  AGENT_ACTIVATION_PRICE: z.string().default('4499').transform(Number),
  AGENT_MONTHLY_PRICE: z.string().default('2499').transform(Number),
  AGENT_FREE_CREDITS: z.string().default('1000').transform(Number),
  API_URL: z.string().optional(),
  TRIAL_CREDIT_AMOUNT: z.string().default('10').transform(Number),
  TRIAL_DAYS: z.string().default('7').transform(Number)
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  logger.error('[FATAL] Invalid environment configuration:');
  parsed.error.errors.forEach(e => logger.error(`  - ${e.path.join('.')}: ${e.message}`));
  process.exit(1);
}

const env = parsed.data;

const FALLBACK_MODELS = [
  { id: 'accounts/fireworks/models/glm-5p1', name: 'glm-5p1', supports_chat: true, context_length: 128000 },
  { id: 'accounts/fireworks/models/kimi-k2p5', name: 'kimi-k2p5', supports_chat: true, supports_image_input: true, context_length: 256000 },
  { id: 'accounts/fireworks/models/kimi-k2p6', name: 'kimi-k2p6', supports_chat: true, supports_image_input: true, context_length: 200000 },
  { id: 'accounts/fireworks/models/gpt-oss-120b', name: 'gpt-oss-120b', supports_chat: true, context_length: 128000 },
  { id: 'accounts/fireworks/models/deepseek-v4-pro', name: 'deepseek-v4-pro', supports_chat: true, context_length: 64000 },
  { id: 'accounts/fireworks/models/flux-1-dev-fp8', name: 'flux-1-dev-fp8', supports_chat: false },
  { id: 'accounts/fireworks/models/flux-1-schnell-fp8', name: 'flux-1-schnell-fp8', supports_chat: false },
  { id: 'accounts/fireworks/models/flux-kontext-pro', name: 'flux-kontext-pro', supports_chat: false },
  { id: 'accounts/fireworks/models/flux-kontext-max', name: 'flux-kontext-max', supports_chat: false }
];

module.exports = {
  PORT: env.PORT,
  DATABASE_URL: env.DATABASE_URL,
  JWT_SECRET: env.JWT_SECRET,
  JWT_EXPIRES_IN: env.JWT_EXPIRES_IN,
  SUGGY_PROJECT_KEY: env.SUGGY_PROJECT_KEY,
  SUGGY_ACCOUNT_ID: env.SUGGY_ACCOUNT_ID || 'default',
  SUGGY_BASE_URL: env.SUGGY_BASE_URL,
  MODEL_CACHE_TTL: env.MODEL_CACHE_TTL,
  FALLBACK_MODELS,
  CORS_ORIGINS: env.CORS_ORIGINS.split(',').map(s => s.trim()).filter(Boolean),
  WEBCHAT_API_KEY: env.WEBCHAT_API_KEY,
  NODE_ENV: env.NODE_ENV,
  YOOKASSA_SHOP_ID: env.YOOKASSA_SHOP_ID,
  YOOKASSA_SECRET_KEY: env.YOOKASSA_SECRET_KEY,
  YOOKASSA_WEBHOOK_SECRET: env.YOOKASSA_WEBHOOK_SECRET,
  CLIENT_URL: env.CLIENT_URL,
  API_URL: env.API_URL || env.CLIENT_URL,
  RESEND_API_KEY: env.RESEND_API_KEY,
  RESEND_FROM_EMAIL: env.RESEND_FROM_EMAIL,
  ENCRYPTION_KEY: env.ENCRYPTION_KEY,
  TELEGRAPH_ACCESS_TOKEN: env.TELEGRAPH_ACCESS_TOKEN,
  TELEGRAM_API_ID: env.TELEGRAM_API_ID,
  TELEGRAM_API_HASH: env.TELEGRAM_API_HASH,
  AGENT_ACTIVATION_PRICE: env.AGENT_ACTIVATION_PRICE,
  AGENT_MONTHLY_PRICE: env.AGENT_MONTHLY_PRICE,
  AGENT_FREE_CREDITS: env.AGENT_FREE_CREDITS,
  TRIAL_CREDIT_AMOUNT: env.TRIAL_CREDIT_AMOUNT,
  TRIAL_DAYS: env.TRIAL_DAYS
};
