const express = require('express');
const { z } = require('zod');
const { prisma } = require('../prisma-client');
const { authenticate } = require('../middleware/auth');
const { generalLimiter } = require('../middleware/rateLimit');
const { safeError } = require('../utils/errors');
const { sendEmail } = require('../services/resend');
const crypto = require('crypto');

const router = express.Router();

// GET /api/workspace
router.get('/', authenticate, generalLimiter, async (req, res) => {
  try {
    const workspace = await prisma.workspace.findUnique({ where: { id: req.user.workspaceId } });
    if (!workspace) return res.status(404).json({ error: 'Workspace not found' });
    res.json({
      id: workspace.id,
      name: workspace.name,
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

// GET /api/workspace/members
router.get('/members', authenticate, generalLimiter, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { workspaceId: req.user.workspaceId },
      select: { id: true, name: true, email: true, role: true, createdAt: true }
    });

    const invitations = await prisma.teamInvitation.findMany({
      where: { workspaceId: req.user.workspaceId, status: 'pending' }
    });

    const members = [
      ...users.map((u) => ({ id: u.id, name: u.name, email: u.email, role: u.role, joinedAt: u.createdAt, status: 'active' })),
      ...invitations.map((i) => ({ id: i.id, name: i.email, email: i.email, role: i.role, joinedAt: i.createdAt, status: 'pending' }))
    ];

    res.json(members);
  } catch (err) {
    console.error('Workspace members error:', err);
    safeError(res, err, 500, 'Failed to fetch members');
  }
});

// POST /api/workspace/invite
router.post('/invite', authenticate, generalLimiter, async (req, res) => {
  try {
    const schema = z.object({
      email: z.string().email(),
      role: z.enum(['ADMIN', 'MANAGER', 'VIEWER']).default('MANAGER')
    });
    const { email, role } = schema.parse(req.body);
    const workspaceId = req.user.workspaceId;

    // Check if user is already a member
    const existingUser = await prisma.user.findFirst({
      where: { email, workspaceId }
    });
    if (existingUser) {
      return res.status(400).json({ error: 'Пользователь уже в команде' });
    }

    // Check for pending invite
    const existingInvite = await prisma.teamInvitation.findFirst({
      where: { email, workspaceId, status: 'pending' }
    });
    if (existingInvite) {
      return res.status(400).json({ error: 'Приглашение уже отправлено' });
    }

    // Check if user exists on platform (different workspace)
    const platformUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true }
    });

    const token = crypto.randomBytes(32).toString('hex');
    const invite = await prisma.teamInvitation.create({
      data: {
        workspaceId,
        email,
        role,
        token,
        invitedBy: req.user.userId
      }
    });

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { name: true }
    });

    const inviter = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { name: true }
    });

    // Send invitation email
    const acceptUrl = `${process.env.CLIENT_URL || 'https://agentcore.work'}/team/invite/${token}`;
    try {
      await sendEmail({
        to: email,
        subject: `Приглашение в команду ${workspace?.name || 'AgentCore'}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="text-align: center; margin-bottom: 48px;">
              <h1 style="color: #111; font-size: 28px; font-weight: 700; margin: 0;">AgentCore</h1>
            </div>
            <div style="background: #fff; border-radius: 16px; padding: 32px; border: 1px solid #eee;">
              <h2 style="color: #111; font-size: 20px; font-weight: 600; margin: 0 0 16px;">Вас пригласили в команду</h2>
              <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
                <strong>${inviter?.name || 'Коллега'}</strong> приглашает вас присоединиться к команде 
                <strong>${workspace?.name || 'AgentCore'}</strong> в роли <strong>${role}</strong>.
              </p>
              ${platformUser ? '' : '<p style="color: #777; font-size: 13px; margin: 0 0 24px;">Для присоединения вам нужно сначала зарегистрироваться на платформе.</p>'}
              <a href="${acceptUrl}" style="display: inline-block; background: #111; color: #fff; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 15px;">
                Принять приглашение
              </a>
              <p style="color: #999; font-size: 12px; margin: 24px 0 0;">
                Ссылка действительна 7 дней. Если вы не ожидали приглашения, просто проигнорируйте это письмо.
              </p>
            </div>
          </div>
        `
      });
    } catch (emailErr) {
      console.error('[Invite] Email failed:', emailErr.message);
      // Don't fail the request if email fails, but warn
    }

    // Create in-app notification for invited user if they exist on platform
    if (platformUser) {
      await prisma.notification.create({
        data: {
          userId: platformUser.id,
          workspaceId,
          title: 'Новое приглашение в команду',
          message: `${inviter?.name || 'Коллега'} приглашает вас в команду ${workspace?.name || 'AgentCore'}`,
          type: 'info',
          link: `/team/invite/${token}`
        }
      });
    }

    res.json({
      success: true,
      invite: { id: invite.id, email, role, status: invite.status },
      message: platformUser
        ? 'Приглашение отправлено. Пользователь получит уведомление на сайте и email.'
        : 'Приглашение отправлено. Пользователь должен зарегистрироваться, затем принять приглашение по ссылке из email.'
    });
  } catch (err) {
    console.error('Invite error:', err);
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Некорректный email' });
    }
    safeError(res, err, 500, 'Не удалось отправить приглашение');
  }
});

