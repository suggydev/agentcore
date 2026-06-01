const express = require('express');
const { prisma } = require('../prisma-client');
const { authenticate } = require('../middleware/auth');
const { generalLimiter } = require('../middleware/rateLimit');

const router = express.Router();

async function getDashboardData(workspaceId) {
  const [conversations, messages, agents, customers] = await Promise.all([
    prisma.conversation.count({ where: { workspaceId } }),
    prisma.message.count({ where: { conversation: { workspaceId } } }),
    prisma.agent.count({ where: { workspaceId } }),
    prisma.cRMContact.count({ where: { workspaceId } })
  ]);

  const recentMessages = await prisma.message.findMany({
    where: { conversation: { workspaceId }, role: 'user' },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: { conversation: { select: { title: true } } }
  });

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
    res.status(500).json({ error: err.message });
  }
});

router.get('/dashboard', authenticate, generalLimiter, async (req, res) => {
  try {
    res.json(await getDashboardData(req.user.workspaceId));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
