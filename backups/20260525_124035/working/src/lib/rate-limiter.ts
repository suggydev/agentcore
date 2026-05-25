/**
 * Sliding window rate limiter.
 * Uses in-memory counters with TTL — suitable for single-instance deployments.
 * For multi-instance, replace with Redis-backed implementation.
 *
 * Different rate limits for different endpoint categories:
 *   - auth:     5 requests / minute  (brute-force protection)
 *   - billing:  30 requests / minute
 *   - admin:    60 requests / minute
 *   - default:  100 requests / minute
 */
import { RateLimitError } from "@/lib/errors";

export type RateLimitCategory = "auth" | "billing" | "admin" | "default";

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

const CATEGORY_CONFIGS: Record<RateLimitCategory, RateLimitConfig> = {
  auth: { windowMs: 60_000, maxRequests: 5 },
  billing: { windowMs: 60_000, maxRequests: 30 },
  admin: { windowMs: 60_000, maxRequests: 60 },
  default: { windowMs: 60_000, maxRequests: 100 },
};

interface BucketEntry {
  count: number;
  windowStart: number;
}

/** In-memory store — keyed by `${category}:${identifier}` */
const store = new Map<string, BucketEntry>();

// Periodic cleanup of expired entries
const CLEANUP_INTERVAL_MS = 5 * 60_000; // 5 minutes
let cleanupTimer: ReturnType<typeof setInterval> | null = null;

function startCleanup() {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      const config = CATEGORY_CONFIGS[key.split(":")[0] as RateLimitCategory]
        ?? CATEGORY_CONFIGS.default;
      if (now - entry.windowStart > config.windowMs * 2) {
        store.delete(key);
      }
    }
  }, CLEANUP_INTERVAL_MS);

  // Don't prevent process exit
  if (cleanupTimer.unref) cleanupTimer.unref();
}

startCleanup();

/** Whitelist identifiers (e.g., internal service keys) */
const WHITELIST = new Set<string>();

export function addToWhitelist(identifier: string): void {
  WHITELIST.add(identifier);
}

/**
 * Check rate limit for a given identifier and category.
 * Throws RateLimitError if limit exceeded.
 * Returns remaining request count if allowed.
 */
export function checkRateLimit(
  identifier: string,
  category: RateLimitCategory = "default",
): { remaining: number; resetAt: number } {
  if (WHITELIST.has(identifier)) {
    const config = CATEGORY_CONFIGS[category];
    return { remaining: config.maxRequests, resetAt: Date.now() + config.windowMs };
  }

  const config = CATEGORY_CONFIGS[category];
  const key = `${category}:${identifier}`;
  const now = Date.now();

  let entry = store.get(key);

  // Reset window if expired
  if (!entry || now - entry.windowStart > config.windowMs) {
    entry = { count: 0, windowStart: now };
    store.set(key, entry);
  }

  entry.count += 1;

  if (entry.count > config.maxRequests) {
    const resetAt = entry.windowStart + config.windowMs;
    const retryAfterMs = resetAt - now;
    throw new RateLimitError(retryAfterMs, `Rate limit exceeded for ${category}`);
  }

  return {
    remaining: config.maxRequests - entry.count,
    resetAt: entry.windowStart + config.windowMs,
  };
}

/**
 * Express/TanStack middleware helper — returns a function that
 * can be used as middleware to enforce rate limits.
 */
export function rateLimitMiddleware(category: RateLimitCategory = "default") {
  return async ({ next, context }: { next: Function; context: Record<string, unknown> }) => {
    const userId = (context as any)?.userId as string | undefined;
    const identifier = userId || "anonymous";
    const result = checkRateLimit(identifier, category);
    return next();
  };
}

/** Reset rate limit for a specific identifier (useful after successful auth) */
export function resetRateLimit(identifier: string, category: RateLimitCategory): void {
  store.delete(`${category}:${identifier}`);
}

/** Get current rate limit status without incrementing */
export function getRateLimitStatus(
  identifier: string,
  category: RateLimitCategory = "default",
): { count: number; remaining: number; resetAt: number } {
  const config = CATEGORY_CONFIGS[category];
  const key = `${category}:${identifier}`;
  const now = Date.now();

  const entry = store.get(key);
  if (!entry || now - entry.windowStart > config.windowMs) {
    return { count: 0, remaining: config.maxRequests, resetAt: now + config.windowMs };
  }

  return {
    count: entry.count,
    remaining: Math.max(0, config.maxRequests - entry.count),
    resetAt: entry.windowStart + config.windowMs,
  };
}
