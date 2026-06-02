'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Loader2, ArrowRight, ArrowLeft, Check, Building2, Users, Briefcase, Target, MessageCircle, Search, UserPlus, Share2, Megaphone, Linkedin, Instagram, Zap, Heart, Star, Send } from 'lucide-react';
import { useAgentStore } from '@/store/agentStore';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

const INDUSTRIES = [
 'Технологии', 'Финансы', 'Медицина', 'E-commerce', 'Образование',
 'Недвижимость', 'Консалтинг', 'Производство', 'Ритейл', 'HoReCa',
 'Маркетинг', 'Логистика', 'Строительство', 'Авто', 'Другое',
];

const COMPANY_SIZES = ['1', '2-10', '11-50', '51-200', '201-1000', '1000+'];

const SOURCES = [
 { id: 'youtube', icon: Zap, label: 'YouTube' },
 { id: 'telegram', icon: Send, label: 'Telegram' },
 { id: 'instagram', icon: Instagram, label: 'Instagram' },
 { id: 'search', icon: Search, label: 'Поиск' },
 { id: 'friend', icon: UserPlus, label: 'Рекомендация' },
 { id: 'linkedin', icon: Linkedin, label: 'LinkedIn' },
 { id: 'ads', icon: Megaphone, label: 'Реклама' },
 { id: 'share', icon: Share2, label: 'Другое' },
];

const PURPOSES = [
 { id: 'sales', icon: Target, label: 'Продажи и лиды', desc: 'Автоматизация воронки продаж, квалификация клиентов' },
 { id: 'support', icon: MessageCircle, label: 'Поддержка клиентов', desc: '24/7 ответы, снижение нагрузки на команду' },
 { id: 'consulting', icon: Briefcase, label: 'Консультации', desc: 'Квалификация и запись на встречи' },
 { id: 'automation', icon: Zap, label: 'Автоматизация процессов', desc: 'Внутренние задачи, онбординг, HR' },
 { id: 'marketing', icon: Megaphone, label: 'Маркетинг', desc: 'Рассылки, прогрев, повторные касания' },
 { id: 'other', icon: Star, label: 'Другое', desc: 'Определю позже' },
];

const STEPS = [
 { num: 1, label: 'Аккаунт' },
 { num: 2, label: 'О компании' },
 { num: 3, label: 'Запуск' },
];

const slideRight = {
 initial: { opacity: 0, x: 24 },
 animate: { opacity: 1, x: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } },
 exit: { opacity: 0, x: -24, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } },
};

const fadeUp = {
 initial: { opacity: 0, y: 12 },
 animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1], delay: 0.05 } },
};

