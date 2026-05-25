import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/lib/auth-middleware-local";
import { db } from "@/db";
import {
  agents,
  agentLogs,
  leads,
  alerts,
  auditLogs,
  integrations,
  invitations,
  userRoles,
  profiles,
  apiKeys,
  agentKnowledge,
  companies,
  agentcoreSettings,
  subscriptions,
} from "@/db/schema";
import { eq, desc, inArray, gte, and, sql } from "drizzle-orm";

// ═══════════════════════════════════════════════════════════
// Demo mode check
// ═══════════════════════════════════════════════════════════

export const checkDemoMode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ companyId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const rows = await db.select({ upstreamLast4: agentcoreSettings.upstreamLast4 })
      .from(agentcoreSettings)
      .where(eq(agentcoreSettings.companyId, data.companyId))
      .limit(1);

    if (rows.length === 0) return { isDemo: false };
    return { isDemo: !rows[0].upstreamLast4 };
  });

// ═══════════════════════════════════════════════════════════
// Dashboard data
// ═══════════════════════════════════════════════════════════

export const getDashboardAgents = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ companyId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const rows = await db.select({
      id: agents.id, name: agents.name, status: agents.status,
    })
      .from(agents)
      .where(eq(agents.companyId, data.companyId));
    return rows;
  });

export const getDashboardLogs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    companyId: z.string().uuid(),
    since: z.string().optional(),
    limit: z.number().default(1000),
  }).parse(d))
  .handler(async ({ data }) => {
    const conditions = [eq(agentLogs.companyId, data.companyId)];
    if (data.since) conditions.push(gte(agentLogs.createdAt, new Date(data.since)));

    const rows = await db.select({
      id: agentLogs.id,
      agentId: agentLogs.agentId,
      status: agentLogs.status,
      taskType: agentLogs.taskType,
      costUsd: agentLogs.costUsd,
      tokensUsed: agentLogs.tokensUsed,
      durationMs: agentLogs.durationMs,
      errorMessage: agentLogs.errorMessage,
      createdAt: agentLogs.createdAt,
    })
      .from(agentLogs)
      .where(and(...conditions))
      .orderBy(desc(agentLogs.createdAt))
      .limit(data.limit);
    return rows;
  });

// ═══════════════════════════════════════════════════════════
// Agent list / toggle
// ═══════════════════════════════════════════════════════════

export const listAgents = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ companyId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const rows = await db.select({
      id: agents.id, name: agents.name, type: agents.type,
      status: agents.status, dailyBudgetUsd: agents.dailyBudgetUsd,
      updatedAt: agents.updatedAt,
    })
      .from(agents)
      .where(eq(agents.companyId, data.companyId))
      .orderBy(desc(agents.updatedAt));
    return rows;
  });

export const toggleAgentStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    agentId: z.string().uuid(),
    status: z.enum(["active", "paused", "error", "draft"]),
  }).parse(d))
  .handler(async ({ data }) => {
    await db.update(agents)
      .set({ status: data.status })
      .where(eq(agents.id, data.agentId));
    return { ok: true };
  });

// ═══════════════════════════════════════════════════════════
// Agent detail
// ═══════════════════════════════════════════════════════════

export const getAgent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ agentId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const rows = await db.select().from(agents).where(eq(agents.id, data.agentId)).limit(1);
    const row = rows[0] ?? null;
    if (!row) return null;
    return { ...row, config: row.config as Record<string, any>, tools: row.tools as any };
  });

export const getAgentLogs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    agentId: z.string().uuid(),
    limit: z.number().default(50),
  }).parse(d))
  .handler(async ({ data }) => {
    const rows = await db.select({
      id: agentLogs.id, status: agentLogs.status,
      tokensUsed: agentLogs.tokensUsed, costUsd: agentLogs.costUsd,
      durationMs: agentLogs.durationMs, createdAt: agentLogs.createdAt,
      taskType: agentLogs.taskType,
    })
      .from(agentLogs)
      .where(eq(agentLogs.agentId, data.agentId))
      .orderBy(desc(agentLogs.createdAt))
      .limit(data.limit);
    return rows;
  });

export const getAgentLogsDetail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    companyId: z.string().uuid(),
    limit: z.number().default(500),
  }).parse(d))
  .handler(async ({ data }) => {
    const rows = await db.select({
      id: agentLogs.id, agentId: agentLogs.agentId, status: agentLogs.status,
      taskType: agentLogs.taskType, prompt: agentLogs.prompt,
      response: agentLogs.response, errorMessage: agentLogs.errorMessage,
      tokensUsed: agentLogs.tokensUsed, costUsd: agentLogs.costUsd,
      durationMs: agentLogs.durationMs, toolCalls: agentLogs.toolCalls,
      createdAt: agentLogs.createdAt,
    })
      .from(agentLogs)
      .where(eq(agentLogs.companyId, data.companyId))
      .orderBy(desc(agentLogs.createdAt))
      .limit(data.limit);
    return rows.map(r => ({ ...r, toolCalls: r.toolCalls as any }));
  });

