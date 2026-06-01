const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const { prisma } = require('../prisma-client');
const config = require('../config');
const { fetchModels, routeToModel } = require('../services/suggy');
const { authenticate } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimit');
const { safeError } = require('../utils/errors');

const router = express.Router();

router.post('/register', authLimiter, async (req, res) => {
  try {
    const schema = z.object({
      name: z.string().min(2),
      email: z.string().email(),
      password: z.string().min(6),
      workspaceName: z.string().optional()
    });
    const data = schema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) return res.status(400).json({ error: 'Email already registered' });

    const trialEndsAt = new Date(Date.now() + config.TRIAL_DAYS * 24 * 60 * 60 * 1000);
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const { workspace, user } = await prisma.$transaction(async (tx) => {
      const workspace = await tx.workspace.create({
        data: {
          name: data.workspaceName || data.name + "'s Workspace",
          plan: 'TRIAL',
          trialEndsAt,
          settings: {}
        }
      });
      const user = await tx.user.create({
        data: {
          name: data.name,
          email: data.email,
          password: hashedPassword,
          workspaceId: workspace.id,
          role: 'OWNER'
        }
      });
      return { workspace, user };
    });

    if (config.CREATE_DEFAULT_AGENTS !== false) {
      const models = await fetchModels();
      const defaultModels = {
        assistant: routeToModel('general chat', 'hello', models)?.id || 'accounts/fireworks/models/glm-5p1',
        coder: routeToModel('coding', 'write code', models)?.id || 'accounts/fireworks/models/deepseek-v4-pro',
        creative: routeToModel('creative writing', 'write story', models)?.id || 'accounts/fireworks/models/glm-5p1',
        analyst: routeToModel('analyze document', 'analyze long text', models)?.id || 'accounts/fireworks/models/deepseek-v4-pro'
      };

      await prisma.agent.createMany({
        data: [
          { name: 'AI Assistant', description: 'General purpose assistant', workspaceId: workspace.id, model: defaultModels.assistant, systemPrompt: 'You are a helpful AI assistant.' },
          { name: 'Code Expert', description: 'Coding and technical tasks', workspaceId: workspace.id, model: defaultModels.coder, systemPrompt: 'You are an expert programmer. Write clean, well-documented code.' },
          { name: 'Creative Writer', description: 'Creative writing and content', workspaceId: workspace.id, model: defaultModels.creative, systemPrompt: 'You are a creative writer with excellent storytelling skills.' },
          { name: 'Data Analyst', description: 'Data analysis and research', workspaceId: workspace.id, model: defaultModels.analyst, systemPrompt: 'You are a data analyst and researcher. Provide thorough, evidence-based analysis.' }
        ],
        skipDuplicates: true
      });
    }

    const token = jwt.sign({ userId: user.id, workspaceId: workspace.id, role: user.role, tokenVersion: user.tokenVersion }, config.JWT_SECRET, { expiresIn: '7d' });
    res.json({
      accessToken: token,
      user: { id: user.id, name: user.name, email: user.email },
      workspaceId: workspace.id,
      plan: workspace.plan,
      trialEndsAt: workspace.trialEndsAt
    });
  } catch (err) {
    console.error('Register error:', err);
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: err.flatten() });
    }
    safeError(res, err, 400, 'Registration failed');
  }
});

router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = z.object({ email: z.string().email(), password: z.string() }).parse(req.body);
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const workspace = await prisma.workspace.findUnique({ where: { id: user.workspaceId } });
    const token = jwt.sign({ userId: user.id, workspaceId: user.workspaceId, role: user.role, tokenVersion: user.tokenVersion }, config.JWT_SECRET, { expiresIn: '7d' });
    res.json({
      accessToken: token,
      user: { id: user.id, name: user.name, email: user.email },
      workspaceId: user.workspaceId,
      plan: workspace?.plan || 'FREE',
      trialEndsAt: workspace?.trialEndsAt
    });
  } catch (err) {
    console.error('Login error:', err);
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: err.flatten() });
    }
    safeError(res, err, 400, 'Login failed');
  }
});

router.post('/refresh', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const newTokenVersion = user.tokenVersion + 1;
    await prisma.user.update({
      where: { id: user.id },
      data: { tokenVersion: newTokenVersion }
    });

    const workspace = await prisma.workspace.findUnique({ where: { id: user.workspaceId } });
    const token = jwt.sign(
      { userId: user.id, workspaceId: user.workspaceId, role: user.role, tokenVersion: newTokenVersion },
      config.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      accessToken: token,
      user: { id: user.id, name: user.name, email: user.email },
      workspaceId: user.workspaceId,
      plan: workspace?.plan || 'FREE',
      trialEndsAt: workspace?.trialEndsAt
    });
  } catch (err) {
    console.error('Refresh error:', err);
    safeError(res, err);
  }
});

router.post('/logout', authenticate, async (req, res) => {
  try {
    await prisma.user.update({
      where: { id: req.user.userId },
      data: { tokenVersion: { increment: 1 } }
    });
    res.json({ success: true });
  } catch (err) {
    safeError(res, err);
  }
});

router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.userId }, include: { workspace: true } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ id: user.id, name: user.name, email: user.email, role: user.role, workspace: user.workspace });
  } catch (err) {
    safeError(res, err);
  }
});

module.exports = router;
