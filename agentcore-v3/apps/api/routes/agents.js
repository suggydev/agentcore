const express = require('express');
const { z } = require('zod');
const { prisma } = require('../prisma-client');
const { authenticate } = require('../middleware/auth');
const { generalLimiter } = require('../middleware/rateLimit');
const { fetchModels } = require('../services/suggy');
const { safeError } = require('../utils/errors');

const agentPostSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional().default(''),
  model: z.string().optional(),
  systemPrompt: z.string().optional().default('You are a helpful AI assistant.'),
  temperature: z.number().min(0).max(2).optional().default(0.7),
  maxTokens: z.number().int().min(1).max(32000).optional().default(2000),
  isActive: z.boolean().optional().default(true)
});

const agentPutSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  model: z.string().optional(),
  systemPrompt: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().min(1).max(32000).optional(),
  isActive: z.boolean().optional()
});

const router = express.Router();

router.get('/', authenticate, generalLimiter, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;
    const [agents, total] = await Promise.all([
      prisma.agent.findMany({
        where: { workspaceId: req.user.workspaceId },
        orderBy: { createdAt: 'desc' },
        skip, take: limit
      }),
      prisma.agent.count({ where: { workspaceId: req.user.workspaceId } })
    ]);
    res.json({ data: agents, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    safeError(res, err);
  }
});

router.get('/:id', authenticate, async (req, res) => {
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

router.post('/', authenticate, async (req, res) => {
  try {
    const parsed = agentPostSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation error', details: parsed.error.flatten() });
    }
    const { name, description, model: rawModel, systemPrompt, temperature, maxTokens, isActive } = parsed.data;

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
        workspaceId: req.user.workspaceId
      }
    });
    res.json(agent);
  } catch (err) {
    console.error('[AGENTS POST] Error:', err);
    safeError(res, err, 400, 'Failed to create agent');
  }
});

router.put('/:id', authenticate, async (req, res) => {
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

    const agent = await prisma.agent.update({
      where: { id: req.params.id },
      data: updateData
    });
    res.json(agent);
  } catch (err) {
    safeError(res, err, 400, 'Failed to update agent');
  }
});

router.delete('/:id', authenticate, async (req, res) => {
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

module.exports = router;
