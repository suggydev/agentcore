'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Plus, Search, Loader2, Brain, ArrowRight, MessageSquare, Zap } from 'lucide-react';
import { Input } from '@/design/components/Input';
import { Card } from '@/design/components/Card';
import { useToast } from '@/design/components/Toast';
import { t } from '@/design/i18n';
import { useAgentStore } from '@/store/agentStore';
import ErrorBoundary from '@/components/ErrorBoundary';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

interface Agent {
  id: string;
  name: string;
  emoji?: string;
  description: string | null;
  isActive: boolean;
  isPaid: boolean;
  createdAt: string;
  conversationCount?: number;
  messageCount?: number;
}

type FilterType = 'all' | 'active' | 'drafts';

export default function AgentsPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const auth = useAgentStore((s) => s.auth);

  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
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
        headers: { Authorization: `Bearer ${token}` }
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
      if (process.env.NODE_ENV === 'development') console.error('[AgentsPage]', err);
      addToast({ variant: 'error', message: err instanceof Error ? err.message : 'Не удалось загрузить агентов' });
    }
    setLoading(false);
  }, [token, addToast, handleAuthError]);

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
    <div className="rounded-card bg-surface border border-border p-4 space-y-3 animate-pulse">
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
      <ErrorBoundary>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="h-8 bg-surface-2 rounded w-48 animate-pulse" />
            <div className="h-4 bg-surface-2 rounded w-64 mt-2 animate-pulse" />
          </div>
          <div className="h-10 bg-surface-2 rounded w-32 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-[28px] font-semibold text-text tracking-[-0.01em]">{t('agents.title')}</h1>
          <p className="text-sm sm:text-[14px] text-text-muted mt-1">Управление AI-агентами</p>
        </div>
        <button
          onClick={() => router.push('/agents/create')}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand text-white text-sm font-medium hover:bg-brand-hover transition-colors w-full sm:w-auto"
        >
          <Plus size={16} />
          Новый агент
        </button>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
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
          <p className="text-[16px] font-medium text-text mb-2">Создайте первого агента</p>
          <p className="text-sm text-text-muted mb-4 text-center max-w-md">
            Создайте агента для автоматизации коммуникаций с клиентами.
          </p>
          <button
            onClick={() => router.push('/agents/create')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand text-white text-sm font-medium hover:bg-brand-hover transition-colors"
          >
            <Plus size={16} />
            Создать агента
          </button>
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
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                        agent.isActive 
                          ? 'bg-green-500/10 text-green-500' 
                          : 'bg-surface-2 text-text-muted'
                      }`}>
                        {agent.isActive ? 'Активен' : 'Черновик'}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-[13px] text-text-muted line-clamp-1">
                  {agent.description || 'Нет описания'}
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <span className="text-[11px] px-2 py-0.5 rounded-pill bg-surface-2 text-text-muted flex items-center gap-1">
                    <MessageSquare size={10} />
                    {agent.conversationCount || 0} диалогов
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-pill bg-surface-2 text-text-muted flex items-center gap-1">
                    <Zap size={10} />
                    {agent.messageCount || 0} сообщений
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/agents/${agent.id}`);
                  }}
                  className="mt-3 w-full py-2 rounded-lg bg-accent-soft border border-border text-text text-sm font-medium hover:bg-accent-soft/70 transition-all flex items-center justify-center gap-1.5"
                >
                  Перейти к агенту
                  <ArrowRight size={14} />
                </button>
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
              onClick={() => router.push('/agents/create')}
              className="flex flex-col items-center justify-center h-full border-dashed min-h-[140px]"
            >
              <Plus size={24} className="text-text-muted mb-2" />
              <p className="text-[14px] font-medium text-text-muted">Новый агент</p>
            </Card>
          </motion.div>
        </div>
      )}
    </div>
    </ErrorBoundary>
  );
}
