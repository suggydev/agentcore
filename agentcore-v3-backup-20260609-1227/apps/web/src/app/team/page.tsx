'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Users, Plus, Trash2, Mail, Shield, User, Crown, Loader2, X, CheckCircle2, AlertCircle, AlertTriangle } from 'lucide-react';
import NewDashboardLayout from '@/components/NewDashboardLayout';
import { useToast } from '@/design/components/Toast';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'OWNER' | 'ADMIN' | 'MANAGER' | 'VIEWER';
  avatar?: string;
  joinedAt: string;
  status: 'active' | 'pending';
}

const roleLabels: Record<string, string> = {
  OWNER: 'Владелец',
  ADMIN: 'Администратор',
  MANAGER: 'Менеджер',
  VIEWER: 'Наблюдатель',
};

const roleColors: Record<string, string> = {
  OWNER: 'bg-brand/20 text-brand border-brand/30',
  ADMIN: 'bg-warning/20 text-warning border-warning/30',
  MANAGER: 'bg-success/20 text-success border-success/30',
  VIEWER: 'bg-surface-3 text-text-muted border-border',
};

export default function TeamPage() {
  const router = useRouter();
  const { addToast } = useToast();

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [authChecked, setAuthChecked] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('MANAGER');
  const [inviteLoading, setInviteLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    setAuthChecked(true);
  }, [router]);

  const fetchMembers = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      setFetchError('');
      const res = await fetch(`${API_BASE}/api/workspace/members`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Не удалось загрузить участников');
      }
      const data = await res.json();
      setMembers(Array.isArray(data) ? data : data.members || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка соединения';
      setFetchError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authChecked) fetchMembers();
  }, [authChecked, fetchMembers]);

  const inviteMember = async () => {
    if (!inviteEmail.trim()) return;
    setInviteLoading(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_BASE}/api/workspace/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      });
      const data = await res.json();
      if (res.ok) {
        addToast({ variant: 'success', message: data.message || `Приглашение отправлено на ${inviteEmail}` });
        setInviteEmail('');
        fetchMembers();
      } else {
        addToast({ variant: 'error', message: data.error || 'Не удалось отправить приглашение' });
      }
    } catch {
      addToast({ variant: 'error', message: 'Ошибка соединения' });
    } finally {
      setInviteLoading(false);
    }
  };

  const removeMember = async (id: string) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_BASE}/api/workspace/members/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setMembers((prev) => prev.filter((m) => m.id !== id));
        addToast({ variant: 'success', message: 'Участник удалён из команды' });
      } else {
        const data = await res.json().catch(() => ({}));
        addToast({ variant: 'error', message: data.error || 'Не удалось удалить участника' });
      }
    } catch {
      addToast({ variant: 'error', message: 'Ошибка соединения' });
    }
  };

  if (!authChecked) {
    return (
      <NewDashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 text-brand animate-spin" />
        </div>
      </NewDashboardLayout>
    );
  }

  if (loading) {
    return (
      <NewDashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 text-brand animate-spin" />
        </div>
      </NewDashboardLayout>
    );
  }

  return (
    <NewDashboardLayout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="mb-8">
          <p className="text-[11px] font-semibold uppercase tracking-label text-brand mb-2">Управление</p>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-text tracking-tight">Команда</h1>
          <p className="text-text-muted mt-1">Приглашайте коллег и управляйте доступом</p>
        </div>

        {/* Invite Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface rounded-2xl border border-border shadow-sm p-4 sm:p-6 mb-6"
        >
          <h3 className="font-semibold text-text mb-4 flex items-center gap-2">
            <Plus size={18} className="text-brand" />
            Пригласить участника
          </h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <input
                type="email"
                placeholder="email@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && inviteMember()}
                className="w-full px-3.5 py-2.5 bg-surface rounded-xl border border-border text-sm text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-brand/30 transition-all"
              />
            </div>
            <div className="flex gap-3">
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="px-3 py-2.5 bg-surface rounded-xl border border-border text-sm text-text focus:outline-none focus:ring-2 focus:ring-brand/30 flex-1 sm:flex-none"
              >
                <option value="ADMIN">Администратор</option>
                <option value="MANAGER">Менеджер</option>
                <option value="VIEWER">Наблюдатель</option>
              </select>
              <button
                onClick={inviteMember}
                disabled={inviteLoading || !inviteEmail.trim()}
                className="px-5 py-2.5 rounded-xl bg-brand text-white text-sm font-semibold hover:bg-brand-hover transition-all disabled:opacity-50 flex items-center gap-2 flex-shrink-0"
              >
                {inviteLoading ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
                <span className="hidden sm:inline">Пригласить</span>
                <span className="sm:hidden">+</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Members List */}
        {fetchError ? (
          <div className="bg-surface rounded-2xl border border-border shadow-sm p-8 text-center">
            <AlertTriangle size={32} className="mx-auto text-[var(--warning)] mb-3" />
            <p className="text-text-muted mb-4">{fetchError}</p>
            <button
              onClick={fetchMembers}
              className="px-4 py-2 rounded-xl bg-brand text-white text-sm font-semibold hover:bg-brand-hover transition-all"
            >
              Попробовать снова
            </button>
          </div>
        ) : members.length === 0 ? (
          <div className="bg-surface rounded-2xl border border-border shadow-sm p-12 text-center">
            <Users size={48} className="text-text-muted mx-auto mb-4" />
            <p className="text-text-muted font-medium">Пока нет участников</p>
            <p className="text-sm text-text-muted mt-1">Пригласите первого коллегу — заполните форму выше</p>
          </div>
        ) : (
          <div className="space-y-3">
            {members.map((member, index) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-surface rounded-2xl border border-border shadow-sm p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0 w-full sm:w-auto">
                  <div className="w-10 h-10 rounded-full bg-brand/15 flex items-center justify-center text-brand font-semibold text-sm flex-shrink-0">
                    {member.avatar ? (
                      <img src={member.avatar} alt={member.name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      (member.name || member.email).charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-text">{member.name || member.email}</p>
                      {member.role === 'OWNER' && <Crown size={14} className="text-brand" />}
                    </div>
                    <p className="text-xs text-text-muted">{member.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                  <span className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border ${roleColors[member.role] || roleColors.VIEWER}`}>
                    {roleLabels[member.role] || member.role}
                  </span>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full ${member.status === 'active' ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'}`}>
                    {member.status === 'active' ? 'Активен' : 'Ожидание'}
                  </span>
                  {member.role !== 'OWNER' && (
                    <button
                      onClick={() => removeMember(member.id)}
                      className="p-2 rounded-lg hover:bg-danger-soft text-danger transition-colors ml-auto sm:ml-0"
                      aria-label={`Удалить ${member.name || member.email}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </NewDashboardLayout>
  );
}
