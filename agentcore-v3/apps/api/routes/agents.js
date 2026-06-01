const express = require('express');
const { prisma } = require('../prisma-client');
const { authenticate } = require('../middleware/auth');
const { generalLimiter } = require('../middleware/rateLimit');
const { fetchModels } = require('../services/suggy');

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
    res.status(500).json({ error: err.message });
  }
});

function normalizeModelId(model) {
  if (!model || model.includes('/')) return model;
  return `accounts/fireworks/models/${model}`;
}

router.get('/:id', authenticate, async (req, res) => {
  try {
    const agent = await prisma.agent.findFirst({
      where: { id: req.params.id, workspaceId: req.user.workspaceId }
    });
    if (!agent) return res.status(404).json({ error: 'Agent not found' });
    res.json(agent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    let { name, description, model, systemPrompt, temperature, maxTokens, isActive } = req.body;
    console.log('[AGENTS POST] Body:', JSON.stringify(req.body));
    console.log('[AGENTS POST] User workspaceId:', req.user?.workspaceId);

    // Normalize short model names (e.g., "glm-5p1" -> "accounts/fireworks/models/glm-5p1")
    if (model) {
      model = normalizeModelId(model);
    }

    const models = await fetchModels();
    console.log('[AGENTS POST] Available models:', models.length);
    const validModel = models.find(m => m.id === model);
    if (model && !validModel) {
      console.log('[AGENTS POST] Invalid model:', model);
      return res.status(400).json({ error: 'Invalid model selected', receivedModel: model, availableModels: models.map(m => m.id) });
    }

    const agent = await prisma.agent.create({
      data: {
        name,
        description,
        model: model || 'accounts/fireworks/models/glm-5p1',
        systemPrompt: systemPrompt || 'You are a helpful AI assistant.',
        temperature: temperature || 0.7,
        maxTokens: maxTokens || 2000,
        isActive: isActive !== false,
        workspaceId: req.user.workspaceId
      }
    });
    res.json(agent);
  } catch (err) {
    console.error('[AGENTS POST] Error:', err);
    res.status(400).json({ error: err.message, code: err.code, meta: err.meta });
  }
});

router.put('/:id', authenticate, async (req, res) => {
  try {
    const { name, description, model, systemPrompt, temperature, maxTokens, isActive } = req.body;
    const existing = await prisma.agent.findFirst({
      where: { id: req.params.id, workspaceId: req.user.workspaceId }
    });
    if (!existing) return res.status(404).json({ error: 'Agent not found' });

    if (model) {
      const normalizedModel = normalizeModelId(model);
      const models = await fetchModels();
      const validModel = models.find(m => m.id === normalizedModel);
      if (!validModel) {
        return res.status(400).json({
          error: 'Invalid model selected',
          receivedModel: model,
          availableModels: models.map(m => m.id)
        });
      }
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (model !== undefined) updateData.model = normalizeModelId(model);
    if (systemPrompt !== undefined) updateData.systemPrompt = systemPrompt;
    if (temperature !== undefined) updateData.temperature = temperature;
    if (maxTokens !== undefined) updateData.maxTokens = maxTokens;
    if (isActive !== undefined) updateData.isActive = isActive;

    const agent = await prisma.agent.update({
      where: { id: req.params.id },
      data: updateData
    });
    res.json(agent);
  } catch (err) {
    res.status(400).json({ error: err.message });
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
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
