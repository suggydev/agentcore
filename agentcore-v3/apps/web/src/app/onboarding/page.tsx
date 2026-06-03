'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
 TrendingUp,
 Headphones,
 MessageCircle,
 Building2,
 Pen,
 ArrowRight,
 ArrowLeft,
 Loader2,
 Calendar,
 Check,
 ChevronRight,
 Heart,
} from 'lucide-react';
import Logo from '../../components/Logo';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

interface FormData {
 companyName: string;
 companySize: string;
 industry: string;
 geography: string;
 channels: string[];
 websiteUrl: string;
 crm: string;
 agentGoal: string;
}

const COMPANY_SIZES = ['1-10', '11-50', '51-200', '201-1000', '1000+'];
const INDUSTRIES = [
 'Технологии', 'Финансы', 'Медицина', 'E-commerce', 'Образование',
 'Недвижимость', 'Консалтинг', 'Производство', 'Другое',
];
const GEOGRAPHIES = [
 'Весь мир', 'Европа', 'Сев. Америка', 'Азия',
 'Юж. Америка', 'Африка', 'Бл. Восток', 'Россия/СНГ',
];
const CHANNELS = [
 'Веб-чат', 'Telegram', 'WhatsApp', 'Email', 'Телефон', 'Slack', 'Discord',
];
const CRMS = [
 'Нет', 'HubSpot', 'Salesforce', 'Pipedrive', 'Zoho', 'Bitrix24', 'AmoCRM', 'Своя',
];

const GOALS = [
 {
 id: 'sales',
 icon: TrendingUp,
 label: 'Продажи',
 description: 'Генерация лидов, квалификация, увеличение конверсии',
 },
 {
 id: 'support',
 icon: Headphones,
 label: 'Поддержка',
 description: '24/7 ответы, снижение нагрузки на команду',
 },
 {
 id: 'consulting',
 icon: MessageCircle,
 label: 'Консультации',
 description: 'Квалификация клиентов, запись на встречи',
 },
 {
 id: 'internal',
 icon: Building2,
 label: 'Автоматизация',
 description: 'Внутренние процессы, онбординг, обучение',
 },
 {
 id: 'custom',
 icon: Pen,
 label: 'Другое',
 description: 'Свой сценарий',
 },
];

