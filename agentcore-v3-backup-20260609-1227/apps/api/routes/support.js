const express = require('express');
const { z } = require('zod');
const { prisma } = require('../prisma-client');
const { authenticate } = require('../middleware/auth');
const { safeError } = require('../utils/errors');

const router = express.Router();

const createTicketSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(5000),
  category: z.enum(['general', 'technical', 'billing', 'integration']).default('general'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium')
});

// POST /api/support/tickets — создать тикет
router.post('/tickets', authenticate, async (req, res) => {
  try {
    const data = createTicketSchema.parse(req.body);
    const ticket = await prisma.ticket.create({
      data: {
        workspaceId: req.user.workspaceId,
        userId: req.user.userId,
        title: data.title,
        description: data.description,
        category: data.category,
        priority: data.priority
      }
    });
    res.status(201).json({ ticket, message: 'Обращение создано. Мы ответим в ближайшее время.' });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: err.flatten() });
    }
    safeError(res, err, 500, 'Не удалось создать обращение.');
  }
});

// GET /api/support/tickets — получить тикеты пользователя
router.get('/tickets', authenticate, async (req, res) => {
  try {
    const tickets = await prisma.ticket.findMany({
      where: { workspaceId: req.user.workspaceId },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ data: tickets });
  } catch (err) {
    safeError(res, err, 500, 'Не удалось получить обращения.');
  }
});

// GET /api/support/tickets/:id — получить тикет по ID
router.get('/tickets/:id', authenticate, async (req, res) => {
  try {
    const ticket = await prisma.ticket.findFirst({
      where: { id: req.params.id, workspaceId: req.user.workspaceId }
    });
    if (!ticket) return res.status(404).json({ error: 'Обращение не найдено' });
    res.json({ ticket });
  } catch (err) {
    safeError(res, err, 500, 'Не удалось получить обращение.');
  }
});

module.exports = router;
