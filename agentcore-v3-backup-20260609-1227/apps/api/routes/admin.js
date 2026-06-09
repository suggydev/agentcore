const express = require('express');
const { z } = require('zod');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { prisma } = require('../prisma-client');
const { authenticate } = require('../middleware/auth');
const { generalLimiter } = require('../middleware/rateLimit');
const { safeError } = require('../utils/errors');
const config = require('../config');
const { requireSuperAdmin, requireAdmin, requireSupport, requireAnalyst } = require('./admin/middleware');
const queries = require('./admin/queries');

const router = express.Router();

function parsePagination(req) {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
  return { page, limit, skip: (page - 1) * limit, take: limit };
}

// Dashboard & Analytics
router.get('/dashboard', authenticate, requireAnalyst, generalLimiter, async (req, res) => {
  try {
    res.json(await queries.getDashboardKPIs());
  } catch (err) {
    safeError(res, err);
  }
});

router.get('/metrics/realtime', authenticate, requireAnalyst, generalLimiter, async (req, res) => {
  try {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const interval = setInterval(async () => {
      try {
        const since = new Date(Date.now() - 60 * 1000);
        const [newUsers, newPayments, newMessages, newErrors] = await Promise.all([
          prisma.user.count({ where: { createdAt: { gte: since } } }),
          prisma.billingTransaction.count({ where: { createdAt: { gte: since }, status: 'completed' } }),
          prisma.message.count({ where: { createdAt: { gte: since } } }),
          prisma.errorLog.count({ where: { createdAt: { gte: since } } })
        ]);
        res.write(`data: ${JSON.stringify({ newUsers, newPayments, newMessages, newErrors, timestamp: new Date().toISOString() })}
\n\n`);
      } catch (e) {
        res.write(`data: ${JSON.stringify({ error: 'fetch failed' })}
\n\n`);
      }
    }, 5000);

    req.on('close', () => clearInterval(interval));
  } catch (err) {
    safeError(res, err);
  }
});

router.get('/analytics/signups', authenticate, requireAnalyst, generalLimiter, async (req, res) => {
  try {
    const { start, end } = queries.getDateRange(req);
    res.json({ data: await queries.getSignupTrends(start, end), period: { start, end } });
  } catch (err) {
    safeError(res, err);
  }
});

router.get('/analytics/activity', authenticate, requireAnalyst, generalLimiter, async (req, res) => {
  try {
    const { start, end } = queries.getDateRange(req);
    res.json({ data: await queries.getActivityTrends(start, end), period: { start, end } });
  } catch (err) {
    safeError(res, err);
  }
});

router.get('/analytics/revenue', authenticate, requireAnalyst, generalLimiter, async (req, res) => {
  try {
    const { start, end } = queries.getDateRange(req);
    res.json({ data: await queries.getRevenueTrends(start, end), period: { start, end } });
  } catch (err) {
    safeError(res, err);
  }
});

router.get('/analytics/models', authenticate, requireAnalyst, generalLimiter, async (req, res) => {
  try {
    const { start, end } = queries.getDateRange(req);
    res.json({ data: await queries.getModelUsage(start, end), period: { start, end } });
  } catch (err) {
    safeError(res, err);
  }
});

router.get('/analytics/channels', authenticate, requireAnalyst, generalLimiter, async (req, res) => {
  try {
    res.json({ data: await queries.getChannelUsage() });
  } catch (err) {
    safeError(res, err);
  }
});

// Users Management
router.get('/users', authenticate, requireSupport, generalLimiter, async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req);
    const { search, role } = req.query;
    const result = await queries.getUserList({ search, role, page, limit, skip });
    res.json({ data: result.users, total: result.total, page, limit });
  } catch (err) {
    safeError(res, err);
  }
});

router.get('/users/:id', authenticate, requireSupport, generalLimiter, async (req, res) => {
  try {
    const user = await queries.getUserById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    safeError(res, err);
  }
});

router.get('/users/:id/activity', authenticate, requireSupport, generalLimiter, async (req, res) => {
  try {
    res.json({ data: await queries.getUserActivity(req.params.id) });
  } catch (err) {
    safeError(res, err);
  }
});

router.post('/users/:id/impersonate', authenticate, requireAdmin, generalLimiter, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    const token = jwt.sign(
      { userId: user.id, workspaceId: user.workspaceId, role: user.role, tokenVersion: user.tokenVersion, impersonatedBy: req.user.userId },
      config.JWT_SECRET,
      { expiresIn: '1h' }
    );
    res.json({ token, expiresIn: '1h' });
  } catch (err) {
    safeError(res, err);
  }
});

