const express = require('express');
const { z } = require('zod');
const { prisma } = require('../prisma-client');
const config = require('../config');
const { authenticate } = require('../middleware/auth');
const { generalLimiter, aiLimiter } = require('../middleware/rateLimit');
const yookassa = require('../services/yookassa');
const { sendAgentReadyEmail } = require('../services/resend');
const { safeError } = require('../utils/errors');

const router = express.Router();

// Utility: calculate workspace balance from all transactions (topups + ai_usage deductions)
async function getWorkspaceBalance(workspaceId) {
  const txs = await prisma.billingTransaction.aggregate({
    where: { workspaceId, status: 'completed' },
    _sum: { amount: true }
  });
  return Math.max(0, (txs._sum?.amount) || 0);
}

// Utility: calculate agent credits (free monthly + top-ups allocated to agent)
async function getAgentCredits(agentId, workspaceId) {
  // Get free monthly credits for this agent
  const agent = await prisma.agent.findUnique({ where: { id: agentId } });
  if (!agent || agent.workspaceId !== workspaceId) return { total: 0, used: 0, remaining: 0 };

  const freeCredits = config.AGENT_FREE_CREDITS;
  const used = await prisma.creditConsumptionLog.aggregate({
    where: { agentId },
    _sum: { amount: true }
  });
  const usedAmount = (used._sum?.amount) || 0;

  return {
    total: freeCredits,
    used: usedAmount,
    remaining: Math.max(0, freeCredits - usedAmount),
    freeCredits
  };
}

router.get('/balance', authenticate, generalLimiter, async (req, res) => {
  try {
    const balance = await getWorkspaceBalance(req.user.workspaceId);
    res.json({ balance });
  } catch (err) {
    safeError(res, err);
  }
});

router.get('/transactions', authenticate, generalLimiter, async (req, res) => {
  try {
    const transactions = await prisma.billingTransaction.findMany({
      where: { workspaceId: req.user.workspaceId },
      orderBy: { createdAt: 'desc' },
      take: 100
    });
    res.json({ data: transactions, total: transactions.length });
  } catch (err) {
    safeError(res, err);
  }
});

router.get('/agent-credits/:agentId', authenticate, generalLimiter, async (req, res) => {
  try {
    const credits = await getAgentCredits(req.params.agentId, req.user.workspaceId);
    res.json(credits);
  } catch (err) {
    safeError(res, err);
  }
});

router.get('/usage', authenticate, generalLimiter, async (req, res) => {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const dateFilter = { gte: monthStart, lte: monthEnd };
    const messagesCount = await prisma.message.count({
      where: { conversation: { workspaceId: req.user.workspaceId }, createdAt: dateFilter }
    });
    const conversationsCount = await prisma.conversation.count({
      where: { workspaceId: req.user.workspaceId, createdAt: dateFilter }
    });
    res.json({ messages: messagesCount, conversations: conversationsCount, month: now.toISOString().slice(0, 7) });
  } catch (err) {
    safeError(res, err);
  }
});

const topUpSchema = z.object({
  amount: z.number().positive(),
  returnUrl: z.string().url().optional()
});

router.post('/top-up', authenticate, aiLimiter, async (req, res) => {
  try {
    const parsed = topUpSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Сумма пополнения должна быть положительным числом' });
    }
    const { amount, returnUrl } = parsed.data;

    const orderId = `topup-${req.user.workspaceId}-${Date.now()}`;

    try {
      const payment = await yookassa.createPayment({
        amount,
        description: `Пополнение баланса AgentCore`,
        orderId,
        returnUrl: returnUrl || config.CLIENT_URL + '/dashboard/credits'
      });

      await prisma.billingTransaction.create({
        data: {
          type: 'topup',
          amount,
          description: `Пополнение баланса на ${amount} ₽`,
          status: 'pending',
          providerPaymentId: payment.id,
          workspaceId: req.user.workspaceId
        }
      });

      res.json({
        paymentUrl: payment.confirmation?.confirmation_url,
        paymentId: payment.id,
        amount,
        status: payment.status
      });
    } catch (yookassaErr) {
      if (yookassaErr.code === 'YOOKASSA_NOT_CONFIGURED' || yookassaErr.message?.includes('не настроена') || yookassaErr.message?.includes('not configured')) {
        return res.status(503).json({
          error: 'Платёжная система временно недоступна. Попробуйте позже.',
          supported: false
        });
      }
      throw yookassaErr;
    }
  } catch (err) {
    console.error('Top-up error:', err.message);
    safeError(res, err, 502, 'Платёжная система временно недоступна');
  }
});

