const express = require('express');
const { prisma } = require('../prisma-client');
const { authenticate } = require('../middleware/auth');
const { generalLimiter } = require('../middleware/rateLimit');
const { safeError } = require('../utils/errors');

const router = express.Router();

async function getDashboardData(workspaceId) {
  const [conversations, messages, agents, customers, recentMessages] = await Promise.all([
    prisma.conversation.count({ where: { workspaceId } }),
    prisma.message.count({ where: { conversation: { workspaceId } } }),
    prisma.agent.count({ where: { workspaceId } }),
    prisma.cRMContact.count({ where: { workspaceId } }),
    prisma.message.findMany({
      where: { conversation: { workspaceId }, role: 'user' },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { conversation: { select: { title: true } } }
    })
  ]);

  return {
    conversations,
    messages,
    agents,
    customers,
    recentActivity: recentMessages.map(m => ({
      id: m.id,
      content: m.content.substring(0, 100),
      role: m.role,
      createdAt: m.createdAt,
      conversationTitle: m.conversation.title
    }))
  };
}

router.get('/', authenticate, generalLimiter, async (req, res) => {
  try {
    res.json(await getDashboardData(req.user.workspaceId));
  } catch (err) {
    safeError(res, err);
  }
});

router.get('/dashboard', authenticate, generalLimiter, async (req, res) => {
  try {
    res.json(await getDashboardData(req.user.workspaceId));
  } catch (err) {
    safeError(res, err);
  }
});

module.exports = router;