// DELETE /api/workspace/members/:id
router.delete('/members/:id', authenticate, generalLimiter, async (req, res) => {
  try {
    const { id } = req.params;
    const workspaceId = req.user.workspaceId;

    // Check if it's a pending invitation
    const invite = await prisma.teamInvitation.findFirst({
      where: { id, workspaceId }
    });
    if (invite) {
      await prisma.teamInvitation.delete({ where: { id } });
      return res.json({ success: true, message: 'Приглашение отменено' });
    }

    // Otherwise it's a user
    const user = await prisma.user.findFirst({
      where: { id, workspaceId }
    });
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
    if (user.role === 'OWNER') return res.status(403).json({ error: 'Нельзя удалить владельца' });

    const personalWorkspace = await prisma.workspace.create({
      data: { name: `${user.name || 'Удалённый'} workspace`, settings: {} }
    });
    await prisma.user.update({
      where: { id },
      data: { workspaceId: personalWorkspace.id, role: 'OWNER' }
    });

    res.json({ success: true, message: 'Пользователь удалён из команды' });
  } catch (err) {
    console.error('Remove member error:', err);
    safeError(res, err, 500, 'Не удалось удалить пользователя');
  }
});

// POST /api/workspace/invite/:token/accept
router.post('/invite/:token/accept', authenticate, generalLimiter, async (req, res) => {
  try {
    const { token } = req.params;
    const invite = await prisma.teamInvitation.findUnique({
      where: { token }
    });

    if (!invite) return res.status(404).json({ error: 'Приглашение не найдено' });
    if (invite.status !== 'pending') return res.status(400).json({ error: 'Приглашение уже использовано' });
    if (new Date() > invite.expiresAt) {
      await prisma.teamInvitation.update({
        where: { id: invite.id },
        data: { status: 'expired' }
      });
      return res.status(400).json({ error: 'Приглашение истекло' });
    }

    // Check that current user matches invite email
    const currentUser = await prisma.user.findUnique({
      where: { id: req.user.userId }
    });
    if (currentUser.email !== invite.email) {
      return res.status(403).json({ error: 'Это приглашение адресовано другому email' });
    }

    // Move user to new workspace
    await prisma.user.update({
      where: { id: req.user.userId },
      data: { workspaceId: invite.workspaceId, role: invite.role }
    });

    await prisma.teamInvitation.update({
      where: { id: invite.id },
      data: { status: 'accepted', acceptedAt: new Date() }
    });

    res.json({ success: true, message: 'Вы присоединились к команде' });
  } catch (err) {
    console.error('Accept invite error:', err);
    safeError(res, err, 500, 'Не удалось принять приглашение');
  }
});

// GET /api/workspace/invitations
router.get('/invitations', authenticate, generalLimiter, async (req, res) => {
  try {
    const invitations = await prisma.teamInvitation.findMany({
      where: { workspaceId: req.user.workspaceId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(invitations);
  } catch (err) {
    safeError(res, err, 500, 'Failed to fetch invitations');
  }
});

// Notifications
// GET /api/notifications
router.get('/notifications', authenticate, generalLimiter, async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    res.json({ data: notifications, unreadCount: notifications.filter((n) => !n.read).length });
  } catch (err) {
    safeError(res, err, 500, 'Failed to fetch notifications');
  }
});

// POST /api/notifications/:id/read
router.post('/notifications/:id/read', authenticate, generalLimiter, async (req, res) => {
  try {
    await prisma.notification.update({
      where: { id: req.params.id, userId: req.user.userId },
      data: { read: true }
    });
    res.json({ success: true });
  } catch (err) {
    safeError(res, err, 500, 'Failed to mark notification as read');
  }
});

module.exports = router;
