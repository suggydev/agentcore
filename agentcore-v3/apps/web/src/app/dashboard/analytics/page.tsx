'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  MessageSquare,
  MessagesSquare,
  Bot,
  Users,
  Loader2,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

interface AnalyticsData {
  conversations: number;
  messages: number;
  agents: number;
  customers: number;
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    createdAt: string;
  }>;
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
};

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'conversations' | 'agents'>('conversations');
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
      return;
    }

    const load = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/analytics`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const json = await res.json();
          setData({
            conversations: json.conversations ?? 0,
            messages: json.messages ?? 0,
            agents: json.agents ?? 0,
            customers: json.customers ?? 0,
            recentActivity: Array.isArray(json.recentActivity) ? json.recentActivity : [],
          });
        } else {
          setError('Не удалось загрузить аналитику');
        }
      } catch (err) {
        console.error('[AnalyticsPage]', err);
        setError('Ошибка соединения');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const metrics = [
    {
      label: 'Диалоги',
      value: data?.conversations ?? 0,
      icon: MessageSquare,
      trend: 12,
      color: 'text-brand',
      bg: 'bg-brand-soft',
    },
    {
      label: 'Сообщения',
      value: data?.messages ?? 0,
      icon: MessagesSquare,
      trend: 8,
      color: 'text-success',
      bg: 'bg-success-soft',
    },
    {
      label: 'Агенты',
      value: data?.agents ?? 0,
      icon: Bot,
      trend: -2,
      color: 'text-warning',
      bg: 'bg-warning-soft',
    },
    {
      label: 'Клиенты',
      value: data?.customers ?? 0,
      icon: Users,
      trend: 24,
      color: 'text-sky-blue',
      bg: 'bg-sky-blue/10',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]" role="status">
        <Loader2 className="w-8 h-8 text-brand animate-spin" aria-hidden="true" />
        <span className="sr-only">Загрузка аналитики...</span>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto" data-testid="analytics-dashboard">
      <motion.div variants={container} initial="hidden" animate="show" className="mb-8">
        <motion.div variants={item}>
          <p className="text-[11px] font-semibold uppercase tracking-label text-brand mb-2">Аналитика</p>
          <h1 className="font-display font-bold text-3xl text-text tracking-tight">Аналитика</h1>
          <p className="text-text-muted mt-1 text-sm">Обзор ключевых метрик и активности.</p>
        </motion.div>
      </motion.div>

      {error && (
        <motion.div variants={item} className="mb-6 p-4 rounded-2xl bg-danger-soft border border-danger-soft text-danger text-sm">
          {error}
        </motion.div>
      )}

      {/* Metric Cards */}
      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {metrics.map((m) => {
          const Icon = m.icon;
          const isPositive = m.trend >= 0;
          return (
            <motion.div
              key={m.label}
              variants={item}
              data-testid="metric-card"
              className="bg-surface rounded-2xl border border-border shadow-sm p-6 group hover:shadow-md transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-11 h-11 rounded-xl ${m.bg} flex items-center justify-center ring-1 ring-border/60`}>
                  <Icon className={`w-5 h-5 ${m.color}`} />
                </div>
                <div className={`flex items-center gap-1 text-[11px] font-semibold ${isPositive ? 'text-success' : 'text-danger'}`}>
                  {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {Math.abs(m.trend)}%
                </div>
              </div>
              <div className="font-mono font-bold text-2xl text-text tracking-tight">{m.value}</div>
              <p className="text-[11px] font-medium text-text-muted uppercase tracking-wider mt-1">{m.label}</p>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Tabs */}
      <motion.div variants={item} initial="hidden" animate="show" className="flex gap-1 mb-6 bg-surface rounded-xl border border-border p-1 shadow-sm overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('conversations')}
          data-testid="conversations-tab"
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1 ${
            activeTab === 'conversations'
              ? 'bg-accent text-white shadow-sm'
              : 'text-text-muted hover:text-text hover:bg-accent-soft'
          }`}
          role="tab"
          aria-selected={activeTab === 'conversations'}
        >
          <MessageSquare size={16} />
          Диалоги
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('agents')}
          data-testid="agents-tab"
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1 ${
            activeTab === 'agents'
              ? 'bg-accent text-white shadow-sm'
              : 'text-text-muted hover:text-text hover:bg-accent-soft'
          }`}
          role="tab"
          aria-selected={activeTab === 'agents'}
        >
          <Bot size={16} />
          Агенты
        </button>
      </motion.div>

      {/* Recent Activity */}
      <motion.div variants={container} initial="hidden" animate="show">
        <motion.div variants={item} className="bg-surface rounded-2xl border border-border shadow-sm p-6" data-testid="recent-activity">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-lg bg-accent-soft flex items-center justify-center ring-1 ring-border/60">
              <Activity className="w-[18px] h-[18px] text-brand" />
            </div>
            <div>
              <h3 className="font-semibold text-text">Последняя активность</h3>
              <p className="text-xs text-text-muted mt-0.5">Недавние события в системе</p>
            </div>
          </div>

          {data && data.recentActivity.length > 0 ? (
            <div className="space-y-3">
              {data.recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-accent-soft/50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-accent-soft flex items-center justify-center flex-shrink-0">
                    <Clock className="w-4 h-4 text-text-muted" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text truncate">{activity.description}</p>
                    <p className="text-xs text-text-muted">
                      {activity.type} · {new Date(activity.createdAt).toLocaleDateString('ru-RU')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-accent-soft flex items-center justify-center mb-4 ring-1 ring-border/60">
                <Activity className="w-7 h-7 text-text-muted" />
              </div>
              <p className="text-text-muted font-medium mb-1">Нет активности</p>
              <p className="text-text-muted text-sm max-w-xs">Здесь будет отображаться последняя активность системы.</p>
            </div>
          )}
        </motion.div>
      </motion.div>

      <div className="h-8" />
    </div>
  );
}
