'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Eye, EyeOff, ArrowRight, ArrowLeft, Check, Building2, Users, Briefcase,
  Target, MessageCircle, Search, UserPlus, Share2, Megaphone, Linkedin,
  Instagram, Zap, Star, Loader2, Send,
} from 'lucide-react';

interface RegisterFormProps {
  onRegister: (data: RegisterData) => Promise<void>;
  loading: boolean;
  error: string;
  stepError: string;
  onStepChange?: (step: number) => void;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  companyName: string;
  companySize: string;
  industry: string;
  source: string;
  purpose: string;
}

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

const slideRight = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, x: -24, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } },
};

const inputClass = "w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-surface focus:outline-none focus:ring-2 focus-visible:ring-[var(--brand)] focus-visible:border-[var(--brand)] transition-all text-[var(--text)] placeholder:text-[var(--text-muted)] text-sm";
const inputClassErr = "w-full px-4 py-3 rounded-xl border border-[var(--danger)] bg-surface focus:outline-none focus:ring-2 focus-visible:ring-[var(--danger)] transition-all text-[var(--text)] placeholder:text-[var(--text-muted)] text-sm";

function getPasswordStrength(pwd: string): { score: number; label: string; color: string } {
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
}

const step1ErrorId = 'register-step1-error';
const step2ErrorId = 'register-step2-error';
const step3ErrorId = 'register-step3-error';

function Step1({
  name, setName, email, setEmail, password, setPassword, confirmPassword, setConfirmPassword,
  showPassword, setShowPassword, error, onNext,
}: {
  name: string; setName: (v: string) => void;
  email: string; setEmail: (v: string) => void;
  password: string; setPassword: (v: string) => void;
  confirmPassword: string; setConfirmPassword: (v: string) => void;
  showPassword: boolean; setShowPassword: (v: boolean) => void;
  error: string; onNext: () => void;
}) {
  const strength = useMemo(() => getPasswordStrength(password), [password]);

  const hasFieldError = (field: string) => {
    if (!error) return false;
    const msg = error.toLowerCase();
    if (field === 'email' && (msg.includes('email') || msg.includes('почт'))) return true;
    if (field === 'password' && (msg.includes('парол') || msg.includes('password'))) return true;
    if (field === 'name' && msg.includes('имя')) return true;
    if (field === 'confirmPassword' && msg.includes('совпада')) return true;
    if (!msg.includes('email') && !msg.includes('парол') && !msg.includes('имя') && !msg.includes('совпада')) return true;
    return false;
  };

  return (
    <motion.div key="step1" {...slideRight} className="space-y-4">
      <div>
        <label htmlFor="reg-name" className="block text-sm font-medium text-[var(--text)] mb-1.5">Как вас зовут?</label>
        <input id="reg-name" type="text" value={name} onChange={e => setName(e.target.value)}
          aria-invalid={hasFieldError('name')}
          aria-describedby={error ? step1ErrorId : undefined}
          className={hasFieldError('name') ? inputClassErr : inputClass} placeholder="Иван Иванов" />
      </div>
      <div>
        <label htmlFor="reg-email" className="block text-sm font-medium text-[var(--text)] mb-1.5">Рабочий email</label>
        <input id="reg-email" type="email" value={email} onChange={e => setEmail(e.target.value)}
          aria-invalid={hasFieldError('email')}
          aria-describedby={error ? step1ErrorId : undefined}
          className={hasFieldError('email') ? inputClassErr : inputClass} placeholder="you@company.com" />
      </div>
      <div>
        <label htmlFor="reg-password" className="block text-sm font-medium text-[var(--text)] mb-1.5">Пароль</label>
        <div className="relative">
          <input id="reg-password" type={showPassword ? 'text' : 'password'} value={password}
            onChange={e => setPassword(e.target.value)} minLength={6}
            aria-invalid={hasFieldError('password')}
            aria-describedby={error ? step1ErrorId : undefined}
            className={`${hasFieldError('password') ? inputClassErr : inputClass} pr-12`} placeholder="Минимум 6 символов" />
          <button type="button" onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
            aria-pressed={showPassword}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-muted)] transition-colors">
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {strength.score > 0 && (
          <div className="flex items-center gap-1.5 mt-1.5" aria-live="polite" aria-atomic="true">
            <div className="flex gap-0.5">
              {[1, 2, 3].map(bar => (
                <div key={bar} className={`w-6 h-1 rounded-full transition-colors ${
                  bar <= strength.score ? strength.color : 'bg-[var(--border)]'
                }`} />
              ))}
            </div>
            <span className="text-[10px] text-[var(--text-muted)]">{strength.label}</span>
          </div>
        )}
      </div>
      <div>
        <label htmlFor="reg-confirm" className="block text-sm font-medium text-[var(--text)] mb-1.5">Подтвердите пароль</label>
        <input id="reg-confirm" type={showPassword ? 'text' : 'password'} value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)} minLength={6}
          aria-invalid={hasFieldError('confirmPassword')}
          aria-describedby={error ? step1ErrorId : undefined}
          className={hasFieldError('confirmPassword') ? inputClassErr : inputClass} placeholder="Повторите пароль" />
      </div>
      {error && (
        <motion.div id={step1ErrorId} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
          aria-live="polite"
          aria-atomic="true"
          className="p-3 rounded-xl bg-danger-soft border border-[var(--danger-soft)] text-danger text-sm text-center">{error}</motion.div>
      )}
      <button type="button" onClick={onNext}
        className="w-full btn-primary text-sm py-3">
        Далее <ArrowRight className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