export const getAgentList = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ companyId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const rows = await db.select({ id: agents.id, name: agents.name })
      .from(agents)
      .where(eq(agents.companyId, data.companyId));
    return rows;
  });

// ═══════════════════════════════════════════════════════════
// Leads CRUD
// ═══════════════════════════════════════════════════════════

export const listLeads = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    companyId: z.string().uuid(),
    limit: z.number().default(500),
  }).parse(d))
  .handler(async ({ data }) => {
    const rows = await db.select({
      id: leads.id, name: leads.name, email: leads.email,
      phone: leads.phone, status: leads.status, aiScore: leads.aiScore,
      source: leads.source, createdAt: leads.createdAt,
    })
      .from(leads)
      .where(eq(leads.companyId, data.companyId))
      .orderBy(desc(leads.createdAt))
      .limit(data.limit);
    return rows;
  });

export const createLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    companyId: z.string().uuid(),
    name: z.string().min(1),
    email: z.string().optional(),
    phone: z.string().optional(),
    source: z.string().optional().default("manual"),
  }).parse(d))
  .handler(async ({ data }) => {
    const [row] = await db.insert(leads).values({
      companyId: data.companyId,
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      source: data.source,
    }).returning({ id: leads.id });
    return row;
  });

export const updateLeadStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    leadId: z.string().uuid(),
    status: z.string(),
  }).parse(d))
  .handler(async ({ data }) => {
    await db.update(leads).set({ status: data.status as any }).where(eq(leads.id, data.leadId));
    return { ok: true };
  });

export const deleteLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ leadId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    await db.delete(leads).where(eq(leads.id, data.leadId));
    return { ok: true };
  });

// ═══════════════════════════════════════════════════════════
// Alerts CRUD
// ═══════════════════════════════════════════════════════════

export const listAlerts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ companyId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const rows = await db.select({
      id: alerts.id, name: alerts.name, triggerType: alerts.triggerType,
      threshold: alerts.threshold, channels: alerts.channels,
      enabled: alerts.enabled, lastFiredAt: alerts.lastFiredAt,
    })
      .from(alerts)
      .where(eq(alerts.companyId, data.companyId))
      .orderBy(desc(alerts.createdAt));
    return rows.map(r => ({ ...r, threshold: r.threshold as any, channels: r.channels as any }));
  });

export const createAlert = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    companyId: z.string().uuid(),
    name: z.string().min(1),
    triggerType: z.string().min(1),
    threshold: z.any().optional(),
    channels: z.array(z.string()).optional(),
    cooldownMinutes: z.number().default(5),
  }).parse(d))
  .handler(async ({ data }) => {
    const [row] = await db.insert(alerts).values({
      companyId: data.companyId,
      name: data.name,
      triggerType: data.triggerType,
      threshold: data.threshold ?? {},
      channels: data.channels ?? [],
      enabled: true,
      cooldownMinutes: data.cooldownMinutes,
    }).returning({ id: alerts.id });
    return row;
  });

export const toggleAlert = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    alertId: z.string().uuid(),
    enabled: z.boolean(),
  }).parse(d))
  .handler(async ({ data }) => {
    await db.update(alerts).set({ enabled: data.enabled }).where(eq(alerts.id, data.alertId));
    return { ok: true };
  });

export const deleteAlert = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ alertId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    await db.delete(alerts).where(eq(alerts.id, data.alertId));
    return { ok: true };
  });

// ═══════════════════════════════════════════════════════════
// Audit logs
// ═══════════════════════════════════════════════════════════

export const listAuditLogs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    companyId: z.string().uuid(),
    limit: z.number().default(50),
  }).parse(d))
  .handler(async ({ data }) => {
    const rows = await db.select({
      id: auditLogs.id, action: auditLogs.action,
      resourceType: auditLogs.resourceType,
      resourceId: auditLogs.resourceId,
      userId: auditLogs.userId,
      metadata: auditLogs.metadata,
      createdAt: auditLogs.createdAt,
    })
      .from(auditLogs)
      .where(eq(auditLogs.companyId, data.companyId))
      .orderBy(desc(auditLogs.createdAt))
      .limit(data.limit);
    return rows.map(r => ({ ...r, metadata: r.metadata as any }));
  });

// ═══════════════════════════════════════════════════════════
// Integrations list
// ═══════════════════════════════════════════════════════════

export const listIntegrations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ companyId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const rows = await db.select()
      .from(integrations)
      .where(eq(integrations.companyId, data.companyId));
    return rows.map(r => ({ ...r, config: r.config as any }));
  });

// ═══════════════════════════════════════════════════════════
// Settings — team members, invitations, API keys, audit
// ═══════════════════════════════════════════════════════════

