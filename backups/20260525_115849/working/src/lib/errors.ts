/**
 * Centralized error handling with typed custom error classes.
 * Each error type maps to a specific HTTP status code.
 * Stack traces are never exposed in production responses.
 */

export enum ErrorCode {
  // Auth errors (401)
  UNAUTHORIZED = "UNAUTHORIZED",
  TOKEN_EXPIRED = "TOKEN_EXPIRED",
  INVALID_TOKEN = "INVALID_TOKEN",
  INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
  ACCOUNT_LOCKED = "ACCOUNT_LOCKED",

  // Permission errors (403)
  FORBIDDEN = "FORBIDDEN",
  INSUFFICIENT_ROLE = "INSUFFICIENT_ROLE",
  ADMIN_REQUIRED = "ADMIN_REQUIRED",
  CSRF_TOKEN_INVALID = "CSRF_TOKEN_INVALID",

  // Validation errors (400)
  VALIDATION_ERROR = "VALIDATION_ERROR",
  INVALID_INPUT = "INVALID_INPUT",
  INVALID_EMAIL = "INVALID_EMAIL",
  WEAK_PASSWORD = "WEAK_PASSWORD",

  // Not found (404)
  NOT_FOUND = "NOT_FOUND",
  AGENT_NOT_FOUND = "AGENT_NOT_FOUND",
  USER_NOT_FOUND = "USER_NOT_FOUND",
  COMPANY_NOT_FOUND = "COMPANY_NOT_FOUND",
  SUBSCRIPTION_NOT_FOUND = "SUBSCRIPTION_NOT_FOUND",

  // Conflict (409)
  CONFLICT = "CONFLICT",
  DUPLICATE_EMAIL = "DUPLICATE_EMAIL",
  DUPLICATE_RESOURCE = "DUPLICATE_RESOURCE",

  // Billing errors (402 / 422)
  PAYMENT_REQUIRED = "PAYMENT_REQUIRED",
  INSUFFICIENT_BALANCE = "INSUFFICIENT_BALANCE",
  PLAN_LIMIT_EXCEEDED = "PLAN_LIMIT_EXCEEDED",
  SUBSCRIPTION_EXPIRED = "SUBSCRIPTION_EXPIRED",
  BILLING_ERROR = "BILLING_ERROR",
  WEBHOOK_VERIFICATION_FAILED = "WEBHOOK_VERIFICATION_FAILED",
  IDEMPOTENCY_ERROR = "IDEMPOTENCY_ERROR",

  // Rate limiting (429)
  RATE_LIMITED = "RATE_LIMITED",

  // Server errors (500)
  INTERNAL_ERROR = "INTERNAL_ERROR",
  DATABASE_ERROR = "DATABASE_ERROR",
  EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR",
  AGENT_EXECUTION_ERROR = "AGENT_EXECUTION_ERROR",
  AGENT_TIMEOUT = "AGENT_TIMEOUT",
  CONFIGURATION_ERROR = "CONFIGURATION_ERROR",
}

const ERROR_STATUS_MAP: Record<ErrorCode, number> = {
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.TOKEN_EXPIRED]: 401,
  [ErrorCode.INVALID_TOKEN]: 401,
  [ErrorCode.INVALID_CREDENTIALS]: 401,
  [ErrorCode.ACCOUNT_LOCKED]: 423,
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.INSUFFICIENT_ROLE]: 403,
  [ErrorCode.ADMIN_REQUIRED]: 403,
  [ErrorCode.CSRF_TOKEN_INVALID]: 403,
  [ErrorCode.VALIDATION_ERROR]: 400,
  [ErrorCode.INVALID_INPUT]: 400,
  [ErrorCode.INVALID_EMAIL]: 400,
  [ErrorCode.WEAK_PASSWORD]: 400,
  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.AGENT_NOT_FOUND]: 404,
  [ErrorCode.USER_NOT_FOUND]: 404,
  [ErrorCode.COMPANY_NOT_FOUND]: 404,
  [ErrorCode.SUBSCRIPTION_NOT_FOUND]: 404,
  [ErrorCode.CONFLICT]: 409,
  [ErrorCode.DUPLICATE_EMAIL]: 409,
  [ErrorCode.DUPLICATE_RESOURCE]: 409,
  [ErrorCode.PAYMENT_REQUIRED]: 402,
  [ErrorCode.INSUFFICIENT_BALANCE]: 422,
  [ErrorCode.PLAN_LIMIT_EXCEEDED]: 422,
  [ErrorCode.SUBSCRIPTION_EXPIRED]: 422,
  [ErrorCode.BILLING_ERROR]: 422,
  [ErrorCode.WEBHOOK_VERIFICATION_FAILED]: 422,
  [ErrorCode.IDEMPOTENCY_ERROR]: 422,
  [ErrorCode.RATE_LIMITED]: 429,
  [ErrorCode.INTERNAL_ERROR]: 500,
  [ErrorCode.DATABASE_ERROR]: 500,
  [ErrorCode.EXTERNAL_SERVICE_ERROR]: 502,
  [ErrorCode.AGENT_EXECUTION_ERROR]: 500,
  [ErrorCode.AGENT_TIMEOUT]: 504,
  [ErrorCode.CONFIGURATION_ERROR]: 500,
};

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: Record<string, unknown>;
  public readonly timestamp: string;

  constructor(
    code: ErrorCode,
    message?: string,
    options?: {
      details?: Record<string, unknown>;
      isOperational?: boolean;
      cause?: Error;
    },
  ) {
    const finalMessage = message ?? code;
    super(finalMessage, { cause: options?.cause });
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = ERROR_STATUS_MAP[code] ?? 500;
    this.isOperational = options?.isOperational ?? true;
    this.details = options?.details;
    this.timestamp = new Date().toISOString();

    // Maintain proper stack trace in V8 environments
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /** Convert to a safe JSON response — no stack traces in production */
  toJSON(includeDetails: boolean = false): Record<string, unknown> {
    const isProd = process.env.NODE_ENV === "production";

    const result: Record<string, unknown> = {
      error: {
        code: this.code,
        message: isProd && !this.isOperational
          ? "Internal server error"
          : this.message,
        timestamp: this.timestamp,
      },
    };

    if (this.details && (includeDetails || !isProd)) {
      (result.error as Record<string, unknown>).details = this.details;
    }

    if (!isProd && this.stack) {
      (result.error as Record<string, unknown>).stack = this.stack;
    }

    return result;
  }
}