router.patch('/users/:id', authenticate, requireAdmin, generalLimiter, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.role === 'SUPERADMIN' && req.user.role !== 'SUPERADMIN') {
      return res.status(403).json({ error: 'Only superadmin can modify superadmin' });
    }

    const schema = z.object({
      role: z.enum(['OWNER', 'SUPERADMIN', 'ADMIN', 'SUPPORT', 'ANALYST']).optional(),
      name: z.string().min(1).optional(),
      email: z.string().email().optional()
    });
    const data = schema.parse(req.body);
    if (data.email !== undefined) {
      const existing = await prisma.user.findUnique({ where: { email: data.email.toLowerCase().trim() } });
      if (existing && existing.id !== req.params.id) {
        return res.status(400).json({ error: 'Email already registered' });
      }
      data.email = data.email.toLowerCase().trim();
    }
    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data,
      select: {
        id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true,
        workspaceId: true, tokenVersion: true,
        workspace: { select: { id: true, name: true } }
      }
    });
    res.json(updated);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: err.flatten() });
    }
    safeError(res, err);
  }
});

router.delete('/users/:id', authenticate, requireAdmin, generalLimiter, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.role === 'SUPERADMIN') {
      return res.status(403).json({ error: 'Cannot delete superadmin' });
    }
    if (user.id === req.user.userId) {
      return res.status(400).json({ error: 'Cannot delete yourself' });
    }

    await prisma.user.update({
      where: { id: req.params.id },
      data: {
        email: `deleted_${user.id}@deleted.local`,
        name: 'Deleted User',
        password: await bcrypt.hash('deleted', 10),
        tokenVersion: 999999
      }
    });
    res.json({ success: true });
  } catch (err) {
    safeError(res, err);
  }
});

// Workspaces
router.get('/workspaces', authenticate, requireSupport, generalLimiter, async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req);
    const { search, plan } = req.query;
    const result = await queries.getWorkspaceList({ search, plan, page, limit, skip });
    res.json({ data: result.workspaces, total: result.total, page, limit });
  } catch (err) {
    safeError(res, err);
  }
});

router.get('/workspaces/:id', authenticate, requireSupport, generalLimiter, async (req, res) => {
  try {
    const ws = await queries.getWorkspaceById(req.params.id);
    if (!ws) return res.status(404).json({ error: 'Workspace not found' });
    res.json(ws);
  } catch (err) {
    safeError(res, err);
  }
});

router.get('/workspaces/:id/analytics', authenticate, requireAnalyst, generalLimiter, async (req, res) => {
  try {
    const { start, end } = queries.getDateRange(req);
    res.json({ data: await queries.getWorkspaceAnalytics(req.params.id, start, end), period: { start, end } });
  } catch (err) {
    safeError(res, err);
  }
});

// System & Logs
router.get('/system/health', authenticate, requireAdmin, generalLimiter, async (req, res) => {
  try {
    res.json(await queries.getSystemHealth());
  } catch (err) {
    safeError(res, err);
  }
});

router.get('/system/logs', authenticate, requireAdmin, generalLimiter, async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req);
    const { level, path, type, start, end } = req.query;
    const startDate = start ? new Date(start) : undefined;
    const endDate = end ? new Date(end) : undefined;
    const result = await queries.getSystemLogs({ level, path, type, start: startDate, end: endDate, page, limit, skip });
    res.json({ data: result.logs, total: result.total, page, limit });
  } catch (err) {
    safeError(res, err);
  }
});

router.get('/system/config', authenticate, requireSuperAdmin, generalLimiter, async (req, res) => {
  try {
    const safeConfig = {
      PORT: config.PORT,
      NODE_ENV: config.NODE_ENV,
      CORS_ORIGINS: config.CORS_ORIGINS,
      CLIENT_URL: config.CLIENT_URL,
      SUGGY_BASE_URL: config.SUGGY_BASE_URL,
      MODEL_CACHE_TTL: config.MODEL_CACHE_TTL,
      TRIAL_DAYS: config.TRIAL_DAYS,
      TRIAL_CREDIT_AMOUNT: config.TRIAL_CREDIT_AMOUNT,
      PRO_CREDIT_AMOUNT: config.PRO_CREDIT_AMOUNT,
      BUSINESS_CREDIT_AMOUNT: config.BUSINESS_CREDIT_AMOUNT
    };
    res.json(safeConfig);
  } catch (err) {
    safeError(res, err);
  }
});

