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

  // Permission errors (403)
  FORBIDDEN = "FORBIDDEN",
  INSUFFICIENT_ROLE = "INSUFFICIENT_ROLE",
  ADMIN_REQUIRED = "ADMIN_REQUIRED",

  // Validation errors (400)
  VALIDATION_ERROR = "VALIDATION_ERROR",
  INVALID_INPUT = "INVALID_INPUT",

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

  // Rate limiting (429)
  RATE_LIMITED = "RATE_LIMITED",

  // Server errors (500)
  INTERNAL_ERROR = "INTERNAL_ERROR",
  DATABASE_ERROR = "DATABASE_ERROR",
  EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR",
  AGENT_EXECUTION_ERROR = "AGENT_EXECUTION_ERROR",
  AGENT_TIMEOUT = "AGENT_TIMEOUT",
}

const ERROR_STATUS_MAP: Record<ErrorCode, number> = {
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.TOKEN_EXPIRED]: 401,
  [ErrorCode.INVALID_TOKEN]: 401,
  [ErrorCode.INVALID_CREDENTIALS]: 401,
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.INSUFFICIENT_ROLE]: 403,
  [ErrorCode.ADMIN_REQUIRED]: 403,
  [ErrorCode.VALIDATION_ERROR]: 400,
  [ErrorCode.INVALID_INPUT]: 400,
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
  [ErrorCode.RATE_LIMITED]: 429,
  [ErrorCode.INTERNAL_ERROR]: 500,
  [ErrorCode.DATABASE_ERROR]: 500,
  [ErrorCode.EXTERNAL_SERVICE_ERROR]: 502,
  [ErrorCode.AGENT_EXECUTION_ERROR]: 500,
  [ErrorCode.AGENT_TIMEOUT]: 504,
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
    const msg = message || code;
    super(msg, { cause: options?.cause });
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = ERROR_STATUS_MAP[code] || 500;
    this.isOperational = options?.isOperational ?? true;
    this.details = options?.details;
    this.timestamp = new Date().toISOString();

    // Maintain proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, new.target.prototype);
  }

  /** Serialize for API response — never includes stack traces */
  toJSON(): Record<string, unknown> {
    const result: Record<string, unknown> = {
      error: {
        code: this.code,
        message: this.message,
        timestamp: this.timestamp,
      },
    };
    if (this.details) {
      result.error.details = this.details;
    }
    return result;
  }
}

// ═══════════════════════════════════════════════════════════
// Specific error subclasses for convenience
// ═══════════════════════════════════════════════════════════

export class AuthError extends AppError {
  constructor(code: ErrorCode, message?: string, details?: Record<string, unknown>) {
    super(code, message, { details });
  }
}

export class ForbiddenError extends AppError {
  constructor(message?: string, details?: Record<string, unknown>) {
    super(ErrorCode.FORBIDDEN, message, { details });
  }
}

export class AdminRequiredError extends AppError {
  constructor(message = "Admin access required") {
    super(ErrorCode.ADMIN_REQUIRED, message);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(ErrorCode.VALIDATION_ERROR, message, { details });
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(
      ErrorCode.NOT_FOUND,
      `${resource} not found${id ? `: ${id}` : ""}`,
      { resource, id },
    );
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(ErrorCode.CONFLICT, message, { details });
  }
}

export class BillingError extends AppError {
  constructor(code: ErrorCode, message: string, details?: Record<string, unknown>) {
    super(code, message, { details });
  }
}

export class RateLimitError extends AppError {
  public readonly retryAfterMs: number;

  constructor(retryAfterMs: number, message = "Too many requests") {
    super(ErrorCode.RATE_LIMITED, message, { retryAfterMs });
    this.retryAfterMs = retryAfterMs;
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, cause?: Error) {
    super(ErrorCode.DATABASE_ERROR, message, { isOperational: false, cause });
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message?: string, cause?: Error) {
    super(ErrorCode.EXTERNAL_SERVICE_ERROR, message || `External service error: ${service}`, {
      details: { service },
      isOperational: true,
      cause,
    });
  }
}

// ═══════════════════════════════════════════════════════════
// Error handler utilities
// ═══════════════════════════════════════════════════════════

/** Convert unknown thrown values into AppError */
export function normalizeError(err: unknown): AppError {
  if (err instanceof AppError) return err;

  if (err instanceof Error) {
    // Zod validation errors
    if (err.name === "ZodError") {
      const zodErr = err as any;
      const fields = zodErr.flatten?.()?.fieldErrors ?? {};
      return new ValidationError("Input validation failed", { fields });
    }

    // JWT errors
    if (err.name === "TokenExpiredError") {
      return new AuthError(ErrorCode.TOKEN_EXPIRED, "Token has expired");
    }
    if (err.name === "JsonWebTokenError") {
      return new AuthError(ErrorCode.INVALID_TOKEN, "Invalid token");
    }

    // Database constraint violations
    if (err.message?.includes("duplicate key") || err.message?.includes("unique constraint")) {
      if (err.message?.includes("email")) {
        return new ConflictError("Email already exists", { field: "email" });
      }
      return new ConflictError("Resource already exists");
    }
    if (err.message?.includes("foreign key constraint")) {
      return new ValidationError("Referenced resource does not exist");
    }

    return new AppError(ErrorCode.INTERNAL_ERROR, err.message, {
      isOperational: false,
      cause: err,
    });
  }

  if (typeof err === "string") {
    return new AppError(ErrorCode.INTERNAL_ERROR, err, { isOperational: false });
  }

  return new AppError(ErrorCode.INTERNAL_ERROR, "An unexpected error occurred", {
    isOperational: false,
  });
}

/** Check if an error is operational (expected) vs a bug */
export function isOperationalError(err: unknown): boolean {
  if (err instanceof AppError) return err.isOperational;
  return false;
}
