'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Brain,
  MessageSquare,
  Zap,
  TrendingUp,
  Loader2,
  Users,
  BarChart3,
  ArrowRight,
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

interface Agent {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  conversationCount?: number;
  messageCount?: number;
}

export default function AnalyticsPage() {
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState('');

  useEffect(() => {
    const t = localStorage.getItem('token');
    if (!t) { router.push('/login'); return; }
    setToken(t);
  }, [router]);

  const loadAgents = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/agents`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAgents(Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []);
      }
    } catch (err) {
      if (process.env.NODE_ENV === 'development') console.error('[Analytics] Failed to load agents:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadAgents();
  }, [loadAgents]);

  const totalAgents = agents.length;
  const activeAgents = agents.filter((a) => a.isActive).length;
  const totalConversations = agents.reduce((sum, a) => sum + (a.conversationCount || 0), 0);
  const totalMessages = agents.reduce((sum, a) => sum + (a.messageCount || 0), 0);

  const statCards = [
    {
      label: 'Всего агентов',
      value: totalAgents,
      icon: Brain,
      color: 'text-brand',
      bg: 'bg-brand/10',
    },
    {
      label: 'Активные агенты',
      value: activeAgents,
      icon: Zap,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
    },
    {
      label: 'Диалогов',
      value: totalConversations,
      icon: MessageSquare,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      label: 'Сообщений',
      value: totalMessages,
      icon: BarChart3,
      color: 'text-violet-500',
      bg: 'bg-violet-500/10',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <Loader2 className="w-8 h-8 text-brand animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-brand" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text">Аналитика</h1>
            <p className="text-sm text-text-muted">Обзор активности ваших AI-агентов</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="bg-surface rounded-2xl border border-border p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center`}>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
            </div>
            <p className="text-3xl font-bold text-text mb-1">{card.value}</p>
            <p className="text-sm text-text-muted">{card.label}</p>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-surface rounded-2xl border border-border overflow-hidden"
      >
        <div className="p-5 border-b border-border">
          <h2 className="text-lg font-semibold text-text">Агенты</h2>
          <p className="text-sm text-text-muted mt-1">Статистика по каждому агенту</p>
        </div>
        <div className="divide-y divide-border">
          {agents.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="w-10 h-10 text-text-muted mx-auto mb-3" />
              <p className="text-text-muted">Пока нет агентов</p>
              <button
                onClick={() => router.push('/agents/create')}
                className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-brand hover:text-brand-hover transition-colors"
              >
                Создать первого агента <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            agents.map((agent) => (
              <div
                key={agent.id}
                onClick={() => router.push(`/agents/${agent.id}`)}
                className="p-4 flex items-center gap-4 hover:bg-bg/50 transition-colors cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-accent-soft flex items-center justify-center text-xl flex-shrink-0">
                  🤖
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-text truncate">{agent.name}</h3>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full ${
                        agent.isActive
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : 'bg-surface-2 text-text-muted'
                      }`}
                    >
                      {agent.isActive ? 'Активен' : 'Черновик'}
                    </span>
                  </div>
                  <p className="text-xs text-text-muted mt-0.5 truncate">
                    {agent.description || 'Нет описания'}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-sm text-text-muted flex-shrink-0">
                  <div className="flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4" />
                    <span>{agent.conversationCount || 0}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <BarChart3 className="w-4 h-4" />
                    <span>{agent.messageCount || 0}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}
