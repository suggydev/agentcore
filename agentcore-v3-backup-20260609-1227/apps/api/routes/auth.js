const crypto = require('crypto');
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const { prisma } = require('../prisma-client');
const config = require('../config');
const { authenticate } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimit');
const { safeError } = require('../utils/errors');

const router = express.Router();

router.post('/register', authLimiter, async (req, res) => {
  try {
    const schema = z.object({
      name: z.string().min(2).max(255),
      email: z.string().email().max(255),
      password: z.string().min(6),
      workspaceName: z.string().max(100).optional(),
      companyName: z.string().max(255).optional(),
      companySize: z.string().max(50).optional(),
      industry: z.string().max(100).optional(),
      source: z.string().max(50).optional(),
      purpose: z.string().max(50).optional()
    });
    const data = schema.parse(req.body);
    const email = data.email.toLowerCase().trim();

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      // perform dummy hash to prevent timing attacks
      await bcrypt.hash(data.password, 10);
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const { workspace, user } = await prisma.$transaction(async (tx) => {
      const workspace = await tx.workspace.create({
        data: {
          name: data.workspaceName || data.name + "'s Workspace",
          settings: {
            companyName: data.companyName || null,
            companySize: data.companySize || null,
            industry: data.industry || null,
            source: data.source || null,
            purpose: data.purpose || null
          }
        }
      });
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

    const token = jwt.sign({ userId: user.id, workspaceId: workspace.id, role: user.role, tokenVersion: user.tokenVersion }, config.JWT_SECRET, { expiresIn: config.JWT_EXPIRES_IN });
    res.json({
      accessToken: token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      workspaceId: workspace.id
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
    const user = await prisma.user.findUnique({ where: { email } });
    const dummyHash = '$2a$10$dummyhashdummyhashdummyhashdummyhashdu';
    const hashToCompare = user?.password || dummyHash;
    const valid = await bcrypt.compare(password, hashToCompare);
    if (!user || !valid) {
      if (user) {
        prisma.userLoginLog.create({ data: { userId: user.id, ip: req.ip, userAgent: req.get('user-agent'), success: false } }).catch(() => {});
      }
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.settings?.twoFactorEnabled) {
      return res.json({ require2FA: true, message: 'Требуется код 2FA', userId: user.id });
    }

    const workspace = await prisma.workspace.findUnique({ where: { id: user.workspaceId } });
    const token = jwt.sign({ userId: user.id, workspaceId: user.workspaceId, role: user.role, tokenVersion: user.tokenVersion }, config.JWT_SECRET, { expiresIn: config.JWT_EXPIRES_IN });
    prisma.userLoginLog.create({ data: { userId: user.id, ip: req.ip, userAgent: req.get('user-agent'), success: true } }).catch(() => {});

    res.json({
      accessToken: token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      workspaceId: user.workspaceId
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

    const token = jwt.sign(
      { userId: user.id, workspaceId: user.workspaceId, role: user.role, tokenVersion: updated.tokenVersion },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRES_IN }
    );

    res.json({
      accessToken: token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      workspaceId: user.workspaceId
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
    const user = await prisma.user.findUnique({ where: { id: req.user.userId }, include: { workspace: { select: { id: true, name: true, settings: true } } } });
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
      newPassword: z.string().min(6),
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

// GET /api/auth/sessions — list recent login sessions for current user
router.get('/sessions', authenticate, async (req, res) => {
  try {
    const sessions = await prisma.userLoginLog.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        ip: true,
        userAgent: true,
        country: true,
        city: true,
        device: true,
        success: true,
        createdAt: true,
      }
    });
    res.json({ sessions });
  } catch (err) {
    safeError(res, err, 500, 'Failed to fetch sessions');
  }
});

// POST /api/auth/api-keys — generate a new API key (stored in user.settings)
router.post('/api-keys', authenticate, async (req, res) => {
  try {
    const schema = z.object({ name: z.string().optional() });
    const data = schema.parse(req.body);
    const key = `ak_${crypto.randomBytes(24).toString('hex')}`;
    const user = await prisma.user.findUnique({ where: { id: req.user.userId }, select: { settings: true } });
    const settings = user?.settings || {};
    const apiKeys = settings.apiKeys || [];
    apiKeys.push({
      id: `key_${Date.now()}`,
      name: data.name || 'API Key',
      key: key,
      createdAt: new Date().toISOString(),
      lastUsedAt: null,
    });
    await prisma.user.update({
      where: { id: req.user.userId },
      data: { settings: { ...settings, apiKeys: apiKeys.slice(-10) } }
    });
    res.json({ key, name: data.name });
  } catch (err) {
    safeError(res, err, 500, 'Failed to generate API key');
  }
});

// 2FA Email endpoints
function generate2FACode() {
  return crypto.randomInt(100000, 999999).toString();
}

router.post('/2fa/send-code', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const code = generate2FACode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.user.update({
      where: { id: user.id },
      data: {
        settings: {
          ...(user.settings || {}),
          twoFactorCode: code,
          twoFactorCodeExpires: expiresAt.toISOString(),
        }
      }
    });

    // TODO: Replace with actual email service (SMTP/Resend/SendGrid)
    console.log(`[2FA] Code for ${user.email}: ${code}`);

    res.json({
      success: true,
      message: 'Код отправлен на email',
      ...(process.env.NODE_ENV === 'development' ? { _devCode: code } : {})
    });
  } catch (err) {
    console.error('2FA send code error:', err);
    safeError(res, err, 500, 'Failed to send 2FA code');
  }
});

router.post('/2fa/verify', authenticate, async (req, res) => {
  try {
    const schema = z.object({ code: z.string().length(6) });
    const data = schema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const settings = user.settings || {};
    const storedCode = settings.twoFactorCode;
    const expiresAt = settings.twoFactorCodeExpires ? new Date(settings.twoFactorCodeExpires) : null;

    if (!storedCode || !expiresAt || new Date() > expiresAt || storedCode !== data.code) {
      return res.status(400).json({ error: 'Неверный или просроченный код' });
    }

    // Enable 2FA
    await prisma.user.update({
      where: { id: user.id },
      data: {
        settings: {
          ...settings,
          twoFactorEnabled: true,
          twoFactorCode: null,
          twoFactorCodeExpires: null,
        }
      }
    });

    res.json({ success: true, message: '2FA включена' });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: err.flatten() });
    }
    console.error('2FA verify error:', err);
    safeError(res, err, 500, 'Failed to verify 2FA code');
  }
});

router.post('/2fa/disable', authenticate, async (req, res) => {
  try {
    const schema = z.object({ code: z.string().length(6) });
    const data = schema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const settings = user.settings || {};
    const storedCode = settings.twoFactorCode;
    const expiresAt = settings.twoFactorCodeExpires ? new Date(settings.twoFactorCodeExpires) : null;

    // If no pending code, generate one and require it
    if (!storedCode || !expiresAt || new Date() > expiresAt) {
      const code = generate2FACode();
      const newExpires = new Date(Date.now() + 10 * 60 * 1000);
      await prisma.user.update({
        where: { id: user.id },
        data: {
          settings: {
            ...settings,
            twoFactorCode: code,
            twoFactorCodeExpires: newExpires.toISOString(),
          }
        }
      });
      console.log(`[2FA] Disable code for ${user.email}: ${code}`);
      return res.status(400).json({
        error: 'Требуется подтверждение',
        message: 'Введите код из email для отключения 2FA',
        ...(process.env.NODE_ENV === 'development' ? { _devCode: code } : {})
      });
    }

    if (storedCode !== data.code) {
      return res.status(400).json({ error: 'Неверный код' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        settings: {
          ...settings,
          twoFactorEnabled: false,
          twoFactorCode: null,
          twoFactorCodeExpires: null,
        }
      }
    });

    res.json({ success: true, message: '2FA отключена' });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: err.flatten() });
    }
    console.error('2FA disable error:', err);
    safeError(res, err, 500, 'Failed to disable 2FA');
  }
});

router.post('/guest', authLimiter, async (req, res) => {
  try {
    const guestId = require('crypto').randomUUID();
    const guestEmail = `guest-${guestId}@agentcore.work`;
    const guestPassword = require('crypto').randomBytes(16).toString('hex');
    const hashedPassword = await bcrypt.hash(guestPassword, 10);

    const workspace = await prisma.workspace.create({
      data: { name: 'Guest Workspace', settings: { isGuest: true } }
    });
    const user = await prisma.user.create({
      data: { name: 'Гость', email: guestEmail, password: hashedPassword, workspaceId: workspace.id, role: 'GUEST' }
    });
    const token = jwt.sign({ userId: user.id, workspaceId: workspace.id, role: user.role, tokenVersion: user.tokenVersion }, config.JWT_SECRET, { expiresIn: '24h' });
    res.json({ accessToken: token, user: { id: user.id, name: user.name, email: user.email, role: user.role }, workspaceId: workspace.id });
  } catch (err) {
    console.error('Guest register error:', err);
    safeError(res, err, 500, 'Guest registration failed');
  }
});

module.exports = router;
