const express = require('express');
const { z } = require('zod');
const { prisma } = require('../prisma-client');
const { authenticate } = require('../middleware/auth');
const { generalLimiter } = require('../middleware/rateLimit');
const { safeError } = require('../utils/errors');

const knowledgeUpdateSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  content: z.string().min(1).optional(),
  type: z.enum(['text', 'url', 'file']).optional()
});

const router = express.Router();

router.get('/', authenticate, generalLimiter, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;
    const agentId = req.query.agentId || null;
    const where = { workspaceId: req.user.workspaceId };
    if (agentId) where.agentId = agentId;
    else where.agentId = null; // global workspace knowledge
    const [docs, total] = await Promise.all([
      prisma.knowledgeDocument.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip, take: limit
      }),
      prisma.knowledgeDocument.count({ where })
    ]);
    res.json({ data: docs, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    safeError(res, err);
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const schema = z.object({
      title: z.string().min(1).max(500),
      content: z.string().min(1),
      type: z.enum(['text', 'url', 'file']).optional().default('text'),
      agentId: z.string().optional(),
    });
    const data = schema.parse(req.body);
    const createData = { title: data.title, content: data.content, type: data.type, workspaceId: req.user.workspaceId };
    if (data.agentId) {
      // Verify agent belongs to this workspace
      const agent = await prisma.agent.findFirst({ where: { id: data.agentId, workspaceId: req.user.workspaceId } });
      if (!agent) return res.status(404).json({ error: 'Agent not found in this workspace' });
      createData.agentId = data.agentId;
    }
    const doc = await prisma.knowledgeDocument.create({ data: createData });
    res.json(doc);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: err.flatten() });
    }
    safeError(res, err, 400, 'Failed to create document');
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
    safeError(res, err);
  }
});

router.put('/:id', authenticate, async (req, res) => {
  try {
    const parsed = knowledgeUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation error', details: parsed.error.flatten() });
    }
    const data = parsed.data;

    const existing = await prisma.knowledgeDocument.findFirst({
      where: { id: req.params.id, workspaceId: req.user.workspaceId }
    });
    if (!existing) return res.status(404).json({ error: 'Document not found' });

    const updateData = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.content !== undefined) updateData.content = data.content;
    if (data.type !== undefined) updateData.type = data.type;

    const doc = await prisma.knowledgeDocument.update({
      where: { id: req.params.id },
      data: updateData
    });
    res.json(doc);
  } catch (err) {
    safeError(res, err, 400, 'Failed to update document');
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
    safeError(res, err, 400, 'Failed to delete document');
  }
});

// FAQ endpoints — stored in workspace.settings.faq to avoid migration
router.get('/faq', authenticate, generalLimiter, async (req, res) => {
  try {
    const workspace = await prisma.workspace.findUnique({
      where: { id: req.user.workspaceId },
      select: { settings: true }
    });
    const faqs = workspace?.settings?.faq || [];
    res.json({ data: faqs, total: faqs.length });
  } catch (err) {
    safeError(res, err);
  }
});

router.post('/faq', authenticate, async (req, res) => {
  try {
    const schema = z.object({
      question: z.string().min(1).max(500),
      answer: z.string().min(1),
    });
    const data = schema.parse(req.body);
    const workspace = await prisma.workspace.findUnique({
      where: { id: req.user.workspaceId },
      select: { settings: true }
    });
    const settings = workspace?.settings || {};
    const faqs = settings.faq || [];
    const newFaq = {
      id: `faq-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      ...data,
      createdAt: new Date().toISOString()
    };
    faqs.push(newFaq);
    await prisma.workspace.update({
      where: { id: req.user.workspaceId },
      data: { settings: { ...settings, faq: faqs } }
    });
    res.json(newFaq);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: err.flatten() });
    }
    safeError(res, err, 400, 'Failed to create FAQ');
  }
});

router.delete('/faq/:id', authenticate, async (req, res) => {
  try {
    const workspace = await prisma.workspace.findUnique({
      where: { id: req.user.workspaceId },
      select: { settings: true }
    });
    const settings = workspace?.settings || {};
    const faqs = settings.faq || [];
    const filtered = faqs.filter(f => f.id !== req.params.id);
    if (filtered.length === faqs.length) {
      return res.status(404).json({ error: 'FAQ not found' });
    }
    await prisma.workspace.update({
      where: { id: req.user.workspaceId },
      data: { settings: { ...settings, faq: filtered } }
    });
    res.json({ success: true });
  } catch (err) {
    safeError(res, err, 400, 'Failed to delete FAQ');
  }
});

// Upload endpoint — accepts multipart/form-data, reads text files, saves as knowledge docs
router.post('/upload', authenticate, async (req, res) => {
  try {
    const formidable = require('formidable');
    const form = new formidable.IncomingForm({ multiples: true });
    form.parse(req, async (err, fields, files) => {
      if (err) return safeError(res, err, 400, 'Upload failed');
      const agentId = fields.agentId?.[0] || null;
      if (agentId) {
        const agent = await prisma.agent.findFirst({ where: { id: agentId, workspaceId: req.user.workspaceId } });
        if (!agent) return res.status(404).json({ error: 'Agent not found' });
      }
      const uploadedFiles = Array.isArray(files.files) ? files.files : (files.files ? [files.files] : []);
      const created = [];
      for (const file of uploadedFiles) {
        const fs = require('fs');
        let content = '';
        let type = 'file';
        try {
          const buffer = fs.readFileSync(file.filepath);
          const text = buffer.toString('utf-8');
          if (buffer.length !== Buffer.byteLength(text, 'utf-8')) {
            content = `Файл «${file.originalFilename}» загружен (${(buffer.length / 1024).toFixed(1)} КБ). Извлечение текста из бинарных файлов в разработке.`;
          } else {
            content = text;
            type = 'text';
          }
        } catch (readErr) {
          content = `Файл «${file.originalFilename}» загружен. Ошибка чтения: ${readErr.message}`;
        }
        const doc = await prisma.knowledgeDocument.create({
          data: {
            title: file.originalFilename || 'Uploaded file',
            content,
            type,
            workspaceId: req.user.workspaceId,
            agentId: agentId || undefined
          }
        });
        created.push(doc);
      }
      res.json({ data: created, count: created.length });
    });
  } catch (err) {
    safeError(res, err, 400, 'Upload failed');
  }
});

// Parse URL endpoint — fetches URL and saves content
router.post('/parse', authenticate, async (req, res) => {
  try {
    const schema = z.object({
      url: z.string().url(),
      agentId: z.string().optional(),
    });
    const data = schema.parse(req.body);
    if (data.agentId) {
      const agent = await prisma.agent.findFirst({ where: { id: data.agentId, workspaceId: req.user.workspaceId } });
      if (!agent) return res.status(404).json({ error: 'Agent not found' });
    }
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(data.url, { timeout: 15000 });
    const text = await response.text();
    const doc = await prisma.knowledgeDocument.create({
      data: {
        title: data.url,
        content: text,
        type: 'url',
        workspaceId: req.user.workspaceId,
        agentId: data.agentId || undefined
      }
    });
    res.json(doc);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: err.flatten() });
    }
    safeError(res, err, 400, 'Failed to parse URL');
  }
});

module.exports = router;
