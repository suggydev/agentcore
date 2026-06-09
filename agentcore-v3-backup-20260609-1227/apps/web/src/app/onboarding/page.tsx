'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  Loader2,
  Calendar,
} from 'lucide-react';
import Logo from '../../components/Logo';
import ErrorBoundary from '@/components/ErrorBoundary';
import CompanyStep from '@/components/onboarding/CompanyStep';
import ChannelStep from '@/components/onboarding/ChannelStep';
import GoalStep from '@/components/onboarding/GoalStep';

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

  const canContinueStep0 =
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
      router.push('/agents');
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
      const payload = {
        companyName: form.companyName,
        companySize: form.companySize,
        industry: form.industry,
        geography: form.geography,
        channels: form.channels,
        websiteUrl: form.websiteUrl,
        crm: form.crm,
        skipped: true,
        onboardingCompleted: true,
      };
      await fetch(`${API_BASE}/api/workspace`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      router.push('/agents');
    } catch (err) {
      if (process.env.NODE_ENV === 'development') console.error('[OnboardingPage] handleSkipForNow:', err);
      setError(err instanceof Error ? err.message : 'Не удалось пропустить онбординг. Попробуйте снова.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[var(--bg)] relative flex flex-col items-center justify-center px-4 py-12" suppressHydrationWarning>
        <div className="absolute inset-0 grid-lines opacity-40" />

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 w-full max-w-2xl"
        >
          <div className="flex justify-center mb-8">
            <Logo size={36} />
          </div>

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
              <p className="text-xs text-[var(--brand)] mt-0.5">Без привязки карты. При подписке — ₽1 000/мес на AI-баланс</p>
            </div>
          </motion.div>

          <div className="bg-surface rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden relative">
            <div className="px-6 sm:px-8 pt-5 pb-0 flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--text-muted)]">Шаг {step + 1} из 3</span>
              <div className="flex items-center gap-2">
                <div className={`w-10 h-1 rounded-full transition-all duration-500 ${step === 0 ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'}`} />
                <div className={`w-10 h-1 rounded-full transition-all duration-500 ${step === 1 ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'}`} />
                <div className={`w-10 h-1 rounded-full transition-all duration-500 ${step === 2 ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'}`} />
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
              {step === 0 && (
                <CompanyStep
                  key="company"
                  form={form}
                  update={update}
                />
              )}
              {step === 1 && (
                <ChannelStep
                  key="channel"
                  form={form}
                  update={update}
                  toggleChannel={toggleChannel}
                />
              )}
              {step === 2 && (
                <GoalStep
                  key="goal"
                  form={form}
                  update={update}
                />
              )}
            </AnimatePresence>

            <div className="px-6 sm:px-8 pb-8">
              <div className="flex items-center justify-between mt-6">
                <div>
                  {step > 0 && (
                    <button
                      type="button"
                      onClick={() => setStep(s => s - 1)}
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

                  {step < 2 ? (
                    <button
                      type="button"
                      disabled={(step === 0 && !canContinueStep0)}
                      onClick={() => setStep(s => s + 1)}
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

              <div className="flex items-center justify-center gap-2 mt-6">
                <div className={`w-2 h-2 rounded-full transition-all duration-300 ${step === 0 ? 'bg-[var(--brand)] w-6' : 'bg-[var(--border)]'}`} />
                <div className={`w-2 h-2 rounded-full transition-all duration-300 ${step === 1 ? 'bg-[var(--brand)] w-6' : 'bg-[var(--border)]'}`} />
                <div className={`w-2 h-2 rounded-full transition-all duration-300 ${step === 2 ? 'bg-[var(--brand)] w-6' : 'bg-[var(--border)]'}`} />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </ErrorBoundary>
  );
}
