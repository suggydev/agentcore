'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
 Plus, Loader2, Trash2, Brain, Wand2,
 Code, Cpu, Zap, ArrowLeft, Sparkles, FlaskConical,
 Bot, Check
} from 'lucide-react';
import { useAgentStore } from '../../../store/agentStore';
import { useRouter } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

interface Agent {
 id: string; name: string; description: string | null; model: string;
 systemPrompt: string; temperature: number; isActive: boolean; createdAt: string;
}

type ViewState = 'list' | 'create';

const INDUSTRIES = [
 'Технологии', 'Финансы', 'Медицина', 'E-commerce', 'Образование',
 'Недвижимость', 'Консалтинг', 'Производство', 'Ритейл', 'HoReCa',
 'Маркетинг', 'Логистика', 'Авто', 'Другое',
] as const;

const TONES = ['Дружелюбный', 'Профессиональный', 'Продающий', 'Формальный'] as const;

const INDUSTRY_KEYWORDS: Record<string, { industry: string; tone: string; name: string }> = {
 'магазин': { industry: 'Ритейл', tone: 'Продающий', name: 'Продавец-консультант' },
 'интернет-магазин': { industry: 'E-commerce', tone: 'Продающий', name: 'Онлайн-консультант' },
 'продаж': { industry: 'Ритейл', tone: 'Продающий', name: 'Менеджер продаж' },
 'поддержк': { industry: 'Технологии', tone: 'Дружелюбный', name: 'Специалист поддержки' },
 'клиент': { industry: 'Маркетинг', tone: 'Дружелюбный', name: 'Менеджер по клиентам' },
 'консульта': { industry: 'Консалтинг', tone: 'Профессиональный', name: 'Консультант' },
 'заказ': { industry: 'E-commerce', tone: 'Дружелюбный', name: 'Менеджер заказов' },
 'доставк': { industry: 'Логистика', tone: 'Дружелюбный', name: 'Координатор' },
 'отель': { industry: 'HoReCa', tone: 'Дружелюбный', name: 'Администратор' },
 'ресторан': { industry: 'HoReCa', tone: 'Дружелюбный', name: 'Хостес' },
 'медицин': { industry: 'Медицина', tone: 'Профессиональный', name: 'Мед. ассистент' },
 'недвижимость': { industry: 'Недвижимость', tone: 'Профессиональный', name: 'Риэлтор' },
 'авто': { industry: 'Авто', tone: 'Профессиональный', name: 'Автоконсультант' },
 'финанс': { industry: 'Финансы', tone: 'Формальный', name: 'Фин. ассистент' },
 'банк': { industry: 'Финансы', tone: 'Формальный', name: 'Банковский ассистент' },
 'образова': { industry: 'Образование', tone: 'Профессиональный', name: 'Учебный ассистент' },
 'сайт': { industry: 'Технологии', tone: 'Дружелюбный', name: 'Онлайн-помощник' },
 'чат': { industry: 'Технологии', tone: 'Дружелюбный', name: 'Чат-ассистент' },
 'юриди': { industry: 'Консалтинг', tone: 'Формальный', name: 'Юр. ассистент' },
};

function analyzeDescription(text: string) {
 const lower = text.toLowerCase();
 let industry = 'Другое', tone = 'Дружелюбный', name = 'AI-ассистент';
 for (const [kw, m] of Object.entries(INDUSTRY_KEYWORDS)) {
 if (lower.includes(kw)) { industry = m.industry; tone = m.tone; name = m.name; break; }
 }
 if (lower.includes('формальн') || lower.includes('строг')) tone = 'Формальный';
 const model = tone === 'Формальный' || tone === 'Профессиональный'
 ? 'accounts/fireworks/models/deepseek-v4-pro' : 'accounts/fireworks/models/glm-5p1';
 const temperature = tone === 'Формальный' ? 0.3 : tone === 'Дружелюбный' ? 0.8 : 0.7;
 return { name, industry, tone, model, temperature, task: text };
}

function generatePrompt(a: ReturnType<typeof analyzeDescription>, company: string): string {
 return `# РОЛЬ
Ты — ${a.name} компании ${company}. Сфера: ${a.industry}.

# ЗАДАЧА
${a.task}

# ТОН
${a.tone === 'Формальный' ? 'Формальный, деловой' : a.tone === 'Продающий' ? 'Продающий, энергичный' : a.tone === 'Профессиональный' ? 'Профессиональный, экспертный' : 'Дружелюбный, тёплый'}

# ПРАВИЛА
- Отвечай на русском языке
- Начинай с приветствия
- Уточняй потребности клиента
- Если не знаешь ответ — предложи связаться со специалистом`;
}

