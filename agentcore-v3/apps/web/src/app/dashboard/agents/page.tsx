'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Loader2, Trash2, Brain, Wand2, Code, Cpu, Zap, ArrowLeft, Sparkles, FlaskConical } from 'lucide-react';
import AgentBrainAnimation from '../../../components/AgentBrainAnimation';
import AgentReadyScreen from '../../../components/AgentReadyScreen';
import { AGENT_TEMPLATES, AgentTemplate } from '../../../data/agentTemplates';
import { useAgentStore } from '../../../store/agentStore';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

interface Agent {
  id: string; name: string; description: string | null; model: string;
  systemPrompt: string; temperature: number; isActive: boolean; createdAt: string;
}

type ViewState = 'list' | 'create' | 'ready';

const INDUSTRIES = [
  'Технологии', 'Финансы', 'Медицина', 'E-commerce', 'Образование',
  'Недвижимость', 'Консалтинг', 'Производство', 'Ритейл', 'HoReCa',
  'Маркетинг', 'Логистика', 'Авто', 'Другое',
] as const;

const TONES = ['Дружелюбный', 'Профессиональный', 'Продающий', 'Формальный'] as const;

const INDUSTRY_KEYWORDS: Record<string, { industry: string; tone: string; name: string }> = {
  'магазин': { industry: 'Ритейл', tone: 'Продающий', name: 'Продавец-консультант' },
  'интернет-магазин': { industry: 'E-commerce', tone: 'Продающий', name: 'Онлайн-консультант' },
  'продаж': { industry: 'Ритейл', tone: 'Продающий', name: 'Менеджер по продажам' },
  'поддержк': { industry: 'Технологии', tone: 'Дружелюбный', name: 'Специалист поддержки' },
  'клиент': { industry: 'Маркетинг', tone: 'Дружелюбный', name: 'Менеджер по работе с клиентами' },
  'консульта': { industry: 'Консалтинг', tone: 'Профессиональный', name: 'Консультант' },
  'заказ': { industry: 'E-commerce', tone: 'Продающий', name: 'Менеджер заказов' },
  'доставк': { industry: 'Логистика', tone: 'Дружелюбный', name: 'Координатор доставки' },
  'отель': { industry: 'HoReCa', tone: 'Дружелюбный', name: 'Администратор' },
  'ресторан': { industry: 'HoReCa', tone: 'Дружелюбный', name: 'Хостес' },
  'медицин': { industry: 'Медицина', tone: 'Профессиональный', name: 'Медицинский ассистент' },
  'недвижимость': { industry: 'Недвижимость', tone: 'Профессиональный', name: 'Риэлтор-консультант' },
  'авто': { industry: 'Авто', tone: 'Профессиональный', name: 'Автоконсультант' },
  'финанс': { industry: 'Финансы', tone: 'Формальный', name: 'Финансовый ассистент' },
  'банк': { industry: 'Финансы', tone: 'Формальный', name: 'Банковский ассистент' },
  'образован': { industry: 'Образование', tone: 'Профессиональный', name: 'Образовательный ассистент' },
  'сайт': { industry: 'Технологии', tone: 'Дружелюбный', name: 'Онлайн-помощник' },
  'чат': { industry: 'Технологии', tone: 'Дружелюбный', name: 'Чат-ассистент' },
  'бот': { industry: 'Технологии', tone: 'Дружелюбный', name: 'Бот-помощник' },
  'юриди': { industry: 'Консалтинг', tone: 'Формальный', name: 'Юридический ассистент' },
};

function analyzeDescription(text: string): {
  name: string; industry: string; tone: string; model: string; temperature: number;
  task: string; rules: string;
} {
  const lower = text.toLowerCase();
  let matchedIndustry = 'Другое';
  let matchedTone = 'Дружелюбный';
  let matchedName = 'AI-ассистент';

  for (const [keyword, mapping] of Object.entries(INDUSTRY_KEYWORDS)) {
    if (lower.includes(keyword)) {
      matchedIndustry = mapping.industry;
      matchedTone = mapping.tone;
      matchedName = mapping.name;
      break;
    }
  }

  if (lower.includes('формальн') || lower.includes('официальн') || lower.includes('строг')) matchedTone = 'Формальный';
  if (lower.includes('дружелюбн') || lower.includes('тёпл') || lower.includes('приветлив')) matchedTone = 'Дружелюбный';

  const model = matchedTone === 'Формальный' || matchedTone === 'Профессиональный'
    ? 'accounts/fireworks/models/deepseek-v4-pro'
    : 'accounts/fireworks/models/glm-5p1';

  const temperature = matchedTone === 'Формальный' ? 0.3 : matchedTone === 'Дружелюбный' ? 0.8 : 0.7;

  const rules = matchedTone === 'Формальный'
    ? '- Отвечай строго по делу, без лишних деталей\n- Используй профессиональную лексику\n- Ссылайся на регламенты и документы при необходимости'
    : matchedTone === 'Продающий'
    ? '- Подчёркивай выгоды для клиента\n- Предлагай дополнительные товары/услуги\n- Мягко веди к покупке'
    : '- Отвечай дружелюбно и по-человечески\n- Используй эмодзи где уместно\n- Уточняй потребности клиента';

  return {
    name: matchedName,
    industry: matchedIndustry,
    tone: matchedTone,
    model,
    temperature,
    task: text,
    rules,
  };
}

