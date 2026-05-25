/**
 * Centralized validation schemas for all API endpoints.
 * Provides reusable zod schemas with sanitization and password complexity rules.
 */
import { z } from "zod";

// ─── Reusable primitives ───────────────────────────────────────

/** Email validation following common RFC 5322 patterns */
export const emailSchema = z
  .string()
  .trim()
  .email("Некорректный формат email")
  .max(254, "Email слишком длинный");

/** Password complexity: min 8 chars, upper, lower, digit, special */
export const passwordSchema = z
  .string()
  .min(8, "Пароль должен быть не менее 8 символов")
  .max(128, "Пароль слишком длинущий")
  .regex(/[A-ZА-Я]/, "Пароль должен содержать хотя бы одну заглавную букву")
  .regex(/[a-zа-я]/, "Пароль должен содержать хотя бы одну строчную букву")
  .regex(/[0-9]/, "Пароль должен содержать хотя бы одну цифру")
  .regex(/[^A-Za-zА-Яа-я0-9]/, "Пароль должен содержать хотя бы один спецсимвол");

/** Simple password for login (no complexity check, just non-empty) */
export const loginPasswordSchema = z.string().min(1, "Введите пароль");

/** UUID validator */
export const uuidSchema = z.string().uuid("Некорректный идентификатор");

/** Sanitized string — trims whitespace, rejects pure whitespace */
export const sanitizedText = z
  .string()
  .trim()
  .min(1, "Поле не может быть пустым")
  .max(10_000, "Текст слишком длинный");

/** Sanitized short string for names, titles */
export const sanitizedShortText = sanitizedText.max(255, "Текст слишком длинный");

/** URL validator */
export const urlSchema = z.string().url("Некорректный URL").max(2048);

/** Positive integer */
export const positiveIntSchema = z.number().int().positive();

/** Non-negative integer */
export const nonNegativeIntSchema = z.number().int().nonnegative();

/** Pagination params */
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(500).default(50),
});

// ─── HTML / SQL injection sanitization ─────────────────────────

const DANGEROUS_SQL_PATTERNS = [
  /(\b(OR|AND)\b\s+.+=.+)/i,
  /(;|\-\-|\/\*|\*\/|xp_|sp_)/i,
  /(\bUNION\b\s+\bSELECT\b)/i,
  /(\bDROP\b\s+\bTABLE\b)/i,
  /(\bINSERT\b\s+\bINTO\b)/i,
  /(\bDELETE\b\s+\bFROM\b)/i,
  /(\bUPDATE\b\s+.+\bSET\b)/i,
];

const DANGEROUS_HTML_PATTERNS = [
  /<script\b[^>]*>/i,
  /<\/script>/i,
  /on\w+\s*=/i,
  /javascript\s*:/i,
  /<iframe\b/i,
  /<object\b/i,
  /<embed\b/i,
];

/**
 * Check a string for obvious SQL injection patterns.
 * Returns true if suspicious content is detected.
 */
export function hasSqlInjection(value: string): boolean {
  return DANGEROUS_SQL_PATTERNS.some((p) => p.test(value));
}

/**
 * Check a string for obvious XSS / script injection patterns.
 * Returns true if suspicious content is detected.
 */
export function hasXssPayload(value: string): boolean {
  return DANGEROUS_HTML_PATTERNS.some((p) => p.test(value));
}

/**
 * Recursively scan an object for SQL/XSS injection patterns in string values.
 * Returns list of paths that look suspicious.
 */
export function scanForInjection(data: unknown, path = ""): string[] {
  const hits: string[] = [];
  if (typeof data === "string") {
    if (hasSqlInjection(data)) hits.push(`${path}:sql`);
    if (hasXssPayload(data)) hits.push(`${path}:xss`);
  } else if (Array.isArray(data)) {
    for (let i = 0; i < data.length; i++) {
      hits.push(...scanForInjection(data[i], `${path}[${i}]`));
    }
  } else if (data && typeof data === "object") {
    for (const [key, value] of Object.entries(data)) {
      hits.push(...scanForInjection(value, path ? `${path}.${key}` : key));
    }
  }
  return hits;
}

/**
 * Strip basic HTML tags from a string (lightweight sanitization).
 * For full sanitization use DOMPurify on the client.
 */
export function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, "");
}

// ─── Endpoint-specific schemas ─────────────────────────────────

export const loginSchema = z.object({
  email: emailSchema,
  password: loginPasswordSchema,
});

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  fullName: sanitizedShortText.min(1, "Укажите имя"),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, "Отсутствует refresh token"),
});

export const createAgentSchema = z.object({
  companyId: uuidSchema,
  name: sanitizedShortText,
  type: z.enum(["browser", "crm", "support", "sales", "research", "custom"]),
  description: sanitizedText.max(5000).optional(),
  model: z.string().trim().max(100).optional(),
  tone: z.enum(["professional", "friendly", "formal", "casual"]).optional(),
});

export const updateAgentSchema = z.object({
  agentId: uuidSchema,
  name: sanitizedShortText.optional(),
  description: sanitizedText.max(5000).optional(),
  tone: z.enum(["professional", "friendly", "formal", "casual"]).optional(),
  toneInstructions: sanitizedText.max(2000).optional(),
  restrictions: sanitizedText.max(2000).optional(),
  forbiddenTopics: sanitizedText.max(2000).optional(),
  dailyBudgetUsd: z.number().nonnegative().max(1000).optional(),
  maxTokensPerTask: positiveIntSchema.max(1_000_000).optional(),
  timeoutSeconds: positiveIntSchema.max(3600).optional(),
  rateLimitPerMin: positiveIntSchema.max(10_000).optional(),
  greetingTemplate: sanitizedText.max(1000).optional(),
  closingTemplate: sanitizedText.max(1000).optional(),
});

export const subscriptionCheckoutSchema = z.object({
  companyId: uuidSchema,
  plan: z.enum(["basic", "extended", "premium"]),
  returnUrl: urlSchema,
});

export const cancelSubscriptionSchema = z.object({
  subscriptionId: uuidSchema,
});

export const adminConfigUpdateSchema = z.object({
  password: z.string().min(1),
  values: z.record(z.string(), z.string()),
});

export const agentActionSchema = z.object({
  agentId: uuidSchema,
});

export const dashboardLogsSchema = z.object({
  companyId: uuidSchema,
  since: z.string().datetime({ offset: true }).optional(),
  limit: z.number().int().positive().max(5000).default(1000),
});

export const transactionsListSchema = z.object({
  companyId: uuidSchema,
  ...paginationSchema.shape,
});

export const webhookIdempotencySchema = z.object({
  event: z.string().min(1),
  event_id: z.string().min(1),
});
