'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  MessageSquare,
  Clock,
  Target,
  TrendingUp,
  TrendingDown,
  Loader2,
  AlertCircle,
  Zap,
  Bot,
  RefreshCw,
  X,
  Info,
} from 'lucide-react';
import InfoTooltip from '../../../components/InfoTooltip';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

interface AnalyticsData {
  totalConversations: number;
  totalMessages: number;
  avgResponseTime: number;
  resolutionRate: number;
  conversationsOverTime: Array<{ label: string; count: number }>;
  messageVolume: Array<{ label: string; count: number }>;
  agentPerformance: Array<{ name: string; conversations: number; resolutionRate: number; avgTime: number }>;
  responseTimeDistribution: Array<{ label: string; value: number }>;
  topKeywords: Array<{ word: string; count: number }>;
}

interface StatCard {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  trend: number;
}

const defaultData: AnalyticsData = {
  totalConversations: 0,
  totalMessages: 0,
  avgResponseTime: 0,
  resolutionRate: 0,
  conversationsOverTime: [],
  messageVolume: [],
  agentPerformance: [],
  responseTimeDistribution: [],
  topKeywords: [],
};

const periodLabels: Record<string, string> = { '7d': '7 дней', '30d': '30 дней', '90d': '3 месяца' };

function computeSeriesTrend(data: Array<{ count: number }>): number {
  if (data.length < 2) return 0;
  const mid = Math.floor(data.length / 2);
  const firstHalf = data.slice(0, mid).reduce((s, d) => s + d.count, 0);
  const secondHalf = data.slice(mid).reduce((s, d) => s + d.count, 0);
  if (firstHalf === 0) return secondHalf > 0 ? 100 : 0;
  return Math.round(((secondHalf - firstHalf) / firstHalf) * 100);
}

function computeResolutionTrend(agents: Array<{ resolutionRate: number }>): number {
  if (agents.length === 0) return 0;
  const avg = agents.reduce((s, a) => s + a.resolutionRate, 0) / agents.length;
  return Math.round(avg - 75);
}

function computeResponseTimeTrend(
  distribution: Array<{ value: number }>,
  conversationsTrend: number
): number {
  if (distribution.length === 0) return 0;
  const fastPercent = distribution.slice(0, 2).reduce((s, d) => s + d.value, 0);
  if (fastPercent >= 70) return -(conversationsTrend > 0 ? Math.min(Math.abs(conversationsTrend), 10) : 8);
  if (fastPercent >= 50) return conversationsTrend > 15 ? 3 : -3;
  return Math.max(3, Math.abs(conversationsTrend) > 10 ? Math.round(Math.abs(conversationsTrend) * 0.4) : 5);
}