export const listTeamMembers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ companyId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const roles = await db.select({ userId: userRoles.userId, role: userRoles.role })
      .from(userRoles)
      .where(eq(userRoles.companyId, data.companyId));

    const userIds = [...new Set(roles.map((r) => r.userId))];
    if (userIds.length === 0) return { members: [], invitations: [] };

    const profs = await db.select({ id: profiles.id, email: profiles.email, fullName: profiles.fullName })
      .from(profiles)
      .where(inArray(profiles.id, userIds));

    const profMap = new Map(profs.map((p) => [p.id, p]));
    const members = roles.map((r) => ({
      userId: r.userId,
      role: r.role,
      email: profMap.get(r.userId)?.email ?? null,
      fullName: profMap.get(r.userId)?.fullName ?? null,
    }));

    const inv = await db.select({
      id: invitations.id, email: invitations.email, role: invitations.role,
      token: invitations.token, acceptedAt: invitations.acceptedAt,
      expiresAt: invitations.expiresAt,
    })
      .from(invitations)
      .where(eq(invitations.companyId, data.companyId))
      .orderBy(desc(invitations.createdAt));

    return { members, invitations: inv };
  });

export const createInvitation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    companyId: z.string().uuid(),
    email: z.string().email(),
    role: z.string(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const [row] = await db.insert(invitations).values({
      companyId: data.companyId,
      email: data.email,
      role: data.role as any,
      invitedBy: context.userId,
    }).returning({ id: invitations.id });
    return row;
  });

export const updateMemberRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    userId: z.string().uuid(),
    companyId: z.string().uuid(),
    currentRole: z.string(),
    newRole: z.string(),
  }).parse(d))
  .handler(async ({ data }) => {
    await db.update(userRoles)
      .set({ role: data.newRole as any })
      .where(and(
        eq(userRoles.userId, data.userId),
        eq(userRoles.companyId, data.companyId),
        eq(userRoles.role, data.currentRole as any),
      ));
    return { ok: true };
  });

export const revokeInvitation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ invitationId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    await db.delete(invitations).where(eq(invitations.id, data.invitationId));
    return { ok: true };
  });

export const listApiKeysForSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ companyId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const rows = await db.select({
      id: apiKeys.id, name: apiKeys.name, keyPrefix: apiKeys.keyPrefix,
      createdAt: apiKeys.createdAt, revokedAt: apiKeys.revokedAt,
      lastUsedAt: apiKeys.lastUsedAt,
    })
      .from(apiKeys)
      .where(eq(apiKeys.companyId, data.companyId))
      .orderBy(desc(apiKeys.createdAt));
    return rows;
  });

export const listAuditForSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    companyId: z.string().uuid(),
    limit: z.number().default(50),
  }).parse(d))
  .handler(async ({ data }) => {
    const rows = await db.select({
      id: auditLogs.id, action: auditLogs.action,
      resourceType: auditLogs.resourceType,
      createdAt: auditLogs.createdAt, metadata: auditLogs.metadata,
    })
      .from(auditLogs)
      .where(eq(auditLogs.companyId, data.companyId))
      .orderBy(desc(auditLogs.createdAt))
      .limit(data.limit);
    return rows.map(r => ({ ...r, metadata: r.metadata as any }));
  });

// ═══════════════════════════════════════════════════════════
// Knowledge — agent list for assignment
// ═══════════════════════════════════════════════════════════

export const listAgentsForKnowledge = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ companyId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const rows = await db.select({ id: agents.id, name: agents.name })
      .from(agents)
      .where(eq(agents.companyId, data.companyId))
      .orderBy(agents.name);
    return rows;
  });

// ═══════════════════════════════════════════════════════════
// Onboarding — create workspace
// ═══════════════════════════════════════════════════════════

export const createWorkspace = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    companyName: z.string().min(1),
    industry: z.string().optional(),
    companySize: z.string().optional(),
    useCase: z.string().optional(),
    country: z.string().optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const [company] = await db.insert(companies).values({
      name: data.companyName,
      industry: data.industry,
      companySize: data.companySize,
      useCase: data.useCase,
      country: data.country,
    }).returning();

    await db.insert(userRoles).values({
      userId: context.userId,
      companyId: company.id,
      role: "owner",
    });

    await db.update(profiles)
      .set({ companyId: company.id })
      .where(eq(profiles.id, context.userId));

    await db.insert(subscriptions).values({
      companyId: company.id,
      plan: "basic",
      status: "trialing",
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    });

    return { companyId: company.id };
  });

// ═══════════════════════════════════════════════════════════
// Admin — audit logs
// ═══════════════════════════════════════════════════════════

export const listAuditForAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    companyId: z.string().uuid(),
    limit: z.number().default(100),
  }).parse(d))
  .handler(async ({ data }) => {
    const rows = await db.select()
      .from(auditLogs)
      .where(eq(auditLogs.companyId, data.companyId))
      .orderBy(desc(auditLogs.createdAt))
      .limit(data.limit);
    return rows.map(r => ({ ...r, metadata: r.metadata as any }));
  });
