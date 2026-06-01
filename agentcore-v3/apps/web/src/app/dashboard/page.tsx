'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  MessageSquare,
  Bot,
  Zap,
  Heart,
  Clock,
  ArrowRight,
  Plus,
  Brain,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Loader2,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import InfoTooltip from '../../components/InfoTooltip';

interface StatCard {
  label: string;
  value: number;
  trend: number;
  trendLabel: string;
  icon: React.ElementType;
}

interface Activity {
  id: string;
  title: string;
  agentName: string;
  lastMessage: string;
  updatedAt: string;
}

interface Agent {
  id: string;
  name: string;
  model: string;
  isActive: boolean;
  _count?: { messages: number };
}

interface TrialStatus {
  daysLeft: number;
  isTrialing: boolean;
  trialEndsAt: string;
}

interface DashboardData {
  conversations: number;
  messages: number;
  agents: number;
  customers: number;
  recentActivity: Array<{
    id: string;
    conversationTitle: string;
    content: string;
    role: string;
    createdAt: string;
  }>;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [trialStatus, setTrialStatus] = useState<TrialStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (!token) {
      window.location.href = '/login';
      return;
    }
    if (userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch {}
    }

    const load = async () => {
      try {
        const [dashRes, agentsRes, trialRes] = await Promise.all([
          fetch(`${API_BASE}/api/analytics/dashboard`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE}/api/agents`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE}/api/billing/trial-status`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (dashRes.ok) setDashboardData(await dashRes.json());
        if (agentsRes.ok) {
          const agentsData = await agentsRes.json();
          setAgents(Array.isArray(agentsData) ? agentsData : (agentsData?.data || []));
        }
        if (trialRes.ok) setTrialStatus(await trialRes.json());
      } catch {
        setError('Не удалось загрузить данные дашборда. Попробуйте снова.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Только что';
    if (mins < 60) return `${mins} мин. назад`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} ч. назад`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} дн. назад`;
    return new Date(dateStr).toLocaleDateString();
  };

      const parseActivity = (): Activity[] => {
        if (!dashboardData?.recentActivity) return [];
        return dashboardData.recentActivity.slice(0, 6).map((a) => ({
          id: a.id,
          title: a.conversationTitle || 'Без названия',
          agentName: a.role === 'assistant' ? 'Агент' : a.role === 'user' ? 'Клиент' : a.role,
          lastMessage: (a.content || '').slice(0, 80) + (a.content?.length > 80 ? '...' : ''),
          updatedAt: a.createdAt,
        }));
      };

  const stats: StatCard[] = [
    {
      label: 'Всего диалогов',
      value: dashboardData?.conversations ?? 0,
      trend: 0,
      trendLabel: '',
      icon: MessageSquare,
    },
    {
      label: 'Активных агентов',
      value: agents.filter((a) => a.isActive).length,
      trend: 0,
      trendLabel: '',
      icon: Bot,
    },
    {
      label: 'Сообщений',
      value: dashboardData?.messages ?? 0,
      trend: 0,
      trendLabel: '',
      icon: Zap,
    },
    {
      label: 'Клиентов в CRM',
      value: dashboardData?.customers ?? 0,
      trend: 0,
      trendLabel: '',
      icon: Heart,
    },
  ];

  const topAgents = agents.slice(0, 4);

  const today = new Date();
  const dateStr = today.toLocaleDateString('ru-RU', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.1 },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
  };

  if (loading) {
    return (
      <>
        <div className="flex items-center justify-center min-h-[80vh]">
          <Loader2 className="w-8 h-8 text-mauve-500 animate-spin" />
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <div className="flex flex-col items-center justify-center min-h-[80vh] gap-4">
          <AlertCircle className="w-10 h-10 text-red-400" />
          <p className="text-ink-500">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary text-sm px-6 py-2.5"
          >
            Повторить
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="p-6 lg:p-10 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="mb-10"
        >
          <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-label text-mauve-500 mb-2">
                {dateStr}
              </p>
              <h1 className="font-display font-bold text-3xl text-ink-900 tracking-tight">
                С возвращением{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
              </h1>
              <p className="text-ink-500 mt-1 text-sm">
                Вот что происходит в вашем workspace сегодня.
              </p>
            </div>

            {trialStatus?.isTrialing && (
              <div className="flex-shrink-0 flex items-center gap-2">
                <div className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all duration-300 ${
                  trialStatus.daysLeft <= 3
                    ? 'bg-red-50 border-red-200 text-red-700'
                    : trialStatus.daysLeft <= 7
                    ? 'bg-amber-50 border-amber-200 text-amber-700'
                    : 'bg-mauve-50 border-mauve-200 text-mauve-700'
                }`}>
                  <Sparkles className={`w-4 h-4 ${
                    trialStatus.daysLeft <= 3 ? 'text-red-500' : 'text-mauve-500'
                  }`} />
                  <span>
                    Пробный — <strong>{trialStatus.daysLeft}</strong> дн. осталось
                  </span>
                </div>
                <InfoTooltip content="Пробный период даёт полный доступ ко всем функциям Pro. После окончания триала потребуется оформить подписку." />
              </div>
            )}
          </motion.div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10"
        >
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            const isPositive = stat.trend >= 0;
            const TrendIcon = isPositive ? TrendingUp : TrendingDown;
            return (
              <motion.div
                key={stat.label}
                variants={item}
                whileHover={{ y: -4, transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] } }}
                className="relative bg-white rounded-2xl border border-mauve-100 shadow-sm hover:shadow-md transition-shadow duration-300 p-5 overflow-hidden group"
              >
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-mauve-400/0 via-mauve-400/30 to-mauve-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-mauve-50 flex items-center justify-center ring-1 ring-mauve-100/60">
                    <Icon className="w-5 h-5 text-mauve-600" />
                  </div>
                  {stat.trend !== 0 && (
                    <div className={`flex items-center gap-1 text-xs font-semibold ${
                      isPositive ? 'text-emerald-600' : 'text-red-500'
                    }`}>
                      <TrendIcon className="w-3 h-3" />
                      <span>{isPositive ? '+' : ''}{stat.trend}%</span>
                    </div>
                  )}
                </div>
                <div className="font-mono font-semibold text-2xl text-ink-900 tracking-tight tabular-nums">
                  {stat.value.toLocaleString()}
                </div>
                <p className="text-sm text-ink-500 mt-1 flex items-center gap-1">
                  {stat.label}
                  {stat.label === 'Всего диалогов' && (
                    <InfoTooltip content="Общее количество диалогов между клиентами и агентами за всё время." />
                  )}
                  {stat.label === 'Активных агентов' && (
                    <InfoTooltip content="Количество агентов, которые сейчас активны и готовы отвечать на сообщения." />
                  )}
                  {stat.label === 'Сообщений' && (
                    <InfoTooltip content="Общее количество сообщений, отправленных агентами за всё время." />
                  )}
                  {stat.label === 'Клиентов в CRM' && (
                    <InfoTooltip content="Общее количество контактов в CRM, собранных агентами." />
                  )}
                </p>
                <p className="text-[11px] text-ink-400 mt-0.5">{stat.trendLabel}</p>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Recent Activity + Sidebar */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid lg:grid-cols-3 gap-6 mb-10"
        >
          {/* Recent Activity */}
          <motion.div
            variants={item}
            className="lg:col-span-2 bg-white rounded-2xl border border-mauve-100 shadow-sm p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display font-semibold text-lg text-ink-900">Последняя активность</h2>
              <a
                href="/dashboard/conversations"
                className="flex items-center gap-1 text-sm text-mauve-500 hover:text-mauve-600 transition-colors font-medium"
              >
                Смотреть все <ChevronRight className="w-4 h-4" />
              </a>
            </div>

            {parseActivity().length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-14 h-14 rounded-2xl bg-mauve-50 flex items-center justify-center mb-4 ring-1 ring-mauve-100/60">
                  <MessageSquare className="w-6 h-6 text-mauve-400" />
                </div>
                <p className="text-ink-500 font-medium mb-1">Пока нет диалогов</p>
                <p className="text-ink-400 text-sm mb-4">Начните первый диалог, чтобы увидеть активность здесь.</p>
                <a
                  href="/chat"
                  className="inline-flex items-center gap-2 btn-primary text-sm px-5 py-2.5"
                >
                  <Plus className="w-4 h-4" />
                  Новый диалог
                </a>
              </div>
            ) : (
              <div className="divide-y divide-ink-100">
                {parseActivity().map((activity, i) => (
                  <motion.a
                    key={activity.id}
                    href={`/chat?id=${activity.id}`}
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="flex items-start gap-4 px-2 py-3.5 -mx-2 rounded-xl hover:bg-mauve-50/80 transition-colors duration-200 group"
                  >
                    <div className="w-9 h-9 rounded-lg bg-mauve-50 flex items-center justify-center flex-shrink-0 ring-1 ring-mauve-100/60 group-hover:ring-mauve-200 transition-all duration-200">
                      <MessageSquare className="w-4 h-4 text-mauve-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-ink-900 truncate">{activity.title}</p>
                        <p className="text-xs text-ink-400 flex-shrink-0 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTimeAgo(activity.updatedAt)}
                        </p>
                      </div>
                      <p className="text-sm text-ink-500 truncate mt-0.5">{activity.lastMessage}</p>
                      <p className="text-xs text-mauve-500 mt-1 font-medium">{activity.agentName}</p>
                    </div>
                  </motion.a>
                ))}
              </div>
            )}
          </motion.div>

          {/* Sidebar */}
          <motion.div variants={item} className="flex flex-col gap-4">
            {/* Quick Actions */}
            <div className="bg-white rounded-2xl border border-mauve-100 shadow-sm p-5">
                <div className="flex items-center gap-1.5 mb-4">
                  <h2 className="font-display font-semibold text-lg text-ink-900">Быстрые действия</h2>
                  <InfoTooltip content="Быстрые действия для создания агентов, начала диалогов и просмотра карты мозга." />
                </div>
              <div className="space-y-2.5">
                <a
                  href="/dashboard/agents"
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-mauve-600 text-white hover:bg-mauve-700 transition-all duration-200 text-sm font-semibold group shadow-sm shadow-mauve-600/10 hover:shadow-md hover:shadow-mauve-600/20"
                >
                  <Plus className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                  <span>Создать агента</span>
                </a>
                <a
                  href="/chat"
                  className="flex items-center gap-3 px-4 py-3 rounded-xl border border-ink-200 bg-white text-ink-700 hover:bg-mauve-50 hover:border-mauve-300 transition-all duration-200 text-sm font-medium group"
                >
                  <MessageSquare className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                  <span>Новый диалог</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-auto text-ink-300 group-hover:text-mauve-400 group-hover:translate-x-0.5 transition-all duration-200" />
                </a>
                <a
                  href="/dashboard/brain-map"
                  className="flex items-center gap-3 px-4 py-3 rounded-xl border border-ink-200 bg-white text-ink-700 hover:bg-mauve-50 hover:border-mauve-300 transition-all duration-200 text-sm font-medium group"
                >
                  <Brain className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                  <span>Brain Map</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-auto text-ink-300 group-hover:text-mauve-400 group-hover:translate-x-0.5 transition-all duration-200" />
                </a>
              </div>
            </div>

            {/* Trial Status */}
            {trialStatus?.isTrialing && (
              <div className={`rounded-2xl border shadow-sm p-5 ${
                trialStatus.daysLeft <= 3
                  ? 'bg-red-50/60 border-red-200'
                  : trialStatus.daysLeft <= 7
                  ? 'bg-amber-50/60 border-amber-200'
                  : 'bg-mauve-50/60 border-mauve-200'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-display font-semibold text-sm text-ink-900">Пробный</h3>
                  <Sparkles className={`w-4 h-4 ${
                    trialStatus.daysLeft <= 3 ? 'text-red-500' : 'text-mauve-500'
                  }`} />
                </div>
                <div className="font-mono font-bold text-2xl text-ink-900 tracking-tight">{trialStatus.daysLeft}</div>
                <p className="text-sm text-ink-500 mt-1">дней осталось</p>
                <div className="mt-3 w-full bg-white/60 rounded-full h-2.5 overflow-hidden relative">
                  <motion.div
                    className={`h-full rounded-full ${
                      trialStatus.daysLeft <= 3
                        ? 'bg-gradient-to-r from-red-400 to-red-500'
                        : trialStatus.daysLeft <= 7
                        ? 'bg-gradient-to-r from-amber-400 to-amber-500'
                        : 'bg-gradient-to-r from-mauve-400 to-mauve-600'
                    }`}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (trialStatus.daysLeft / 14) * 100)}%` }}
                    transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
                  />
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    initial={{ x: '-100%' }}
                    animate={{ x: '200%' }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
                  />
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>

        {/* Agents Section */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="bg-white rounded-2xl border border-mauve-100 shadow-sm p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display font-semibold text-lg text-ink-900">Агенты</h2>
            <a
              href="/dashboard/agents"
              className="flex items-center gap-1 text-sm text-mauve-500 hover:text-mauve-600 transition-colors font-medium"
            >
              Смотреть все <ChevronRight className="w-4 h-4" />
            </a>
          </div>

          {topAgents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-14 h-14 rounded-2xl bg-mauve-50 flex items-center justify-center mb-4 ring-1 ring-mauve-100/60">
                <Bot className="w-6 h-6 text-mauve-400" />
              </div>
              <p className="text-ink-500 font-medium mb-1">Агенты не настроены</p>
              <p className="text-ink-400 text-sm mb-4">Создайте первого AI-агента.</p>
              <a
                href="/dashboard/agents"
                className="inline-flex items-center gap-2 btn-primary text-sm px-5 py-2.5"
              >
                <Plus className="w-4 h-4" />
                Создать агента
              </a>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {topAgents.map((agent, i) => (
                <motion.a
                  key={agent.id}
                  href={`/dashboard/agents`}
                  variants={item}
                  custom={i}
                  whileHover={{ y: -3, transition: { duration: 0.2 } }}
                  className="p-4 rounded-xl border border-mauve-100 hover:border-mauve-300 hover:shadow-sm transition-all duration-300 group bg-white"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-mauve-500 to-mauve-300 flex items-center justify-center mb-3 group-hover:shadow-md group-hover:shadow-mauve-400/20 transition-shadow duration-300">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-ink-900 text-sm truncate">{agent.name}</h3>
                  <p className="text-xs text-ink-500 mt-0.5 truncate">{agent.model.split('/').pop() || agent.model}</p>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${
                        agent.isActive ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.4)]' : 'bg-ink-300'
                      }`} />
                      <span className="text-xs text-ink-500">{agent.isActive ? 'Активен' : 'Неактивен'}</span>
                    </div>
                    <span className="text-xs text-ink-400 font-medium">
                      {agent._count?.messages ?? 0} сообщ.
                    </span>
                  </div>
                </motion.a>
              ))}
            </div>
          )}
        </motion.div>

        {/* Bottom Spacer */}
        <div className="h-8" />
      </div>
    </>
  );
}
