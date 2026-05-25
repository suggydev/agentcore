/**
 * HTTP request/response logging middleware.
 *
 * Automatically logs incoming requests with method, URL, user-agent,
 * and records response status + duration on completion.
 * Uses the structured logger so all output is JSON in production.
 */
import { createMiddleware } from "@tanstack/react-start";
import { getRequest, getResponse } from "@tanstack/react-start/server";
import { getLogger } from "@/lib/logger";
import type { LogLevel } from "@/lib/logger";

interface RequestLogContext {
  method: string;
  url: string;
  path: string;
  userAgent?: string;
  correlationId?: string;
  userId?: string;
  companyId?: string;
}

function extractPath(url: string): string {
  try {
    const parsed = new URL(url, "http://localhost");
    return parsed.pathname;
  } catch {
    return url;
  }
}

function generateCorrelationId(): string {
  return `req-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Middleware that logs every HTTP request with timing information.
 *
 * - Logs request start at DEBUG level
 * - Logs request completion at INFO (or WARN for 4xx, ERROR for 5xx)
 * - Includes correlationId, userId, companyId when available
 * - Masks sensitive headers and query params
 */
export const requestLogger = createMiddleware({ type: "function" }).server(
  async ({ next, context }) => {
    const logger = getLogger();
    const request = getRequest();

    if (!request) {
      return next();
    }

    const correlationId =
      request.headers.get("x-correlation-id") ||
      request.headers.get("x-request-id") ||
      generateCorrelationId();

    const method = request.method || "UNKNOWN";
    const url = request.url || "/";
    const path = extractPath(url);
    const userAgent = request.headers.get("user-agent") ?? undefined;

    // Extract auth context if already resolved by auth middleware
    const userId = (context as any)?.userId ?? undefined;
    const companyId = (context as any)?.companyId ?? undefined;

    const logCtx: RequestLogContext = {
      method,
      url: path,
      path,
      userAgent,
      correlationId,
      userId,
      companyId,
    };

    const reqLogger = logger.child({
      correlationId,
      userId,
      companyId,
    });

    reqLogger.debug("Incoming request", {
      method,
      path,
      userAgent,
    });

    const startTime = Date.now();

    try {
      const result = await next();

      const durationMs = Date.now() - startTime;

      // Determine log level based on response status
      let level: LogLevel = "info";
      let status: number | undefined;

      try {
        const response = getResponse();
        status = response?.status;
      } catch {
        // getResponse may not be available in all contexts
      }

      if (status !== undefined) {
        if (status >= 500) {
          level = "error";
        } else if (status >= 400) {
          level = "warn";
        }
      }

      reqLogger.log(level, "Request completed", {
        method,
        path,
        status,
        durationMs,
      });

      return result;
    } catch (error: any) {
      const durationMs = Date.now() - startTime;

      reqLogger.error("Request failed with unhandled error", {
        method,
        path,
        durationMs,
        errorName: error?.name,
        errorMessage: error?.message,
      });

      throw error;
    }
  },
);
