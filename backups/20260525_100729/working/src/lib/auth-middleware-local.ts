/**
 * Local auth middleware — drop-in replacement for `requireSupabaseAuth`.
 *
 * This file is safe to import from client-side code — it does NOT
 * pull in Node-only packages (jwt, bcrypt, pg).  Server-only code
 * lives in @/lib/auth-local and @/lib/auth-db.
 *
 * The middleware reads a JWT from either:
 *   1. Authorization: Bearer <token>  header   (API / serverFn calls)
 *   2. ac_access_token cookie                 (browser navigations)
 *
 * And populates `context` with the same shape used by the Supabase middleware
 * so downstream handlers need minimal changes:
 *   - context.userId   (was data.claims.sub)
 *   - context.companyId
 *   - context.role
 *   - context.claims   (the full decoded payload)
 */
import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { extractTokensFromCookie } from "@/lib/auth-cookies";
import type { AppRole } from "@/lib/auth";
import type { AccessTokenPayload } from "@/lib/auth-local";

// ---------------------------------------------------------------------------
// Auth context shape — mirrors what Supabase middleware put into context
// ---------------------------------------------------------------------------

export interface AuthContext {
  userId: string;
  companyId: string | null;
  role: AppRole;
  claims: AccessTokenPayload;
  /** Raw access token string — useful for passthrough / logging. */
  accessToken: string;
}

// ---------------------------------------------------------------------------
// requireAuth middleware
// ---------------------------------------------------------------------------

export const requireAuth = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    // Lazy import to keep jsonwebtoken out of the client bundle
    const { verifyToken } = await import("@/lib/auth-local");

    const request = getRequest();

    if (!request?.headers) {
      throw new Error("Unauthorized: No request headers available");
    }

    // Try Bearer token first, then cookie
    let token: string | null = null;

    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.slice(7);
    }

    if (!token) {
      const cookieHeader = request.headers.get("cookie");
      const { accessToken } = extractTokensFromCookie(cookieHeader);
      token = accessToken;
    }

    if (!token) {
      throw new Error("Unauthorized: No token provided");
    }

    let claims: AccessTokenPayload;
    try {
      claims = verifyToken(token);
    } catch (err: any) {
      const msg = err?.name === "TokenExpiredError"
        ? "Unauthorized: Token expired"
        : "Unauthorized: Invalid token";
      throw new Error(msg);
    }

    if (!claims.sub) {
      throw new Error("Unauthorized: No user ID found in token");
    }

    return next({
      context: {
        userId: claims.sub,
        companyId: claims.companyId ?? null,
        role: claims.role,
        claims,
        accessToken: token,
      } satisfies AuthContext,
    });
  },
);

/**
 * Backward-compatibility alias — all migrated server functions import
 * { requireSupabaseAuth } from "@/lib/auth-middleware-local".
 */
export const requireSupabaseAuth = requireAuth;

/**
 * Client-side middleware that attaches the Bearer token from cookies
 * to outgoing serverFn RPCs — the local-auth equivalent of
 * `attachSupabaseAuth`.
 *
 * Usage: register as a global function middleware in start.ts
 */
export const attachLocalAuth = createMiddleware({ type: "function" }).client(
  async ({ next }) => {
    // On the client we read the access token from document.cookie
    let token: string | null = null;
    if (typeof document !== "undefined") {
      const { accessToken } = extractTokensFromCookie(document.cookie);
      token = accessToken;
    }
    return next({
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },
);

/** Backward-compatibility alias for attachSupabaseAuth. */
export const attachSupabaseAuth = attachLocalAuth;
