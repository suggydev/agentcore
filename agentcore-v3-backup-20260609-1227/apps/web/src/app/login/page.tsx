'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Heart } from 'lucide-react';
import { useAgentStore } from '@/store/agentStore';
import ErrorBoundary from '@/components/ErrorBoundary';
import LoginForm from '@/components/auth/LoginForm';
import RegisterForm from '@/components/auth/RegisterForm';
import PasswordResetForm from '@/components/auth/PasswordResetForm';
import type { RegisterData } from '@/components/auth/RegisterForm';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

const STEPS = [
  { num: 1, label: 'Аккаунт' },
  { num: 2, label: 'О компании' },
  { num: 3, label: 'Запуск' },
];

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1], delay: 0.05 } },
};

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [isReset, setIsReset] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(0);
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  const setAuth = useAgentStore((s) => s.setAuth);

  const persistAuth = (token: string, user: { id: string; name: string; email: string; role?: string }, workspaceId: string) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('workspaceId', workspaceId);
    document.cookie = `token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax; Secure`;
    setAuth(token, { id: user.id, name: user.name, email: user.email }, workspaceId);
  };

  useEffect(() => {
    return () => { abortRef.current?.abort(); };
  }, []);

  // Auto-clearing error removed: screen readers need stable messages.

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
    };
  }, []);

  const handleLogin = async (email: string, password: string) => {
    if (!email.trim()) { setError('Введите email'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Некорректный email'); return; }
    if (!password) { setError('Введите пароль'); return; }
    if (password.length < 6) { setError('Пароль должен быть не менее 6 символов'); return; }
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
          router.push('/agents');
          return;
        }
      }
      router.push('/onboarding');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (data: RegisterData) => {
    if (!data.name.trim()) { setError('Введите имя'); return; }
    if (!data.email.trim()) { setError('Введите email'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) { setError('Некорректный email'); return; }
    if (!data.password) { setError('Введите пароль'); return; }
    if (data.password.length < 6) { setError('Пароль должен быть не менее 6 символов'); return; }
    if (data.password !== data.confirmPassword) { setError('Пароли не совпадают'); return; }
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
          workspaceName: data.companyName || `${data.name}'s Workspace`,
          companyName: data.companyName,
          companySize: data.companySize,
          industry: data.industry,
          source: data.source,
          purpose: data.purpose,
        }),
        signal: controller.signal,
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Ошибка регистрации');

      persistAuth(resData.accessToken, resData.user, resData.workspaceId);
      setRegisterSuccess(true);
      redirectTimerRef.current = setTimeout(() => {
        router.push('/onboarding');
      }, 800);
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (email: string) => {
    if (!email.trim()) { setResetError('Введите email'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setResetError('Некорректный email'); return; }
    setResetLoading(true);
    setResetError('');
    try {
      const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка сброса пароля');
      setResetSuccess(true);
    } catch (err: unknown) {
      setResetError(err instanceof Error ? err.message : 'Ошибка сброса пароля');
    } finally {
      setResetLoading(false);
    }
  };

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

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] relative overflow-hidden">
        {renderBackground()}

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 w-full max-w-lg px-4 sm:px-6"
        >
          <div className="bg-surface/80 backdrop-blur-xl rounded-2xl shadow-sm border border-[var(--border)] overflow-hidden">
            {!isLogin && !isReset && (
              <div className="bg-[var(--accent-soft)] border-b border-[var(--border)]/30 px-4 sm:px-6 py-3 flex items-center justify-center gap-2">
                <span className="text-sm font-medium text-[var(--brand)]">7 дней пробного периода при регистрации</span>
              </div>
            )}

            <div className="p-6 sm:p-8">
              {isLogin && !isReset && renderLoginHeader()}
              {!isLogin && !isReset && renderRegisterHeader()}
              {isReset && (
                <div className="text-center mb-8">
                  <div className="inline-flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-[var(--brand)] animate-pulse" />
                    <span className="text-xs font-semibold text-[var(--brand)] uppercase tracking-wider">AgentCore</span>
                  </div>
                  <h1 className="font-display font-bold text-2xl text-[var(--text)] mb-2">Восстановление доступа</h1>
                  <p className="text-[var(--text-muted)] text-sm">Сбросьте пароль от рабочей области</p>
                </div>
              )}

              {!isLogin && !isReset && renderProgress()}

              <AnimatePresence mode="wait">
                {isReset ? (
                  <motion.div key="reset" {...fadeUp}>
                    <PasswordResetForm
                      onSubmit={handleResetPassword}
                      onBack={() => { setIsReset(false); setResetError(''); setResetSuccess(false); }}
                      loading={resetLoading}
                      error={resetError}
                      success={resetSuccess}
                    />
                  </motion.div>
                ) : isLogin ? (
                  <motion.div key="login" {...fadeUp}>
                    <LoginForm onSubmit={handleLogin} loading={loading} error={error} onForgotPassword={() => { setIsReset(true); setError(''); }} />
                  </motion.div>
                ) : (
                  <motion.div key="register" {...fadeUp}>
                    <RegisterForm onRegister={handleRegister} loading={loading} error={error} stepError={''} onStepChange={setStep} />
                  </motion.div>
                )}
              </AnimatePresence>

              {!isReset && (
                <div className="mt-6 flex items-center justify-center">
                  <div className="inline-flex bg-[var(--accent-soft)] rounded-xl p-1" role="tablist">
                    <button type="button" role="tab" aria-selected={isLogin} tabIndex={isLogin ? 0 : -1}
                      onClick={() => { if (!isLogin) { setIsLogin(true); setStep(0); setError(''); } }}
                      className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                        isLogin
                          ? 'bg-surface text-[var(--text)] shadow-sm'
                          : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                      }`}
                    >
                      Вход
                    </button>
                    <button type="button" role="tab" aria-selected={!isLogin} tabIndex={!isLogin ? 0 : -1}
                      onClick={() => { if (isLogin) { setIsLogin(false); setStep(0); setError(''); } }}
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
              )}
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-[var(--text-muted)] leading-relaxed">
            Защищено шифрованием. Ваши данные не передаются третьим лицам.
          </p>
        </motion.div>

        <AnimatePresence>
          {registerSuccess && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 z-50 flex items-center justify-center bg-[var(--bg)]/90 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
                className="text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.2 }}
                  className="w-20 h-20 rounded-full bg-[var(--success)] mx-auto mb-5 flex items-center justify-center"
                >
                  <Check className="w-10 h-10 text-white" />
                </motion.div>
                <h2 className="text-xl font-bold text-[var(--text)] mb-2">Аккаунт создан!</h2>
                <p className="text-sm text-[var(--text-muted)]">Перенаправляем в панель управления...</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ErrorBoundary>
  );
}
