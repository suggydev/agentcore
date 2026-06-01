'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Loader2, Trash2, Brain, Wand2,
  Code, Cpu, Zap, ArrowLeft, Sparkles
} from 'lucide-react';
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

const TONES = ['Профессиональный', 'Дружелюбный', 'Продающий', 'Формальный'] as const;

const AUTO_MODELS = [
  { id: 'accounts/fireworks/models/deepseek-v4-pro', name: 'deepseek-v4-pro', icon: Code, for: ['Профессиональный', 'Формальный'] },
  { id: 'accounts/fireworks/models/glm-5p1', name: 'glm-5p1', icon: Cpu, for: ['Дружелюбный', 'Продающий'] },
];

const INDUSTRY_TEMPLATE_MAP: Record<string, string> = {
  'Технологии': 'saas',
  'Финансы': 'finance',
  'Медицина': 'healthcare',
  'E-commerce': 'ecommerce',
  'Образование': 'education',
  'Недвижимость': 'realestate',
  'Консалтинг': 'consulting',
  'Ритейл': 'retail',
  'HoReCa': 'hospitality',
};

function findTemplate(industry: string): AgentTemplate | null {
  const templateId = INDUSTRY_TEMPLATE_MAP[industry];
  if (!templateId) return null;
  return AGENT_TEMPLATES.find(t => t.id === templateId) || null;
}

function selectModel(tone: string, industry: string): { id: string; name: string; icon: typeof Code } {
  for (const m of AUTO_MODELS) {
    if (m.for.includes(tone)) return m;
  }
  if (['Финансы', 'Консалтинг', 'Медицина'].includes(industry)) return AUTO_MODELS[0];
  return AUTO_MODELS[1];
}

function selectTemperature(tone: string): number {
  if (tone === 'Профессиональный' || tone === 'Формальный') return 0.3;
  return 0.7;
}

function resolveTone(tone: string): 'formal' | 'friendly' | 'expert' | 'salesy' | 'reserved' {
  const map: Record<string, 'formal' | 'friendly' | 'expert' | 'salesy' | 'reserved'> = {
    'Профессиональный': 'expert',
    'Дружелюбный': 'friendly',
    'Продающий': 'salesy',
    'Формальный': 'formal',
  };
  return map[tone] || 'friendly';
}

function resolveResponseSpeed(tone: string): string {
  const map: Record<string, string> = {
    'Профессиональный': 'thoughtful',
    'Дружелюбный': 'fast',
    'Продающий': 'natural',
    'Формальный': 'thoughtful',
  };
  return map[tone] || 'natural';
}

function buildToneGuide(tone: string): string {
  switch (tone) {
    case 'Профессиональный':
      return '- Стиль: профессиональный, деловой\n- Говори строго по делу, используй профессиональную лексику\n- Соблюдай деловой этикет';
    case 'Дружелюбный':
      return '- Стиль: дружелюбный, тёплый\n- Общайся по-человечески, с эмпатией\n- Используй эмодзи где уместно';
    case 'Продающий':
      return '- Стиль: продающий, энергичный\n- Подчёркивай выгоды и преимущества\n- Веди клиента к целевому действию';
    case 'Формальный':
      return '- Стиль: формальный, официальный\n- Соблюдай строгий деловой тон\n- Избегай эмоций и разговорной лексики';
    default:
      return '- Стиль: дружелюбный, профессиональный\n- Общайся тепло но по делу';
  }
}

function generateSystemPrompt(
  name: string, industry: string, task: string, tone: string,
  rules: string, companyName: string, template: AgentTemplate | null
): string {
  if (template) {
    const prompt = template.systemPrompt(name, companyName, industry);
    if (rules.trim()) {
      return prompt + `\n\n# ДОПОЛНИТЕЛЬНЫЕ ПРАВИЛА\n${rules}`;
    }
    return prompt;
  }

  const toneGuide = buildToneGuide(tone);
  const rulesSection = rules.trim()
    ? `# ПРАВИЛА\n${rules}`
    : `# ПРАВИЛА\n- Всегда начинай с приветствия и предложения помощи\n- Внимательно слушай и уточняй потребности\n- Предлагай конкретные решения, а не общие фразы\n- Если не знаешь ответ — честно признай и предложи альтернативу\n- Сохраняй контекст разговора`;

  return `# РОЛЬ
Ты — ${name}, AI-ассистент компании ${companyName}.
Твоя сфера: ${industry}.

# ЗАДАЧА
${task}

# ТОН ОБЩЕНИЯ
${toneGuide}

# ЯЗЫК
- Общение на русском языке

${rulesSection}`;
}

function getDefaultPersona(tone: string) {
  const t = resolveTone(tone);
  const isEmoji = t === 'friendly' || t === 'salesy';
  return {
    tone: t,
    responseSpeed: resolveResponseSpeed(tone),
    useEmoji: isEmoji,
    useHumor: isEmoji,
    showEmotions: isEmoji,
    forbiddenWords: 'бот, ИИ, программа, искусственный интеллект, нейросеть',
    aggressionHandling: (isEmoji ? 'empathy' : 'calm') as string,
  };
}

