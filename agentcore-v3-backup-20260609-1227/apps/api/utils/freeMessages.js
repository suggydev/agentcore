const { prisma } = require('../prisma-client');
const config = require('../config');

const FREE_MESSAGES_LIMIT = config.AGENT_FREE_CREDITS || 1000;

/**
 * Check if agent still has free messages left.
 * Free messages only apply to non-active agents (isActive = false).
 * Active agents bypass the free message limit (unlimited).
 * @param {string} agentId
 * @param {string} workspaceId
 * @returns {Promise<{ allowed: boolean; remaining: number; reason?: string }>}
 */
async function checkFreeMessages(agentId, workspaceId) {
  if (!agentId) return { allowed: true, remaining: FREE_MESSAGES_LIMIT };

  const agent = await prisma.agent.findFirst({
    where: { id: agentId, workspaceId }
  });
  if (!agent) return { allowed: false, remaining: 0, reason: 'Agent not found' };

  // Active agents have unlimited messages (paid)
  if (agent.isActive === true) {
    return { allowed: true, remaining: Infinity };
  }

  // Count how many free messages this agent already used this month
  const usedCount = await prisma.creditConsumptionLog.count({
    where: {
      agentId,
      reason: { in: ['ai_request', 'ai_request_extra'] },
      createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
    }
  });

  const remaining = Math.max(0, FREE_MESSAGES_LIMIT - usedCount);
  if (remaining <= 0) {
    return {
      allowed: false,
      remaining: 0,
      reason: 'Лимит бесплатных сообщений исчерпан. Активируйте агента за 4 499 ₽ для продолжения.'
    };
  }

  return { allowed: true, remaining };
}

/**
 * Log a free message usage (creates a credit log with 0 amount to track usage)
 * @param {string} workspaceId
 * @param {string} agentId
 * @param {string} model
 * @returns {Promise<void>}
 */
async function logFreeMessage(workspaceId, agentId, model) {
  if (!agentId) return;
  await prisma.creditConsumptionLog.create({
    data: {
      workspaceId,
      agentId,
      amount: 0,
      reason: 'ai_request',
      model: model || null
    }
  });
}

module.exports = { checkFreeMessages, logFreeMessage, FREE_MESSAGES_LIMIT };