// Agent activation payment: 4,499 RUB one-time
router.post('/agent-activate', authenticate, aiLimiter, async (req, res) => {
  try {
    const schema = z.object({
      agentId: z.string().min(1),
      returnUrl: z.string().url().optional()
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation error', details: parsed.error.flatten() });
    }
    const { agentId, returnUrl } = parsed.data;

    const agent = await prisma.agent.findFirst({
      where: { id: agentId, workspaceId: req.user.workspaceId }
    });
    if (!agent) return res.status(404).json({ error: 'Агент не найден' });
    if (agent.isPaid) return res.status(400).json({ error: 'Агент уже активирован' });

    const price = config.AGENT_ACTIVATION_PRICE;
    const orderId = `agent-activate-${agentId}-${Date.now()}`;

    try {
      const payment = await yookassa.createPayment({
        amount: price,
        description: `Активация агента "${agent.name}"`,
        orderId,
        returnUrl: returnUrl || `${config.CLIENT_URL}/agents/${agentId}`
      });

      await prisma.billingTransaction.create({
        data: {
          type: 'agent_activation',
          amount: price,
          description: `Активация агента "${agent.name}"`,
          status: 'pending',
          providerPaymentId: payment.id,
          agentId,
          workspaceId: req.user.workspaceId
        }
      });

      res.json({
        paymentUrl: payment.confirmation?.confirmation_url,
        paymentId: payment.id,
        amount: price,
        agentId,
        status: payment.status
      });
    } catch (yookassaErr) {
      if (yookassaErr.code === 'YOOKASSA_NOT_CONFIGURED' || yookassaErr.message?.includes('не настроена') || yookassaErr.message?.includes('not configured')) {
        return res.status(503).json({ error: 'Платёжная система временно недоступна', supported: false });
      }
      throw yookassaErr;
    }
  } catch (err) {
    console.error('Agent activation error:', err.message);
    safeError(res, err, 502, 'Ошибка создания платежа');
  }
});

// Agent monthly subscription payment: 2,499 RUB/month
router.post('/agent-subscribe', authenticate, aiLimiter, async (req, res) => {
  try {
    const schema = z.object({
      agentId: z.string().min(1),
      returnUrl: z.string().url().optional()
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation error', details: parsed.error.flatten() });
    }
    const { agentId, returnUrl } = parsed.data;

    const agent = await prisma.agent.findFirst({
      where: { id: agentId, workspaceId: req.user.workspaceId }
    });
    if (!agent) return res.status(404).json({ error: 'Агент не найден' });
    if (!agent.isPaid) return res.status(400).json({ error: 'Сначала активируйте агента' });

    const price = config.AGENT_MONTHLY_PRICE;
    const orderId = `agent-sub-${agentId}-${Date.now()}`;

    try {
      const payment = await yookassa.createPayment({
        amount: price,
        description: `Подписка на агента "${agent.name}"`,
        orderId,
        returnUrl: returnUrl || `${config.CLIENT_URL}/agents/${agentId}`
      });

      await prisma.billingTransaction.create({
        data: {
          type: 'agent_monthly',
          amount: price,
          description: `Подписка на агента "${agent.name}"`,
          status: 'pending',
          providerPaymentId: payment.id,
          agentId,
          workspaceId: req.user.workspaceId
        }
      });

      res.json({
        paymentUrl: payment.confirmation?.confirmation_url,
        paymentId: payment.id,
        amount: price,
        agentId,
        status: payment.status
      });
    } catch (yookassaErr) {
      if (yookassaErr.code === 'YOOKASSA_NOT_CONFIGURED' || yookassaErr.message?.includes('не настроена') || yookassaErr.message?.includes('not configured')) {
        return res.status(503).json({ error: 'Платёжная система временно недоступна', supported: false });
      }
      throw yookassaErr;
    }
  } catch (err) {
    console.error('Agent subscription error:', err.message);
    safeError(res, err, 502, 'Ошибка создания платежа');
  }
});

// YooKassa webhook handler for all payment types
router.post('/yookassa/webhook', async (req, res) => {
  try {
    const signature = req.headers['x-signature'] || req.headers['yookassa-signature'] || '';
    const isValid = yookassa.verifyWebhookSignature(req.body, signature);
    if (!isValid) return res.status(403).json({ error: 'Invalid signature' });

    const { event, object } = req.body;
    if (!object || !object.id) {
      console.log('[YooKassa Webhook] Invalid payload received');
      return res.status(200).json({ received: true });
    }

    const eventType = event || 'unknown';
    const paymentId = object.id;
    const status = object.status;

    console.log(`[YooKassa Webhook] Event: ${eventType}, PaymentID: ${paymentId}, Status: ${status}`);

    // payment_method.active — новый способ оплаты привязан, но не требует обработки транзакции
    if (eventType === 'payment_method.active') {
      console.log('[YooKassa Webhook] Payment method saved for future recurring payments');
      return res.status(200).json({ received: true });
    }

    // Для payment/refund ищем транзакцию
    const tx = await prisma.billingTransaction.findFirst({
      where: { providerPaymentId: paymentId }
    });

    if (!tx) {
      console.log(`[YooKassa Webhook] Transaction not found for providerPaymentId: ${paymentId}`);
      return res.status(200).json({ received: true });
    }

    if (status === 'succeeded') {
      await prisma.billingTransaction.update({
        where: { id: tx.id },
        data: { status: 'completed' }
      });

      // If agent activation succeeded, mark agent as paid and activate
      if (tx.type === 'agent_activation' && tx.agentId) {
        await prisma.agent.update({
          where: { id: tx.agentId },
          data: { isPaid: true, paidAt: new Date(), isLocal: false, status: 'active' }
        });
        await prisma.agentSubscription.create({
          data: {
            agentId: tx.agentId,
            workspaceId: tx.workspaceId,
            status: 'active',
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          }
        });
        // Send email notification
        const workspace = await prisma.workspace.findUnique({
          where: { id: tx.workspaceId },
          include: { users: { take: 1 } }
        });
        if (workspace?.users?.[0]?.email) {
          await sendAgentReadyEmail({
            to: workspace.users[0].email,
            agentName: tx.description?.replace('Активация агента "', '').replace('"', '') || 'AI-ассистент',
            agentId: tx.agentId
          }).catch(err => console.error('[Email] Failed to send agent ready email:', err.message));
        }
      }

      // If agent monthly subscription succeeded, extend subscription
      if (tx.type === 'agent_monthly' && tx.agentId) {
        const existing = await prisma.agentSubscription.findFirst({
          where: { agentId: tx.agentId },
          orderBy: { currentPeriodEnd: 'desc' }
        });
        const startDate = existing?.currentPeriodEnd && new Date(existing.currentPeriodEnd) > new Date()
          ? new Date(existing.currentPeriodEnd)
          : new Date();
        await prisma.agentSubscription.create({
          data: {
            agentId: tx.agentId,
            workspaceId: tx.workspaceId,
            status: 'active',
            currentPeriodStart: startDate,
            currentPeriodEnd: new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000)
          }
        });
      }
    } else if (status === 'canceled') {
      await prisma.billingTransaction.update({
        where: { id: tx.id },
        data: { status: 'failed' }
      });
    } else if (status === 'waiting_for_capture') {
      console.log(`[YooKassa Webhook] Payment waiting for capture: ${paymentId}`);
      // Двухстадийный платёж — пока не обрабатываем, но логируем
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error('YooKassa webhook error:', err.message);
    // Always return 200 to YooKassa so they don't retry and flood us
    res.status(200).json({ received: true, warning: 'Processed with error' });
  }
});

router.post('/yookassa/test', authenticate, generalLimiter, async (req, res) => {
  try {
    const { amount } = req.body || {};
    const testAmount = Math.min(Number(amount) || 1, 10);

    const workspace = await prisma.workspace.findUnique({ where: { id: req.user.workspaceId } });
    if (!workspace) return res.status(404).json({ error: 'Workspace not found' });

    const settings = (workspace.settings && typeof workspace.settings === 'object') ? workspace.settings : {};
    const integrations = settings.integrations || {};
    const yk = integrations.yookassa;

    if (!yk || !yk.connected || !yk.shopId || !yk.secretKey) {
      return res.status(400).json({ error: 'ЮKassa не подключена. Подключите интеграцию в настройках.' });
    }

    const orderId = `test-${req.user.workspaceId}-${Date.now()}`;

    const payment = await yookassa.createPayment({
      amount: testAmount,
      description: `Тестовый платёж AgentCore`,
      orderId,
      returnUrl: config.CLIENT_URL + '/dashboard/integrations',
      capture: false,
    });

    res.json({
      paymentUrl: payment.confirmation?.confirmation_url,
      paymentId: payment.id,
      id: payment.id,
      amount: testAmount,
      status: payment.status,
    });
  } catch (err) {
    if (err.code === 'YOOKASSA_NOT_CONFIGURED' || err.message?.includes('не настроена') || err.message?.includes('not configured')) {
      return res.status(503).json({
        error: 'ЮKassa не настроена. Проверьте shopId и секретный ключ.',
        supported: false,
      });
    }
    console.error('YooKassa test error:', err.message);
    safeError(res, err, 502, 'Ошибка тестового платежа ЮKassa');
  }
});

module.exports = router;
