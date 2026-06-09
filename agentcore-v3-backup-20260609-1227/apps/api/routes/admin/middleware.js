const ROLES = {
  SUPERADMIN: ['SUPERADMIN'],
  ADMIN: ['SUPERADMIN', 'ADMIN'],
  SUPPORT: ['SUPERADMIN', 'ADMIN', 'SUPPORT'],
  ANALYST: ['SUPERADMIN', 'ADMIN', 'SUPPORT', 'ANALYST']
};

function requireRole(allowed) {
  return (req, res, next) => {
    if (!allowed.includes(req.user.role)) {
      return res.status(403).json({ error: 'Доступ запрещён. Недостаточно прав.' });
    }
    next();
  };
}

module.exports = {
  requireSuperAdmin: requireRole(ROLES.SUPERADMIN),
  requireAdmin: requireRole(ROLES.ADMIN),
  requireSupport: requireRole(ROLES.SUPPORT),
  requireAnalyst: requireRole(ROLES.ANALYST)
};
