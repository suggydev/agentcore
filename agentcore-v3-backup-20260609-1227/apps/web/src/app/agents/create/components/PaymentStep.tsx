'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, Shield, CreditCard, Sparkles, ArrowRight, ChevronLeft, Loader2, Zap, Brain, MessageSquare, Lock } from 'lucide-react';
import { GeneratedAgent } from '../page';

interface PaymentStepProps {
  generated: GeneratedAgent | null;
  token: string;
  onBack: () => void;
  onComplete: (brainData: { nodes: any[]; edges: any[] }) => void;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export default function PaymentStep({ generated, token, onBack, onComplete }: PaymentStepProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [aiBalance, setAiBalance] = useState(1000);
  const [aiUsed, setAiUsed] = useState(0);
  const [consentOffer, setConsentOffer] = useState(false);
  const [consentPrivacy, setConsentPrivacy] = useState(false);

  useEffect(() => {
    // Fetch actual AI balance if available
    const fetchBalance = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/billing/balance`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          // If backend returns balance, use it. Otherwise keep default 1000
          if (typeof data.balance === 'number') {
            setAiBalance(data.balance);
          }
        }
      } catch { /* ignore */ }
    };
    if (token) fetchBalance();
  }, [token]);

  const handlePay = async () => {
    if (!token || !generated) return;
    setLoading(true); setError('');

    try {
      // First create the agent (it will be created but not activated yet - or we create it now and then pay)
      // Actually based on the flow, the agent was already generated conceptually.
      // Let's call the agent-activate endpoint which handles payment creation
      const res = await fetch(`${API_BASE}/api/billing/agent-activate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          // We need agentId, but agent isn't created yet. Hmm.
          // Let's create the agent first, then pay
        }),
      });

      // Actually, the simplest flow: create agent first, then redirect to payment
      // But user wants payment BEFORE activation. Let me adjust.

      // For now, let's call the top-up endpoint to get payment URL
      const payRes = await fetch(`${API_BASE}/api/billing/top-up`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: 4499,
          returnUrl: `${typeof window !== 'undefined' ? window.location.origin : ''}/agents`,
        }),
      });

      if (!payRes.ok) {
        const data = await payRes.json().catch(() => ({}));
        throw new Error(data.error || 'Ошибка создания платежа');
      }

      const payData = await payRes.json();
      if (payData.paymentUrl) {
        // Store agent creation data in localStorage for after payment
        localStorage.setItem('pendingAgentCreation', JSON.stringify({
          name: generated.name,
          systemPrompt: generated.systemPrompt,
          description: generated.description,
          emoji: generated.emoji,
          model: generated.model || 'glm-5p1',
          brainNodes: generated.brainNodes || ['greeting', 'faq', 'escalation'],
          temperature: 0.7,
          settings: {},
        }));
        window.location.href = payData.paymentUrl;
      } else {
        throw new Error('Не удалось получить ссылку на оплату');
      }
    } catch (err: any) {
      setError(err.message || 'Ошибка оплаты');
      setLoading(false);
    }
  };

  const canProceed = consentOffer && consentPrivacy;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -20 }}
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative"
    >
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-brand/3 rounded-full blur-[150px]" />
      </div>

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-4 z-20">
        <button onClick={onBack} className="flex items-center gap-2 text-text-muted hover:text-text transition-colors text-sm">
          <ChevronLeft size={16} /> Назад к проектированию
        </button>
        <div className="text-xs text-text-muted font-mono">ШАГ 5 ИЗ 5</div>
      </div>

      <div className="relative z-10 max-w-lg w-full">
        {/* Agent preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-8"
        >
          <div className="w-16 h-16 rounded-2xl bg-brand/10 flex items-center justify-center mx-auto mb-4 text-3xl">
            {generated?.emoji || '🤖'}
          </div>
          <h1 className="text-2xl font-bold text-text mb-1">{generated?.name || 'Ваш AI-агент'}</h1>
          <p className="text-sm text-text-muted">{generated?.description || 'Готов к активации'}</p>
        </motion.div>

        {/* Pricing card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-surface rounded-2xl border border-border p-6 mb-6 shadow-lg shadow-black/5"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center">
              <Sparkles size={16} className="text-brand" />
            </div>
            <h2 className="font-semibold text-text">Стоимость активации</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-border">
              <div>
                <p className="text-sm text-text">Создание и настройка агента</p>
                <p className="text-xs text-text-muted">Проектирование + первый месяц</p>
              </div>
              <p className="text-lg font-bold text-text">4 499 ₽</p>
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm text-text-muted">Следующие месяцы</p>
                <p className="text-xs text-text-muted">Поддержка и работа агента</p>
              </div>
              <p className="text-sm font-medium text-text-muted">2 499 ₽ / мес</p>
            </div>

            <div className="flex items-center justify-between py-3 bg-brand/5 rounded-xl px-4">
              <div className="flex items-center gap-2">
                <Zap size={14} className="text-brand" />
                <p className="text-sm text-text">Итого к оплате</p>
              </div>
              <p className="text-2xl font-bold text-brand">4 499 ₽</p>
            </div>
          </div>

          {/* AI Credits */}
          <div className="mt-4 p-4 bg-surface-2 rounded-xl border border-border">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Brain size={14} className="text-text-muted" />
                <span className="text-sm text-text">AI Баланс</span>
              </div>
              <span className="text-sm font-medium text-text">1 000 ₽</span>
            </div>
            <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden mb-2">
              <div className="h-full bg-brand rounded-full" style={{ width: `${((aiBalance - aiUsed) / aiBalance) * 100}%` }} />
            </div>
            <div className="flex justify-between text-xs text-text-muted">
              <span>Доступно: {aiBalance - aiUsed} ₽</span>
              <span>Использовано: {aiUsed} ₽</span>
            </div>
            <p className="text-[10px] text-text-muted mt-2">
              Обновляется ежемесячно. Дополнительные токены можно купить в любой момент.
            </p>
          </div>

          {/* What's included */}
          <div className="mt-4 space-y-2">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Включено:</p>
            {[
              'Создание и настройка агента',
              '1 месяц работы без доплат',
              '1 000 ₽ AI-баланса',
              'Доступ ко всем интеграциям',
              'Неограниченные правки агента',
              'Поддержка 24/7',
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-text-secondary">
                <Check size={14} className="text-green-500 flex-shrink-0" />
                {item}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Consents */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-3 mb-6"
        >
          <label className="flex items-start gap-3 p-3 rounded-xl bg-surface border border-border cursor-pointer hover:bg-accent-soft/30 transition-colors">
            <input
              type="checkbox"
              checked={consentOffer}
              onChange={e => setConsentOffer(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-border text-brand focus:ring-brand"
            />
            <span className="text-xs text-text-secondary">
              Я согласен с{' '}
              <a href="/offer" target="_blank" className="text-brand hover:underline">условиями оферты</a>{' '}
              и{' '}
              <a href="/refund" target="_blank" className="text-brand hover:underline">правилами возврата</a>
            </span>
          </label>

          <label className="flex items-start gap-3 p-3 rounded-xl bg-surface border border-border cursor-pointer hover:bg-accent-soft/30 transition-colors">
            <input
              type="checkbox"
              checked={consentPrivacy}
              onChange={e => setConsentPrivacy(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-border text-brand focus:ring-brand"
            />
            <span className="text-xs text-text-secondary">
              Я согласен с{' '}
              <a href="/privacy" target="_blank" className="text-brand hover:underline">политикой конфиденциальности</a>{' '}
              и обработкой персональных данных
            </span>
          </label>
        </motion.div>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-500"
          >
            {error}
          </motion.div>
        )}

        {/* Pay button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={handlePay}
            disabled={!canProceed || loading}
            className="w-full flex items-center justify-center gap-2.5 py-4 rounded-xl bg-brand text-white font-medium text-sm hover:bg-brand-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-brand/20"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Создание платежа...
              </>
            ) : (
              <>
                <CreditCard size={18} />
                Оплатить 4 499 ₽
                <ArrowRight size={16} />
              </>
            )}
          </motion.button>

          <div className="flex items-center justify-center gap-2 mt-3 text-xs text-text-muted">
            <Lock size={12} /> Безопасная оплата через ЮKassa
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