const slideUp = {
 initial: { opacity: 0, y: 24 },
 animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
 exit: { opacity: 0, y: -24, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } },
};

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
 const [error, setError] = useState('');
 const [token, setToken] = useState('');

 const [form, setForm] = useState<FormData>({
 companyName: '',
 companySize: '',
 industry: '',
 geography: '',
 channels: [],
 websiteUrl: '',
 crm: '',
 agentGoal: '',
 });

 useEffect(() => {
 const t = localStorage.getItem('token');
  if (!t) {
  router.push('/login');
  return;
  }
 setToken(t);
 }, []);

 const update = <K extends keyof FormData>(key: K, value: FormData[K]) => {
 setForm(prev => ({ ...prev, [key]: value }));
 };

 const toggleChannel = (ch: string) => {
 setForm(prev => ({
 ...prev,
 channels: prev.channels.includes(ch)
 ? prev.channels.filter(c => c !== ch)
 : [...prev.channels, ch],
 }));
 };

 const canContinueStep1 =
 form.companyName.trim() !== '' &&
 form.companySize !== '' &&
 form.industry !== '' &&
 form.geography !== '';

 const handleSubmit = useCallback(async () => {
 setLoading(true);
 setError('');

 try {
 const payload = {
 companyName: form.companyName,
 companySize: form.companySize,
 industry: form.industry,
 geography: form.geography,
 channels: form.channels,
 websiteUrl: form.websiteUrl,
 crm: form.crm,
 agentGoal: form.agentGoal,
 };

  const res = await fetch(`${API_BASE}/api/workspace`, {
  method: 'PUT',
 headers: {
 'Content-Type': 'application/json',
 Authorization: `Bearer ${token}`,
 },
 body: JSON.stringify({ ...payload, onboardingCompleted: true }),
 });

 if (!res.ok) {
 const data = await res.json().catch(() => ({}));
 throw new Error(data.error || 'Не удалось сохранить данные');
 }

  router.push('/dashboard');
  } catch (err: unknown) {
  setError(err instanceof Error ? err.message : 'Не удалось сохранить данные');
 } finally {
 setLoading(false);
 }
 }, [form, token]);

  const handleSkipForNow = async () => {
  if (!token) return;
  setLoading(true);
  try {
  await fetch(`${API_BASE}/api/workspace`, {
  method: 'PUT',
  headers: {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({ skipped: true }),
  });
  } catch (err) { console.error('[OnboardingPage] handleSkipForNow:', err); setError(err instanceof Error ? err.message : 'Не удалось пропустить онбординг. Попробуйте снова.'); }
  finally { setLoading(false); }
  router.push('/dashboard');
  };

 return (
  <div className="min-h-screen bg-[var(--bg)] relative flex flex-col items-center justify-center px-4 py-12" suppressHydrationWarning>
 <div className="absolute inset-0 grid-lines opacity-40" />

 <motion.div
 initial={{ opacity: 0, y: 40 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
 className="relative z-10 w-full max-w-2xl"
 >
 {/* Logo */}
 <div className="flex justify-center mb-8">
 <Logo size={36} />
 </div>

 {/* Trial Banner */}
 <motion.div
 initial={{ opacity: 0, y: -10 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
 className="mb-8 px-5 py-4 rounded-2xl bg-[var(--accent-soft)] border border-[var(--border)] flex items-center gap-4 shadow-sm"
 >
 <div className="w-10 h-10 rounded-xl bg-[var(--brand)] flex items-center justify-center flex-shrink-0">
 <Calendar className="w-5 h-5 text-white" />
 </div>
 <div>
 <p className="text-sm font-semibold text-[var(--brand)]">
 Добро пожаловать! 7 дней полного доступа
 </p>
 <p className="text-xs text-[var(--brand)] mt-0.5">Без привязки карты. При подписке — $10/мес на AI-баланс</p>
 </div>
 </motion.div>

 {/* Card */}
 <div className="bg-surface rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden relative">
 <div className="px-8 pt-5 pb-0 flex items-center justify-between">
 <span className="text-xs font-medium text-[var(--text-muted)]">Шаг {step + 1} из 2</span>
 <div className="flex items-center gap-2">
 <div className={`w-16 h-1 rounded-full transition-all duration-500 ${step === 0 ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'}`} />
 <div className={`w-16 h-1 rounded-full transition-all duration-500 ${step === 1 ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'}`} />
 </div>
 </div>

 {error && (
 <motion.div
 initial={{ opacity: 0, y: -6 }}
 animate={{ opacity: 1, y: 0 }}
 className="mx-8 mt-3 p-3 rounded-xl bg-danger-soft border border-[var(--danger-soft)] text-danger text-sm text-center"
 >
 {error}
 </motion.div>
 )}

 <AnimatePresence mode="wait">
 {step === 0 ? (
 <Step1
 key="step1"
 form={form}
 update={update}
 toggleChannel={toggleChannel}
 />
 ) : (
 <Step2
 key="step2"
 form={form}
 update={update}
 />
 )}
 </AnimatePresence>

 {/* Footer */}
 <div className="px-8 pb-8">
 <div className="flex items-center justify-between mt-6">
 <div>
 {step === 1 && (
 <button
 type="button"
 onClick={() => setStep(0)}
 className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors font-medium"
 >
 <ArrowLeft className="w-4 h-4" />
 Назад
 </button>
 )}
 </div>

 <div className="flex items-center gap-4">
 <button
 type="button"
 onClick={handleSkipForNow}
 disabled={loading}
 className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors font-medium"
 >
 Пропустить
 </button>

 {step === 0 ? (
 <button
 type="button"
 disabled={!canContinueStep1}
 onClick={() => setStep(1)}
 className="btn-primary text-sm px-6 py-2.5 disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:shadow-none disabled:hover:bg-[var(--accent)]"
 >
 Далее <ChevronRight className="w-4 h-4" />
 </button>
 ) : (
 <button
 type="button"
 disabled={!form.agentGoal || loading}
 onClick={handleSubmit}
 className="btn-primary text-sm px-6 py-2.5 disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:shadow-none disabled:hover:bg-[var(--accent)]"
 >
 {loading ? (
 <>
 <Loader2 className="w-4 h-4 animate-spin" />
 Сохранение...
 </>
 ) : (
 <>
 Запустить <ArrowRight className="w-4 h-4" />
 </>
 )}
 </button>
 )}
 </div>
 </div>

 {/* Step Indicators */}
 <div className="flex items-center justify-center gap-2 mt-6">
 <div
 className={`w-2 h-2 rounded-full transition-all duration-300 ${
 step === 0 ? 'bg-[var(--brand)] w-6' : 'bg-[var(--border)]'
 }`}
 />
 <div
 className={`w-2 h-2 rounded-full transition-all duration-300 ${
 step === 1 ? 'bg-[var(--brand)] w-6' : 'bg-[var(--border)]'
 }`}
 />
 </div>
 </div>
 </div>
 </motion.div>
 </div>
 );
}

/* ---------------- Step 1: Company Setup ---------------- */

function Step1({
 form,
 update,
 toggleChannel,
}: {
 form: FormData;
 update: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
 toggleChannel: (ch: string) => void;
}) {
 return (
 <motion.div {...slideUp} className="px-8 pt-8 pb-2">
 <div className="mb-7">
 <h2 className="font-display font-bold text-2xl text-[var(--text)] mb-1.5">
 Настройка рабочей области
 </h2>
 <p className="text-sm text-[var(--text-muted)]">
 Расскажите о вашей компании
 </p>
 </div>

 <div className="space-y-4">
 {/* Company Name */}
 <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg)] transition-all focus-within:ring-2 focus-within:ring-[var(--brand)] focus-within:border-[var(--brand)] focus-within:bg-surface">
 <label className="block text-xs font-semibold uppercase tracking-label text-[var(--brand)] mb-2">
 Название компании
 </label>
 <input
 type="text"
 value={form.companyName}
 onChange={e => update('companyName', e.target.value)}
 placeholder="ООО «Ромашка»"
 className="w-full bg-transparent text-[var(--text)] text-sm placeholder:text-[var(--text-muted)] outline-none"
 />
 </div>

 {/* Company Size */}
 <SelectField
 label="Размер команды"
 value={form.companySize}
 onChange={v => update('companySize', v)}
 options={COMPANY_SIZES}
 placeholder="Выберите размер"
 />

 {/* Industry */}
 <SelectField
 label="Индустрия"
 value={form.industry}
 onChange={v => update('industry', v)}
 options={INDUSTRIES}
 placeholder="Выберите индустрию"
 />

 {/* Geography */}
 <SelectField
 label="Регион"
 value={form.geography}
 onChange={v => update('geography', v)}
 options={GEOGRAPHIES}
 placeholder="Выберите регион"
 />

 {/* Communication Channels */}
 <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg)]">
 <label className="block text-xs font-semibold uppercase tracking-label text-[var(--brand)] mb-3">
 Каналы общения
 </label>
 <div className="flex flex-wrap gap-2">
 {CHANNELS.map(ch => {
 const selected = form.channels.includes(ch);
 return (
 <button
 key={ch}
 type="button"
 onClick={() => toggleChannel(ch)}
 className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200 ${
 selected
 ? 'bg-[var(--accent)] text-white border-[var(--accent)] shadow-md scale-105'
 : 'bg-surface text-[var(--text)] border-[var(--border)] hover:border-[var(--brand)]/40 hover:bg-[var(--accent-soft)] hover:text-[var(--brand)]'
 }`}
 >
 {selected && <Check className="w-3 h-3" />}
 {ch}
 </button>
 );
 })}
 </div>
 </div>

 {/* Website URL */}
 <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg)] transition-all focus-within:ring-2 focus-within:ring-[var(--brand)] focus-within:border-[var(--brand)] focus-within:bg-surface">
 <label className="block text-xs font-semibold uppercase tracking-label text-[var(--brand)] mb-2">
 Сайт компании
 </label>
 <input
 type="url"
 value={form.websiteUrl}
 onChange={e => update('websiteUrl', e.target.value)}
 placeholder="https://example.com"
 className="w-full bg-transparent text-[var(--text)] text-sm placeholder:text-[var(--text-muted)] outline-none"
 />
 </div>

 {/* CRM */}
 <SelectField
 label="CRM"
 value={form.crm}
 onChange={v => update('crm', v)}
 options={CRMS}
 placeholder="Выберите CRM"
 />
 </div>
 </motion.div>
 );
}

/* ---------------- Step 2: Agent Goal ---------------- */

function Step2({
 form,
 update,
}: {
 form: FormData;
 update: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
}) {
 return (
 <motion.div {...slideUp} className="px-8 pt-8 pb-2">
 <div className="mb-7">
 <h2 className="font-display font-bold text-2xl text-[var(--text)] mb-1.5">
 Что будет делать ваш агент?
 </h2>
 <p className="text-sm text-[var(--text-muted)]">
 Выберите основную задачу для AI-агента
 </p>
 </div>

 <div className="grid grid-cols-1 gap-3 mb-6">
 {GOALS.map(goal => {
 const selected = form.agentGoal === goal.id;
 const Icon = goal.icon;
 return (
 <motion.button
 key={goal.id}
 type="button"
 whileHover={selected ? { scale: 1.01 } : { y: -3, scale: 1.02 }}
 whileTap={{ scale: 0.98 }}
 onClick={() => update('agentGoal', goal.id)}
 className={`flex items-start gap-4 p-4 rounded-xl border text-left transition-all duration-300 ${
 selected
 ? 'bg-[var(--accent-soft)] border-[var(--brand)]/40 shadow-lg ring-1 ring-[var(--brand)]/30'
 : 'bg-[var(--bg)] border-[var(--border)] hover:border-[var(--brand)]/40 hover:shadow-lg hover:bg-surface'
 }`}
 >
 <div
 className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors duration-300 ${
 selected ? 'bg-[var(--brand)]' : 'bg-[var(--accent-soft)]'
 }`}
 >
 <Icon
 className={`w-5 h-5 transition-colors duration-300 ${
 selected ? 'text-white' : 'text-[var(--brand)]'
 }`}
 />
 </div>
 <div className="min-w-0">
 <p
 className={`font-semibold text-sm transition-colors duration-300 ${
 selected ? 'text-[var(--brand)]' : 'text-[var(--text)]'
 }`}
 >
 {goal.label}
 </p>
 <p className="text-xs text-[var(--text-muted)] mt-0.5">{goal.description}</p>
 </div>
 {selected && (
 <div className="ml-auto flex-shrink-0 self-center">
 <div className="w-5 h-5 rounded-full bg-[var(--brand)] flex items-center justify-center">
 <Check className="w-3 h-3 text-white" />
 </div>
 </div>
 )}
 </motion.button>
 );
 })}
 </div>

 {/* Preview Card */}
 {form.agentGoal && (
 <motion.div
 initial={{ opacity: 0, y: 12 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
 className="p-5 rounded-xl border border-[var(--border)] bg-gradient-to-br from-[var(--accent-soft)]/80 to-[var(--surface)] shadow-md"
 >
 <p className="text-xs font-semibold uppercase tracking-label text-[var(--brand)] mb-4">
 Создать первого агента
 </p>
 <div className="flex items-center gap-4">
 <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[var(--brand)] to-[var(--brand)]/60 flex items-center justify-center shadow-lg">
 {(() => {
 const goal = GOALS.find(g => g.id === form.agentGoal);
 if (!goal) return null;
 const Icon = goal.icon;
 return <Icon className="w-5 h-5 text-white" />;
 })()}
 </div>
 <div>
 <p className="text-sm font-semibold text-[var(--text)]">
 {GOALS.find(g => g.id === form.agentGoal)?.label} Агент
 </p>
 <div className="flex items-center gap-1.5 mt-1">
 <Heart className="w-3.5 h-3.5 text-[var(--text-muted)]" />
 <p className="text-xs text-[var(--brand)]">При подписке — $10/мес на AI-запросы</p>
 </div>
 </div>
 </div>
 </motion.div>
 )}
 </motion.div>
 );
}

/* ---------------- Shared: Select Field ---------------- */

function SelectField({
 label,
 value,
 onChange,
 options,
 placeholder,
}: {
 label: string;
 value: string;
 onChange: (v: string) => void;
 options: string[];
 placeholder: string;
}) {
 return (
 <div className="relative p-4 rounded-xl border border-[var(--border)] bg-[var(--bg)] transition-all focus-within:ring-2 focus-within:ring-[var(--brand)] focus-within:border-[var(--brand)] focus-within:bg-surface">
 <label className="block text-xs font-semibold uppercase tracking-label text-[var(--brand)] mb-2">
 {label}
 </label>
 <div className="relative">
  <select
  value={value}
  onChange={e => onChange(e.target.value)}
  className="w-full bg-transparent text-[var(--text)] text-sm outline-none cursor-pointer appearance-none pr-8"
  suppressHydrationWarning
  >
  <option value="">
  {placeholder}
  </option>
  {options.map(opt => (
  <option key={opt} value={opt}>
  {opt}
  </option>
  ))}
  </select>
 <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none">
 <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
 <path d="M1 1.5L6 6.5L11 1.5" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
 </svg>
 </div>
 {value && (
 <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none">
 <div className="w-1.5 h-1.5 rounded-full bg-[var(--brand)]/30" />
 </div>
 )}
 </div>
 </div>
 );
}
