import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { eq, desc, gte } from "drizzle-orm";
import { db } from "@/db";
import { agents, agentLogs, agentVersions } from "@/db/schema";
import { requireSupabaseAuth } from "@/lib/auth-middleware-local";

const SNAPSHOT_FIELDS_MAP: Record<string, any> = {
  tone: agents.tone,
  toneInstructions: agents.toneInstructions,
  restrictions: agents.restrictions,
  forbiddenTopics: agents.forbiddenTopics,
  dailyBudgetUsd: agents.dailyBudgetUsd,
  maxTokensPerTask: agents.maxTokensPerTask,
  timeoutSeconds: agents.timeoutSeconds,
  rateLimitPerMin: agents.rateLimitPerMin,
  model: agents.model,
  greetingTemplate: agents.greetingTemplate,
  closingTemplate: agents.closingTemplate,
  maxAutoRepliesPerConversation: agents.maxAutoRepliesPerConversation,
  maxMessagesPerDay: agents.maxMessagesPerDay,
  maxRunsPerDay: agents.maxRunsPerDay,
  maxAutoRepliesPerDay: agents.maxAutoRepliesPerDay,
  allowedHoursStart: agents.allowedHoursStart,
  allowedHoursEnd: agents.allowedHoursEnd,
  allowedDays: agents.allowedDays,
};

/** Auto-create a version snapshot before config changes */
async function autoVersion(
  agentId: string,
  userId: string,
  changeDescription: string,
) {
  const agent = await db
    .select(SNAPSHOT_FIELDS_MAP)
    .from(agents)
    .where(eq(agents.id, agentId))
    .limit(1)
    .then((rows) => rows[0] ?? null);
  if (!agent) return;

  const snapshot: Record<string, unknown> = {};
  for (const key of Object.keys(SNAPSHOT_FIELDS_MAP)) {
    snapshot[key] = (agent as Record<string, unknown>)[key] ?? null;
  }

  const latest = await db
    .select({ version: agentVersions.version })
    .from(agentVersions)
    .where(eq(agentVersions.agentId, agentId))
    .orderBy(desc(agentVersions.version))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  const nextVersion = (latest?.version ?? 0) + 1;

  await db.insert(agentVersions).values({
    agentId,
    version: nextVersion,
    snapshot,
    changeDescription,
    createdBy: userId,
  });
}

/** Pause an agent */
export const pauseAgent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ agentId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    await db
      .update(agents)
      .set({ status: "paused" })
      .where(eq(agents.id, data.agentId));
    return { ok: true };
  });

/** Resume an agent */
export const resumeAgent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ agentId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    await db
      .update(agents)
      .set({ status: "active" })
      .where(eq(agents.id, data.agentId));
    return { ok: true };
  });

/** Stop an agent immediately (cancels all active jobs) */
export const stopAgent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ agentId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    await db
      .update(agents)
      .set({ status: "error" })
      .where(eq(agents.id, data.agentId));
    return { ok: true };
  });

/** Update agent limits (auto-versions before change) */
export const updateAgentLimits = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      agentId: z.string().uuid(),
      daily_budget_usd: z.number().min(0).max(10000).optional(),
      max_tokens_per_task: z.number().int().min(100).max(128000).optional(),
      timeout_seconds: z.number().int().min(10).max(3600).optional(),
      rate_limit_per_min: z.number().int().min(1).max(10000).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const changedFields = Object.keys(data).filter((k) => k !== "agentId");
    await autoVersion(data.agentId, context.userId, `Limits updated: ${changedFields.join(", ")}`);

    const updates: Record<string, unknown> = {};
    if (data.daily_budget_usd !== undefined) updates.dailyBudgetUsd = String(data.daily_budget_usd);
    if (data.max_tokens_per_task !== undefined) updates.maxTokensPerTask = data.max_tokens_per_task;
    if (data.timeout_seconds !== undefined) updates.timeoutSeconds = data.timeout_seconds;
    if (data.rate_limit_per_min !== undefined) updates.rateLimitPerMin = data.rate_limit_per_min;

    await db
      .update(agents)
      .set(updates)
      .where(eq(agents.id, data.agentId));
    return { ok: true };
  });

