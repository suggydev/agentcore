const { prisma } = require('../prisma-client');
const { checkFreeMessages, logFreeMessage } = require('./freeMessages');

const FREE_CREDITS = 100; // free messages per agent per month

/**
 * Check if agent/workspace has credits and deduct if available.
 * For non-active agents, uses free messages system.
 * For active agents, uses paid balance.
 * @param {string} workspaceId
 * @param {string} agentId
 * @param {number} amount
 * @returns {Promise<boolean>}
 */
async function checkAndDeductCredits(workspaceId, agentId, amount) {
  if (!agentId) {
    // Global chat (no agent) - check workspace balance or allow if free
    const balance = await getWorkspaceBalance(workspaceId);
    if (balance >= amount) {
      await deductBalance(workspaceId, amount, 'ai_request');
      return true;
    }
    return false;
  }

  const agent = await prisma.agent.findUnique({ where: { id: agentId } });
  if (!agent || agent.workspaceId !== workspaceId) return false;

  // Active agents use paid balance
  if (agent.isActive === true) {
    const balance = await getWorkspaceBalance(workspaceId);
    if (balance >= amount) {
      await deductBalance(workspaceId, amount, 'ai_request', agentId);
      return true;
    }
    return false;
  }

  // Non-active agents use free messages
  const freeCheck = await checkFreeMessages(agentId, workspaceId);
  if (freeCheck.allowed) {
    await logFreeMessage(workspaceId, agentId, null);
    return true;
  }
  return false;
}

/**
 * Get agent credits info (free + paid)
 * @param {string} agentId
 * @param {string} workspaceId
 */
async function getAgentCredits(agentId, workspaceId) {
  const agent = await prisma.agent.findUnique({ where: { id: agentId } });
  if (!agent || agent.workspaceId !== workspaceId) return { total: 0, used: 0, remaining: 0 };

  const used = await prisma.creditConsumptionLog.aggregate({
    where: { agentId },
    _sum: { amount: true }
  });
  const usedAmount = (used._sum?.amount) || 0;
  const freeCount = await prisma.creditConsumptionLog.count({
    where: { agentId, amount: 0, reason: { in: ['ai_request', 'ai_request_extra'] } }
  });

  return {
    total: FREE_CREDITS,
    used: usedAmount + freeCount,
    remaining: Math.max(0, FREE_CREDITS - freeCount),
    freeCredits: FREE_CREDITS
  };
}

async function getWorkspaceBalance(workspaceId) {
  const txs = await prisma.billingTransaction.aggregate({
    where: { workspaceId },
    _sum: { amount: true }
  });
  return Math.max(0, (txs._sum?.amount) || 0);
}

async function deductBalance(workspaceId, amount, reason, agentId) {
  await prisma.billingTransaction.create({
    data: {
      workspaceId,
      type: 'ai_usage',
      amount: -amount,
      description: reason,
      agentId: agentId || null,
      status: 'completed'
    }
  });
}

module.exports = { checkAndDeductCredits, getAgentCredits };
