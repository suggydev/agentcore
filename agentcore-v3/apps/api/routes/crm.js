const express = require('express');
const { z } = require('zod');
const { prisma } = require('../prisma-client');
const { authenticate } = require('../middleware/auth');
const { generalLimiter } = require('../middleware/rateLimit');
const { safeError } = require('../utils/errors');

const crmUpdateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().max(50).optional().or(z.literal('')),
  status: z.enum(['lead', 'contact', 'customer', 'archived']).optional(),
  notes: z.string().max(2000).optional().or(z.literal(''))
});

const router = express.Router();

router.get('/', authenticate, generalLimiter, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;
    const [customers, total] = await Promise.all([
      prisma.cRMContact.findMany({
        where: { workspaceId: req.user.workspaceId },
        orderBy: { createdAt: 'desc' },
        skip, take: limit
      }),
      prisma.cRMContact.count({ where: { workspaceId: req.user.workspaceId } })
    ]);
    res.json({ data: customers, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    safeError(res, err);
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const schema = z.object({
      name: z.string().min(1).max(255),
      email: z.string().email().optional().or(z.literal('')),
      phone: z.string().max(50).optional().or(z.literal('')),
      status: z.enum(['lead', 'contact', 'customer', 'archived']).optional(),
      notes: z.string().max(2000).optional().or(z.literal('')),
    });
    const data = schema.parse(req.body);
    const customer = await prisma.cRMContact.create({
      data: { ...data, email: data.email || null, phone: data.phone || null, notes: data.notes || null, workspaceId: req.user.workspaceId }
    });
    res.json(customer);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: err.flatten() });
    }
    safeError(res, err, 400, 'Failed to create contact');
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const contact = await prisma.cRMContact.findFirst({
      where: { id: req.params.id, workspaceId: req.user.workspaceId }
    });
    if (!contact) return res.status(404).json({ error: 'Contact not found' });
    res.json(contact);
  } catch (err) {
    safeError(res, err);
  }
});

router.put('/:id', authenticate, async (req, res) => {
  try {
    const parsed = crmUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation error', details: parsed.error.flatten() });
    }
    const data = parsed.data;

    const existing = await prisma.cRMContact.findFirst({
      where: { id: req.params.id, workspaceId: req.user.workspaceId }
    });
    if (!existing) return res.status(404).json({ error: 'Contact not found' });

    const updateData = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.email !== undefined) updateData.email = data.email || null;
    if (data.phone !== undefined) updateData.phone = data.phone || null;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.notes !== undefined) updateData.notes = data.notes || null;

    const contact = await prisma.cRMContact.update({
      where: { id: req.params.id },
      data: updateData
    });
    res.json(contact);
  } catch (err) {
    safeError(res, err, 400, 'Failed to update contact');
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const result = await prisma.cRMContact.deleteMany({
      where: { id: req.params.id, workspaceId: req.user.workspaceId }
    });
    if (result.count === 0) return res.status(404).json({ error: 'Contact not found' });
    res.json({ success: true });
  } catch (err) {
    safeError(res, err, 400, 'Failed to delete contact');
  }
});

module.exports = router;
