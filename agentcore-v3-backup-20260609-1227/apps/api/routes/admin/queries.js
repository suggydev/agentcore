const { prisma } = require('../../prisma-client');

function getPagination(req) {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
  return { page, limit, skip: (page - 1) * limit, take: limit };
}

function getDateRange(req) {
  const days = Math.min(365, Math.max(1, parseInt(req.query.days) || 30));
  const end = new Date();
  const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
  return { start, end, days };
}

function toDateKey(d) {
  return d.toISOString().slice(0, 10);
}

function fillDateRange(start, end) {
  const map = new Map();
  const curr = new Date(start);
  while (curr <= end) {
    map.set(toDateKey(curr), 0);
    curr.setDate(curr.getDate() + 1);
  }
  return map;
}

// Dashboard
async function getDashboardKPIs() {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [
    totalUsers,
    activeUsersToday,
    totalWorkspaces,
    totalRevenue,
    totalMessages,
    totalAgents,
    unresolvedAlerts,
    latestMetric
  ] = await Promise.all([
    prisma.user.count(),
    prisma.userLoginLog.groupBy({ by: ['userId'], where: { createdAt: { gte: todayStart }, success: true } }).then(r => r.length),
    prisma.workspace.count(),
    prisma.billingTransaction.aggregate({ where: { status: 'completed', type: 'topup' }, _sum: { amount: true } }),
    prisma.message.count(),
    prisma.agent.count(),
    prisma.alert.count({ where: { resolved: false } }),
    prisma.systemMetric.findFirst({ orderBy: { createdAt: 'desc' } })
  ]);

  return {
    totalUsers,
    activeUsersToday,
    totalWorkspaces,
    totalRevenue: totalRevenue._sum?.amount || 0,
    totalMessages,
    totalAgents,
    unresolvedAlerts,
    systemHealth: latestMetric ? {
      cpuUsage: latestMetric.cpuUsage,
      ramUsage: latestMetric.ramUsage,
      dbConnections: latestMetric.dbConnections,
      diskUsage: latestMetric.diskUsage,
      uptime: latestMetric.uptime
    } : null
  };
}

// Analytics
async function getSignupTrends(start, end) {
  const users = await prisma.user.findMany({
    where: { createdAt: { gte: start, lte: end } },
    select: { createdAt: true }
  });
  const map = fillDateRange(start, end);
  for (const u of users) {
    map.set(toDateKey(u.createdAt), (map.get(toDateKey(u.createdAt)) || 0) + 1);
  }
  return Array.from(map.entries()).map(([date, count]) => ({ date, count }));
}

async function getActivityTrends(start, end) {
  const [logins, sessions] = await Promise.all([
    prisma.userLoginLog.findMany({
      where: { createdAt: { gte: start, lte: end }, success: true },
      select: { createdAt: true }
    }),
    prisma.pageView.findMany({
      where: { createdAt: { gte: start, lte: end } },
      select: { createdAt: true }
    })
  ]);
  const dauMap = fillDateRange(start, end);
  const sessionMap = fillDateRange(start, end);
  for (const l of logins) {
    const key = toDateKey(l.createdAt);
    dauMap.set(key, (dauMap.get(key) || 0) + 1);
  }
  for (const s of sessions) {
    const key = toDateKey(s.createdAt);
    sessionMap.set(key, (sessionMap.get(key) || 0) + 1);
  }
  return Array.from(dauMap.keys()).map(date => ({
    date,
    dau: dauMap.get(date) || 0,
    sessions: sessionMap.get(date) || 0
  }));
}

async function getRevenueTrends(start, end) {
  const txs = await prisma.billingTransaction.findMany({
    where: { createdAt: { gte: start, lte: end }, status: 'completed' },
    select: { createdAt: true, amount: true }
  });
  const map = fillDateRange(start, end);
  for (const t of txs) {
    map.set(toDateKey(t.createdAt), (map.get(toDateKey(t.createdAt)) || 0) + t.amount);
  }
  return Array.from(map.entries()).map(([date, amount]) => ({ date, amount }));
}

async function getModelUsage(start, end) {
  const logs = await prisma.modelUsageLog.findMany({
    where: { createdAt: { gte: start, lte: end } },
    select: { model: true, tokensIn: true, tokensOut: true, cost: true, latency: true }
  });
  const map = new Map();
  for (const l of logs) {
    const entry = map.get(l.model) || { model: l.model, tokensIn: 0, tokensOut: 0, cost: 0, latencySum: 0, count: 0 };
    entry.tokensIn += l.tokensIn || 0;
    entry.tokensOut += l.tokensOut || 0;
    entry.cost += l.cost || 0;
    entry.latencySum += l.latency || 0;
    entry.count += 1;
    map.set(l.model, entry);
  }
  return Array.from(map.values()).map(m => ({
    model: m.model,
    tokensIn: m.tokensIn,
    tokensOut: m.tokensOut,
    cost: m.cost,
    avgLatency: m.count > 0 ? Math.round(m.latencySum / m.count) : 0,
    count: m.count
  }));
}