/** Update agent tone (auto-versions before change) */
export const updateAgentTone = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      agentId: z.string().uuid(),
      tone: z.enum(["professional", "friendly", "casual", "technical", "empathetic"]).optional(),
      tone_instructions: z.string().max(5000).optional(),
      greeting_template: z.string().max(2000).optional(),
      closing_template: z.string().max(2000).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const changedFields = Object.keys(data).filter((k) => k !== "agentId");
    await autoVersion(data.agentId, context.userId, `Tone updated: ${changedFields.join(", ")}`);

    const updates: Record<string, unknown> = {};
    if (data.tone !== undefined) updates.tone = data.tone;
    if (data.tone_instructions !== undefined) updates.toneInstructions = data.tone_instructions;
    if (data.greeting_template !== undefined) updates.greetingTemplate = data.greeting_template;
    if (data.closing_template !== undefined) updates.closingTemplate = data.closing_template;

    const [updated] = await db
      .update(agents)
      .set(updates)
      .where(eq(agents.id, data.agentId))
      .returning({
        id: agents.id,
        tone: agents.tone,
        toneInstructions: agents.toneInstructions,
        greetingTemplate: agents.greetingTemplate,
        closingTemplate: agents.closingTemplate,
      });
    return updated;
  });

/** Update agent restrictions (auto-versions before change) */
export const updateAgentRestrictions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      agentId: z.string().uuid(),
      restrictions: z.array(z.string().min(1).max(500)).optional(),
      forbidden_topics: z.array(z.string().min(1).max(200)).optional(),
      max_auto_replies_per_conversation: z.number().int().min(0).max(1000).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const changedFields = Object.keys(data).filter((k) => k !== "agentId");
    await autoVersion(data.agentId, context.userId, `Restrictions updated: ${changedFields.join(", ")}`);

    const updates: Record<string, unknown> = {};
    if (data.restrictions !== undefined) updates.restrictions = data.restrictions;
    if (data.forbidden_topics !== undefined) updates.forbiddenTopics = data.forbidden_topics;
    if (data.max_auto_replies_per_conversation !== undefined) updates.maxAutoRepliesPerConversation = data.max_auto_replies_per_conversation;

    const [updated] = await db
      .update(agents)
      .set(updates)
      .where(eq(agents.id, data.agentId))
      .returning({
        id: agents.id,
        restrictions: agents.restrictions,
        forbiddenTopics: agents.forbiddenTopics,
        maxAutoRepliesPerConversation: agents.maxAutoRepliesPerConversation,
      });
    return updated;
  });

/** Get agent metrics for the last 24 hours */
export const getAgentMetrics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ agentId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const logs = await db
      .select({
        status: agentLogs.status,
        tokensUsed: agentLogs.tokensUsed,
        costUsd: agentLogs.costUsd,
        durationMs: agentLogs.durationMs,
        createdAt: agentLogs.createdAt,
      })
      .from(agentLogs)
      .where(
        eq(agentLogs.agentId, data.agentId) &&
        gte(agentLogs.createdAt, since),
      )
      .orderBy(agentLogs.createdAt);

    const totalRequests = logs.length;
    const totalTokens = logs.reduce((s, l) => s + (l.tokensUsed || 0), 0);
    const totalCost = logs.reduce((s, l) => s + (Number(l.costUsd) || 0), 0);
    const errors = logs.filter((l) => l.status === "failed").length;
    const durations = logs.map((l) => l.durationMs || 0).filter(Boolean);
    const p95 = durations.length > 0
      ? durations.sort((a, b) => a - b)[Math.floor(durations.length * 0.95)]
      : 0;

    // Hourly breakdown
    const hourlyData: Array<{ hour: string; requests: number; cost: number; errors: number }> = [];
    const now = new Date();
    for (let i = 23; i >= 0; i--) {
      const hour = new Date(now.getTime() - i * 60 * 60 * 1000);
      const hourStart = new Date(hour.getFullYear(), hour.getMonth(), hour.getDate(), hour.getHours());
      const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000);

      const hourLogs = logs.filter((l) => {
        const t = new Date(l.createdAt!);
        return t >= hourStart && t < hourEnd;
      });

      hourlyData.push({
        hour: hourStart.toISOString(),
        requests: hourLogs.length,
        cost: hourLogs.reduce((s, l) => s + (Number(l.costUsd) || 0), 0),
        errors: hourLogs.filter((l) => l.status === "failed").length,
      });
    }

    return {
      totalRequests,
      totalTokens,
      totalCost: totalCost.toFixed(4),
      errorRate: totalRequests > 0 ? ((errors / totalRequests) * 100).toFixed(1) + "%" : "0%",
      p95Latency: p95,
      hourlyData,
    };
  });

/** Stop a specific BullMQ job */
export const cancelJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ jobId: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const workerUrl = process.env.WORKER_API_URL || "http://127.0.0.1:9100";
    const response = await fetch(`${workerUrl}/api/jobs/${data.jobId}/cancel`, {
      method: "POST",
      headers: {
        "X-Internal-Token": process.env.INTERNAL_API_TOKEN || "",
      },
    });
    if (!response.ok) {
      throw new Error(`Failed to cancel job: ${response.statusText}`);
    }
    return { ok: true };
  });