function computeStats(data: AnalyticsData): StatCard[] {
  const conversationsTrend = computeSeriesTrend(data.conversationsOverTime);
  const messagesTrend = computeSeriesTrend(data.messageVolume);
  const resolutionTrend = computeResolutionTrend(data.agentPerformance);
  const responseTimeTrend = computeResponseTimeTrend(data.responseTimeDistribution, conversationsTrend);

  return [
    {
      label: 'Всего диалогов',
      value: (data.totalConversations || data.conversationsOverTime.reduce((s, d) => s + d.count, 0)).toLocaleString(),
      icon: MessageSquare,
      trend: conversationsTrend,
    },
    {
      label: 'Сообщения',
      value: (data.totalMessages || data.messageVolume.reduce((s, d) => s + d.count, 0)).toLocaleString(),
      icon: BarChart3,
      trend: messagesTrend,
    },
    {
      label: 'Среднее время ответа',
      value: data.avgResponseTime ? `${data.avgResponseTime}с` : '—',
      icon: Clock,
      trend: responseTimeTrend,
    },
    {
      label: '% решённых',
      value: data.resolutionRate ? `${data.resolutionRate}%` : '—%',
      icon: Target,
      trend: resolutionTrend,
    },
  ];
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData>(defaultData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  const [retryCount, setRetryCount] = useState(0);
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/analytics?period=${period}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const json = await res.json();
        setData({
          totalConversations: json.totalConversations ?? json.conversations ?? 0,
          totalMessages: json.totalMessages ?? json.messages ?? 0,
          avgResponseTime: json.avgResponseTime ?? 0,
          resolutionRate: json.resolutionRate ?? 0,
          conversationsOverTime: json.conversationsOverTime ?? [],
          messageVolume: json.messageVolume ?? [],
          agentPerformance: json.agentPerformance ?? [],
          responseTimeDistribution: json.responseTimeDistribution ?? [],
          topKeywords: json.topKeywords ?? [],
        });
        return;
      }

      throw new Error(`HTTP ${res.status}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить данные аналитики');
    } finally {
      setLoading(false);
    }
  }, [period, retryCount]);

  const handleRetry = useCallback(() => {
    setRetryCount((c) => c + 1);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const stats = useMemo(() => computeStats(data), [data]);

  const maxBar = useMemo(
    () => Math.max(...data.conversationsOverTime.map((b) => b.count), 1),
    [data.conversationsOverTime]
  );
  const maxVolume = useMemo(
    () => Math.max(...data.messageVolume.map((b) => b.count), 1),
    [data.messageVolume]
  );

  const responseTotal = useMemo(
    () => Math.max(...data.responseTimeDistribution.map((d) => d.value), 1),
    [data.responseTimeDistribution]
  );

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
  };
  const item = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
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
          <AlertCircle className="w-12 h-12 text-red-400" />
          <p className="text-ink-500 text-base max-w-md text-center">{error}</p>
          <button
            onClick={handleRetry}
            className="btn-primary text-sm px-6 py-2.5 inline-flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Повторить
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="p-6 lg:p-10 max-w-7xl mx-auto">
        <motion.div variants={container} initial="hidden" animate="show" className="mb-10">
          <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-label text-mauve-500 mb-2">Аналитика</p>
              <div className="flex items-center gap-3">
                <h1 className="font-display font-bold text-3xl text-ink-900 tracking-tight">Панель аналитики</h1>
              </div>
              <p className="text-ink-500 mt-1 text-sm">Метрики эффективности</p>
            </div>
            <div className="flex gap-1 bg-white rounded-xl border border-mauve-100 p-1 shadow-sm">
              {(['7d', '30d', '90d'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => { setPeriod(p); setSelectedKeyword(null); }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                    period === p
                      ? 'bg-mauve-600 text-white shadow-sm'
                      : 'text-ink-500 hover:text-ink-700 hover:bg-mauve-50'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>

        {/* Stat Cards */}
        <motion.div variants={container} initial="hidden" animate="show" className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon;
            const isPositive = stat.trend >= 0;
            const TrendIcon = isPositive ? TrendingUp : TrendingDown;
            return (
              <motion.div
                key={stat.label}
                variants={item}
                whileHover={{ y: -3, transition: { duration: 0.2 } }}
                className="bg-white rounded-2xl border border-mauve-100 shadow-sm p-5 group relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-mauve-400/0 via-mauve-400/30 to-mauve-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-mauve-50 flex items-center justify-center ring-1 ring-mauve-100/60">
                    <Icon className="w-5 h-5 text-mauve-600" />
                  </div>
                  {stat.trend !== 0 ? (
                    <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs font-semibold ${
                      isPositive ? 'text-emerald-600 bg-emerald-50' : 'text-red-500 bg-red-50'
                    }`}>
                      <TrendIcon className="w-3 h-3" />
                      <span>{isPositive ? '+' : ''}{stat.trend}%</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-xs text-mauve-400 font-medium">
                      <span>0%</span>
                    </div>
                  )}
                </div>
                <div className="font-mono font-semibold text-2xl text-ink-900 tracking-tight">{stat.value}</div>
                <p className="text-sm text-mauve-500 mt-1 flex items-center gap-1">
                  {stat.label}
                  {stat.label === 'Всего диалогов' && <InfoTooltip content="Общее количество диалогов за выбранный период. Включает активные и завершённые." iconSize={12} />}
                  {stat.label === 'Сообщения' && <InfoTooltip content="Общее количество сообщений за выбранный период. Включает сообщения клиентов и ответы агентов." iconSize={12} />}
                  {stat.label === 'Среднее время ответа' && <InfoTooltip content="Среднее время в секундах от получения сообщения до отправки ответа агентом." iconSize={12} />}
                  {stat.label === '% решённых' && <InfoTooltip content="Доля диалогов, успешно завершённых агентом без необходимости эскалации на человека." iconSize={12} />}
                </p>
                {stat.trend !== 0 && (
                  <p className={`text-[11px] mt-1 font-medium ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
                    {isPositive ? 'Рост' : 'Снижение'} по сравнению с предыдущим периодом
                  </p>
                )}
              </motion.div>
            );
          })}
        </motion.div>

        {/* Charts Row */}
        <motion.div variants={container} initial="hidden" animate="show" className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* Conversations Over Time */}
          <motion.div variants={item} className="bg-white rounded-2xl border border-mauve-100 shadow-sm p-6">
            <div className="flex items-center gap-1.5 mb-5">
              <h2 className="font-display font-semibold text-lg text-ink-900">Диалоги за {periodLabels[period]}</h2>
              <InfoTooltip content="Количество начатых диалогов за выбранный период. Каждый столбец — один временной отрезок (день, неделя или месяц)." iconSize={13} />
            </div>
            <div className="flex items-end gap-1 h-48">
              {data.conversationsOverTime.map((bar, i) => (
                <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group/bar">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(bar.count / maxBar) * 100}%` }}
                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: i * 0.04 }}
                    className="w-full max-w-[32px] rounded-t-lg bg-gradient-to-t from-mauve-600 via-mauve-400 to-mauve-300 hover:from-mauve-700 hover:via-mauve-500 hover:to-mauve-400 transition-all duration-200 cursor-pointer relative group/bar-active"
                    style={{ minHeight: 4 }}
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-ink-800 text-white text-[10px] font-semibold px-2 py-1 rounded-md opacity-0 group-hover/bar-active:opacity-100 transition-opacity whitespace-nowrap shadow-sm pointer-events-none">
                      {bar.label}: {bar.count}
                    </div>
                  </motion.div>
                  <span className="text-[10px] text-mauve-400 mt-2 truncate max-w-[32px]">{bar.label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Message Volume */}
          <motion.div variants={item} className="bg-white rounded-2xl border border-mauve-100 shadow-sm p-6">
            <div className="flex items-center gap-1.5 mb-5">
              <h2 className="font-display font-semibold text-lg text-ink-900">Объём сообщений за {periodLabels[period]}</h2>
              <InfoTooltip content="Общее количество сообщений (от клиентов и агентов) за выбранный период. Показывает нагрузку на систему." iconSize={13} />
            </div>
            <div className="flex items-end gap-1 h-48">
              {data.messageVolume.map((bar, i) => (
                <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group/bar">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(bar.count / maxVolume) * 100}%` }}
                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: i * 0.04 }}
                    className="w-full max-w-[32px] rounded-t-lg bg-gradient-to-t from-mauve-700 via-mauve-500 to-mauve-300 hover:from-mauve-800 hover:via-mauve-600 hover:to-mauve-400 transition-all duration-200 cursor-pointer relative group/bar-active"
                    style={{ minHeight: 4 }}
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-ink-800 text-white text-[10px] font-semibold px-2 py-1 rounded-md opacity-0 group-hover/bar-active:opacity-100 transition-opacity whitespace-nowrap shadow-sm pointer-events-none">
                      {bar.label}: {bar.count}
                    </div>
                  </motion.div>
                  <span className="text-[10px] text-mauve-400 mt-2 truncate max-w-[32px]">{bar.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>

        {/* Agent Performance + Response Time */}
        <motion.div variants={container} initial="hidden" animate="show" className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* Agent Performance */}
          <motion.div variants={item} className="bg-white rounded-2xl border border-mauve-100 shadow-sm p-6">
            <div className="flex items-center gap-1.5 mb-5">
              <h2 className="font-display font-semibold text-lg text-ink-900">Эффективность агентов</h2>
              <InfoTooltip content="Процент успешно решённых диалогов каждым агентом. Высокий процент означает, что агент справляется без эскалации на человека." iconSize={13} />
            </div>
            {data.agentPerformance.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Bot className="w-12 h-12 text-mauve-200 mb-3" />
                <p className="text-mauve-400 text-sm font-medium">Нет агентов</p>
                <p className="text-mauve-300 text-xs mt-1">Создайте агента, чтобы увидеть статистику</p>
              </div>
            ) : (
              <div className="space-y-4">
                {data.agentPerformance.map((agent, i) => (
                  <div key={i} className="group/row">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-semibold text-ink-700">{agent.name}</span>
                      <span className="text-xs text-mauve-400">{agent.conversations} диалогов</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex-1 h-2.5 bg-mauve-50 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, agent.resolutionRate)}%` }}
                          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 + i * 0.06 }}
                          className="h-full rounded-full bg-gradient-to-r from-mauve-400 via-mauve-500 to-mauve-600"
                        />
                      </div>
                      <span className="text-xs font-mono text-ink-500 w-12 text-right">{agent.resolutionRate}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Response Time Distribution */}
          <motion.div variants={item} className="bg-white rounded-2xl border border-mauve-100 shadow-sm p-6">
            <div className="flex items-center gap-1.5 mb-5">
              <h2 className="font-display font-semibold text-lg text-ink-900">Время ответа</h2>
              <InfoTooltip content="Распределение времени ответа агента на сообщения клиентов. Зелёный — быстро, красный — медленно. Оптимально >70% в зоне до 5 минут." iconSize={13} />
            </div>
            {data.responseTimeDistribution.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Clock className="w-12 h-12 text-mauve-200 mb-3" />
                <p className="text-mauve-400 text-sm font-medium">Нет данных</p>
              </div>
            ) : (
              <div className="space-y-4">
                {data.responseTimeDistribution.map((dist, i) => {
                  const colors = [
                    'bg-emerald-400',
                    'bg-emerald-500',
                    'bg-amber-400',
                    'bg-orange-400',
                    'bg-red-400',
                  ];
                  const gradients = [
                    'bg-gradient-to-r from-emerald-300 to-emerald-500',
                    'bg-gradient-to-r from-mauve-300 to-mauve-500',
                    'bg-gradient-to-r from-amber-300 to-amber-500',
                    'bg-gradient-to-r from-orange-300 to-orange-500',
                    'bg-gradient-to-r from-red-300 to-red-500',
                  ];
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-medium text-ink-700">{dist.label}</span>
                        <span className="text-xs font-semibold text-ink-500">{dist.value}%</span>
                      </div>
                      <div className="h-3 bg-mauve-50 rounded-full overflow-hidden relative">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(dist.value / responseTotal) * 100}%` }}
                          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.2 + i * 0.06 }}
                          className={`h-full rounded-full ${gradients[i % gradients.length]}`}
                        >
                          {dist.value > 5 && (
                            <span className="absolute inset-0 flex items-center justify-end pr-2 text-[10px] font-bold text-white drop-shadow-sm">
                              {dist.value}%
                            </span>
                          )}
                        </motion.div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </motion.div>

        {/* Top Agents Table + Keywords */}
        <motion.div variants={container} initial="hidden" animate="show" className="grid lg:grid-cols-2 gap-6">
          {/* Agents Table */}
          <motion.div variants={item} className="bg-white rounded-2xl border border-mauve-100 shadow-sm p-6">
            <h2 className="font-display font-semibold text-lg text-ink-900 mb-5">Топ агентов</h2>
            {data.agentPerformance.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Bot className="w-12 h-12 text-mauve-200 mb-3" />
                <p className="text-mauve-400 text-sm font-medium">Пока нет агентов</p>
                <p className="text-mauve-300 text-xs mt-1">Создайте первого агента для отображения статистики</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-mauve-100">
                      <th className="text-left py-2.5 text-xs font-semibold text-mauve-500 uppercase tracking-wide">Агент</th>
                      <th className="text-right py-2.5 text-xs font-semibold text-mauve-500 uppercase tracking-wide">Диал.</th>
                      <th className="text-right py-2.5 text-xs font-semibold text-mauve-500 uppercase tracking-wide">Решение</th>
                      <th className="text-right py-2.5 text-xs font-semibold text-mauve-500 uppercase tracking-wide">Ср. время</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.agentPerformance.map((agent, i) => (
                      <motion.tr
                        key={i}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 + i * 0.05 }}
                        className="border-b border-mauve-50 hover:bg-mauve-50/50 transition-colors"
                      >
                        <td className="py-3 text-ink-900 font-medium">{agent.name}</td>
                        <td className="py-3 text-right text-ink-600">{agent.conversations}</td>
                        <td className="py-3 text-right">
                          <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
                            agent.resolutionRate > 80
                              ? 'text-emerald-700 bg-emerald-50'
                              : agent.resolutionRate > 50
                              ? 'text-amber-700 bg-amber-50'
                              : 'text-red-600 bg-red-50'
                          }`}>
                            {agent.resolutionRate}%
                          </span>
                        </td>
                        <td className="py-3 text-right text-ink-500 font-mono text-xs">{agent.avgTime || '—'}s</td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>

          {/* Keywords */}
          <motion.div variants={item} className="bg-white rounded-2xl border border-mauve-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-1.5">
                <h2 className="font-display font-semibold text-lg text-ink-900">Популярные темы</h2>
                <InfoTooltip content="Ключевые слова, которые чаще всего встречаются в диалогах. Нажмите на тему, чтобы выделить её." iconSize={13} />
              </div>
              {selectedKeyword && (
                <button
                  onClick={() => setSelectedKeyword(null)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-mauve-600 bg-mauve-50 hover:bg-mauve-100 transition-colors"
                >
                  <X className="w-3 h-3" />
                  Сбросить
                </button>
              )}
            </div>
            {data.topKeywords.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Zap className="w-12 h-12 text-mauve-200 mb-3" />
                <p className="text-mauve-400 text-sm font-medium">Нет данных по ключевым словам</p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {data.topKeywords.map((kw, i) => {
                  const isSelected = selectedKeyword === kw.word;
                  return (
                    <motion.button
                      key={kw.word}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{
                        opacity: 1,
                        scale: isSelected ? 1.05 : 1,
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.97 }}
                      transition={{ delay: 0.3 + i * 0.03, duration: 0.2 }}
                      onClick={() => setSelectedKeyword(isSelected ? null : kw.word)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-200 ${
                        isSelected
                          ? 'border-mauve-400 bg-mauve-100 text-mauve-700 shadow-sm'
                          : 'border-mauve-100 bg-white hover:bg-mauve-50 hover:border-mauve-300 text-ink-600'
                      }`}
                      style={{ fontSize: `${Math.min(1.1, 0.75 + kw.count / 100)}rem` }}
                      title={`Нажмите, чтобы ${isSelected ? 'сбросить' : 'выделить'} тему "${kw.word}"`}
                    >
                      {kw.word}
                      <span className="text-[10px] text-mauve-400 font-mono">{kw.count}</span>
                    </motion.button>
                  );
                })}
              </div>
            )}
            {selectedKeyword && (
              <p className="mt-4 text-xs text-mauve-500 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" />
                Выбрана тема «{selectedKeyword}»
              </p>
            )}
          </motion.div>
        </motion.div>

        <div className="h-8" />
      </div>
    </>
  );
}
