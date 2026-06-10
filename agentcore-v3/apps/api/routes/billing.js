const express = require('express');
const { z } = require('zod');
const { prisma } = require('../prisma-client');
const config = require('../config');
const { authenticate } = require('../middleware/auth');
const { generalLimiter, aiLimiter } = require('../middleware/rateLimit');
const yookassa = require('../services/yookassa');
const { safeError } = require('../utils/errors');

const router = express.Router();

router.get('/balance', authenticate, generalLimiter, async (req, res) => {
  try {
    const [workspace, topUpSum] = await Promise.all([
      prisma.workspace.findUnique({ where: { id: req.user.workspaceId } }),
      prisma.billingTransaction.aggregate({
        where: { workspaceId: req.user.workspaceId, type: 'topup', status: 'completed' },
        _sum: { amount: true }
      })
    ]);
    if (!workspace) return res.status(404).json({ error: 'Workspace not found' });

    const isTrial = (workspace.plan || 'TRIAL') === 'TRIAL';
    const trialActive = isTrial && workspace.trialEndsAt && new Date() <= workspace.trialEndsAt;
    const hasActiveSub = workspace.subscriptionActive === true || trialActive;
    const planCredit = isTrial ? (trialActive ? config.TRIAL_CREDIT_AMOUNT : 0) : config.BUSINESS_CREDIT_AMOUNT;
    const toppedUpBalance = (topUpSum._sum?.amount) || 0;
    const balance = toppedUpBalance + planCredit;

    res.json({ balance, toppedUpBalance, subscriptionCredit: planCredit, subscriptionActive: hasActiveSub, plan: workspace.plan || 'TRIAL', trialActive });
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

router.get('/plan', authenticate, generalLimiter, async (req, res) => {
  try {
    const workspace = await prisma.workspace.findUnique({ where: { id: req.user.workspaceId } });
    const plan = workspace?.plan || 'FREE';
    const isPaid = plan === 'PRO' || plan === 'ENTERPRISE';
    res.json({
      plan,
      trialEndsAt: workspace?.trialEndsAt,
      settings: workspace?.settings || {},
      limits: {
        agents: isPaid ? 10 : 1,
        messages: isPaid ? 999999 : 100,
        knowledge: isPaid ? 999999 : 10
      }
    });
  } catch (err) {
    safeError(res, err);
  }
});

router.get('/trial-status', authenticate, generalLimiter, async (req, res) => {
  try {
    const workspace = await prisma.workspace.findUnique({ where: { id: req.user.workspaceId } });
    if (!workspace) return res.status(404).json({ error: 'Workspace not found' });

    const trialEndsAt = workspace.trialEndsAt;
    if (!trialEndsAt) {
      return res.json({ trialEndsAt: null, daysLeft: null, isTrialing: false });
    }

    const now = new Date();
    const diffMs = trialEndsAt.getTime() - now.getTime();
    const daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

    res.json({
      trialEndsAt: trialEndsAt.toISOString(),
      daysLeft,
      isTrialing: (workspace.plan || 'TRIAL') === 'TRIAL',
      isExpired: (workspace.plan || 'TRIAL') === 'TRIAL' && diffMs <= 0
    });
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

router.get('/suggy-balance', authenticate, generalLimiter, async (req, res) => {
  try {
    const [workspace, topUpSum] = await Promise.all([
      prisma.workspace.findUnique({ where: { id: req.user.workspaceId } }),
      prisma.billingTransaction.aggregate({
        where: { workspaceId: req.user.workspaceId, type: 'topup', status: 'completed' },
        _sum: { amount: true }
      })
    ]);
    if (!workspace) return res.status(404).json({ error: 'Workspace not found' });

    const isTrial = (workspace.plan || 'TRIAL') === 'TRIAL';
    const trialActive = isTrial && workspace.trialEndsAt && new Date() <= workspace.trialEndsAt;
    const hasActiveSub = workspace.subscriptionActive === true || trialActive;

    const planCredit = (() => {
      switch (workspace.plan || 'TRIAL') {
        case 'TRIAL': return trialActive ? config.TRIAL_CREDIT_AMOUNT : 0;
        case 'PRO': return config.PRO_CREDIT_AMOUNT;
        case 'BUSINESS': return config.BUSINESS_CREDIT_AMOUNT;
        case 'ENTERPRISE': return config.BUSINESS_CREDIT_AMOUNT;
        default: return 0;
      }
    })();

    const toppedUpBalance = (topUpSum._sum?.amount) || 0;
    const balance = toppedUpBalance + planCredit;

    res.json({
      balance,
      toppedUpBalance,
      subscriptionCredit: planCredit,
      subscriptionActive: hasActiveSub,
      plan: workspace.plan || 'TRIAL',
      trialActive
    });
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
    if (process.env.NODE_ENV === 'production' && (!config.YOOKASSA_SHOP_ID || !config.YOOKASSA_SECRET_KEY)) {
      return res.status(503).json({
        error: 'Платёжная система временно недоступна. Попробуйте позже.',
        supported: false
      });
    }

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
          description: `Пополнение баланса на ${amount} RUB`,
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
      if (yookassaErr.message?.includes('not configured')) {
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
    if (err.message?.includes('not configured') || err.code === 'YOOKASSA_NOT_CONFIGURED') {
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
