const express = require('express');
const { prisma } = require('../prisma-client');
const { authenticate } = require('../middleware/auth');
const { generalLimiter } = require('../middleware/rateLimit');
const { safeError } = require('../utils/errors');

const router = express.Router();

router.get('/', authenticate, generalLimiter, async (req, res) => {
  try {
    const { agentId } = req.query;
    if (!agentId) return res.status(400).json({ error: 'agentId required' });

    const agent = await prisma.agent.findFirst({
      where: { id: String(agentId), workspace: { users: { some: { id: req.user.userId } } } }
    });
    if (!agent) return res.status(404).json({ error: 'Agent not found' });

    const now = new Date();
    const dayAgo = new Date(now - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

    const [conversationsTotal, conversationsDay, messages, creditLogs] = await Promise.all([
      prisma.conversation.count({ where: { agentId: String(agentId) } }),
      prisma.conversation.count({ where: { agentId: String(agentId), createdAt: { gte: dayAgo } } }),
      prisma.message.findMany({
        where: { conversation: { agentId: String(agentId) }, role: 'assistant', createdAt: { gte: weekAgo } },
        orderBy: { createdAt: 'asc' },
        select: { content: true, createdAt: true }
      }),
      prisma.creditConsumptionLog.findMany({
        where: { agentId: String(agentId), createdAt: { gte: weekAgo } },
        orderBy: { createdAt: 'asc' },
        select: { amount: true, createdAt: true }
      })
    ]);

    const avgResponseLength = messages.length > 0
      ? Math.round(messages.reduce((sum, m) => sum + m.content.length, 0) / messages.length)
      : 0;

    const tokenCost = creditLogs.reduce((sum, c) => sum + (c.amount || 0), 0);

    // Build sparkline for last 7 days (daily conversation counts)
    const dialogsSparkline = [];
    for (let i = 6; i >= 0; i--) {
      const start = new Date(now - (i + 1) * 24 * 60 * 60 * 1000);
      const end = new Date(now - i * 24 * 60 * 60 * 1000);
      const count = await prisma.conversation.count({
        where: { agentId: String(agentId), createdAt: { gte: start, lt: end } }
      });
      dialogsSparkline.push(count);
    }

    res.json({
      dialogsPerDay: conversationsDay,
      dialogsTotal: conversationsTotal,
      avgResponseLength,
      conversion: null, // Not yet available — CRM pipeline tracking not implemented
      tokenCost,
      responseTime: null, // Not yet available — response timing not tracked
      dialogsSparkline
    });
  } catch (err) {
    safeError(res, err);
  }
});

module.exports = router;