async function getChannelUsage() {
  const agents = await prisma.agent.findMany({ select: { channel: true } });
  const map = new Map();
  for (const a of agents) {
    const key = a.channel || 'unknown';
    map.set(key, (map.get(key) || 0) + 1);
  }
  return Array.from(map.entries()).map(([channel, count]) => ({ channel, count }));
}

// Users
async function getUserList({ search, role, page, limit, skip }) {
  const where = {};
  if (role) where.role = role;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } }
    ];
  }
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true,
        workspaceId: true, tokenVersion: true,
        workspace: { select: { id: true, name: true } }
      }
    }),
    prisma.user.count({ where })
  ]);
  return { users, total, page, limit };
}

async function getUserById(id) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true,
      workspaceId: true, tokenVersion: true,
      workspace: { select: { id: true, name: true } }
    }
  });
}

async function getUserActivity(userId) {
  return prisma.userActivityLog.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 100
  });
}

// Workspaces
async function getWorkspaceList({ search, plan, page, limit, skip }) {
  const where = {};
  if (plan) where.plan = plan;
  if (search) where.name = { contains: search, mode: 'insensitive' };
  const [workspaces, total] = await Promise.all([
    prisma.workspace.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        users: { select: { id: true, name: true, email: true, role: true } },
        _count: { select: { agents: true, conversations: true, crmContacts: true, knowledgeDocs: true } }
      }
    }),
    prisma.workspace.count({ where })
  ]);
  return { workspaces, total, page, limit };
}

async function getWorkspaceById(id) {
  const [ws, messageCount] = await Promise.all([
    prisma.workspace.findUnique({
      where: { id },
      include: {
        users: { select: { id: true, name: true, email: true, role: true } },
        agents: { select: { id: true, name: true, channel: true, isActive: true } },
        billingTransactions: { orderBy: { createdAt: 'desc' }, take: 20 },
        _count: { select: { conversations: true, crmContacts: true, knowledgeDocs: true } }
      }
    }),
    prisma.message.count({ where: { conversation: { workspaceId: id } } })
  ]);
  if (ws) ws.messageCount = messageCount;
  return ws;
}

async function getWorkspaceAnalytics(id, start, end) {
  const [messages, conversations, agents] = await Promise.all([
    prisma.message.findMany({
      where: { conversation: { workspaceId: id }, createdAt: { gte: start, lte: end } },
      select: { createdAt: true }
    }),
    prisma.conversation.findMany({
      where: { workspaceId: id, createdAt: { gte: start, lte: end } },
      select: { createdAt: true }
    }),
    prisma.agent.findMany({
      where: { workspaceId: id, createdAt: { gte: start, lte: end } },
      select: { createdAt: true }
    })
  ]);
  const msgMap = fillDateRange(start, end);
  const convMap = fillDateRange(start, end);
  const agentMap = fillDateRange(start, end);
  for (const m of messages) {
    const key = toDateKey(m.createdAt);
    msgMap.set(key, (msgMap.get(key) || 0) + 1);
  }
  for (const c of conversations) {
    const key = toDateKey(c.createdAt);
    convMap.set(key, (convMap.get(key) || 0) + 1);
  }
  for (const a of agents) {
    const key = toDateKey(a.createdAt);
    agentMap.set(key, (agentMap.get(key) || 0) + 1);
  }
  return Array.from(msgMap.keys()).map(date => ({
    date,
    messages: msgMap.get(date) || 0,
    conversations: convMap.get(date) || 0,
    agents: agentMap.get(date) || 0
  }));
}

// System
async function getSystemHealth() {
  const [latestMetric, recentErrors, dbCheck] = await Promise.all([
    prisma.systemMetric.findFirst({ orderBy: { createdAt: 'desc' } }),
    prisma.errorLog.findMany({ orderBy: { createdAt: 'desc' }, take: 5 }),
    prisma.workspace.findFirst({ select: { id: true } }).then(() => true).catch(() => false)
  ]);
  return {
    dbStatus: dbCheck ? 'ok' : 'error',
    apiUptime: process.uptime(),
    lastErrors: recentErrors,
    metrics: latestMetric || null
  };
}

