'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Loader2, Brain } from 'lucide-react';
import { Button } from '@/design/components/Button';
import { Input } from '@/design/components/Input';
import { Card } from '@/design/components/Card';
import { StatusBadge } from '@/design/components/StatusBadge';
import { Modal } from '@/design/components/Modal';
import { useToast } from '@/design/components/Toast';
import { t } from '@/design/i18n';
import { useAgentStore } from '@/store/agentStore';
import CreateAgentWizard from '@/components/editor/CreateAgentWizard';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

interface Agent {
  id: string;
  name: string;
  emoji?: string;
  description: string | null;
  model: string;
  systemPrompt: string;
  temperature: number;
  isActive: boolean;
  createdAt: string;
}

type FilterType = 'all' | 'active' | 'drafts';

export default function AgentsPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const auth = useAgentStore((s) => s.auth);
  const workspaceSettings = useAgentStore((s) => s.workspaceSettings);

  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [token, setToken] = useState('');

  useEffect(() => {
    const tk = localStorage.getItem('token') || auth.token;
    if (!tk) { router.push('/login'); return; }
    setToken(tk);
  }, [auth.token, router]);

  useEffect(() => {
    if (!token) return;
    loadAgents();
  }, [token]);

  const handleAuthError = useCallback((status: number, msg: string) => {
    if (status === 401) {
      localStorage.removeItem('token');
      router.push('/login');
      return;
    }
    addToast({ variant: 'error', message: msg });
  }, [router, addToast]);

  const loadAgents = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/agents`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAgents(Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []);
      } else {
        const errData = await res.json().catch(() => ({}));
        const msg = errData.error || errData.message || `Ошибка ${res.status}: не удалось загрузить агентов`;
        handleAuthError(res.status, msg);
      }
    } catch (err) {
      console.error('[AgentsPage]', err);
      addToast({ variant: 'error', message: err instanceof Error ? err.message : 'Не удалось загрузить агентов: сетевая ошибка' });
    }
    setLoading(false);
  }, [token, addToast, handleAuthError]);

  const handleCreate = useCallback(async (data: { name: string; systemPrompt: string; emoji: string; description?: string }) => {
    try {
      const res = await fetch(`${API_BASE}/api/agents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: data.name,
          systemPrompt: data.systemPrompt,
          emoji: data.emoji,
          description: data.description || data.systemPrompt.slice(0, 200),
          temperature: 0.7,
        }),
      });

      if (res.ok) {
        const agent = await res.json();
        setCreateOpen(false);
        router.push(`/agents/${agent.id}`);
      } else {
        const errData = await res.json().catch(() => ({}));
        const msg = errData.error || errData.message || `Ошибка ${res.status}: не удалось создать агента`;
        handleAuthError(res.status, msg);
      }
    } catch (err) {
      addToast({ variant: 'error', message: err instanceof Error ? err.message : 'Не удалось создать агента: сетевая ошибка' });
    }
  }, [token, router, addToast, handleAuthError]);

  const filteredAgents = Array.isArray(agents) ? agents.filter((a) => {
    const matchesSearch = a.name.toLowerCase().includes(search.toLowerCase()) ||
      (a.description?.toLowerCase().includes(search.toLowerCase()) ?? false);
    const matchesFilter = filter === 'all' ||
      (filter === 'active' && a.isActive) ||
      (filter === 'drafts' && !a.isActive);
    return matchesSearch && matchesFilter;
  }) : [];

  const filterButtons: { id: FilterType; label: string }[] = [
    { id: 'all', label: t('agents.filters.all') },
    { id: 'active', label: t('agents.filters.active') },
    { id: 'drafts', label: t('agents.filters.drafts') },
  ];

  const SkeletonCard = () => (
    <div className="rounded-card bg-surface border border-[var(--border)] p-4 space-y-3 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-button bg-surface-2 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-surface-2 rounded w-3/4" />
          <div className="h-3 bg-surface-2 rounded w-16" />
        </div>
      </div>
      <div className="h-3 bg-surface-2 rounded w-full" />
      <div className="h-3 bg-surface-2 rounded w-1/2" />
    </div>
  );

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="h-8 bg-surface-2 rounded w-48 animate-pulse" />
            <div className="h-4 bg-surface-2 rounded w-64 mt-2 animate-pulse" />
          </div>
          <div className="h-10 bg-surface-2 rounded w-32 animate-pulse" />
        </div>
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-10 bg-surface-2 rounded animate-pulse" />
          <div className="flex gap-1">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-8 bg-surface-2 rounded-pill w-16 animate-pulse" />
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[28px] font-semibold text-text tracking-[-0.01em]">{t('agents.title')}</h1>
          <p className="text-[14px] text-text-muted mt-1">{t('agents.subtitle')}</p>
        </div>
        <Button variant="primary" onClick={() => setCreateOpen(true)} aria-label={t('agents.create')}>
          <Plus size={16} />
          {t('agents.create')}
        </Button>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1">
          <Input
            placeholder={t('agents.search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label={t('agents.search')}
          />
        </div>
        <div className="flex items-center gap-1">
          {filterButtons.map((fb) => (
            <button
              key={fb.id}
              onClick={() => setFilter(fb.id)}
              className={`px-3 py-1.5 rounded-pill text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                filter === fb.id
                  ? 'bg-accent-soft text-brand'
                  : 'text-text-muted hover:text-text'
              }`}
              aria-label={fb.label}
            >
              {fb.label}
            </button>
          ))}
        </div>
      </div>

      {filteredAgents.length === 0 && agents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Brain size={48} className="text-text-muted mb-4" />
          <p className="text-[16px] font-medium text-text mb-2">{t('agents.createFirst')}</p>
          <Button variant="primary" onClick={() => setCreateOpen(true)} aria-label={t('agents.create')}>
            <Plus size={16} />
            {t('agents.create')}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredAgents.map((agent, i) => (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card
                hoverable
                onClick={() => router.push(`/agents/${agent.id}`)}
                className="flex flex-col"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-button bg-accent-soft flex items-center justify-center text-[22px] flex-shrink-0">
                    {agent.emoji || '🤖'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[15px] font-semibold text-text truncate">{agent.name}</h3>
                    <StatusBadge
                      variant={agent.isActive ? 'active' : 'draft'}
                      className="mt-1"
                    />
                  </div>
                </div>
                <p className="text-[13px] text-text-muted line-clamp-1">
                  {agent.description || agent.systemPrompt.slice(0, 80)}
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <span className="text-[11px] px-2 py-0.5 rounded-pill bg-surface-2 text-text-muted">
                    {agent.model.split('/').pop()}
                  </span>
                </div>
              </Card>
            </motion.div>
          ))}

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: filteredAgents.length * 0.05 }}
          >
            <Card
              hoverable
              onClick={() => setCreateOpen(true)}
              className="flex flex-col items-center justify-center h-full border-dashed min-h-[140px]"
            >
              <Plus size={24} className="text-text-muted mb-2" />
              <p className="text-[14px] font-medium text-text-muted">{t('agents.create')}</p>
            </Card>
          </motion.div>
        </div>
      )}

      <AnimatePresence>
        {createOpen && (
          <Modal
            open={createOpen}
            onClose={() => setCreateOpen(false)}
            title="Новый агент"
            size="lg"
          >
            <CreateAgentWizard
              companyName={workspaceSettings.companyName || 'Компания'}
              onSubmit={handleCreate}
              onCancel={() => setCreateOpen(false)}
            />
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}
