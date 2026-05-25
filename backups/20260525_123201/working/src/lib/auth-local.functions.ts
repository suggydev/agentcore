import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { setResponseHeader } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "./auth-middleware-local";
import { db } from "@/db";
import { profiles, userRoles, companies, subscriptions } from "@/db/schema";
import { hashPassword, verifyPassword, generateToken, generateRefreshToken, buildAuthCookies, buildClearCookies } from "@/lib/auth-local";

export const loginFn = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({ email: z.string().email(), password: z.string().min(1) }).parse(d),
  )
  .handler(async ({ data }) => {
    const [user] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.email, data.email))
      .limit(1);

    if (!user || !user.passwordHash) {
      throw new Error("Неверный email или пароль");
    }

    const valid = await verifyPassword(data.password, user.passwordHash);
    if (!valid) {
      throw new Error("Неверный email или пароль");
    }

    const [role] = await db
      .select()
      .from(userRoles)
      .where(eq(userRoles.userId, user.id))
      .limit(1);

    const token = generateToken(user.id, user.companyId || null, (role?.role as any) || "viewer");
    const refreshToken = generateRefreshToken(user.id);
    const cookies = buildAuthCookies(token, refreshToken);
    for (const c of cookies) setResponseHeader("Set-Cookie", c);

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
        companyId: user.companyId,
      },
      role: role?.role || "viewer",
    };
  });

export const registerFn = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        email: z.string().email(),
        password: z.string().min(6),
        fullName: z.string().min(1),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const [existing] = await db
      .select({ id: profiles.id })
      .from(profiles)
      .where(eq(profiles.email, data.email))
      .limit(1);

    if (existing) {
      throw new Error("Пользователь с таким email уже существует");
    }

    const passwordHash = await hashPassword(data.password);
    const userId = crypto.randomUUID();

    await db.insert(profiles).values({
      id: userId,
      email: data.email,
      fullName: data.fullName,
      passwordHash,
    });

    const token = generateToken(userId, null, "viewer");
    const refreshToken = generateRefreshToken(userId);
    const cookies = buildAuthCookies(token, refreshToken);
    for (const c of cookies) setResponseHeader("Set-Cookie", c);

    return {
      user: {
        id: userId,
        email: data.email,
        fullName: data.fullName,
        companyId: null,
      },
      role: null,
    };
  });

export const logoutFn = createServerFn({ method: "POST" })
  .handler(async () => {
    const cookies = buildClearCookies();
    for (const c of cookies) setResponseHeader("Set-Cookie", c);
    return { ok: true };
  });

export const getCurrentUserFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [user] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, context.userId))
      .limit(1);

    if (!user) {
      throw new Error("User not found");
    }

    const [role] = await db
      .select()
      .from(userRoles)
      .where(eq(userRoles.userId, user.id))
      .limit(1);

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
        companyId: user.companyId,
      },
      role: role?.role || "viewer",
    };
  });

export const createWorkspaceFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ companyName: z.string().min(1) }).parse(d))
  .handler(async ({ data, context }) => {
    const [company] = await db
      .insert(companies)
      .values({ name: data.companyName })
      .returning();

    await db.insert(userRoles).values({
      userId: context.userId,
      companyId: company.id,
      role: "owner",
    });

    await db
      .update(profiles)
      .set({ companyId: company.id })
      .where(eq(profiles.id, context.userId));

    await db.insert(subscriptions).values({
      companyId: company.id,
      plan: "basic",
      status: "trialing",
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    });

    const newToken = generateToken(context.userId, company.id, "owner");
    const newRefreshToken = generateRefreshToken(context.userId);
    const cookies = buildAuthCookies(newToken, newRefreshToken);
    for (const c of cookies) setResponseHeader("Set-Cookie", c);

    return { companyId: company.id };
  });