async function getSystemLogs({ level, path, type, start, end, page, limit, skip }) {
  const dateFilter = {};
  if (start) dateFilter.gte = start;
  if (end) dateFilter.lte = end;
  const hasDateFilter = Object.keys(dateFilter).length > 0;

  if (type === 'error') {
    const where = {};
    if (hasDateFilter) where.createdAt = dateFilter;
    const [logs, total] = await Promise.all([
      prisma.errorLog.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
      prisma.errorLog.count({ where })
    ]);
    return { logs, total, page, limit };
  }

  const where = {};
  if (path) where.path = { contains: path };
  if (hasDateFilter) where.createdAt = dateFilter;
  if (level) {
    if (level === 'error') where.status = { gte: 500 };
    else if (level === 'warn') where.status = { gte: 400, lt: 500 };
  }
  const [logs, total] = await Promise.all([
    prisma.apiRequestLog.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
    prisma.apiRequestLog.count({ where })
  ]);
  return { logs, total, page, limit };
}

async function getSystemMetrics(start, end) {
  return prisma.systemMetric.findMany({
    where: { createdAt: { gte: start, lte: end } },
    orderBy: { createdAt: 'asc' }
  });
}

// Billing
async function getBillingTransactions({ status, type, start, end, page, limit, skip }) {
  const where = {};
  if (status) where.status = status;
  if (type) where.type = type;
  const dateFilter = {};
  if (start) dateFilter.gte = start;
  if (end) dateFilter.lte = end;
  if (Object.keys(dateFilter).length > 0) where.createdAt = dateFilter;
  const [txs, total] = await Promise.all([
    prisma.billingTransaction.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { workspace: { select: { id: true, name: true } } }
    }),
    prisma.billingTransaction.count({ where })
  ]);
  return { transactions: txs, total, page, limit };
}

async function getRevenueAnalytics(start, end) {
  const txs = await prisma.billingTransaction.findMany({
    where: { status: 'completed', createdAt: { gte: start, lte: end } },
    select: { createdAt: true, amount: true }
  });
  const dailyMap = fillDateRange(start, end);
  const monthlyMap = new Map();
  for (const t of txs) {
    const dayKey = toDateKey(t.createdAt);
    dailyMap.set(dayKey, (dailyMap.get(dayKey) || 0) + t.amount);
    const monthKey = t.createdAt.toISOString().slice(0, 7);
    monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + t.amount);
  }
  return {
    daily: Array.from(dailyMap.entries()).map(([date, amount]) => ({ date, amount })),
    monthly: Array.from(monthlyMap.entries()).map(([month, amount]) => ({ month, amount }))
  };
}

async function getCreditConsumption({ workspaceId, start, end }) {
  const where = {};
  if (workspaceId) where.workspaceId = workspaceId;
  const dateFilter = {};
  if (start) dateFilter.gte = start;
  if (end) dateFilter.lte = end;
  if (Object.keys(dateFilter).length > 0) where.createdAt = dateFilter;
  const logs = await prisma.creditConsumptionLog.findMany({ where, orderBy: { createdAt: 'desc' } });
  const wsIds = [...new Set(logs.map(l => l.workspaceId))];
  const workspaces = await prisma.workspace.findMany({
    where: { id: { in: wsIds } },
    select: { id: true, name: true }
  });
  const wsMap = new Map(workspaces.map(w => [w.id, w.name]));
  const map = new Map();
  for (const l of logs) {
    const entry = map.get(l.workspaceId) || { workspaceId: l.workspaceId, workspaceName: wsMap.get(l.workspaceId) || 'Unknown', amount: 0 };
    entry.amount += l.amount || 0;
    map.set(l.workspaceId, entry);
  }
  return Array.from(map.values());
}

// Alerts
async function getAlerts({ type, resolved, entityType, page, limit, skip }) {
  const where = {};
  if (type) where.type = type;
  if (resolved !== undefined) where.resolved = resolved === 'true' || resolved === true;
  if (entityType) where.entityType = entityType;
  const [alerts, total] = await Promise.all([
    prisma.alert.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.alert.count({ where })
  ]);
  return { alerts, total, page, limit };
}

async function resolveAlert(id, resolvedBy) {
  return prisma.alert.update({
    where: { id },
    data: { resolved: true, resolvedAt: new Date(), resolvedBy }
  });
}

async function createAlert(data) {
  return prisma.alert.create({ data });
}

module.exports = {
  getPagination, getDateRange, toDateKey,
  getDashboardKPIs,
  getSignupTrends, getActivityTrends, getRevenueTrends, getModelUsage, getChannelUsage,
  getUserList, getUserById, getUserActivity,
  getWorkspaceList, getWorkspaceById, getWorkspaceAnalytics,
  getSystemHealth, getSystemLogs, getSystemMetrics,
  getBillingTransactions, getRevenueAnalytics, getCreditConsumption,
  getAlerts, resolveAlert, createAlert
};
