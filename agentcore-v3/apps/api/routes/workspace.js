const express = require('express');
const { z } = require('zod');
const { prisma } = require('../prisma-client');
const { authenticate } = require('../middleware/auth');
const { generalLimiter } = require('../middleware/rateLimit');
const { safeError } = require('../utils/errors');

const router = express.Router();

router.get('/', authenticate, generalLimiter, async (req, res) => {
  try {
    const workspace = await prisma.workspace.findUnique({ where: { id: req.user.workspaceId } });
    if (!workspace) return res.status(404).json({ error: 'Workspace not found' });
    res.json({
      id: workspace.id,
      name: workspace.name,
      plan: workspace.plan || 'TRIAL',
      trialEndsAt: workspace.trialEndsAt,
      subscriptionActive: workspace.subscriptionActive || false,
      subscriptionStartsAt: workspace.subscriptionStartsAt,
      settings: workspace.settings || {},
      createdAt: workspace.createdAt,
      updatedAt: workspace.updatedAt
    });
  } catch (err) {
    console.error('Workspace GET error:', err);
    safeError(res, err);
  }
});

router.patch('/', authenticate, generalLimiter, async (req, res) => {
  try {
    const schema = z.object({
      workspaceName: z.string().min(1).optional(),
      companyName: z.string().optional(),
      companySize: z.string().optional(),
      industry: z.string().optional(),
      geography: z.string().optional(),
      channels: z.array(z.string()).optional(),
      website: z.string().optional(),
      crm: z.string().optional(),
      agentGoal: z.string().optional(),
      onboardingCompleted: z.boolean().optional()
    });
    const data = schema.parse(req.body);

    const workspace = await prisma.workspace.findUnique({ where: { id: req.user.workspaceId } });
    if (!workspace) return res.status(404).json({ error: 'Workspace not found' });

    const currentSettings = (workspace.settings && typeof workspace.settings === 'object') ? { ...workspace.settings } : {};
    const merged = { ...currentSettings, ...data };

    const updateData = { settings: merged };
    if (data.workspaceName) updateData.name = data.workspaceName;

    const updated = await prisma.workspace.update({
      where: { id: req.user.workspaceId },
      data: updateData
    });

    res.json({ success: true, settings: updated.settings });
  } catch (err) {
    console.error('Onboarding error:', err);
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: err.flatten() });
    }
    safeError(res, err, 400, 'Failed to update workspace');
  }
});

router.put('/', authenticate, generalLimiter, async (req, res) => {
  try {
    const schema = z.object({
      workspaceName: z.string().min(1).optional(),
      companyName: z.string().optional(),
      companySize: z.string().optional(),
      industry: z.string().optional(),
      geography: z.string().optional(),
      channels: z.array(z.string()).optional(),
      website: z.string().optional(),
      crm: z.string().optional(),
      agentGoal: z.string().optional(),
      onboardingCompleted: z.boolean().optional()
    });
    const data = schema.parse(req.body);

    const workspace = await prisma.workspace.findUnique({ where: { id: req.user.workspaceId } });
    if (!workspace) return res.status(404).json({ error: 'Workspace not found' });

    const currentSettings = (workspace.settings && typeof workspace.settings === 'object') ? { ...workspace.settings } : {};
    const merged = { ...currentSettings, ...data };

    const updateData = { settings: merged };
    if (data.workspaceName) updateData.name = data.workspaceName;

    const updated = await prisma.workspace.update({
      where: { id: req.user.workspaceId },
      data: updateData
    });

    res.json({ success: true, settings: updated.settings });
  } catch (err) {
    console.error('Onboarding error:', err);
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: err.flatten() });
    }
    safeError(res, err, 400, 'Failed to update workspace');
  }
});

module.exports = router;
