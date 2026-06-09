const express = require('express');
const { z } = require('zod');
const { prisma } = require('../prisma-client');
const config = require('../config');
const { authenticate } = require('../middleware/auth');
const { generalLimiter } = require('../middleware/rateLimit');
const { fetchModels } = require('../services/suggy');
const { safeError } = require('../utils/errors');

const agentPostSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().nullish().transform(v => v ?? ''),
  model: z.string().nullish(),
  systemPrompt: z.string().nullish().transform(v => v ?? 'You are a helpful AI assistant.'),
  temperature: z.number().min(0).max(2).nullish().transform(v => v ?? 0.7),
  maxTokens: z.number().int().min(1).max(32000).nullish().transform(v => v ?? 2000),
  isActive: z.boolean().nullish().transform(v => v ?? true),
  channel: z.string().nullish(),
  settings: z.record(z.any()).nullish(),
  status: z.enum(['draft', 'designing', 'in_development', 'ready', 'active', 'archived']).nullish().transform(v => v ?? 'draft')
});

const agentPutSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().nullish(),
  model: z.string().nullish(),
  systemPrompt: z.string().nullish(),
  temperature: z.number().min(0).max(2).nullish(),
  maxTokens: z.number().int().min(1).max(32000).nullish(),
  isActive: z.boolean().nullish(),
  channel: z.string().nullish(),
  settings: z.record(z.any()).nullish(),
  status: z.enum(['draft', 'designing', 'in_development', 'ready', 'active', 'archived']).nullish(),
  brainMap: z.any().optional()
});

function normalizeModelId(model) {
  if (!model || model.includes('/')) return model;
  return `accounts/fireworks/models/${model}`;
}

const router = express.Router();

router.get('/', authenticate, generalLimiter, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;
    const [agents, total, unpaidCount] = await Promise.all([
      prisma.agent.findMany({
        where: { workspaceId: req.user.workspaceId },
        orderBy: { createdAt: 'desc' },
        skip, take: limit
      }),
      prisma.agent.count({ where: { workspaceId: req.user.workspaceId } }),
      prisma.agent.count({
        where: { workspaceId: req.user.workspaceId, isPaid: false, status: { not: 'archived' } }
      })
    ]);
    res.json({
      data: agents,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      unpaidCount,
      maxUnpaid: 3
    });
  } catch (err) {
    safeError(res, err);
  }
});

router.get('/unpaid-count', authenticate, generalLimiter, async (req, res) => {
  try {
    const count = await prisma.agent.count({
      where: { workspaceId: req.user.workspaceId, isPaid: false, status: { not: 'archived' } }
    });
    res.json({ count, max: 3, canCreate: count < 3 });
  } catch (err) {
    safeError(res, err);
  }
});

router.get('/:id', authenticate, generalLimiter, async (req, res) => {
  try {
    const agent = await prisma.agent.findFirst({
      where: { id: req.params.id, workspaceId: req.user.workspaceId }
    });
    if (!agent) return res.status(404).json({ error: 'Agent not found' });
    res.json(agent);
  } catch (err) {
    safeError(res, err);
  }
});

router.post('/', authenticate, generalLimiter, async (req, res) => {
  try {
    const parsed = agentPostSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation error', details: parsed.error.flatten() });
    }
    const { name, description, model: rawModel, systemPrompt, temperature, maxTokens, isActive, channel, settings, status } = parsed.data;

    // Check unpaid agent limit (max 3)
    const unpaidCount = await prisma.agent.count({
      where: { workspaceId: req.user.workspaceId, isPaid: false, status: { not: 'archived' } }
    });
    if (unpaidCount >= 3) {
      return res.status(403).json({
        error: 'Достигнут лимит неоплаченных агентов',
        message: 'У вас уже 3 неоплаченных агента. Активируйте одного из них, чтобы создать нового.',
        activate_url: '/agents'
      });
    }

    let model = rawModel ? normalizeModelId(rawModel) : null;
    const models = await fetchModels();
    const validModel = model ? models.find(m => m.id === model) : null;
    if (model && !validModel) {
      return res.status(400).json({ error: 'Invalid model selected' });
    }

    const agent = await prisma.agent.create({
      data: {
        name,
        description,
        model: model || 'accounts/fireworks/models/glm-5p1',
        systemPrompt,
        temperature,
        maxTokens,
        isActive,
        channel,
        settings: settings || undefined,
        status: status || 'draft',
        isPaid: false,
        isLocal: true,
        activationPrice: config.AGENT_ACTIVATION_PRICE,
        monthlyPrice: config.AGENT_MONTHLY_PRICE,
        workspaceId: req.user.workspaceId
      }
    });
    res.json(agent);
  } catch (err) {
    console.error('[AGENTS POST] Error:', err);
    safeError(res, err, 400, 'Failed to create agent');
  }
});

router.put('/:id', authenticate, generalLimiter, async (req, res) => {
  try {
    const parsed = agentPutSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation error', details: parsed.error.flatten() });
    }
    const data = parsed.data;

    const existing = await prisma.agent.findFirst({
      where: { id: req.params.id, workspaceId: req.user.workspaceId }
    });
    if (!existing) return res.status(404).json({ error: 'Agent not found' });

    if (data.model) {
      const normalizedModel = normalizeModelId(data.model);
      const models = await fetchModels();
      if (!models.find(m => m.id === normalizedModel)) {
        return res.status(400).json({ error: 'Invalid model selected' });
      }
    }

    const updateData = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.model !== undefined) updateData.model = normalizeModelId(data.model);
    if (data.systemPrompt !== undefined) updateData.systemPrompt = data.systemPrompt;
    if (data.temperature !== undefined) updateData.temperature = data.temperature;
    if (data.maxTokens !== undefined) updateData.maxTokens = data.maxTokens;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.channel !== undefined) updateData.channel = data.channel;
    if (data.settings !== undefined) updateData.settings = data.settings;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.brainMap !== undefined) updateData.settings = { ...(existing.settings || {}), brainMap: data.brainMap };

    const agent = await prisma.agent.update({
      where: { id: req.params.id, workspaceId: req.user.workspaceId },
      data: updateData
    });
    res.json(agent);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Agent not found' });
    safeError(res, err, 500, 'Failed to update agent');
  }
});

router.delete('/:id', authenticate, generalLimiter, async (req, res) => {
  try {
    const result = await prisma.agent.deleteMany({
      where: { id: req.params.id, workspaceId: req.user.workspaceId }
    });
    if (result.count === 0) return res.status(404).json({ error: 'Agent not found' });
    res.json({ success: true });
  } catch (err) {
    safeError(res, err, 400, 'Failed to delete agent');
  }
});

// GET /api/agents/:id/free-messages — оставшиеся бесплатные сообщения
router.get('/:id/free-messages', authenticate, generalLimiter, async (req, res) => {
  try {
    const agent = await prisma.agent.findFirst({
      where: { id: req.params.id, workspaceId: req.user.workspaceId }
    });
    if (!agent) return res.status(404).json({ error: 'Agent not found' });

    if (agent.isActive) {
      return res.json({ remaining: Infinity, total: 100, isActive: true });
    }

    const usedCount = await prisma.creditConsumptionLog.count({
      where: {
        agentId: req.params.id,
        amount: 0,
        reason: { in: ['ai_request', 'ai_request_extra'] },
        createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
      }
    });

    const remaining = Math.max(0, 100 - usedCount);
    res.json({ remaining, total: 100, used: usedCount, isActive: false });
  } catch (err) {
    safeError(res, err, 500, 'Failed to fetch free messages count');
  }
});

module.exports = router;
