'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bot, Plus, Brain, Sparkles, MessageSquare, ArrowRight, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

interface Agent {
  id: string; name: string; description: string | null; model: string;
  isActive: boolean; createdAt: string;
}
interface Stats {
  agents: number; conversations: number; messages: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [stats, setStats] = useState<Stats>({ agents: 0, conversations: 0, messages: 0 });
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState('');

  useEffect(() => {
    const t = localStorage.getItem('token');
    if (!t) { router.push('/login'); return; }
    setToken(t);

    Promise.all([
      fetch(`${API_BASE}/api/agents`, { headers: { Authorization: `Bearer ${t}` } }),
      fetch(`${API_BASE}/api/analytics`, { headers: { Authorization: `Bearer ${t}` } }),
    ]).then(async ([ar, sr]) => {
      if (ar.ok) { const d = await ar.json(); setAgents((Array.isArray(d) ? d : d.data || []).slice(0, 6)); }
      if (sr.ok) { const s = await sr.json(); setStats({ agents: s.agents || 0, conversations: s.conversations || 0, messages: s.messages || 0 }); }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-screen"><Loader2 className="w-8 h-8 text-mauve-500 animate-spin" /></div>;

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-8">
          <h1 className="text-2xl font-display font-bold text-ink-900">Панель управления</h1>
          <p className="text-ink-400 text-sm mt-1">Ваши AI-агенты и статистика</p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Агентов', value: stats.agents, icon: Bot, color: 'from-mauve-500 to-mauve-300' },
            { label: 'Диалогов', value: stats.conversations, icon: MessageSquare, color: 'from-blue-500 to-blue-300' },
            { label: 'Сообщений', value: stats.messages, icon: Sparkles, color: 'from-emerald-500 to-emerald-300' },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-white rounded-2xl border border-mauve-100 shadow-sm p-5">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center`}><s.icon className="w-5 h-5 text-white" /></div>
                <div><p className="text-2xl font-bold text-ink-900">{s.value}</p><p className="text-xs text-ink-400">{s.label}</p></div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Agents */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-ink-900">Ваши агенты</h2>
          <button onClick={() => router.push('/dashboard/agents')} className="text-xs text-mauve-600 hover:text-mauve-700 font-medium flex items-center gap-1">Все агенты <ArrowRight className="w-3 h-3" /></button>
        </div>

        {agents.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl border border-mauve-100 shadow-sm p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-mauve-500 to-mauve-300 flex items-center justify-center mx-auto mb-4"><Brain className="w-8 h-8 text-white" /></div>
            <h2 className="text-lg font-bold text-ink-900 mb-2">Создайте первого агента</h2>
            <p className="text-ink-400 text-sm mb-6 max-w-md mx-auto">AI-агенты обрабатывают запросы клиентов 24/7 — продают, консультируют, собирают заявки</p>
            <button onClick={() => router.push('/dashboard/agents?create=1')} className="btn-primary text-sm gap-2"><Plus className="w-4 h-4" /> Создать агента</button>
          </motion.div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map(agent => (
              <motion.div key={agent.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-mauve-100 shadow-sm p-5 group cursor-pointer hover:shadow-md hover:border-mauve-200 transition-all" onClick={() => router.push(`/dashboard/agents/${agent.id}`)}>
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-mauve-500 to-mauve-300 flex items-center justify-center flex-shrink-0"><Brain className="w-5 h-5 text-white" /></div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-ink-900 truncate">{agent.name}</h3>
                    <p className="text-xs text-ink-400 mt-0.5 line-clamp-1">{agent.description || 'Без описания'}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-ink-400 font-mono">{agent.model.split('/').pop()}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium ${agent.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-ink-100 text-ink-500'}`}>{agent.isActive ? 'Активен' : 'Неактивен'}</span>
                </div>
              </motion.div>
            ))}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl border border-dashed border-mauve-200 p-5 flex flex-col items-center justify-center text-center cursor-pointer hover:border-mauve-300 hover:bg-mauve-50/30 transition-all min-h-[120px]" onClick={() => router.push('/dashboard/agents?create=1')}>
              <Plus className="w-6 h-6 text-mauve-400 mb-2" /><span className="text-sm text-mauve-500 font-medium">Создать агента</span>
            </motion.div>
          </div>
        )}

        {/* Quick links */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8">
          {[
            { label: 'Интеграции', href: '/dashboard/integrations' },
            { label: 'База знаний', href: '/dashboard/knowledge' },
            { label: 'Тарифы', href: '/dashboard/billing' },
            { label: 'Настройки', href: '/dashboard/settings' },
          ].map(l => (
            <button key={l.label} onClick={() => router.push(l.href)} className="text-xs font-medium text-ink-500 hover:text-ink-700 bg-white rounded-xl border border-mauve-100 py-3 px-4 hover:border-mauve-200 hover:shadow-sm transition-all text-center">{l.label}</button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
