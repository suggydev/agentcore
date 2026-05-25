/**
 * Structured JSON logger with levels, correlation IDs, and sensitive data masking.
 * Safe for production — tokens, passwords, and keys are automatically redacted.
 */
export type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4,
};

const SENSITIVE_KEYS = new Set([
  "password", "passwordHash", "password_hash", "token", "accessToken", "refreshToken",
  "access_token", "refresh_token", "secret", "secretKey", "secret_key", "apiKey", "api_key",
  "authorization", "cookie", "setCookie", "creditCard", "cvv",
]);

const SENSITIVE_PATTERNS = [
  /Bearer\s+[^\s]+/gi,
  /sk-[a-zA-Z0-9]{20,}/g,
  /key_[a-zA-Z0-9]{20,}/g,
];

function maskValue(value: unknown): unknown {
  if (typeof value === "string") {
    let masked = value;
    for (const pattern of SENSITIVE_PATTERNS) {
      masked = masked.replace(pattern, "[REDACTED]");
    }
    return masked;
  }
  return value;
}

function maskObject(obj: unknown, depth = 0): unknown {
  if (depth > 5) return "[max depth]";
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === "string") return maskValue(obj);
  if (typeof obj !== "object") return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => maskObject(item, depth + 1));
  }

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.has(key)) {
      result[key] = "[REDACTED]";
    } else {
      result[key] = maskObject(value, depth + 1);
    }
  }
  return result;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  correlationId?: string;
  userId?: string;
  companyId?: string;
  durationMs?: number;
  [key: string]: unknown;
}

class Logger {
  private minLevel: LogLevel;
  private defaultContext: Record<string, unknown>;

  constructor(minLevel: LogLevel = "info", defaultContext: Record<string, unknown> = {}) {
    const envLevel = process.env.LOG_LEVEL as LogLevel | undefined;
    this.minLevel = envLevel && envLevel in LOG_LEVEL_PRIORITY ? envLevel : minLevel;
    this.defaultContext = defaultContext;
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[this.minLevel];
  }

  private formatEntry(level: LogLevel, message: string, data?: Record<string, unknown>): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...this.defaultContext,
      ...data,
    };
    return maskObject(entry) as LogEntry;
  }

  private output(entry: LogEntry): void {
    const isDev = process.env.NODE_ENV !== "production";
    if (isDev && entry.level !== "error" && entry.level !== "fatal") {
      // Pretty format for development
      const { timestamp, level, message, ...rest } = entry;
      const extras = Object.keys(rest).length > 0 ? JSON.stringify(rest, null, 2) : "";
      console.log(`[${timestamp}] ${level.toUpperCase()}: ${message} ${extras}`);
    } else {
      console.log(JSON.stringify(entry));
    }
  }

  debug(message: string, data?: Record<string, unknown>): void {
    if (!this.shouldLog("debug")) return;
    this.output(this.formatEntry("debug", message, data));
  }

  info(message: string, data?: Record<string, unknown>): void {
    if (!this.shouldLog("info")) return;
    this.output(this.formatEntry("info", message, data));
  }

  warn(message: string, data?: Record<string, unknown>): void {
    if (!this.shouldLog("warn")) return;
    this.output(this.formatEntry("warn", message, data));
  }

  error(message: string, data?: Record<string, unknown>): void {
    if (!this.shouldLog("error")) return;
    this.output(this.formatEntry("error", message, data));
  }

  fatal(message: string, data?: Record<string, unknown>): void {
    this.output(this.formatEntry("fatal", message, data));
  }

  /** Create a child logger with additional default context */
  child(context: Record<string, unknown>): Logger {
    return new Logger(this.minLevel, { ...this.defaultContext, ...context });
  }

  /** Log a slow query */
  slowQuery(query: string, durationMs: number, data?: Record<string, unknown>): void {
    this.warn("Slow query detected", {
      query: query.length > 500 ? query.slice(0, 500) + "..." : query,
      durationMs,
      ...data,
    });
  }
}

// Singleton logger
export const logger = new Logger();

/** Create a request-scoped logger with correlation ID */
export function createRequestLogger(correlationId: string, userId?: string, companyId?: string): Logger {
  return logger.child({ correlationId, userId, companyId });
}
