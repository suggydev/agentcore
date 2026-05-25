/**
 * POST /api/auth/register
 *
 * Creates a new user in the local `profiles` table, hashes the password,
 * and returns JWT tokens.  Optionally creates a company if one is provided.
 */
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { randomUUID } from "crypto";
import { hashPassword, generateToken, generateRefreshToken, buildAuthCookies } from "@/lib/auth-local";
import { dbQueryOne, getDb } from "@/lib/auth-db";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(1).max(200),
  companyName: z.string().min(1).max(200).optional(),
});

export const Route = createFileRoute("/api/auth/register")({
  server: {
    handlers: {
      POST: async ({ request }: any) => {
        try {
          const body = await request.json();
          const parsed = registerSchema.safeParse(body);
          if (!parsed.success) {
            return new Response(JSON.stringify({ error: "Invalid input", details: parsed.error.flatten() }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          const { email, password, fullName, companyName } = parsed.data;

          // Check if email is already taken
          const existing = await dbQueryOne<{ id: string }>(
            `SELECT id FROM public.profiles WHERE email = $1`,
            [email],
          );
          if (existing) {
            return new Response(JSON.stringify({ error: "Email already registered" }), {
              status: 409,
              headers: { "Content-Type": "application/json" },
            });
          }

          const userId = randomUUID();
          const passwordHash = await hashPassword(password);

          const db = getDb();
          const client = await db.connect();

          try {
            await client.query("BEGIN");

            // Create company if provided
            let companyId: string | null = null;
            if (companyName) {
              companyId = randomUUID();
              await client.query(
                `INSERT INTO public.companies (id, name) VALUES ($1, $2)`,
                [companyId, companyName],
              );
            }

            // Create profile with hashed password
            await client.query(
              `INSERT INTO public.profiles (id, email, full_name, company_id, password_hash)
               VALUES ($1, $2, $3, $4, $5)`,
              [userId, email, fullName, companyId, passwordHash],
            );

            // Assign owner role if a company was created
            if (companyId) {
              await client.query(
                `INSERT INTO public.user_roles (user_id, company_id, role) VALUES ($1, $2, 'owner')`,
                [userId, companyId],
              );
            }

            await client.query("COMMIT");

            const role = companyId ? "owner" : "viewer";
            const accessToken = generateToken(userId, companyId, role);
            const refreshToken = generateRefreshToken(userId);

            const secure = request.headers.get("x-forwarded-proto") === "https" || process.env.NODE_ENV === "production";
            const setCookies = buildAuthCookies(accessToken, refreshToken, secure);

            return new Response(
              JSON.stringify({
                accessToken,
                refreshToken,
                user: {
                  id: userId,
                  email,
                  fullName,
                  companyId,
                  role,
                },
              }),
              {
                status: 201,
                headers: {
                  "Content-Type": "application/json",
                  "Set-Cookie": setCookies.join(", "),
                },
              },
            );
          } catch (txErr) {
            await client.query("ROLLBACK");
            throw txErr;
          } finally {
            client.release();
          }
        } catch (err: any) {
          console.error("[auth/register]", err);
          return new Response(JSON.stringify({ error: "Internal server error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
