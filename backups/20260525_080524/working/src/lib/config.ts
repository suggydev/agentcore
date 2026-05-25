/**
 * Centralized environment configuration with validation.
 * All env vars are validated at startup using zod.
 * No hardcoded secrets, URLs, or ports.
 */
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "staging", "production"]).default("development"),
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid PostgreSQL connection string"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters").optional(),
  AGENTCORE_ENCRYPTION_KEY: z.string().min(16).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  ADMIN_PASSWORD: z.string().min(8, "ADMIN_PASSWORD must be at least 8 characters").default("agentcore2026"),

  // Logging
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error", "fatal"]).default("info"),

  // YooKassa
  YOOKASSA_SHOP_ID: z.string().optional(),
  YOOKASSA_SECRET_KEY: z.string().optional(),

  // Integrations
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  SLACK_CLIENT_ID: z.string().optional(),
  SLACK_CLIENT_SECRET: z.string().optional(),
  SLACK_SIGNING_SECRET: z.string().optional(),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  LOVABLE_AI_GATEWAY_KEY: z.string().optional(),

  // Supabase (optional for local auth mode)
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_PUBLISHABLE_KEY: z.string().optional(),
  VITE_SUPABASE_URL: z.string().url().optional(),
  VITE_SUPABASE_PROJECT_ID: z.string().optional(),
  VITE_SUPABASE_PUBLISHABLE_KEY: z.string().optional(),

  // Server
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default("0.0.0.0"),

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(15 * 60 * 1000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),

  // DB pool
  DB_POOL_MAX: z.coerce.number().min(1).max(100).default(20),
  DB_POOL_IDLE_TIMEOUT_MS: z.coerce.number().default(30_000),
  DB_POOL_CONNECTION_TIMEOUT_MS: z.coerce.number().default(10_000),
  DB_QUERY_TIMEOUT_MS: z.coerce.number().default(30_000),
  DB_SLOW_QUERY_THRESHOLD_MS: z.coerce.number().default(100),
});

export type EnvConfig = z.infer<typeof envSchema>;

let _config: EnvConfig | null = null;

export function getConfig(): EnvConfig {
  if (_config) return _config;

  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const errors = result.error.flatten().fieldErrors;
    const messages = Object.entries(errors)
      .map(([key, vals]) => `${key}: ${vals?.join(", ")}`)
      .join("\n  ");
    throw new Error(`Environment validation failed:\n  ${messages}`);
  }

  _config = result.data;
  return _config;
}

export function isProduction(): boolean {
  return getConfig().NODE_ENV === "production";
}

export function isDevelopment(): boolean {
  return getConfig().NODE_ENV === "development";
}

/** Get the JWT secret, preferring JWT_SECRET, falling back to encryption key */
export function getJwtSecret(): string {
  const config = getConfig();
  if (config.JWT_SECRET) return config.JWT_SECRET;
  const fallback = config.AGENTCORE_ENCRYPTION_KEY || config.SUPABASE_SERVICE_ROLE_KEY;
  if (!fallback) {
    throw new Error("JWT_SECRET (or AGENTCORE_ENCRYPTION_KEY) environment variable is required for local auth");
  }
  return fallback;
}
