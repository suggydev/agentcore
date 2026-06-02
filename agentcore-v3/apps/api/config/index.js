// Central configuration — single source of truth for all env-derived values
require('dotenv').config();

const { z } = require('zod');

const envSchema = z.object({
  PORT: z.string().default('4000').transform(Number),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
  SUGGY_PROJECT_KEY: z.string().min(1, 'SUGGY_PROJECT_KEY is required'),
  SUGGY_BASE_URL: z.string().default('https://api.suggy.lol/v1'),
  MODEL_CACHE_TTL: z.string().default('60000').transform(Number),
  CORS_ORIGINS: z.string().default('http://localhost:3000'),
  WEBCHAT_API_KEY: z.string().optional(),
  NODE_ENV: z.string().default('development'),
  YOOKASSA_SHOP_ID: z.string().optional(),
  YOOKASSA_SECRET_KEY: z.string().optional(),
  YOOKASSA_WEBHOOK_SECRET: z.string().optional(),
  SUGGY_ACCOUNT_ID: z.string().optional(),
  CLIENT_URL: z.string().default('http://localhost:3000'),
  TRIAL_CREDIT_AMOUNT: z.string().default('10').transform(Number),
  TRIAL_DAYS: z.string().default('7').transform(Number),
  CREATE_DEFAULT_AGENTS: z.string().default('true').transform(v => v === 'true'),
  PRO_CREDIT_AMOUNT: z.string().default('10').transform(Number),
  BUSINESS_CREDIT_AMOUNT: z.string().default('10').transform(Number),
  ENCRYPTION_KEY: z.string().optional()
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('[FATAL] Invalid environment configuration:');
  parsed.error.errors.forEach(e => console.error(`  - ${e.path.join('.')}: ${e.message}`));
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
  SUGGY_PROJECT_KEY: env.SUGGY_PROJECT_KEY,
  SUGGY_ACCOUNT_ID: env.SUGGY_ACCOUNT_ID || '',
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
  TRIAL_CREDIT_AMOUNT: env.TRIAL_CREDIT_AMOUNT,
  TRIAL_DAYS: env.TRIAL_DAYS,
  CREATE_DEFAULT_AGENTS: env.CREATE_DEFAULT_AGENTS,
  PRO_CREDIT_AMOUNT: env.PRO_CREDIT_AMOUNT,
  BUSINESS_CREDIT_AMOUNT: env.BUSINESS_CREDIT_AMOUNT,
  ENCRYPTION_KEY: env.ENCRYPTION_KEY || env.DATABASE_URL
};