// ═══════════════════════════════════════════════════════════
// Specialized error subclasses
// ═══════════════════════════════════════════════════════════

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(ErrorCode.VALIDATION_ERROR, message, { details });
  }
}

export class AuthError extends AppError {
  constructor(code: ErrorCode, message: string, details?: Record<string, unknown>) {
    super(code, message, { details });
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(ErrorCode.NOT_FOUND, `${resource} not found${id ? `: ${id}` : ""}`, {
      details: { resource, id },
    });
  }
}

export class AgentNotFoundError extends AppError {
  constructor(agentId: string) {
    super(ErrorCode.AGENT_NOT_FOUND, `Agent not found: ${agentId}`, {
      details: { agentId },
    });
  }
}

export class BillingError extends AppError {
  constructor(code: ErrorCode, message: string, details?: Record<string, unknown>) {
    super(code, message, { details });
  }
}

export class RateLimitError extends AppError {
  public readonly retryAfterMs: number;

  constructor(retryAfterMs: number, message?: string) {
    super(ErrorCode.RATE_LIMITED, message ?? "Rate limit exceeded", {
      details: { retryAfterMs },
    });
    this.retryAfterMs = retryAfterMs;
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, cause?: Error) {
    super(ErrorCode.DATABASE_ERROR, message, { cause, isOperational: false });
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message: string, cause?: Error) {
    super(ErrorCode.EXTERNAL_SERVICE_ERROR, `${service}: ${message}`, {
      cause,
      details: { service },
    });
  }
}

export class ConfigurationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(ErrorCode.CONFIGURATION_ERROR, message, { details, isOperational: false });
  }
}

// ═══════════════════════════════════════════════════════════
// Error helper utilities
// ═══════════════════════════════════════════════════════════

/** Convert any thrown value into an AppError */
export function normalizeError(err: unknown): AppError {
  if (err instanceof AppError) return err;

  if (err instanceof Error) {
    // Detect common DB errors
    const msg = err.message?.toLowerCase() ?? "";
    if (msg.includes("connection") || msg.includes("econnrefused") || msg.includes("pool")) {
      return new DatabaseError(err.message, err);
    }
    if (msg.includes("unique") || msg.includes("duplicate")) {
      return new AppError(ErrorCode.DUPLICATE_RESOURCE, err.message, { cause: err });
    }
    return new AppError(ErrorCode.INTERNAL_ERROR, err.message, {
      cause: err,
      isOperational: false,
    });
  }

  return new AppError(ErrorCode.INTERNAL_ERROR, String(err), { isOperational: false });
}

/** Check if an error is operational (expected) vs a bug */
export function isOperationalError(err: unknown): boolean {
  if (err instanceof AppError) return err.isOperational;
  return false;
}

/** Global unhandled rejection / uncaught exception handlers */
export function installGlobalErrorHandlers(): void {
  process.on("unhandledRejection", (reason: unknown) => {
    const err = normalizeError(reason);
    console.error("[UNHANDLED REJECTION]", err.toJSON());
    if (!err.isOperational) {
      process.exit(1);
    }
  });

  process.on("uncaughtException", (err: Error) => {
    const appErr = normalizeError(err);
    console.error("[UNCAUGHT EXCEPTION]", appErr.toJSON());
    // Uncaught exceptions are unsafe — always exit
    process.exit(1);
  });
}
