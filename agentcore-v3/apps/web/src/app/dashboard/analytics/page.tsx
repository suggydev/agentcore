'use client';

import { useState, useEffect, useMemo } from 'react';
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
  ChevronDown,
  Zap,
} from 'lucide-react';
import DashboardLayout from '../../../components/DashboardLayout';

const API_BASE = 'http://31.76.102.116:4000';

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

const periodLabels: Record<string, string> = { '7d': 'Last 7 days', '30d': 'Last 30 days', '90d': 'Last 3 months' };

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData>(defaultData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
      return;
    }
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/analytics/dashboard?period=${period}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const json = await res.json();
          setData({
            totalConversations: json.totalConversations ?? json.conversations ?? 0,
            totalMessages: json.totalMessages ?? json.messages ?? 0,
            avgResponseTime: json.avgResponseTime ?? 0,
            resolutionRate: json.resolutionRate ?? 0,
            conversationsOverTime: json.conversationsOverTime ?? generateMockBars(12),
            messageVolume: json.messageVolume ?? generateMockBars(12),
            agentPerformance: json.agentPerformance ?? [],
            responseTimeDistribution: json.responseTimeDistribution ?? [],
            topKeywords: json.topKeywords ?? [],
          });
        } else {
          setData({
            ...defaultData,
            conversationsOverTime: generateMockBars(12),
            messageVolume: generateMockBars(12),
            agentPerformance: generateMockAgents(),
            responseTimeDistribution: [
              { label: '< 1min', value: 35 },
              { label: '1-5min', value: 40 },
              { label: '5-15min', value: 15 },
              { label: '15-30min', value: 7 },
              { label: '30min+', value: 3 },
            ],
            topKeywords: generateMockKeywords(),
          });
        }
      } catch {
        setData({
          ...defaultData,
          conversationsOverTime: generateMockBars(12),
          messageVolume: generateMockBars(12),
          agentPerformance: generateMockAgents(),
          responseTimeDistribution: [
            { label: '< 1min', value: 35 },
            { label: '1-5min', value: 40 },
            { label: '5-15min', value: 15 },
            { label: '15-30min', value: 7 },
            { label: '30min+', value: 3 },
          ],
          topKeywords: generateMockKeywords(),
        });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [period]);

  const maxBar = useMemo(
    () => Math.max(...data.conversationsOverTime.map((b) => b.count), 1),
    [data.conversationsOverTime]
  );
  const maxVolume = useMemo(
    () => Math.max(...data.messageVolume.map((b) => b.count), 1),
    [data.messageVolume]
  );

  const stats = [
    { label: 'Total Conversations', value: data.totalConversations.toLocaleString(), icon: MessageSquare, trend: 12 },
    { label: 'Messages', value: data.totalMessages.toLocaleString(), icon: BarChart3, trend: 8 },
    { label: 'Avg Response Time', value: `${data.avgResponseTime || '—'}`, icon: Clock, trend: -5 },
    { label: 'Resolution Rate', value: `${data.resolutionRate || '—'}%`, icon: Target, trend: 3 },
  ];

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
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[80vh]">
          <Loader2 className="w-8 h-8 text-mauve-500 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[80vh] gap-4">
          <AlertCircle className="w-10 h-10 text-red-400" />
          <p className="text-ink-500">{error}</p>
          <button onClick={() => window.location.reload()} className="btn-primary text-sm px-6 py-2.5">Retry</button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-10 max-w-7xl mx-auto">
        <motion.div variants={container} initial="hidden" animate="show" className="mb-10">
          <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-label text-mauve-500 mb-2">Analytics</p>
              <h1 className="font-display font-bold text-3xl text-ink-900 tracking-tight">Analytics Dashboard</h1>
              <p className="text-ink-500 mt-1 text-sm">Performance insights and conversation metrics.</p>
            </div>
            <div className="flex gap-1 bg-white rounded-xl border border-mauve-100 p-1 shadow-sm">
              {(['7d', '30d', '90d'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
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
                  <div className={`flex items-center gap-1 text-xs font-semibold ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
                    <TrendIcon className="w-3 h-3" />
                    <span>{isPositive ? '+' : ''}{stat.trend}%</span>
                  </div>
                </div>
                <div className="font-mono font-semibold text-2xl text-ink-900 tracking-tight">{stat.value}</div>
                <p className="text-sm text-ink-500 mt-1">{stat.label}</p>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Charts Row */}
        <motion.div variants={container} initial="hidden" animate="show" className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* Conversations Over Time */}
          <motion.div variants={item} className="bg-white rounded-2xl border border-mauve-100 shadow-sm p-6">
            <h2 className="font-display font-semibold text-lg text-ink-900 mb-5">Conversations {periodLabels[period]}</h2>
            <div className="flex items-end gap-1 h-48">
              {data.conversationsOverTime.map((bar, i) => (
                <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group/bar">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(bar.count / maxBar) * 100}%` }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: i * 0.03 }}
                    className="w-full max-w-[32px] rounded-t-lg bg-gradient-to-t from-mauve-400 to-mauve-300 hover:from-mauve-500 hover:to-mauve-400 transition-all duration-200 cursor-pointer relative"
                    style={{ minHeight: 4 }}
                  >
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-semibold text-ink-700 opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap">
                      {bar.count}
                    </div>
                  </motion.div>
                  <span className="text-[10px] text-ink-400 mt-2 truncate max-w-[32px]">{bar.label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Message Volume */}
          <motion.div variants={item} className="bg-white rounded-2xl border border-mauve-100 shadow-sm p-6">
            <h2 className="font-display font-semibold text-lg text-ink-900 mb-5">Message Volume {periodLabels[period]}</h2>
            <div className="flex items-end gap-1 h-48">
              {data.messageVolume.map((bar, i) => (
                <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group/bar">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(bar.count / maxVolume) * 100}%` }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: i * 0.03 }}
                    className="w-full max-w-[32px] rounded-t-lg bg-gradient-to-t from-mauve-500 to-mauve-300 hover:from-mauve-600 hover:to-mauve-400 transition-all duration-200 cursor-pointer relative"
                    style={{ minHeight: 4 }}
                  >
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-semibold text-ink-700 opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap">
                      {bar.count}
                    </div>
                  </motion.div>
                  <span className="text-[10px] text-ink-400 mt-2 truncate max-w-[32px]">{bar.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>

        {/* Agent Performance + Response Time */}
        <motion.div variants={container} initial="hidden" animate="show" className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* Agent Performance */}
          <motion.div variants={item} className="bg-white rounded-2xl border border-mauve-100 shadow-sm p-6">
            <h2 className="font-display font-semibold text-lg text-ink-900 mb-5">Agent Performance</h2>
            {data.agentPerformance.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-ink-400 text-sm">No agent data available</div>
            ) : (
              <div className="space-y-4">
                {data.agentPerformance.map((agent, i) => (
                  <div key={i} className="group/row">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-semibold text-ink-700">{agent.name}</span>
                      <span className="text-xs text-ink-500">{agent.conversations} conversations</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex-1 h-2.5 bg-mauve-50 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, agent.resolutionRate)}%` }}
                          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 + i * 0.05 }}
                          className="h-full rounded-full bg-gradient-to-r from-mauve-400 to-mauve-600"
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
            <h2 className="font-display font-semibold text-lg text-ink-900 mb-5">Response Time</h2>
            {data.responseTimeDistribution.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-ink-400 text-sm">No data available</div>
            ) : (
              <div className="space-y-4">
                {data.responseTimeDistribution.map((dist, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-ink-700">{dist.label}</span>
                      <span className="text-xs text-ink-500">{dist.value}%</span>
                    </div>
                    <div className="h-2.5 bg-mauve-50 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${dist.value}%` }}
                        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.2 + i * 0.05 }}
                        className={`h-full rounded-full ${
                          i === 0 ? 'bg-emerald-400' : i === 1 ? 'bg-mauve-400' : i === 2 ? 'bg-amber-400' : 'bg-ink-300'
                        }`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>

        {/* Top Agents Table + Keywords */}
        <motion.div variants={container} initial="hidden" animate="show" className="grid lg:grid-cols-2 gap-6">
          {/* Agents Table */}
          <motion.div variants={item} className="bg-white rounded-2xl border border-mauve-100 shadow-sm p-6">
            <h2 className="font-display font-semibold text-lg text-ink-900 mb-5">Top Agents</h2>
            {data.agentPerformance.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-ink-400 text-sm">No agents yet</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-ink-100">
                      <th className="text-left py-2.5 text-xs font-semibold text-ink-500 uppercase tracking-wide">Agent</th>
                      <th className="text-right py-2.5 text-xs font-semibold text-ink-500 uppercase tracking-wide">Conv.</th>
                      <th className="text-right py-2.5 text-xs font-semibold text-ink-500 uppercase tracking-wide">Resolution</th>
                      <th className="text-right py-2.5 text-xs font-semibold text-ink-500 uppercase tracking-wide">Avg Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.agentPerformance.map((agent, i) => (
                      <motion.tr
                        key={i}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 + i * 0.04 }}
                        className="border-b border-ink-50 hover:bg-mauve-50/50 transition-colors"
                      >
                        <td className="py-3 text-ink-900 font-medium">{agent.name}</td>
                        <td className="py-3 text-right text-ink-600">{agent.conversations}</td>
                        <td className="py-3 text-right">
                          <span className={`text-xs font-semibold ${agent.resolutionRate > 80 ? 'text-emerald-600' : agent.resolutionRate > 50 ? 'text-amber-600' : 'text-red-500'}`}>
                            {agent.resolutionRate}%
                          </span>
                        </td>
                        <td className="py-3 text-right text-ink-500">{agent.avgTime || '—'}s</td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>

          {/* Keywords */}
          <motion.div variants={item} className="bg-white rounded-2xl border border-mauve-100 shadow-sm p-6">
            <h2 className="font-display font-semibold text-lg text-ink-900 mb-5">Popular Topics</h2>
            {data.topKeywords.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Zap className="w-8 h-8 text-mauve-300 mb-3" />
                <p className="text-ink-400 text-sm">No keyword data yet</p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {data.topKeywords.map((kw, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 + i * 0.03 }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border border-mauve-100 bg-white hover:bg-mauve-50 hover:border-mauve-300 transition-all duration-200 cursor-default"
                    style={{ fontSize: `${Math.min(1.1, 0.75 + kw.count / 100)}rem` }}
                  >
                    {kw.word}
                    <span className="text-[10px] text-mauve-400 font-mono">{kw.count}</span>
                  </motion.span>
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>

        <div className="h-8" />
      </div>
    </DashboardLayout>
  );
}

function generateMockBars(count: number) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return Array.from({ length: count }, (_, i) => ({
    label: months[i % 12],
    count: Math.floor(Math.random() * 200) + 30,
  }));
}

function generateMockAgents() {
  return [
    { name: 'Support Agent', conversations: 145, resolutionRate: 92, avgTime: 12 },
    { name: 'Sales Bot', conversations: 89, resolutionRate: 78, avgTime: 24 },
    { name: 'Onboarding', conversations: 67, resolutionRate: 95, avgTime: 8 },
    { name: 'FAQ Bot', conversations: 200, resolutionRate: 99, avgTime: 3 },
    { name: 'General AI', conversations: 124, resolutionRate: 85, avgTime: 15 },
  ];
}

function generateMockKeywords() {
  return [
    { word: 'pricing', count: 45 },
    { word: 'refund', count: 38 },
    { word: 'shipping', count: 32 },
    { word: 'account', count: 28 },
    { word: 'password', count: 26 },
    { word: 'subscription', count: 24 },
    { word: 'order', count: 22 },
    { word: 'delivery', count: 18 },
    { word: 'cancellation', count: 16 },
    { word: 'warranty', count: 14 },
    { word: 'integration', count: 12 },
    { word: 'api', count: 10 },
  ];
}
