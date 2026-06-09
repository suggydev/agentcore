export function getUserRole(): string | null {
  if (typeof window === 'undefined') return null;
  // 1. Try localStorage user object
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr) as { role?: string };
      if (user.role) return user.role;
    } catch { /* ignore */ }
  }
  // 2. Fallback: decode role from JWT token payload
  const token = localStorage.getItem('token') || document.cookie.split(';').find(c => c.trim().startsWith('token='))?.split('=')[1];
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return decoded.role || null;
  } catch {
    return null;
  }
}

export function isAdminRole(role: string | null): boolean {
  if (!role) return false;
  return ['SUPERADMIN', 'ADMIN', 'SUPPORT', 'ANALYST'].includes(role);
}
