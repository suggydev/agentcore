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
import CreateAgentForm from '@/components/editor/CreateAgentForm';

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

  const loadAgents = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/agents`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setAgents(await res.json());
    } catch {
      addToast({ variant: 'error', message: t('toast.error') });
    }
    setLoading(false);
  }, [token, addToast]);

  const handleCreate = useCallback(async (data: { name: string; systemPrompt: string; emoji: string }) => {
    try {
      const res = await fetch(`${API_BASE}/api/agents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: data.name, systemPrompt: data.systemPrompt, emoji: data.emoji, temperature: 0.7 }),
      });

      if (res.ok) {
        const agent = await res.json();
        setCreateOpen(false);
        router.push(`/agents/${agent.id}`);
      } else {
        addToast({ variant: 'error', message: t('toast.error') });
      }
    } catch {
      addToast({ variant: 'error', message: t('toast.error') });
    }
  }, [token, router, addToast]);

  const filteredAgents = agents.filter((a) => {
    const matchesSearch = a.name.toLowerCase().includes(search.toLowerCase()) ||
      (a.description?.toLowerCase().includes(search.toLowerCase()) ?? false);
    const matchesFilter = filter === 'all' ||
      (filter === 'active' && a.isActive) ||
      (filter === 'drafts' && !a.isActive);
    return matchesSearch && matchesFilter;
  });

  const filterButtons: { id: FilterType; label: string }[] = [
    { id: 'all', label: t('agents.filters.all') },
    { id: 'active', label: t('agents.filters.active') },
    { id: 'drafts', label: t('agents.filters.drafts') },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-brand animate-spin" />
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
            <CreateAgentForm
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
