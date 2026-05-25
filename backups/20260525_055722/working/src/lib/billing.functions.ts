import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/lib/auth-middleware-local";
import { PLAN_PRICES, PLANS } from "@/lib/billing-plans";
import { db } from "@/db";
import { subscriptions, walletTransactions } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

/** Create a YooKassa checkout session for a subscription plan */
export const createSubscriptionCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      companyId: z.string().uuid(),
      plan: z.enum(["basic", "extended", "premium"]),
      returnUrl: z.string().url(),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const shopId = process.env.YOOKASSA_SHOP_ID;
    const secret = process.env.YOOKASSA_SECRET_KEY;
    if (!shopId || !secret) throw new Error("YooKassa not configured");

    const idempotenceKey = crypto.randomUUID();
    const amountKopecks = PLAN_PRICES[data.plan];
    const value = (amountKopecks / 100).toFixed(2);
    const auth = Buffer.from(`${shopId}:${secret}`).toString("base64");

    const r = await fetch("https://api.yookassa.ru/v3/payments", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Idempotence-Key": idempotenceKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: { value, currency: "RUB" },
        capture: true,
        save_payment_method: true,
        confirmation: { type: "redirect", return_url: data.returnUrl },
        description: `AgentCore подписка: ${data.plan}`,
        metadata: {
          company_id: data.companyId,
          kind: "subscription",
          plan: data.plan,
        },
      }),
    });

    const payment: any = await r.json();
    if (!r.ok) {
      throw new Error(`YooKassa: ${payment?.description ?? r.statusText}`);
    }

    const [sub] = await db.insert(subscriptions).values({
      companyId: data.companyId,
      plan: data.plan,
      status: "pending",
      paymentMethodId: null,
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    }).returning({ id: subscriptions.id });

    return {
      paymentId: payment.id,
      confirmationUrl: payment.confirmation?.confirmation_url as string,
      subscriptionId: sub.id,
    };
  });

/** Cancel a subscription */
export const cancelSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ subscriptionId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    await db.update(subscriptions)
      .set({ status: "canceled" })
      .where(eq(subscriptions.id, data.subscriptionId));
    return { ok: true };
  });

/** Get current subscription status */
export const getCurrentSubscription = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ companyId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const rows = await db.select()
      .from(subscriptions)
      .where(and(eq(subscriptions.companyId, data.companyId), eq(subscriptions.status, "active")))
      .orderBy(desc(subscriptions.createdAt))
      .limit(1);
    const sub = rows[0] ?? null;
    return { subscription: sub, plan: sub?.plan ?? "none" };
  });

/** List all invoices (wallet transactions for subscriptions) */
export const listInvoices = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ companyId: z.string().uuid(), limit: z.number().int().min(1).max(200).optional() }).parse(d))
  .handler(async ({ data }) => {
    const rows = await db.select({
      id: walletTransactions.id,
      type: walletTransactions.type,
      status: walletTransactions.status,
      amountKopecks: walletTransactions.amountKopecks,
      description: walletTransactions.description,
      externalId: walletTransactions.externalId,
      createdAt: walletTransactions.createdAt,
    })
      .from(walletTransactions)
      .where(and(eq(walletTransactions.companyId, data.companyId), eq(walletTransactions.type, "subscription")))
      .orderBy(desc(walletTransactions.createdAt))
      .limit(data.limit ?? 50);

    return {
      invoices: rows.map(r => ({
        ...r,
        amountKopecks: Number(r.amountKopecks),
      })),
    };
  });
