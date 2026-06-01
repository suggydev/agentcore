const express = require('express');
const { z } = require('zod');
const { prisma } = require('../prisma-client');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const workspace = await prisma.workspace.findUnique({ where: { id: req.user.workspaceId } });
    if (!workspace) return res.status(404).json({ error: 'Workspace not found' });
    res.json({
      id: workspace.id,
      name: workspace.name,
      plan: workspace.plan,
      trialEndsAt: workspace.trialEndsAt,
      subscriptionActive: workspace.subscriptionActive,
      subscriptionStartsAt: workspace.subscriptionStartsAt,
      settings: workspace.settings || {},
      createdAt: workspace.createdAt,
      updatedAt: workspace.updatedAt
    });
  } catch (err) {
    console.error('Workspace GET error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.put('/', authenticate, async (req, res) => {
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
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
