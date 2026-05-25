/**
 * POST /api/auth/login
 *
 * Authenticates a user against the local `profiles` table (which must have a
 * `password_hash` column added by the migration agent).
 *
 * Returns { accessToken, refreshToken, user } and sets HTTP-only cookies.
 * If the user has 2FA enabled the response indicates that a TOTP code is
 * required instead of issuing the final tokens.
 */
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { verifyPassword, generateToken, generateRefreshToken, buildAuthCookies } from "@/lib/auth-local";
import { dbQueryOne } from "@/lib/auth-db";
import type { AppRole } from "@/lib/auth";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

interface ProfileRow {
  id: string;
  email: string | null;
  full_name: string | null;
  company_id: string | null;
  password_hash: string | null;
  two_factor_enabled: boolean;
  avatar_url: string | null;
}

interface RoleRow {
  role: AppRole;
}

export const Route = createFileRoute("/api/auth/login")({
  server: {
    handlers: {
      POST: async ({ request }: any) => {
        try {
          const body = await request.json();
          const parsed = loginSchema.safeParse(body);
          if (!parsed.success) {
            return new Response(JSON.stringify({ error: "Invalid input", details: parsed.error.flatten() }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          const { email, password } = parsed.data;

          // Look up user by email
          const profile = await dbQueryOne<ProfileRow>(
            `SELECT id, email, full_name, company_id, password_hash, two_factor_enabled, avatar_url
             FROM public.profiles WHERE email = $1`,
            [email],
          );

          if (!profile || !profile.password_hash) {
            return new Response(JSON.stringify({ error: "Invalid email or password" }), {
              status: 401,
              headers: { "Content-Type": "application/json" },
            });
          }

          // Verify password
          const valid = await verifyPassword(password, profile.password_hash);
          if (!valid) {
            return new Response(JSON.stringify({ error: "Invalid email or password" }), {
              status: 401,
              headers: { "Content-Type": "application/json" },
            });
          }

          // If 2FA is enabled, tell the client a code is needed
          if (profile.two_factor_enabled) {
            return new Response(
              JSON.stringify({
                requires2FA: true,
                userId: profile.id,
              }),
              { status: 200, headers: { "Content-Type": "application/json" } },
            );
          }

          // Resolve primary role
          let role: AppRole = "viewer";
          if (profile.company_id) {
            const roleRow = await dbQueryOne<RoleRow>(
              `SELECT role FROM public.user_roles WHERE user_id = $1 AND company_id = $2 LIMIT 1`,
              [profile.id, profile.company_id],
            );
            if (roleRow) role = roleRow.role;
          }

          // Generate tokens
          const accessToken = generateToken(profile.id, profile.company_id, role);
          const refreshToken = generateRefreshToken(profile.id);

          // Build response with cookies
          const secure = request.headers.get("x-forwarded-proto") === "https" || process.env.NODE_ENV === "production";
          const setCookies = buildAuthCookies(accessToken, refreshToken, secure);

          return new Response(
            JSON.stringify({
              accessToken,
              refreshToken,
              user: {
                id: profile.id,
                email: profile.email,
                fullName: profile.full_name,
                companyId: profile.company_id,
                role,
                avatarUrl: profile.avatar_url,
              },
            }),
            {
              status: 200,
              headers: {
                "Content-Type": "application/json",
                "Set-Cookie": setCookies.join(", "),
              },
            },
          );
        } catch (err: any) {
          console.error("[auth/login]", err);
          return new Response(JSON.stringify({ error: "Internal server error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
