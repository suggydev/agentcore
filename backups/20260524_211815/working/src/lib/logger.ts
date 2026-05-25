/**
 * Structured JSON logger with levels, correlation IDs, and sensitive data masking.
 * Safe for production — tokens, passwords, and keys are automatically redacted.
 *
 * Log level is controlled via LOG_LEVEL environment variable.
 * Output is always JSON in production; pretty-print in development for non-error levels.
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
  "authorization", "cookie", "setCookie", "creditCard", "cvv", "idempotenceKey",
  "serviceRoleKey", "service_role_key", "signingSecret", "authToken",
]);

const SENSITIVE_PATTERNS = [
  /Bearer\s+[^\s]+/gi,
  /sk-[a-zA-Z0-9]{20,}/g,
  /key_[a-zA-Z0-9]{20,}/g,
  /Basic\s+[A-Za-z0-9+/=]+/gi,
];

function maskStringValue(value: string): string {
  let masked = value;
  for (const pattern of SENSITIVE_PATTERNS) {
    masked = masked.replace(pattern, "[REDACTED]");
  }
  return masked;
}

function maskObject(obj: unknown, depth = 0): unknown {
  if (depth > 6) return "[max depth]";
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === "string") return maskStringValue(obj);
  if (typeof obj !== "object") return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => maskObject(item, depth + 1));
  }

  if (obj instanceof Error) {
    return {
      name: obj.name,
      message: obj.message,
      stack: obj.stack,
    };
  }

  if (obj instanceof Date) {
    return obj.toISOString();
  }

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
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
  private context: Record<string, unknown>;

  constructor(minLevel?: LogLevel, context: Record<string, unknown> = {}) {
    const envLevel = process.env.LOG_LEVEL as LogLevel | undefined;
    this.minLevel = envLevel && envLevel in LOG_LEVEL_PRIORITY ? envLevel : (minLevel ?? "info");
    this.context = context;
  }

  /** Create a child logger with additional persistent context */
  child(extra: Record<string, unknown>): Logger {
    const child = new Logger(this.minLevel, { ...this.context, ...extra });
    return child;
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[this.minLevel];
  }

  private formatEntry(level: LogLevel, message: string, data?: Record<string, unknown>): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...this.context,
      ...data,
    };
    return maskObject(entry) as LogEntry;
  }

  private output(entry: LogEntry): void {
    const isDev = process.env.NODE_ENV !== "production";

    if (isDev && entry.level !== "error" && entry.level !== "fatal") {
      // Pretty format for development non-error logs
      const { timestamp, level, message, ...rest } = entry;
      const extras = Object.keys(rest).length > 0 ? " " + JSON.stringify(rest) : "";
      const levelTag = level.toUpperCase().padEnd(5);
      console.log(`[${timestamp}] ${levelTag} ${message}${extras}`);
    } else {
      // JSON output for production and all error/fatal logs
      console.log(JSON.stringify(entry));
    }
  }

  private log(level: LogLevel, message: string, data?: Record<string, unknown>): void {
    if (!this.shouldLog(level)) return;
    const entry = this.formatEntry(level, message, data);
    this.output(entry);
  }

  debug(message: string, data?: Record<string, unknown>): void {
    this.log("debug", message, data);
  }

  info(message: string, data?: Record<string, unknown>): void {
    this.log("info", message, data);
  }

  warn(message: string, data?: Record<string, unknown>): void {
    this.log("warn", message, data);
  }

  error(message: string, data?: Record<string, unknown>): void {
    this.log("error", message, data);
  }

  fatal(message: string, data?: Record<string, unknown>): void {
    this.log("fatal", message, data);
  }

  /** Log with an explicit duration — useful for timing operations */
  timer(message: string, durationMs: number, data?: Record<string, unknown>): void {
    const level: LogLevel = durationMs > 5000 ? "warn" : durationMs > 1000 ? "info" : "debug";
    this.log(level, message, { ...data, durationMs });
  }
}

// ---------------------------------------------------------------------------
// Singleton root logger
// ---------------------------------------------------------------------------

let _rootLogger: Logger | null = null;

export function getLogger(): Logger {
  if (!_rootLogger) {
    _rootLogger = new Logger();
  }
  return _rootLogger;
}

/** Reset the singleton — useful in tests */
export function resetLogger(): void {
  _rootLogger = null;
}

/** Create a child logger from the root with extra context */
export function createLogger(context: Record<string, unknown>): Logger {
  return getLogger().child(context);
}

export default getLogger;
