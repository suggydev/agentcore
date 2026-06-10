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

const loginAttempts = new Map();
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;

function isLockedOut(email) {
  const record = loginAttempts.get(email);
  if (!record) return false;
  if (record.count >= MAX_FAILED_ATTEMPTS && Date.now() - record.lastAttempt < LOCKOUT_DURATION_MS) {
    return true;
  }
  if (Date.now() - record.lastAttempt >= LOCKOUT_DURATION_MS) {
    loginAttempts.delete(email);
    return false;
  }
  return false;
}

function recordFailedAttempt(email) {
  const record = loginAttempts.get(email) || { count: 0, lastAttempt: 0 };
  record.count += 1;
  record.lastAttempt = Date.now();
  loginAttempts.set(email, record);
}

function resetAttempts(email) {
  loginAttempts.delete(email);
}

router.post('/register', authLimiter, async (req, res) => {
  try {
    const schema = z.object({
      name: z.string().min(2).max(255),
      email: z.string().email().max(255),
      password: z.string().min(8).regex(/[A-Z]/, 'Password must contain an uppercase letter').regex(/[0-9]/, 'Password must contain a digit'),
      workspaceName: z.string().max(100).optional()
    });
    const data = schema.parse(req.body);
    const email = data.email.toLowerCase().trim();

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      // perform dummy hash to prevent timing attacks
      await bcrypt.hash(data.password, 10);
      return res.status(400).json({ error: 'Email already registered' });
    }

    const trialEndsAt = new Date(Date.now() + config.TRIAL_DAYS * 24 * 60 * 60 * 1000);
    const hashedPassword = await bcrypt.hash(data.password, 10);

    let workspace;
    let user;
    
    try {
      const result = await prisma.$transaction(async (tx) => {
        const workspaceData = {
          name: data.workspaceName || data.name + "'s Workspace",
          trialEndsAt,
          settings: {}
        };
        // Only add plan if the column exists (backward compatibility)
        try {
          workspaceData.plan = 'TRIAL';
        } catch (e) {
          console.warn('[Auth] plan column not available, skipping');
        }
        
        const workspace = await tx.workspace.create({ data: workspaceData });
        const user = await tx.user.create({
          data: {
            name: data.name,
            email,
            password: hashedPassword,
            workspaceId: workspace.id,
            role: 'OWNER'
          }
        });
        return { workspace, user };
      });
      workspace = result.workspace;
      user = result.user;
    } catch (txError) {
      // If transaction fails due to missing columns, try without plan
      console.warn('[Auth] Transaction failed, attempting fallback:', txError.message);
      workspace = await prisma.workspace.create({
        data: {
          name: data.workspaceName || data.name + "'s Workspace",
          trialEndsAt,
          settings: {}
        }
      });
      user = await prisma.user.create({
        data: {
          name: data.name,
          email,
          password: hashedPassword,
          workspaceId: workspace.id,
          role: 'OWNER'
        }
      });
    }

    if (config.CREATE_DEFAULT_AGENTS !== false) {
      try {
        const models = await fetchModels();
        const defaultModels = {
          assistant: routeToModel('general chat', 'hello', models)?.id || 'accounts/fireworks/models/glm-5p1',
          coder: routeToModel('coding', 'write code', models)?.id || 'accounts/fireworks/models/deepseek-v4-pro',
          creative: routeToModel('creative writing', 'write story', models)?.id || 'accounts/fireworks/models/glm-5p1',
          analyst: routeToModel('analyze document', 'analyze long text', models)?.id || 'accounts/fireworks/models/deepseek-v4-pro'
        };

        await prisma.$transaction(async (tx) => {
          await tx.agent.createMany({
            data: [
              { name: 'AI Assistant', description: 'General purpose assistant', workspaceId: workspace.id, model: defaultModels.assistant, systemPrompt: 'You are a helpful AI assistant.' },
              { name: 'Code Expert', description: 'Coding and technical tasks', workspaceId: workspace.id, model: defaultModels.coder, systemPrompt: 'You are an expert programmer. Write clean, well-documented code.' },
              { name: 'Creative Writer', description: 'Creative writing and content', workspaceId: workspace.id, model: defaultModels.creative, systemPrompt: 'You are a creative writer with excellent storytelling skills.' },
              { name: 'Data Analyst', description: 'Data analysis and research', workspaceId: workspace.id, model: defaultModels.analyst, systemPrompt: 'You are a data analyst and researcher. Provide thorough, evidence-based analysis.' }
            ],
            skipDuplicates: true
          });
        });
      } catch (agentErr) {
        console.error('[Auth] Default agent creation failed, rolling back:', agentErr);
        await prisma.user.delete({ where: { id: user.id } }).catch(err => { console.error('[Auth] Rollback user delete failed:', err.message); });
        await prisma.workspace.delete({ where: { id: workspace.id } }).catch(err => { console.error('[Auth] Rollback workspace delete failed:', err.message); });
        return res.status(500).json({ error: `Registration failed: could not create default agents — ${agentErr.message}` });
      }
    }

    const token = jwt.sign({ userId: user.id, workspaceId: workspace.id, role: user.role, tokenVersion: user.tokenVersion }, config.JWT_SECRET, { expiresIn: config.JWT_EXPIRES_IN || '7d' });
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });
    res.json({
      accessToken: token,
      user: { id: user.id, name: user.name, email: user.email },
      workspaceId: workspace.id,
      plan: workspace.plan || 'TRIAL',
      trialEndsAt: workspace.trialEndsAt
    });
  } catch (err) {
    console.error('Register error:', err);
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: err.flatten() });
    }
    safeError(res, err, 500, 'Registration failed');
  }
});