function generatePrompt(analysis: ReturnType<typeof analyzeDescription>, companyName: string): string {
  const toneGuide = analysis.tone === 'Формальный' ? 'Формальный, деловой, без эмоций'
    : analysis.tone === 'Продающий' ? 'Продающий, энергичный, нацеленный на результат'
    : analysis.tone === 'Профессиональный' ? 'Профессиональный, экспертный, уверенный'
    : 'Дружелюбный, тёплый, человечный';

  return `# РОЛЬ
Ты — ${analysis.name} компании ${companyName}.
Сфера: ${analysis.industry}.

# ЗАДАЧА
${analysis.task}

# ТОН
${toneGuide}

# ПРАВИЛА
${analysis.rules}

# КОНТЕКСТ
- Отвечай на русском языке
- Если не знаешь ответ — предложи связаться со специалистом
- Сохраняй историю диалога`;
}

export default function AgentsPage() {
  const [view, setView] = useState<ViewState>('list');
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const [token, setToken] = useState('');
  const store = useAgentStore();

  const [description, setDescription] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisDone, setAnalysisDone] = useState(false);

  const [agentName, setAgentName] = useState('');
  const [industry, setIndustry] = useState('');
  const [task, setTask] = useState('');
  const [tone, setTone] = useState('');
  const [rules, setRules] = useState('');

  const [createdAgent, setCreatedAgent] = useState<Agent | null>(null);
  const [testPrompts, setTestPrompts] = useState<string[]>([]);

  useEffect(() => {
    const t = localStorage.getItem('token');
    if (!t) { window.location.href = '/login'; return; }
    setToken(t);
    loadAgents(t);
  }, []);

  const loadAgents = async (t: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/agents`, { headers: { Authorization: `Bearer ${t}` } });
      if (res.ok) {
        const agentsData = await res.json();
        setAgents(Array.isArray(agentsData) ? agentsData : (agentsData?.data || []));
      }
    } catch {}
    setLoading(false);
  };

  const deleteAgent = async (id: string) => {
    await fetch(`${API_BASE}/api/agents/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    setAgents(prev => prev.filter(a => a.id !== id));
  };

  const handleAIAnalyze = () => {
    if (!description.trim()) return;
    setAnalyzing(true);
    setTimeout(() => {
      const result = analyzeDescription(description.trim());
      setAgentName(result.name);
      setIndustry(result.industry);
      setTask(result.task);
      setTone(result.tone);
      setRules(result.rules);
      setAnalysisDone(true);
      setAnalyzing(false);
    }, 800);
  };

  const handleCreate = async () => {
    if (!token) return;

    const name = agentName.trim() || 'AI-ассистент';
    const model = tone === 'Формальный' || tone === 'Профессиональный'
      ? 'accounts/fireworks/models/deepseek-v4-pro'
      : 'accounts/fireworks/models/glm-5p1';
    const temperature = tone === 'Формальный' ? 0.3 : tone === 'Дружелюбный' ? 0.8 : 0.7;
    const companyName = store.onboarding.workspace.companyName || 'Ваша компания';

    setCreating(true);
    try {
      const res = await fetch(`${API_BASE}/api/agents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name,
          description: (task || description).substring(0, 200),
          model,
          systemPrompt: generatePrompt(analyzeDescription(task || description), companyName),
          temperature,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setCreatedAgent(data.agent || data);
        setAgents(prev => [data.agent || data, ...prev]);
        setShowAnimation(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const handleAnimationComplete = () => {
    setShowAnimation(false);
    setView('ready');
  };

  const handleReadyClose = () => {
    setView('list');
    setDescription('');
    setAgentName('');
    setIndustry('');
    setTask('');
    setTone('');
    setRules('');
    setAnalysisDone(false);
    setCreatedAgent(null);
    setTestPrompts([]);
  };

  const openCreate = () => {
    setView('create');
    setDescription('');
    setAgentName('');
    setIndustry('');
    setTask('');
    setTone('');
    setRules('');
    setAnalysisDone(false);
  };

  const canCreate = agentName.trim() || description.trim();

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <Loader2 className="w-8 h-8 text-mauve-500 animate-spin" />
    </div>
  );

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto">
      <AnimatePresence>
        {showAnimation && (
          <AgentBrainAnimation agentName={agentName || 'Агент'} isVisible={true} onComplete={handleAnimationComplete} />
        )}
      </AnimatePresence>

      {!showAnimation && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-display font-bold text-ink-900">
                {view === 'list' ? 'AI-агенты' : view === 'ready' ? 'Готово' : 'Новый агент'}
              </h1>
              <p className="text-ink-400 text-sm mt-1">
                {view === 'list' ? 'Ваши цифровые сотрудники' : view === 'ready' ? 'Агент создан' : 'Опишите задачу — AI заполнит всё остальное'}
              </p>
            </div>
            {view === 'list' && (
              <button onClick={openCreate} className="btn-primary text-sm gap-2">
                <Plus className="w-4 h-4" /> Создать
              </button>
            )}
            {view === 'create' && (
              <button onClick={() => setView('list')} className="btn-secondary text-sm gap-2">
                <ArrowLeft className="w-4 h-4" /> К списку
              </button>
            )}
          </div>
        </motion.div>
      )}

      {view === 'list' && !showAnimation && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map(agent => (
            <motion.div key={agent.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-white rounded-2xl border border-mauve-100 shadow-sm p-5 group cursor-pointer hover:shadow-md transition-shadow" onClick={() => window.location.href = `/dashboard/agents/${agent.id}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-mauve-500 to-mauve-300 flex items-center justify-center">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <button onClick={e => { e.stopPropagation(); deleteAgent(agent.id); }} className="p-1.5 rounded-lg hover:bg-red-50 text-ink-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <h3 className="font-bold text-ink-900">{agent.name}</h3>
              <p className="text-ink-400 text-sm mt-1 line-clamp-2">{agent.description || 'Нет описания'}</p>
              <div className="flex items-center gap-2 mt-3 p-2.5 rounded-xl bg-gradient-to-r from-mauve-50 to-white border border-mauve-100/80">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-mauve-500 to-mauve-300 flex items-center justify-center flex-shrink-0">
                  {agent.model.includes('deepseek') ? <Code className="w-3.5 h-3.5 text-white" /> : agent.model.includes('kimi') ? <Zap className="w-3.5 h-3.5 text-white" /> : <Cpu className="w-3.5 h-3.5 text-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-mauve-400">Модель</p>
                  <p className="text-sm font-bold text-mauve-800 truncate">{agent.model.split('/').pop()}</p>
                </div>
              </div>
              <span className={`inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-md font-semibold mt-2 ${agent.isActive ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/50' : 'bg-ink-100 text-ink-500 ring-1 ring-ink-200/50'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${agent.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-ink-400'}`} />
                {agent.isActive ? 'Активен' : 'Неактивен'}
              </span>
            </motion.div>
          ))}
          {agents.length === 0 && (
            <div className="col-span-full text-center py-16">
              <Brain className="w-12 h-12 text-mauve-300 mx-auto mb-4" />
              <p className="text-ink-500 mb-4">Пока нет агентов. Создайте первого!</p>
              <button onClick={openCreate} className="btn-primary text-sm"><Plus className="w-4 h-4 inline mr-1" />Создать</button>
            </div>
          )}
        </motion.div>
      )}

      {view === 'create' && !showAnimation && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto space-y-6">
          {/* AI Quick Description Card */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
                <FlaskConical className="w-4 h-4 text-amber-600" />
              </div>
              <h2 className="font-semibold text-ink-900">Быстрое создание</h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">Beta</span>
            </div>
            <p className="text-sm text-ink-400 mb-4">Опишите задачу своими словами — AI сам заполнит имя, сферу, тон и правила</p>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Например: интернет-магазин одежды, нужен консультант для подбора размера и оформления заказов"
              rows={3}
              maxLength={500}
              className="w-full px-4 py-3 rounded-xl border border-amber-200 bg-white focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 text-sm text-ink-900 placeholder:text-ink-300 outline-none resize-none"
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-[10px] text-ink-300">{description.length}/500</span>
              <button
                onClick={handleAIAnalyze}
                disabled={!description.trim() || analyzing}
                className="flex items-center gap-2 text-sm font-medium px-5 py-2.5 rounded-xl bg-amber-500 text-white hover:bg-amber-600 transition-colors disabled:opacity-40"
              >
                {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                {analyzing ? 'Анализирую...' : 'Заполнить с помощью AI'}
              </button>
            </div>

            {analysisDone && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 p-3 rounded-xl bg-amber-100/50 border border-amber-200 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <p className="text-xs text-amber-800">AI подобрал параметры. Проверьте ниже и нажмите «Создать агента».</p>
              </motion.div>
            )}
          </div>

          {/* Manual Form */}
          <div className="bg-white rounded-2xl border border-mauve-100 shadow-sm p-6 space-y-5">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-mauve-600" />
              <h2 className="font-semibold text-ink-900">Параметры агента</h2>
              <span className="text-[10px] text-ink-400">можно редактировать</span>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">Имя агента</label>
              <input type="text" value={agentName} onChange={e => setAgentName(e.target.value)} placeholder="Например: Продавец-консультант" maxLength={50} className="w-full px-4 py-3 rounded-xl border border-mauve-200 bg-[#F8F9FB] focus:ring-2 focus:ring-mauve-400/30 focus:border-mauve-400 text-sm text-ink-900 placeholder:text-ink-300 outline-none" />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">Сфера</label>
              <select value={industry} onChange={e => setIndustry(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-mauve-200 bg-[#F8F9FB] focus:ring-2 focus:ring-mauve-400/30 focus:border-mauve-400 text-sm text-ink-900 outline-none appearance-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%23999' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10z'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 16px center', paddingRight: '40px' }}>
                <option value="" disabled>Выберите сферу...</option>
                {INDUSTRIES.map(ind => <option key={ind} value={ind}>{ind}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">Задача</label>
              <textarea value={task} onChange={e => setTask(e.target.value)} placeholder="Что должен делать агент?" rows={3} maxLength={500} className="w-full px-4 py-3 rounded-xl border border-mauve-200 bg-[#F8F9FB] focus:ring-2 focus:ring-mauve-400/30 focus:border-mauve-400 text-sm text-ink-900 placeholder:text-ink-300 outline-none resize-none" />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">Тон</label>
              <div className="grid grid-cols-2 gap-2">
                {TONES.map(t => (
                  <button key={t} type="button" onClick={() => setTone(t)} className={`px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${tone === t ? 'border-mauve-400 bg-mauve-50 text-mauve-700 shadow-sm' : 'border-mauve-200 bg-white text-ink-600 hover:border-mauve-300 hover:bg-mauve-50/50'}`}>{t}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Summary */}
          {canCreate && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-mauve-50 to-white rounded-2xl border border-mauve-200 shadow-sm p-6">
              <h3 className="font-semibold text-ink-900 mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-mauve-600" /> Предпросмотр
              </h3>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-white border border-mauve-100"><p className="text-[10px] text-mauve-400 uppercase">Имя</p><p className="text-sm font-bold text-mauve-800">{agentName || '(из описания)'}</p></div>
                <div className="p-3 rounded-xl bg-white border border-mauve-100"><p className="text-[10px] text-mauve-400 uppercase">Сфера</p><p className="text-sm font-bold text-mauve-800">{industry || '(из описания)'}</p></div>
                <div className="p-3 rounded-xl bg-white border border-mauve-100"><p className="text-[10px] text-mauve-400 uppercase">Тон</p><p className="text-sm font-bold text-mauve-800">{tone || '(из описания)'}</p></div>
                <div className="p-3 rounded-xl bg-white border border-mauve-100"><p className="text-[10px] text-mauve-400 uppercase">Модель</p><p className="text-sm font-bold text-mauve-800">{tone === 'Формальный' || tone === 'Профессиональный' ? 'deepseek-v4-pro' : 'glm-5p1'}</p></div>
              </div>
            </motion.div>
          )}

          {/* Create Button */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center gap-2">
            <button
              onClick={handleCreate}
              disabled={creating || !canCreate}
              className="btn-primary text-base px-10 py-3.5 gap-3 shadow-lg shadow-mauve-600/20 hover:shadow-xl hover:shadow-mauve-600/30 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {creating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              Создать агента
            </button>
            {!canCreate && <p className="text-xs text-ink-400">Заполните описание или поля выше</p>}
          </motion.div>
        </motion.div>
      )}

      {view === 'ready' && createdAgent && (
        <AgentReadyScreen
          agent={{ id: createdAgent.id, name: createdAgent.name, description: createdAgent.description || '', model: createdAgent.model }}
          testPrompts={testPrompts}
          onClose={handleReadyClose}
        />
      )}
    </div>
  );
}
