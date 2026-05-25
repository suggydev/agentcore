/**
 * Local authentication module — drop-in replacement for Supabase Auth.
 * Uses bcrypt for password hashing and JWT (jsonwebtoken) for stateless tokens.
 *
 * IMPORTANT: This file imports Node-only packages (bcryptjs, jsonwebtoken).
 * It MUST NOT be imported from client-side code.  Cookie helpers that are
 * safe for the browser are in @/lib/auth-cookies instead.
 *
 * Exports mirror the patterns used by the Supabase middleware so that
 * `requireAuth` can replace `requireSupabaseAuth` without changing call-sites.
 */
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { AppRole } from "@/lib/auth";

// Re-export cookie helpers for backward compatibility.
// Consumers that only need cookie helpers should import from @/lib/auth-cookies.
export {
  extractTokensFromCookie,
  buildAuthCookies,
  buildClearCookies,
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  type CookieAuthResult,
} from "@/lib/auth-cookies";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const BCRYPT_ROUNDS = 12;
const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY = "7d";

function getJwtSecret(): string {
  const env = process.env.JWT_SECRET;
  if (env) return env;

  // Derive a stable secret from the existing encryption key so that
  // deployments that already set AGENTCORE_ENCRYPTION_KEY work out of the box.
  const fallback = process.env.AGENTCORE_ENCRYPTION_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!fallback) {
    throw new Error(
      "JWT_SECRET (or AGENTCORE_ENCRYPTION_KEY) environment variable is required for local auth",
    );
  }
  return fallback;
}

// Lazy-initialised singleton so the secret is read once at first use.
let _secret: string | undefined;
function secret(): string {
  if (!_secret) _secret = getJwtSecret();
  return _secret;
}

// ---------------------------------------------------------------------------
// Token payloads
// ---------------------------------------------------------------------------

export interface AccessTokenPayload {
  sub: string;        // userId (UUID)
  companyId: string | null;
  role: AppRole;
  type: "access";
}

export interface RefreshTokenPayload {
  sub: string;        // userId (UUID)
  type: "refresh";
}

// ---------------------------------------------------------------------------
// Password helpers
// ---------------------------------------------------------------------------

/** Hash a plaintext password with bcrypt (12 rounds). */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/** Verify a plaintext password against a bcrypt hash. */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ---------------------------------------------------------------------------
// Access token
// ---------------------------------------------------------------------------

/** Generate a short-lived access token (15 min). */
export function generateToken(userId: string, companyId: string | null, role: AppRole = "viewer"): string {
  const payload: AccessTokenPayload = {
    sub: userId,
    companyId,
    role,
    type: "access",
  };
  return jwt.sign(payload, secret(), { expiresIn: ACCESS_TOKEN_EXPIRY });
}

/** Verify an access token. Returns the decoded payload or throws. */
export function verifyToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, secret()) as AccessTokenPayload;
  if (decoded.type !== "access") {
    throw new Error("Invalid token type — expected access token");
  }
  return decoded;
}

// ---------------------------------------------------------------------------
// Refresh token
// ---------------------------------------------------------------------------

/** Generate a long-lived refresh token (7 days). */
export function generateRefreshToken(userId: string): string {
  const payload: RefreshTokenPayload = {
    sub: userId,
    type: "refresh",
  };
  return jwt.sign(payload, secret(), { expiresIn: REFRESH_TOKEN_EXPIRY });
}

/** Verify a refresh token. Returns the decoded payload or throws. */
export function verifyRefreshToken(token: string): RefreshTokenPayload {
  const decoded = jwt.verify(token, secret()) as RefreshTokenPayload;
  if (decoded.type !== "refresh") {
    throw new Error("Invalid token type — expected refresh token");
  }
  return decoded;
}