router.get('/system/metrics', authenticate, requireAdmin, generalLimiter, async (req, res) => {
  try {
    const { start, end } = queries.getDateRange(req);
    res.json({ data: await queries.getSystemMetrics(start, end), period: { start, end } });
  } catch (err) {
    safeError(res, err);
  }
});

// Billing
router.get('/billing/transactions', authenticate, requireAdmin, generalLimiter, async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req);
    const { status, type, start, end } = req.query;
    const startDate = start ? new Date(start) : undefined;
    const endDate = end ? new Date(end) : undefined;
    const result = await queries.getBillingTransactions({ status, type, start: startDate, end: endDate, page, limit, skip });
    res.json({ data: result.transactions, total: result.total, page, limit });
  } catch (err) {
    safeError(res, err);
  }
});

router.get('/billing/revenue', authenticate, requireAdmin, generalLimiter, async (req, res) => {
  try {
    const { start, end } = queries.getDateRange(req);
    res.json(await queries.getRevenueAnalytics(start, end));
  } catch (err) {
    safeError(res, err);
  }
});

router.get('/billing/credits', authenticate, requireAdmin, generalLimiter, async (req, res) => {
  try {
    const { start, end, workspaceId } = req.query;
    const startDate = start ? new Date(start) : undefined;
    const endDate = end ? new Date(end) : undefined;
    res.json({ data: await queries.getCreditConsumption({ workspaceId, start: startDate, end: endDate }) });
  } catch (err) {
    safeError(res, err);
  }
});

// Alerts
router.get('/alerts', authenticate, requireSupport, generalLimiter, async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req);
    const { type, resolved, entityType } = req.query;
    const result = await queries.getAlerts({ type, resolved, entityType, page, limit, skip });
    res.json({ data: result.alerts, total: result.total, page, limit });
  } catch (err) {
    safeError(res, err);
  }
});

router.post('/alerts/:id/resolve', authenticate, requireSupport, generalLimiter, async (req, res) => {
  try {
    const alert = await queries.resolveAlert(req.params.id, req.user.userId);
    res.json(alert);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Alert not found' });
    safeError(res, err);
  }
});

router.post('/alerts', authenticate, requireAdmin, generalLimiter, async (req, res) => {
  try {
    const schema = z.object({
      type: z.enum(['error', 'warning', 'info', 'success']),
      title: z.string().min(1),
      message: z.string().min(1),
      entityType: z.string().optional(),
      entityId: z.string().optional()
    });
    const data = schema.parse(req.body);
    const alert = await queries.createAlert(data);
    res.status(201).json(alert);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: err.flatten() });
    }
    safeError(res, err);
  }
});

// GET /api/admin/integration-requests — все запросы на интеграции
router.get('/integration-requests', authenticate, requireSupport, generalLimiter, async (req, res) => {
  try {
    const workspaces = await prisma.workspace.findMany({
      select: { id: true, name: true, settings: true }
    });
    const requests = workspaces.flatMap((ws) => {
      const reqs = (ws.settings?.integrationRequests) || [];
      return reqs.map((r) => ({ ...r, workspaceId: ws.id, workspaceName: ws.name }));
    });
    requests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ data: requests });
  } catch (err) {
    safeError(res, err, 500, 'Не удалось получить запросы интеграций.');
  }
});

// GET /api/admin/support/tickets — все тикеты поддержки
router.get('/support/tickets', authenticate, requireSupport, generalLimiter, async (req, res) => {
  try {
    const { status, priority } = req.query;
    const where = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;

    const tickets = await prisma.ticket.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100
    });
    res.json({ data: tickets });
  } catch (err) {
    safeError(res, err, 500, 'Не удалось получить тикеты поддержки.');
  }
});

// POST /api/admin/support/tickets/:id/resolve — ответить/закрыть тикет
router.post('/support/tickets/:id/resolve', authenticate, requireSupport, generalLimiter, async (req, res) => {
  try {
    const { resolution } = req.body;
    if (!resolution || resolution.trim().length < 3) {
      return res.status(400).json({ error: 'Введите ответ (минимум 3 символа)' });
    }
    const ticket = await prisma.ticket.update({
      where: { id: req.params.id },
      data: {
        status: 'resolved',
        resolution: resolution.trim(),
        assignedTo: req.user.userId,
        resolvedAt: new Date()
      }
    });
    res.json({ ticket, message: 'Тикет закрыт.' });
  } catch (err) {
    safeError(res, err, 500, 'Не удалось закрыть тикет.');
  }
});

module.exports = router;
