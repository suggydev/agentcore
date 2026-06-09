const express = require('express');
const { z } = require('zod');
const { prisma } = require('../prisma-client');
const { authenticate } = require('../middleware/auth');
const { safeError } = require('../utils/errors');

const router = express.Router();

// Legal content schema
const legalContentSchema = z.object({
  companyName: z.string().optional(),
  companyFullName: z.string().optional(),
  inn: z.string().optional(),
  ogrn: z.string().optional(),
  kpp: z.string().optional(),
  legalAddress: z.string().optional(),
  actualAddress: z.string().optional(),
  director: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  supportEmail: z.string().email().optional(),
  supportPhone: z.string().optional(),
  // Tariffs
  tariffs: z.array(z.object({
    id: z.string(),
    name: z.string(),
    price: z.number(),
    period: z.string(),
    description: z.string(),
    features: z.array(z.string()),
    agents: z.number().optional(),
    tokens: z.string().optional(),
    integrations: z.number().optional(),
  })).optional(),
  // Legal texts
  offerText: z.string().optional(),
  privacyText: z.string().optional(),
  refundText: z.string().optional(),
  paymentInfoText: z.string().optional(),
  lastUpdated: z.string().optional(),
}).optional();

// GET legal content (public)
router.get('/legal', async (req, res) => {
  try {
    const settings = await prisma.workspace.findFirst({
      where: { name: 'System Settings' },
      select: { settings: true }
    });
    
    const defaults = {
      companyName: 'ООО «АгентКор»',
      companyFullName: 'Общество с ограниченной ответственностью «АгентКор»',
      inn: '1234567890',
      ogrn: '1234567890123',
      kpp: '123456789',
      legalAddress: '123456, Россия, г. Москва, ул. Примерная, д. 1, офис 101',
      actualAddress: '123456, Россия, г. Москва, ул. Примерная, д. 1, офис 101',
      director: 'Иванов Иван Иванович',
      email: 'hello@agentcore.work',
      phone: '+7 (999) 123-45-67',
      supportEmail: 'support@agentcore.work',
      supportPhone: '+7 (999) 123-45-67',
      tariffs: [
        {
          id: 'starter',
          name: 'Стартовый',
          price: 4499,
          period: 'единоразово + 1 месяц',
          description: 'Создание и настройка 1 AI-агента + 1 месяц работы',
          features: ['1 AI-агент', '1 000 AI-токенов/мес', '2 интеграции', 'Базовая поддержка', 'Настройка промпта'],
          agents: 1,
          tokens: '1 000',
          integrations: 2,
        },
        {
          id: 'pro',
          name: 'Профессиональный',
          price: 2499,
          period: '/месяц',
          description: 'Поддержка и работа агента + расширенные возможности',
          features: ['1 AI-агент', '10 000 AI-токенов/мес', '10 интеграций', 'Приоритетная поддержка', 'Расширенная аналитика', 'API доступ'],
          agents: 1,
          tokens: '10 000',
          integrations: 10,
        },
        {
          id: 'business',
          name: 'Бизнес',
          price: 9999,
          period: '/месяц',
          description: 'Для компаний с несколькими агентами и высокой нагрузкой',
          features: ['5 AI-агентов', '50 000 AI-токенов/мес', 'Все интеграции', 'Выделенная поддержка 24/7', 'Корпоративная аналитика', 'White-label', 'SLA 99.9%'],
          agents: 5,
          tokens: '50 000',
          integrations: 50,
        },
      ],
      lastUpdated: '2026-06-06',
    };
    
    const content = settings?.settings?.legal || defaults;
    res.json(content);
  } catch (err) {
    safeError(res, err);
  }
});

// UPDATE legal content (admin only)
router.put('/legal', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!user || (user.role !== 'SUPERADMIN' && user.role !== 'ADMIN')) {
      return res.status(403).json({ error: 'Доступ запрещён' });
    }

    const data = legalContentSchema.parse(req.body);
    
    let settings = await prisma.workspace.findFirst({
      where: { name: 'System Settings' }
    });
    
    if (!settings) {
      settings = await prisma.workspace.create({
        data: { name: 'System Settings', settings: {} }
      });
    }
    
    const currentSettings = settings.settings || {};
    await prisma.workspace.update({
      where: { id: settings.id },
      data: {
        settings: {
          ...currentSettings,
          legal: {
            ...currentSettings.legal,
            ...data,
            lastUpdated: new Date().toISOString().split('T')[0],
          }
        }
      }
    });
    
    res.json({ success: true, message: 'Юридические данные обновлены' });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: err.flatten() });
    }
    safeError(res, err);
  }
});

module.exports = router;