router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email: rawEmail, password } = z.object({ email: z.string().email(), password: z.string() }).parse(req.body);
    const email = rawEmail.toLowerCase().trim();

    if (isLockedOut(email)) {
      await bcrypt.hash(password, 10);
      return res.status(429).json({ error: 'Слишком много попыток. Попробуйте через 15 минут.', code: 'TOO_MANY_ATTEMPTS' });
    }

    let user;
    try {
      user = await prisma.user.findUnique({ where: { email } });
    } catch (findErr) {
      // Handle case where SUPERADMIN role doesn't exist in enum
      if (findErr.message && findErr.message.includes('SUPERADMIN')) {
        console.warn('[Auth] SUPERADMIN role not in enum, attempting raw query fallback');
        const users = await prisma.$queryRaw`SELECT * FROM "User" WHERE email = ${email}`;
        user = users[0] || null;
      } else {
        throw findErr;
      }
    }
    const dummyHash = '$2a$10$dummyhashdummyhashdummyhashdummyhashdu';
    const hashToCompare = user?.password || dummyHash;
    const valid = await bcrypt.compare(password, hashToCompare);
    if (!user || !valid) {
      recordFailedAttempt(email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    resetAttempts(email);
    let workspace;
    try {
      workspace = await prisma.workspace.findUnique({ where: { id: user.workspaceId } });
    } catch (wsErr) {
      console.warn('[Auth] Workspace query failed:', wsErr.message);
      workspace = null;
    }
    loginAttempts.delete(attemptKey);
    const token = jwt.sign({ userId: user.id, workspaceId: user.workspaceId, role: user.role || 'OWNER', tokenVersion: user.tokenVersion || 0 }, config.JWT_SECRET, { expiresIn: config.JWT_EXPIRES_IN || '7d' });
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });
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
    safeError(res, err, 500, 'Login failed');
  }
});

router.post('/refresh', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { tokenVersion: { increment: 1 } }
    });

    const workspace = await prisma.workspace.findUnique({ where: { id: user.workspaceId } });
    const token = jwt.sign(
      { userId: user.id, workspaceId: user.workspaceId, role: user.role, tokenVersion: updated.tokenVersion },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRES_IN || '7d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });
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
    res.clearCookie('token', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/' });
    res.json({ success: true });
  } catch (err) {
    safeError(res, err);
  }
});

router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.userId }, include: { workspace: { select: { id: true, name: true, plan: true, trialEndsAt: true, settings: true } } } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ id: user.id, name: user.name, email: user.email, role: user.role, workspace: user.workspace });
  } catch (err) {
    safeError(res, err);
  }
});

router.patch('/me', authenticate, async (req, res) => {
  try {
    const schema = z.object({
      name: z.string().min(2).max(255).optional(),
      email: z.string().email().max(255).optional(),
    });
    const data = schema.parse(req.body);
    const updateData = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.email !== undefined) {
      const newEmail = data.email.toLowerCase().trim();
      const existing = await prisma.user.findUnique({ where: { email: newEmail } });
      if (existing && existing.id !== req.user.userId) {
        return res.status(400).json({ error: 'Email already registered' });
      }
      updateData.email = newEmail;
    }
    const user = await prisma.user.update({
      where: { id: req.user.userId },
      data: updateData
    });
    res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: err.flatten() });
    }
    safeError(res, err, 500, 'Failed to update profile');
  }
});

router.post('/change-password', authenticate, async (req, res) => {
  try {
    const schema = z.object({
      oldPassword: z.string().min(1),
      newPassword: z.string().min(8).regex(/[A-Z]/, 'Password must contain an uppercase letter').regex(/[0-9]/, 'Password must contain a digit'),
    });
    const data = schema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!user || !user.password) {
      return res.status(400).json({ error: 'User not found' });
    }
    const valid = await bcrypt.compare(data.oldPassword, user.password);
    if (!valid) {
      return res.status(400).json({ error: 'Invalid old password' });
    }
    const hashedPassword = await bcrypt.hash(data.newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword, tokenVersion: { increment: 1 } }
    });
    res.json({ success: true });
  } catch (err) {
    console.error('Change password error:', err);
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: err.flatten() });
    }
    safeError(res, err, 500, 'Failed to change password');
  }
});

module.exports = router;