function Step2({
  companyName, setCompanyName,
  companySize, setCompanySize,
  industry, setIndustry,
  source, setSource,
  purpose, setPurpose,
  error, onPrev, onNext,
}: {
  companyName: string; setCompanyName: (v: string) => void;
  companySize: string; setCompanySize: (v: string) => void;
  industry: string; setIndustry: (v: string) => void;
  source: string; setSource: (v: string) => void;
  purpose: string; setPurpose: (v: string) => void;
  error: string; onPrev: () => void; onNext: () => void;
}) {
  return (
    <motion.div key="step2" {...slideRight} className="space-y-4">
      <div>
        <label htmlFor="reg-company" className="block text-sm font-medium text-[var(--text)] mb-1.5">Название компании</label>
        <div className="relative">
          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input id="reg-company" type="text" value={companyName} onChange={e => setCompanyName(e.target.value)}
            className={`${inputClass} pl-10`} placeholder="Например: ООО «Ромашка»" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="reg-size" className="block text-sm font-medium text-[var(--text)] mb-1.5">Размер команды</label>
          <div className="relative">
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <select id="reg-size" value={companySize} onChange={e => setCompanySize(e.target.value)}
              className={`${inputClass} pl-10 appearance-none cursor-pointer`}>
              <option value="">Выберите</option>
              {COMPANY_SIZES.map(s => <option key={s} value={s}>{s} чел.</option>)}
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="reg-industry" className="block text-sm font-medium text-[var(--text)] mb-1.5">Индустрия</label>
          <div className="relative">
            <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <select id="reg-industry" value={industry} onChange={e => setIndustry(e.target.value)}
              className={`${inputClass} pl-10 appearance-none cursor-pointer`}>
              <option value="">Выберите</option>
              {INDUSTRIES.map(ind => <option key={ind} value={ind}>{ind}</option>)}
            </select>
          </div>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-[var(--text)] mb-1.5">Откуда вы о нас узнали?</label>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Источник">
          {SOURCES.map(({ id, icon: Icon, label }) => (
            <button key={id} type="button" onClick={() => setSource(id)}
              aria-pressed={source === id}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all border ${
                source === id
                  ? 'bg-[var(--brand)] text-white border-[var(--brand)] shadow-sm'
                  : 'bg-surface text-[var(--text)] border-[var(--border)] hover:border-[var(--brand)]/30 hover:bg-[var(--accent-soft)]/50'
              }`}>
              <Icon className="w-3.5 h-3.5" /> {label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-[var(--text)] mb-1.5">Для чего вам AI-агент?</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" role="group" aria-label="Цель использования">
          {PURPOSES.map(({ id, icon: Icon, label, desc }) => (
            <button key={id} type="button" onClick={() => setPurpose(id)}
              aria-pressed={purpose === id}
              className={`flex items-start gap-3 p-3 rounded-xl text-left transition-all border ${
                purpose === id
                  ? 'bg-[var(--accent-soft)] border-[var(--brand)]/40 ring-1 ring-[var(--brand)]/20'
                  : 'bg-surface border-[var(--border)] hover:border-[var(--brand)]/30 hover:bg-[var(--accent-soft)]/30'
              }`}>
              <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${purpose === id ? 'text-[var(--brand)]' : 'text-[var(--text-muted)]'}`} />
              <div>
                <div className="text-sm font-semibold text-[var(--text)]">{label}</div>
                <div className="text-xs text-[var(--text-muted)] mt-0.5">{desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
      {error && (
        <motion.div id={step2ErrorId} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
          aria-live="polite"
          aria-atomic="true"
          className="p-3 rounded-xl bg-danger-soft border border-[var(--danger-soft)] text-danger text-sm text-center">{error}</motion.div>
      )}
      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onPrev}
          className="flex items-center gap-1.5 px-5 py-3 rounded-xl border border-[var(--border)] text-[var(--text)] hover:bg-[var(--accent-soft)] transition-all text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Назад
        </button>
        <button type="button" onClick={onNext}
          className="flex-1 btn-primary text-sm py-3">
          Далее <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}

function Step3({
  name, email, companyName, companySize, industry, purpose,
  loading, error, onPrev, onRegister,
}: {
  name: string; email: string;
  companyName: string; companySize: string; industry: string;
  purpose: string;
  loading: boolean; error: string;
  onPrev: () => void; onRegister: () => void;
}) {
  const purposeLabel = PURPOSES.find(p => p.id === purpose)?.label;

  return (
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
              <span className="font-medium text-[var(--text)]">{purposeLabel}</span>
            </div>
          )}
        </div>
      </div>

      <div className="bg-success-soft/60 rounded-2xl p-4 border border-[var(--success-soft)] flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-[var(--success-soft)] flex items-center justify-center flex-shrink-0 mt-0.5">
          <Check className="w-4 h-4 text-success" />
        </div>
        <div>
          <div className="text-sm font-semibold text-[var(--success)]">7 дней пробного периода</div>
          <div className="text-xs text-success mt-0.5 leading-relaxed">
            После регистрации вы получите полный доступ ко всем функциям на 7 дней.
            При оформлении подписки — ₽1 000 на баланс для AI-запросов ежемесячно.
          </div>
        </div>
      </div>

      {error && (
        <motion.div id={step3ErrorId} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          aria-live="polite"
          aria-atomic="true"
          className="p-3 rounded-xl bg-danger-soft border border-[var(--danger-soft)] text-danger text-sm">{error}</motion.div>
      )}

      <div className="flex gap-3">
        <button type="button" onClick={onPrev}
          className="flex items-center gap-1.5 px-5 py-3 rounded-xl border border-[var(--border)] text-[var(--text)] hover:bg-[var(--accent-soft)] transition-all text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Назад
        </button>
        <button type="button" onClick={onRegister} disabled={loading}
          className="flex-1 btn-primary text-sm py-3 disabled:opacity-60">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><span>Создать аккаунт</span> <Check className="w-4 h-4" /></>}
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
}

export default function RegisterForm({ onRegister, loading, error, stepError, onStepChange }: RegisterFormProps) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companySize, setCompanySize] = useState('');
  const [industry, setIndustry] = useState('');
  const [source, setSource] = useState('');
  const [purpose, setPurpose] = useState('');
  const [clientError, setClientError] = useState('');

  const validateStep0 = (): string | null => {
    if (!name.trim()) return 'Введите имя';
    if (!email.trim()) return 'Введите email';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Некорректный email';
    if (!password) return 'Введите пароль';
    if (password.length < 6) return 'Пароль должен быть не менее 6 символов';
    if (password !== confirmPassword) return 'Пароли не совпадают';
    return null;
  };

  const validateStep1 = (): string | null => {
    if (!companyName.trim()) return 'Введите название компании';
    if (!companySize) return 'Выберите размер команды';
    if (!industry) return 'Выберите индустрию';
    if (!source) return 'Выберите источник';
    if (!purpose) return 'Выберите цель использования';
    return null;
  };

  const handleNext = () => {
    if (step === 0) {
      const err = validateStep0();
      setClientError(err || '');
      if (err) return;
    }
    if (step === 1) {
      const err = validateStep1();
      setClientError(err || '');
      if (err) return;
    }
    setClientError('');
    const next = step + 1;
    setStep(next);
    onStepChange?.(next);
  };

  const handlePrev = () => {
    const prev = step - 1;
    setStep(prev);
    setClientError('');
    onStepChange?.(prev);
  };

  const handleRegister = () => {
    if (step === 2) {
      const err = validateStep0();
      if (err) return;
      onRegister({ name, email, password, confirmPassword, companyName, companySize, industry, source, purpose });
    }
  };

  const displayError = step === 0 ? error : (step === 1 ? clientError : error);

  return (
    <>
      {step === 0 && (
        <Step1
          name={name} setName={setName}
          email={email} setEmail={setEmail}
          password={password} setPassword={setPassword}
          confirmPassword={confirmPassword} setConfirmPassword={setConfirmPassword}
          showPassword={showPassword} setShowPassword={setShowPassword}
          error={displayError}
          onNext={handleNext}
        />
      )}
      {step === 1 && (
        <Step2
          companyName={companyName} setCompanyName={setCompanyName}
          companySize={companySize} setCompanySize={setCompanySize}
          industry={industry} setIndustry={setIndustry}
          source={source} setSource={setSource}
          purpose={purpose} setPurpose={setPurpose}
          error={displayError}
          onPrev={handlePrev}
          onNext={handleNext}
        />
      )}
      {step === 2 && (
        <Step3
          name={name} email={email}
          companyName={companyName} companySize={companySize}
          industry={industry} purpose={purpose}
          loading={loading} error={displayError}
          onPrev={handlePrev}
          onRegister={handleRegister}
        />
      )}
    </>
  );
}
