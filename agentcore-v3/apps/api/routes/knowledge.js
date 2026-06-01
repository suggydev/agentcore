const express = require('express');
const { z } = require('zod');
const { prisma } = require('../prisma-client');
const { authenticate } = require('../middleware/auth');
const { generalLimiter } = require('../middleware/rateLimit');

const router = express.Router();

router.get('/', authenticate, generalLimiter, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;
    const [docs, total] = await Promise.all([
      prisma.knowledgeDocument.findMany({
        where: { workspaceId: req.user.workspaceId },
        orderBy: { createdAt: 'desc' },
        skip, take: limit
      }),
      prisma.knowledgeDocument.count({ where: { workspaceId: req.user.workspaceId } })
    ]);
    res.json({ data: docs, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const schema = z.object({
      title: z.string().min(1).max(500),
      content: z.string().min(1),
      type: z.enum(['text', 'url', 'file']).optional().default('text'),
    });
    const data = schema.parse(req.body);
    const doc = await prisma.knowledgeDocument.create({
      data: { ...data, workspaceId: req.user.workspaceId }
    });
    res.json(doc);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const doc = await prisma.knowledgeDocument.findFirst({
      where: { id: req.params.id, workspaceId: req.user.workspaceId }
    });
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authenticate, async (req, res) => {
  try {
    const { title, content, type } = req.body;
    const existing = await prisma.knowledgeDocument.findFirst({
      where: { id: req.params.id, workspaceId: req.user.workspaceId }
    });
    if (!existing) return res.status(404).json({ error: 'Document not found' });

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (type !== undefined) updateData.type = type;

    const doc = await prisma.knowledgeDocument.update({
      where: { id: req.params.id },
      data: updateData
    });
    res.json(doc);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const result = await prisma.knowledgeDocument.deleteMany({
      where: { id: req.params.id, workspaceId: req.user.workspaceId }
    });
    if (result.count === 0) return res.status(404).json({ error: 'Document not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