export default function LoginPage() {
 const [isLogin, setIsLogin] = useState(true);
 const [step, setStep] = useState(0);

 const [name, setName] = useState('');
 const [email, setEmail] = useState('');
 const [password, setPassword] = useState('');
 const [showPassword, setShowPassword] = useState(false);

 const [companyName, setCompanyName] = useState('');
 const [companySize, setCompanySize] = useState('');
 const [industry, setIndustry] = useState('');
 const [source, setSource] = useState('');
 const [purpose, setPurpose] = useState('');

 const [loading, setLoading] = useState(false);
 const [error, setError] = useState('');
 const [stepErrors, setStepErrors] = useState<Record<number, string>>({});

 const setAuth = useAgentStore((s) => s.setAuth);

 const persistAuth = (token: string, user: { id: string; name: string; email: string }, workspaceId: string) => {
 localStorage.setItem('token', token);
 localStorage.setItem('user', JSON.stringify(user));
 localStorage.setItem('workspaceId', workspaceId);
 document.cookie = `token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
 setAuth(token, { id: user.id, name: user.name, email: user.email }, workspaceId);
 };

 const getPasswordStrength = (pwd: string): { score: number; label: string; color: string } => {
 if (!pwd) return { score: 0, label: '', color: '' };
 let score = 0;
 if (pwd.length >= 6) score++;
 if (pwd.length >= 10) score++;
 if (/[A-Z]/.test(pwd)) score++;
 if (/[0-9]/.test(pwd)) score++;
 if (/[^A-Za-z0-9]/.test(pwd)) score++;
if (score <= 2) return { score: 1, label: 'Слабый', color: 'bg-[var(--danger)]' };
  if (score <= 3) return { score: 2, label: 'Средний', color: 'bg-[var(--warning)]' };
  return { score: 3, label: 'Надёжный', color: 'bg-[var(--success)]' };
 };

 const stepError = stepErrors[step] || '';

 useEffect(() => {
 if (!error && !stepError) return;
 const t = setTimeout(() => {
 setError('');
 setStepErrors({});
 }, 5000);
 return () => clearTimeout(t);
 }, [error, stepError]);

 const nextStep = () => {
 if (step === 0) {
 if (!name || !email || !password) {
 setStepErrors(p => ({ ...p, 0: 'Заполните все поля' }));
 return;
 }
 if (password.length < 6) {
 setStepErrors(p => ({ ...p, 0: 'Пароль должен быть не менее 6 символов' }));
 return;
 }
 setStepErrors(p => ({ ...p, 0: '' }));
 } else if (step === 1) {
 setStepErrors(p => ({ ...p, 1: '' }));
 }
 setStep(s => s + 1);
 };

 const prevStep = () => {
 setStep(s => s - 1);
 setError('');
 };

 const handleRegister = async () => {
 setLoading(true);
 setError('');
 try {
 const res = await fetch(`${API_BASE}/api/auth/register`, {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 name,
 email,
 password,
 workspaceName: companyName || `${name}'s Workspace`,
 companyName,
 companySize,
 industry,
 source,
 purpose,
 }),
 });
 const data = await res.json();
 if (!res.ok) throw new Error(data.error || 'Ошибка регистрации');

 persistAuth(data.accessToken, data.user, data.workspaceId);
 window.location.href = '/onboarding';
 } catch (err: unknown) {
 setError(err instanceof Error ? err.message : 'Ошибка регистрации');
 setStep(0);
 } finally {
 setLoading(false);
 }
 };

 const handleLogin = async (e: React.FormEvent) => {
 e.preventDefault();
 setLoading(true);
 setError('');
 try {
 const res = await fetch(`${API_BASE}/api/auth/login`, {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ email, password }),
 });
 const data = await res.json();
 if (!res.ok) throw new Error(data.error || 'Ошибка входа');

 persistAuth(data.accessToken, data.user, data.workspaceId);

 const meRes = await fetch(`${API_BASE}/api/auth/me`, {
 headers: { Authorization: `Bearer ${data.accessToken}` },
 });
 if (meRes.ok) {
 const me = await meRes.json();
 if (me.workspace?.settings?.onboardingCompleted) {
 window.location.href = '/dashboard';
 return;
 }
 }
 window.location.href = '/onboarding';
 } catch (err: unknown) {
 setError(err instanceof Error ? err.message : 'Ошибка входа');
 } finally {
 setLoading(false);
 }
 };

 const inputClass = "w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-surface focus:outline-none focus:ring-2 focus-visible:ring-[var(--brand)] focus-visible:border-[var(--brand)] transition-all text-[var(--text)] placeholder:text-[var(--text-muted)] text-sm";

 const renderLogin = () => (
 <form onSubmit={handleLogin} className="space-y-4">
 <div>
 <label className="block text-sm font-medium text-[var(--text)] mb-1.5">Email</label>
 <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
 className={inputClass} placeholder="you@company.com" />
 </div>
 <div>
 <label className="block text-sm font-medium text-[var(--text)] mb-1.5">Пароль</label>
 <div className="relative">
 <input type={showPassword ? 'text' : 'password'} value={password}
 onChange={e => setPassword(e.target.value)} required minLength={6}
 className={`${inputClass} pr-12`} placeholder="••••••••" />
 <button type="button" onClick={() => setShowPassword(!showPassword)}
 className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-muted)] transition-colors">
 {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
 </button>
 </div>
 </div>
 {error && (
 <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
 className="p-3 rounded-xl bg-danger-soft border border-[var(--danger-soft)] text-danger text-sm text-center">{error}</motion.div>
 )}
 <button type="submit" disabled={loading}
 className="w-full btn-primary text-sm py-3 disabled:opacity-60">
 {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Войти <ArrowRight className="w-4 h-4" /></>}
 </button>
 </form>
 );

 const renderStep1 = () => (
 <motion.div key="step1" {...slideRight} className="space-y-4">
 <div>
 <label className="block text-sm font-medium text-[var(--text)] mb-1.5">Как вас зовут?</label>
 <input type="text" value={name} onChange={e => setName(e.target.value)}
 className={inputClass} placeholder="Иван Иванов" autoFocus />
 </div>
 <div>
 <label className="block text-sm font-medium text-[var(--text)] mb-1.5">Рабочий email</label>
 <input type="email" value={email} onChange={e => setEmail(e.target.value)}
 className={inputClass} placeholder="you@company.com" />
 </div>
 <div>
 <label className="block text-sm font-medium text-[var(--text)] mb-1.5">Пароль</label>
 <div className="relative">
 <input type={showPassword ? 'text' : 'password'} value={password}
 onChange={e => setPassword(e.target.value)} minLength={6}
 className={`${inputClass} pr-12`} placeholder="Минимум 6 символов" />
 <button type="button" onClick={() => setShowPassword(!showPassword)}
 className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-muted)] transition-colors">
 {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
 </button>
 </div>
 {getPasswordStrength(password).score > 0 && (
 <div className="flex items-center gap-1.5 mt-1.5">
 <div className="flex gap-0.5">
 {[1, 2, 3].map(bar => (
 <div key={bar} className={`w-6 h-1 rounded-full transition-colors ${
 bar <= getPasswordStrength(password).score
 ? getPasswordStrength(password).color
 : 'bg-[var(--border)]'
 }`} />
 ))}
 </div>
 <span className="text-[10px] text-[var(--text-muted)]">{getPasswordStrength(password).label}</span>
 </div>
 )}
 </div>
 {stepError && (
 <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
 className="p-3 rounded-xl bg-danger-soft border border-[var(--danger-soft)] text-danger text-sm text-center">{stepError}</motion.div>
 )}
 <button onClick={nextStep}
 className="w-full btn-primary text-sm py-3">
 Далее <ArrowRight className="w-4 h-4" />
 </button>
 </motion.div>
 );

 const renderStep2 = () => (
 <motion.div key="step2" {...slideRight} className="space-y-4">
 <div>
 <label className="block text-sm font-medium text-[var(--text)] mb-1.5">Название компании</label>
 <div className="relative">
 <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
 <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)}
 className={`${inputClass} pl-10`} placeholder="Например: ООО «Ромашка»" autoFocus />
 </div>
 </div>
 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="block text-sm font-medium text-[var(--text)] mb-1.5">Размер команды</label>
 <div className="relative">
 <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
 <select value={companySize} onChange={e => setCompanySize(e.target.value)}
 className={`${inputClass} pl-10 appearance-none cursor-pointer`}>
 <option value="">Выберите</option>
 {COMPANY_SIZES.map(s => <option key={s} value={s}>{s} чел.</option>)}
 </select>
 </div>
 </div>
 <div>
 <label className="block text-sm font-medium text-[var(--text)] mb-1.5">Индустрия</label>
 <div className="relative">
 <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
 <select value={industry} onChange={e => setIndustry(e.target.value)}
 className={`${inputClass} pl-10 appearance-none cursor-pointer`}>
 <option value="">Выберите</option>
 {INDUSTRIES.map(ind => <option key={ind} value={ind}>{ind}</option>)}
 </select>
 </div>
 </div>
 </div>
 <div>
 <label className="block text-sm font-medium text-[var(--text)] mb-1.5">Откуда вы о нас узнали?</label>
 <div className="flex flex-wrap gap-2">
 {SOURCES.map(({ id, icon: Icon, label }) => (
 <button key={id} type="button" onClick={() => setSource(id)}
 className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all border
 ${source === id
 ? 'bg-[var(--brand)] text-white border-[var(--brand)] shadow-sm'
 : 'bg-surface text-[var(--text)] border-[var(--border)] hover:border-[var(--brand)]/30 hover:bg-[var(--accent-soft)]/50'}`}>
 <Icon className="w-3.5 h-3.5" /> {label}
 </button>
 ))}
 </div>
 </div>
 <div>
 <label className="block text-sm font-medium text-[var(--text)] mb-1.5">Для чего вам AI-агент?</label>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
 {PURPOSES.map(({ id, icon: Icon, label, desc }) => (
 <button key={id} type="button" onClick={() => setPurpose(id)}
 className={`flex items-start gap-3 p-3 rounded-xl text-left transition-all border
 ${purpose === id
 ? 'bg-[var(--accent-soft)] border-[var(--brand)]/40 ring-1 ring-[var(--brand)]/20'
 : 'bg-surface border-[var(--border)] hover:border-[var(--brand)]/30 hover:bg-[var(--accent-soft)]/30'}`}>
 <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${purpose === id ? 'text-[var(--brand)]' : 'text-[var(--text-muted)]'}`} />
 <div>
 <div className="text-sm font-semibold text-[var(--text)]">{label}</div>
 <div className="text-xs text-[var(--text-muted)] mt-0.5">{desc}</div>
 </div>
 </button>
 ))}
 </div>
 </div>
 <div className="flex gap-3 pt-1">
 <button onClick={prevStep}
 className="flex items-center gap-1.5 px-5 py-3 rounded-xl border border-[var(--border)] text-[var(--text)] hover:bg-[var(--accent-soft)] transition-all text-sm font-medium">
 <ArrowLeft className="w-4 h-4" /> Назад
 </button>
 <button onClick={nextStep}
 className="flex-1 btn-primary text-sm py-3">
 Далее <ArrowRight className="w-4 h-4" />
 </button>
 </div>
 </motion.div>
 );

 const renderStep3 = () => (
 <motion.div key="step3" {...slideRight} className="space-y-5">
 <div className="bg-surface rounded-2xl p-5 border border-[var(--border)] shadow-sm">
 <h3 className="text-sm font-semibold text-[var(--text)] mb-4 flex items-center gap-2">
 <div className="w-6 h-6 rounded-full bg-[var(--accent-soft)] flex items-center justify-center">
 <Check className="w-3.5 h-3.5 text-[var(--brand)]" />
 </div>
 Проверьте данные
 </h3>
 <div className="space-y-2.5 text-sm">
 <div className="flex justify-between items-center py-1.5 px-3 rounded-lg bg-[var(--accent-soft)]/40">
 <span className="text-[var(--text-muted)]">Имя</span>
 <span className="font-medium text-[var(--text)]">{name}</span>
 </div>
 <div className="flex justify-between items-center py-1.5 px-3 rounded-lg bg-[var(--accent-soft)]/40">
 <span className="text-[var(--text-muted)]">Email</span>
 <span className="font-medium text-[var(--text)]">{email}</span>
 </div>
 {companyName && (
 <div className="flex justify-between items-center py-1.5 px-3 rounded-lg bg-[var(--accent-soft)]/40">
 <span className="text-[var(--text-muted)]">Компания</span>
 <span className="font-medium text-[var(--text)]">{companyName}</span>
 </div>
 )}
 {companySize && (
 <div className="flex justify-between items-center py-1.5 px-3 rounded-lg bg-[var(--accent-soft)]/40">
 <span className="text-[var(--text-muted)]">Команда</span>
 <span className="font-medium text-[var(--text)]">{companySize} чел.</span>
 </div>
 )}
 {industry && (
 <div className="flex justify-between items-center py-1.5 px-3 rounded-lg bg-[var(--accent-soft)]/40">
 <span className="text-[var(--text-muted)]">Индустрия</span>
 <span className="font-medium text-[var(--text)]">{industry}</span>
 </div>
 )}
 {purpose && (
 <div className="flex justify-between items-center py-1.5 px-3 rounded-lg bg-[var(--accent-soft)]/40">
 <span className="text-[var(--text-muted)]">Цель</span>
 <span className="font-medium text-[var(--text)]">{PURPOSES.find(p => p.id === purpose)?.label}</span>
 </div>
 )}
 </div>
 </div>

 <div className="bg-success-soft/60 rounded-2xl p-4 border border-[var(--success-soft)] flex items-start gap-3">
 <div className="w-8 h-8 rounded-full bg-[var(--success-soft)] flex items-center justify-center flex-shrink-0 mt-0.5">
 <Check className="w-4 h-4 text-success" />
 </div>
 <div>
 <div className="text-sm font-semibold text-[var(--success)]">7 дней бесплатно</div>
 <div className="text-xs text-success mt-0.5 leading-relaxed">
 После регистрации вы получите полный доступ ко всем функциям на 7 дней.
 При оформлении подписки — $10 на баланс для AI-запросов ежемесячно.
 </div>
 </div>
 </div>

 {error && (
 <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
 className="p-3 rounded-xl bg-danger-soft border border-[var(--danger-soft)] text-danger text-sm">{error}</motion.div>
 )}

 <div className="flex gap-3">
 <button onClick={prevStep}
 className="flex items-center gap-1.5 px-5 py-3 rounded-xl border border-[var(--border)] text-[var(--text)] hover:bg-[var(--accent-soft)] transition-all text-sm font-medium">
 <ArrowLeft className="w-4 h-4" /> Назад
 </button>
 <button onClick={handleRegister} disabled={loading}
 className="flex-1 btn-primary text-sm py-3 disabled:opacity-60">
 {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Создать аккаунт <Check className="w-4 h-4" /></>}
 </button>
 </div>

 <p className="text-center text-xs text-[var(--text-muted)] leading-relaxed">
 Создавая аккаунт, вы соглашаетесь с{' '}
 <a href="/privacy" className="text-[var(--brand)] hover:text-[var(--brand)] underline underline-offset-2">Политикой конфиденциальности</a>
 {' '}и{' '}
 <a href="/terms" className="text-[var(--brand)] hover:text-[var(--brand)] underline underline-offset-2">Условиями использования</a>
 </p>
 </motion.div>
 );

 const renderProgress = () => (
 <div className="flex items-center justify-center mb-6">
 {STEPS.map((s, i) => (
 <div key={s.num} className="flex items-center">
 <motion.div
 initial={false}
 animate={{
        background: i <= step ? 'var(--brand)' : 'var(--surface-2)',
        color: i <= step ? 'var(--surface)' : 'var(--text-muted)',
 scale: i === step ? 1.15 : 1,
 }}
 transition={{ type: 'spring', stiffness: 400, damping: 25 }}
 className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
 >
 {i < step ? <Check className="w-3.5 h-3.5" /> : s.num}
 </motion.div>
 <span className={`text-xs font-medium hidden sm:block ml-2 mr-1 ${i <= step ? 'text-[var(--text)]' : 'text-[var(--text-muted)]'}`}>
 {s.label}
 </span>
 {i < STEPS.length - 1 && (
 <div className="relative w-8 sm:w-12 h-0.5 rounded-full bg-[var(--border)] overflow-hidden mx-1">
 <motion.div
 initial={false}
 animate={{ width: i < step ? '100%' : '0%' }}
 transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
 className="absolute inset-0 bg-[var(--brand)] rounded-full"
 />
 </div>
 )}
 </div>
 ))}
 </div>
 );

 const renderBackground = () => (
 <div className="absolute inset-0 pointer-events-none overflow-hidden">
 <motion.div
 className="absolute -top-48 -left-48 w-[700px] h-[700px] rounded-full opacity-40"
 style={{ background: 'radial-gradient(circle, color-mix(in srgb, var(--surface) 92%, var(--brand)) 0%, color-mix(in srgb, var(--surface) 97%, var(--brand)) 40%, transparent 70%)' }}
 animate={{ x: [0, 30, -15, 0], y: [0, -20, 15, 0], scale: [1, 1.05, 0.97, 1] }}
 transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
 />
 <motion.div
 className="absolute -bottom-48 -right-48 w-[600px] h-[600px] rounded-full opacity-30"
 style={{ background: 'radial-gradient(circle, color-mix(in srgb, var(--brand) 60%, transparent) 0%, color-mix(in srgb, var(--brand) 20%, transparent) 40%, transparent 70%)' }}
 animate={{ x: [0, -40, 25, 0], y: [0, 30, -20, 0], scale: [1, 0.93, 1.05, 1] }}
 transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
 />
 </div>
 );

 const renderLoginHeader = () => (
 <div className="text-center mb-8">
 <div className="inline-flex items-center gap-2 mb-1">
 <div className="w-2 h-2 rounded-full bg-[var(--brand)] animate-pulse" />
 <span className="text-xs font-semibold text-[var(--brand)] uppercase tracking-wider">AgentCore</span>
 </div>
 <h1 className="font-display font-bold text-2xl text-[var(--text)] mb-2">
 С возвращением
 </h1>
 <p className="text-[var(--text-muted)] text-sm">Войдите в рабочую область</p>
 </div>
 );

 const renderRegisterHeader = () => (
 <div className="text-center mb-2">
 <div className="inline-flex items-center gap-2 mb-1">
 <Heart className="w-4 h-4 text-[var(--brand)]" />
 <span className="text-xs font-semibold text-[var(--brand)] uppercase tracking-wider">AgentCore</span>
 </div>
 <h1 className="font-display font-bold text-2xl text-[var(--text)] mb-1">
 {step === 0 && 'Давайте познакомимся'}
 {step === 1 && 'Расскажите о вашем бизнесе'}
 {step === 2 && 'Всё готово к запуску'}
 </h1>
 <p className="text-[var(--text-muted)] text-sm">
 {step === 0 && 'Создайте аккаунт за 2 минуты'}
 {step === 1 && 'Это поможет нам настроить AI под ваши задачи'}
 {step === 2 && 'Проверьте данные и начните работу'}
 </p>
 </div>
 );

 return (
 <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] relative overflow-hidden">
 {renderBackground()}

 <motion.div
 initial={{ opacity: 0, y: 24 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
 className="relative z-10 w-full max-w-lg px-6"
 >
 <div className="bg-surface/80 backdrop-blur-xl rounded-2xl shadow-sm border border-[var(--border)] overflow-hidden">
 {!isLogin && (
 <div className="bg-[var(--accent-soft)] border-b border-[var(--border)]/30 px-6 py-3 flex items-center justify-center gap-2">
 <span className="text-sm font-medium text-[var(--brand)]">7 дней бесплатного доступа при регистрации</span>
 </div>
 )}

 <div className="p-8">
 {isLogin ? renderLoginHeader() : renderRegisterHeader()}

 {!isLogin && renderProgress()}

 <AnimatePresence mode="wait">
 {isLogin ? (
 <motion.div key="login" {...fadeUp}>
 {renderLogin()}
 </motion.div>
 ) : (
 <>
 {step === 0 && renderStep1()}
 {step === 1 && renderStep2()}
 {step === 2 && renderStep3()}
 </>
 )}
 </AnimatePresence>

 <div className="mt-6 flex items-center justify-center">
 <div className="inline-flex bg-[var(--accent-soft)] rounded-xl p-1">
 <button
 onClick={() => { if (!isLogin) { setIsLogin(true); setStep(0); setError(''); setStepErrors({}); } }}
 className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
 isLogin
 ? 'bg-surface text-[var(--text)] shadow-sm'
 : 'text-[var(--text-muted)] hover:text-[var(--text)]'
 }`}
 >
 Вход
 </button>
 <button
 onClick={() => { if (isLogin) { setIsLogin(false); setStep(0); setError(''); setStepErrors({}); } }}
 className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
 !isLogin
 ? 'bg-surface text-[var(--text)] shadow-sm'
 : 'text-[var(--text-muted)] hover:text-[var(--text)]'
 }`}
 >
 Регистрация
 </button>
 </div>
 </div>
 </div>
 </div>

 <p className="mt-6 text-center text-xs text-[var(--text-muted)] leading-relaxed">
 Защищено шифрованием. Ваши данные не передаются третьим лицам.
 </p>
 </motion.div>
 </div>
 );
}