export default function AgentsPage() {
 const [view, setView] = useState<ViewState>('list');
 const [agents, setAgents] = useState<Agent[]>([]);
 const [loading, setLoading] = useState(true);
 const [token, setToken] = useState('');
 const store = useAgentStore();
 const router = useRouter();

 const [description, setDescription] = useState('');
 const [analyzing, setAnalyzing] = useState(false);
 const [analyzed, setAnalyzed] = useState(false);
 const [agentName, setAgentName] = useState('');
 const [industry, setIndustry] = useState('');
 const [task, setTask] = useState('');
 const [tone, setTone] = useState('');
 const [rules, setRules] = useState('');

 const [creating, setCreating] = useState(false);
 const [createStep, setCreateStep] = useState(0);
 const [createResult, setCreateResult] = useState<{ ok: boolean; id?: string } | null>(null);

 useEffect(() => {
 const t = localStorage.getItem('token');
 if (!t) { router.push('/login'); return; }
  setToken(t);
  fetch(`${API_BASE}/api/agents`, { headers: { Authorization: `Bearer ${t}` } }).then(r => r.json()).then(d => {
 setAgents(Array.isArray(d) ? d : (d?.data || []));
 }).catch(() => {}).finally(() => setLoading(false));
 }, []);

 const deleteAgent = async (id: string, e: React.MouseEvent) => {
 e.stopPropagation();
 await fetch(`${API_BASE}/api/agents/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
 setAgents(prev => prev.filter(a => a.id !== id));
 };

 const handleAIAnalyze = () => {
 if (!description.trim()) return;
 setAnalyzing(true);
 setTimeout(() => {
 const r = analyzeDescription(description.trim());
 setAgentName(r.name); setIndustry(r.industry); setTask(r.task); setTone(r.tone);
 setAnalyzed(true); setAnalyzing(false);
 }, 600);
 };

 const handleCreate = async () => {
 if (!token) return;
 setCreating(true); setCreateStep(1); setCreateResult(null);

 try {
 await new Promise(r => setTimeout(r, 400));
 setCreateStep(2);

 const name = agentName.trim() || 'AI-ассистент';
 const model = tone === 'Формальный' || tone === 'Профессиональный'
 ? 'accounts/fireworks/models/deepseek-v4-pro' : 'accounts/fireworks/models/glm-5p1';
 const temperature = tone === 'Формальный' ? 0.3 : tone === 'Дружелюбный' ? 0.8 : 0.7;
 const company = store.onboarding.workspace.companyName || 'Ваша компания';

 const res = await fetch(`${API_BASE}/api/agents`, {
 method: 'POST',
 headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
 body: JSON.stringify({
 name,
 description: (task || description).substring(0, 200),
 model,
 systemPrompt: generatePrompt(analyzeDescription(task || description), company),
 temperature,
 }),
 });

 if (res.ok) {
 const data = await res.json();
 setAgents(prev => [data, ...prev]);
 setCreateResult({ ok: true, id: data.id });
 setCreateStep(3);
 setTimeout(() => router.push(`/agents/${data.id}`), 1200);
 } else {
 setCreateResult({ ok: false });
 setCreateStep(0);
 }
 } catch {
 setCreateResult({ ok: false });
 setCreateStep(0);
 }
 };

 const openCreate = () => {
 setView('create');
 setDescription(''); setAgentName(''); setIndustry(''); setTask(''); setTone(''); setRules('');
 setAnalyzed(false); setCreateStep(0); setCreateResult(null);
 };

 const canCreate = agentName.trim() || description.trim();

 if (loading) return (
 <div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 text-[var(--brand)] animate-spin" /></div>
 );

 return (
 <div className="p-6 lg:p-10 max-w-6xl mx-auto">
 {/* Creation Progress Overlay */}
 <AnimatePresence>
 {creating && (
 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--accent-soft)]/90 backdrop-blur-sm">
 <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-surface rounded-3xl shadow-2xl p-10 max-w-sm mx-4 text-center">
 <div className="flex flex-col items-center gap-6">
 {createStep === 1 && (
 <>
 <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--brand)] to-[var(--brand)]/60 flex items-center justify-center">
 <Bot className="w-8 h-8 text-white" />
 </motion.div>
 <div><p className="font-bold text-[var(--text)] text-lg">Создаю агента</p><p className="text-[var(--text-muted)] text-sm mt-1">Настраиваю параметры...</p></div>
 <div className="w-full h-2 rounded-full bg-[var(--accent-soft)] overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: '40%' }} transition={{ duration: 1.5 }} className="h-full rounded-full bg-[var(--brand)]" /></div>
 </>
 )}
 {createStep === 2 && (
 <>
 <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }} className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--brand)] to-[var(--brand)]/60 flex items-center justify-center">
 <Brain className="w-8 h-8 text-white" />
 </motion.div>
 <div><p className="font-bold text-[var(--text)] text-lg">Настраиваю модель</p><p className="text-[var(--text-muted)] text-sm mt-1">{tone === 'Формальный' || tone === 'Профессиональный' ? 'deepseek-v4-pro' : 'glm-5p1'}</p></div>
 <div className="w-full h-2 rounded-full bg-[var(--accent-soft)] overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: '80%' }} transition={{ duration: 2 }} className="h-full rounded-full bg-[var(--brand)]" /></div>
 </>
 )}
 {createStep === 3 && createResult?.ok && (
 <>
 <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 12 }} className="w-16 h-16 rounded-2xl bg-[var(--success-soft)] flex items-center justify-center">
 <Check className="w-8 h-8 text-[var(--success)]" />
 </motion.div>
 <div><p className="font-bold text-[var(--text)] text-lg">Агент создан!</p><p className="text-[var(--text-muted)] text-sm mt-1">Открываю страницу агента...</p></div>
 <div className="w-full h-2 rounded-full bg-[var(--success-soft)] overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 0.5 }} className="h-full rounded-full bg-[var(--success)]" /></div>
 </>
 )}
 {createResult && !createResult.ok && (
 <>
 <div className="w-16 h-16 rounded-2xl bg-[var(--danger-soft)] flex items-center justify-center text-danger text-2xl font-bold">!</div>
 <div><p className="font-bold text-[var(--text)] text-lg">Ошибка</p><p className="text-[var(--text-muted)] text-sm mt-1">Попробуйте ещё раз</p></div>
 <button onClick={() => setCreating(false)} className="btn-primary text-sm">Закрыть</button>
 </>
 )}
 </div>
 </motion.div>
 </motion.div>
 )}
 </AnimatePresence>

 <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
 <div className="flex items-center justify-between mb-8">
 <div>
 <h1 className="text-2xl font-display font-bold text-[var(--text)]">{view === 'list' ? 'AI-агенты' : 'Новый агент'}</h1>
 <p className="text-[var(--text-muted)] text-sm mt-1">{view === 'list' ? 'Ваши цифровые сотрудники' : 'Опишите задачу — AI заполнит всё остальное'}</p>
 </div>
 {view === 'list' && <button onClick={openCreate} className="btn-primary text-sm gap-2"><Plus className="w-4 h-4" /> Создать</button>}
 {view === 'create' && <button onClick={() => setView('list')} className="btn-secondary text-sm gap-2"><ArrowLeft className="w-4 h-4" /> К списку</button>}
 </div>
 </motion.div>

 {view === 'list' && (
 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
 {agents.map(agent => (
 <motion.div key={agent.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-surface rounded-2xl border border-[var(--border)] shadow-sm p-5 group cursor-pointer hover:shadow-md hover:border-[var(--border)] transition-all" onClick={() => router.push(`/agents/${agent.id}`)}>
 <div className="flex items-start justify-between mb-3">
 <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--brand)] to-[var(--brand)]/60 flex items-center justify-center"><Brain className="w-5 h-5 text-white" /></div>
 <button onClick={(e: React.MouseEvent) => deleteAgent(agent.id, e)} className="p-1.5 rounded-lg hover:bg-danger-soft text-[var(--text-muted)] hover:text-danger transition-colors opacity-0 group-hover:opacity-100"><Trash2 className="w-3.5 h-3.5" /></button>
 </div>
 <h3 className="font-bold text-[var(--text)]">{agent.name}</h3>
 <p className="text-[var(--text-muted)] text-sm mt-1 line-clamp-2">{agent.description || 'Нет описания'}</p>
 <div className="flex items-center gap-2 mt-3 p-2.5 rounded-xl bg-gradient-to-r from-[var(--accent-soft)] to-[var(--surface)] border border-[var(--border)]">
 <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[var(--brand)] to-[var(--brand)]/60 flex items-center justify-center flex-shrink-0">
 {agent.model.includes('deepseek') ? <Code className="w-3.5 h-3.5 text-white" /> : agent.model.includes('kimi') ? <Zap className="w-3.5 h-3.5 text-white" /> : <Cpu className="w-3.5 h-3.5 text-white" />}
 </div>
 <div className="flex-1 min-w-0"><p className="text-xs text-[var(--text-muted)]">Модель</p><p className="text-sm font-bold text-[var(--text)] truncate">{agent.model.split('/').pop()}</p></div>
 </div>
 <span className={`inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-md font-semibold mt-2 ${agent.isActive ? 'bg-[var(--success-soft)] text-[var(--success)] ring-1 ring-[var(--success-soft)]' : 'bg-[var(--surface-2)] text-[var(--text-muted)] ring-1 ring-[var(--border)]'}`}>
 <span className={`w-1.5 h-1.5 rounded-full ${agent.isActive ? 'bg-[var(--success)] animate-pulse' : 'bg-[var(--text-muted)]'}`} />{agent.isActive ? 'Активен' : 'Неактивен'}
 </span>
 </motion.div>
 ))}
 {agents.length === 0 && (
 <div className="col-span-full text-center py-16"><Brain className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" /><p className="text-[var(--text-muted)] mb-4">Пока нет агентов</p><button onClick={openCreate} className="btn-primary text-sm"><Plus className="w-4 h-4 inline mr-1" />Создать</button></div>
 )}
 </motion.div>
 )}

 {view === 'create' && (
 <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto space-y-6">
 <div className="bg-gradient-to-br from-[var(--warning-soft)] to-[var(--warning-soft)] rounded-2xl border border-[var(--warning-soft)] shadow-sm p-6">
 <div className="flex items-center gap-2 mb-1"><div className="w-7 h-7 rounded-lg bg-[var(--warning-soft)] flex items-center justify-center"><FlaskConical className="w-4 h-4 text-[var(--warning)]" /></div><h2 className="font-semibold text-[var(--text)]">Быстрое создание</h2><span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--warning-soft)] text-[var(--warning)] font-medium">Beta</span></div>
 <p className="text-sm text-[var(--text-muted)] mb-4">Опишите задачу — AI заполнит имя, сферу и тон</p>
 <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Например: интернет-магазин одежды, нужен консультант для подбора размера" rows={3} maxLength={500} className="w-full px-4 py-3 rounded-xl border border-[var(--warning-soft)] bg-surface focus:ring-2 focus:ring-[var(--warning)]/30 focus:border-[var(--warning)] text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] outline-none resize-none" />
 <div className="flex items-center justify-between mt-2">
 <span className="text-[10px] text-[var(--text-muted)]">{description.length}/500</span>
 <button onClick={handleAIAnalyze} disabled={!description.trim() || analyzing} className="flex items-center gap-2 text-sm font-medium px-5 py-2.5 rounded-xl bg-[var(--warning)] text-white hover:bg-[var(--warning)] transition-colors disabled:opacity-40">{analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}{analyzing ? 'Анализ...' : 'Заполнить с помощью AI'}</button>
 </div>
 </div>

 <div className="bg-surface rounded-2xl border border-[var(--border)] shadow-sm p-6 space-y-5">
 <div className="flex items-center gap-2"><Brain className="w-5 h-5 text-[var(--brand)]" /><h2 className="font-semibold text-[var(--text)]">Параметры</h2><span className="text-[10px] text-[var(--text-muted)]">можно редактировать</span></div>
 <div><label className="block text-sm font-medium text-[var(--text)] mb-1.5">Имя агента</label><input type="text" value={agentName} onChange={e => setAgentName(e.target.value)} placeholder="Продавец-консультант" maxLength={50} className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--bg)] focus:ring-2 focus-visible:ring-[var(--brand)] focus-visible:border-[var(--brand)] text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] outline-none" /></div>
 <div><label className="block text-sm font-medium text-[var(--text)] mb-1.5">Сфера</label><select value={industry} onChange={e => setIndustry(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--bg)] focus:ring-2 focus-visible:ring-[var(--brand)] focus-visible:border-[var(--brand)] text-sm text-[var(--text)] outline-none appearance-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' fill=\'%23999\' viewBox=\'0 0 16 16\'%3E%3Cpath d=\'M8 11L3 6h10z\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 16px center', paddingRight: '40px' }}><option value="" disabled>Выберите сферу...</option>{INDUSTRIES.map(ind => <option key={ind} value={ind}>{ind}</option>)}</select></div>
 <div><label className="block text-sm font-medium text-[var(--text)] mb-1.5">Задача</label><textarea value={task} onChange={e => setTask(e.target.value)} placeholder="Что должен делать агент?" rows={3} maxLength={500} className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--bg)] focus:ring-2 focus-visible:ring-[var(--brand)] focus-visible:border-[var(--brand)] text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] outline-none resize-none" /></div>
 <div><label className="block text-sm font-medium text-[var(--text)] mb-1.5">Тон</label><div className="grid grid-cols-2 gap-2">{TONES.map(t => <button key={t} type="button" onClick={() => setTone(t)} className={`px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${tone === t ? 'border-[var(--brand)]/40 bg-[var(--accent-soft)] text-[var(--brand)] shadow-sm' : 'border-[var(--border)] bg-surface text-[var(--text)] hover:border-[var(--brand)]/30 hover:bg-[var(--accent-soft)]/50'}`}>{t}</button>)}</div></div>
 </div>

 <motion.div className="flex flex-col items-center gap-2">
 <button onClick={handleCreate} disabled={creating || !canCreate} className="btn-primary text-base px-10 py-3.5 gap-3 shadow-lg hover:shadow-xl disabled:opacity-40 disabled:cursor-not-allowed">
 {creating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}Создать агента
 </button>
 </motion.div>
 </motion.div>
 )}
 </div>
 );
}