export default function AgentsPage() {
  const [view, setView] = useState<ViewState>('list');
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const [token, setToken] = useState('');
  const store = useAgentStore();

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

  const isFormValid = agentName.trim() && industry && task.trim() && tone;
  const modelInfo = isFormValid ? selectModel(tone, industry) : null;
  const matchedTemplate = industry ? findTemplate(industry) : null;

  const handleCreate = async () => {
    if (!token || !isFormValid) return;
    setCreating(true);

    try {
      const companyName = store.onboarding.workspace.companyName || 'Ваша компания';
      const sysPrompt = generateSystemPrompt(
        agentName.trim(), industry, task.trim(), tone, rules.trim(), companyName, matchedTemplate
      );
      const templatePersona = matchedTemplate ? {
        tone: matchedTemplate.tone,
        responseSpeed: matchedTemplate.responseSpeed,
        useEmoji: matchedTemplate.useEmoji,
        useHumor: matchedTemplate.useHumor,
        showEmotions: matchedTemplate.showEmotions,
        forbiddenWords: matchedTemplate.forbiddenWords,
        aggressionHandling: matchedTemplate.aggressionHandling,
      } : null;
      const defaults = getDefaultPersona(tone);

      const persona = templatePersona || {
        tone: defaults.tone,
        responseSpeed: defaults.responseSpeed,
        useEmoji: defaults.useEmoji,
        useHumor: defaults.useHumor,
        showEmotions: defaults.showEmotions,
        forbiddenWords: defaults.forbiddenWords,
        aggressionHandling: defaults.aggressionHandling,
      };

      const res = await fetch(`${API_BASE}/api/agents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: agentName.trim(),
          description: task.substring(0, 200),
          model: modelInfo!.id,
          systemPrompt: sysPrompt,
          temperature: selectTemperature(tone),
          goal: matchedTemplate?.goal || 'general',
          industry,
          persona: {
            ...persona,
            greeting: `Здравствуйте! Я ${agentName.trim()}, готов помочь.`,
            admitNotKnowing: true,
            adaptToUserStyle: true,
            rememberContext: true,
            notPushy: true,
          },
          brainTemplate: matchedTemplate?.brainTemplate,
          testPrompts: matchedTemplate?.testPrompts || [],
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setCreatedAgent(data.agent || data);
        setTestPrompts(matchedTemplate?.testPrompts || []);
        setAgents(prev => [data.agent || data, ...prev]);
        setShowAnimation(true);
      } else {
        throw new Error('Creation failed');
      }
    } catch (err) {
      console.error('Agent creation failed:', err instanceof Error ? err.message : err);
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
    setAgentName('');
    setIndustry('');
    setTask('');
    setTone('');
    setRules('');
    setCreatedAgent(null);
    setTestPrompts([]);
  };

  const openCreate = () => {
    setView('create');
    setAgentName('');
    setIndustry('');
    setTask('');
    setTone('');
    setRules('');
  };

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
                {view === 'list' ? 'Ваши цифровые сотрудники' : view === 'ready' ? 'Агент настроен и готов к работе' : 'Настройте агента под ваши задачи'}
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

      {/* Agent List */}
      {view === 'list' && !showAnimation && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent, i) => (
            <motion.div key={agent.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-white rounded-2xl border border-mauve-100 shadow-sm p-5 group">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-mauve-500 to-mauve-300 flex items-center justify-center">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <button onClick={() => deleteAgent(agent.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-ink-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <h3 className="font-bold text-ink-900">{agent.name}</h3>
              <p className="text-ink-400 text-sm mt-1 line-clamp-2">{agent.description || 'Нет описания'}</p>
              <div className="flex items-center gap-2 mt-3 p-2.5 rounded-xl bg-gradient-to-r from-mauve-50 to-white border border-mauve-100/80">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-mauve-500 to-mauve-300 flex items-center justify-center flex-shrink-0">
                  {agent.model.includes('deepseek') ? <Code className="w-3.5 h-3.5 text-white" /> :
                   agent.model.includes('kimi') ? <Zap className="w-3.5 h-3.5 text-white" /> :
                   <Cpu className="w-3.5 h-3.5 text-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-mauve-400">Модель</p>
                  <p className="text-sm font-bold text-mauve-800 truncate">{agent.model.split('/').pop()}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className={`inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-md font-semibold transition-colors ${
                  agent.isActive ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/50' : 'bg-ink-100 text-ink-500 ring-1 ring-ink-200/50'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${agent.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-ink-400'}`} />
                  {agent.isActive ? 'Активен' : 'Неактивен'}
                </span>
              </div>
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

      {/* Create Form */}
      {view === 'create' && !showAnimation && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto space-y-6">
          <div className="bg-white rounded-2xl border border-mauve-100 shadow-sm p-6 space-y-5">
            <div className="flex items-center gap-2 mb-1">
              <Wand2 className="w-5 h-5 text-mauve-600" />
              <h2 className="font-semibold text-ink-900">Параметры агента</h2>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">Имя агента</label>
              <input
                type="text"
                value={agentName}
                onChange={e => setAgentName(e.target.value)}
                placeholder="Введите имя агента..."
                maxLength={50}
                className="w-full px-4 py-3 rounded-xl border border-mauve-200 bg-[#F8F9FB] focus:ring-2 focus:ring-mauve-400/30 focus:border-mauve-400 text-sm text-ink-900 placeholder:text-ink-300 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">Сфера / Индустрия</label>
              <select
                value={industry}
                onChange={e => setIndustry(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-mauve-200 bg-[#F8F9FB] focus:ring-2 focus:ring-mauve-400/30 focus:border-mauve-400 text-sm text-ink-900 outline-none appearance-none"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%23999' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10z'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 16px center', paddingRight: '40px' }}
              >
                <option value="" disabled>Выберите индустрию...</option>
                {INDUSTRIES.map(ind => (
                  <option key={ind} value={ind}>{ind}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">Задача агента</label>
              <textarea
                value={task}
                onChange={e => setTask(e.target.value)}
                placeholder="Опишите, что должен делать агент. Например: консультировать клиентов по продуктам компании, обрабатывать заявки, отвечать на вопросы о доставке и возвратах..."
                rows={4}
                maxLength={600}
                className="w-full px-4 py-3 rounded-xl border border-mauve-200 bg-[#F8F9FB] focus:ring-2 focus:ring-mauve-400/30 focus:border-mauve-400 text-sm text-ink-900 placeholder:text-ink-300 outline-none resize-none"
              />
              <span className="text-[10px] text-ink-300 tabular-nums">{task.length}/600</span>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">Тон общения</label>
              <div className="grid grid-cols-2 gap-2">
                {TONES.map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTone(t)}
                    className={`px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                      tone === t
                        ? 'border-mauve-400 bg-mauve-50 text-mauve-700 shadow-sm'
                        : 'border-mauve-200 bg-white text-ink-600 hover:border-mauve-300 hover:bg-mauve-50/50'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">Ключевые правила</label>
              <textarea
                value={rules}
                onChange={e => setRules(e.target.value)}
                placeholder="Особые инструкции для агента. Например: не предлагать товары дороже 5000₽, всегда уточнять контактный телефон, не работать с юрлицами..."
                rows={3}
                maxLength={500}
                className="w-full px-4 py-3 rounded-xl border border-mauve-200 bg-[#F8F9FB] focus:ring-2 focus:ring-mauve-400/30 focus:border-mauve-400 text-sm text-ink-900 placeholder:text-ink-300 outline-none resize-none"
              />
              <span className="text-[10px] text-ink-300 tabular-nums">{rules.length}/500</span>
            </div>
          </div>

          <AnimatePresence>
            {isFormValid && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-gradient-to-br from-mauve-50 to-white rounded-2xl border border-mauve-200 shadow-sm p-6"
              >
                <h3 className="font-semibold text-ink-900 mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-mauve-600" />
                  Предпросмотр агента
                </h3>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-white border border-mauve-100">
                    <p className="text-[10px] text-mauve-400 uppercase tracking-wide mb-0.5">Имя</p>
                    <p className="text-sm font-bold text-mauve-800">{agentName}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white border border-mauve-100">
                    <p className="text-[10px] text-mauve-400 uppercase tracking-wide mb-0.5">Сфера</p>
                    <p className="text-sm font-bold text-mauve-800">{industry}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white border border-mauve-100">
                    <p className="text-[10px] text-mauve-400 uppercase tracking-wide mb-0.5">Тон общения</p>
                    <p className="text-sm font-bold text-mauve-800">{tone}</p>
                  </div>
                  {modelInfo && (
                    <div className="p-3 rounded-xl bg-white border border-mauve-100">
                      <p className="text-[10px] text-mauve-400 uppercase tracking-wide mb-0.5">Модель</p>
                      <div className="flex items-center gap-1.5">
                        <modelInfo.icon className="w-3.5 h-3.5 text-mauve-600" />
                        <p className="text-sm font-bold text-mauve-800">{modelInfo.name}</p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-2"
          >
            <button
              onClick={handleCreate}
              disabled={creating || !isFormValid}
              className="btn-primary text-base px-10 py-3.5 gap-3 shadow-lg shadow-mauve-600/20 hover:shadow-xl hover:shadow-mauve-600/30 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {creating ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Sparkles className="w-5 h-5" />
              )}
              Создать агента
            </button>
            {!isFormValid && (
              <p className="text-xs text-ink-400">
                Заполните: {!agentName.trim() && 'имя '}{!industry && 'сферу '}{!task.trim() && 'задачу '}{!tone && 'тон'}
              </p>
            )}
          </motion.div>
        </motion.div>
      )}

      {/* Ready Screen */}
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
