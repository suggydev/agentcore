'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield, CreditCard, Check, AlertCircle, Loader2, Bot, Sparkles, Zap, Brain, Clock, Lock } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const agentId = searchParams.get('agent') || '';

  const [acceptedOffer, setAcceptedOffer] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [companyData, setCompanyData] = useState({ email: 'hello@agentcore.work' });

  useEffect(() => {
    fetch(`${API_BASE}/api/legal/legal`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.email) setCompanyData(prev => ({ ...prev, ...data }));
      })
      .catch(() => {});
  }, []);

  const handlePayment = async () => {
    if (!acceptedOffer || !acceptedPrivacy) return;

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login?redirect=/checkout');
        return;
      }

      const endpoint = agentId ? '/api/billing/agent-activate' : '/api/billing/top-up';
      const body = agentId
        ? { agentId, returnUrl: `${window.location.origin}/agents` }
        : { amount: 4499, returnUrl: `${window.location.origin}/agents` };

      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка при создании платежа');

      if (data.paymentUrl || data.confirmation?.confirmation_url) {
        window.location.href = data.paymentUrl || data.confirmation.confirmation_url;
      } else {
        setSuccess(true);
      }
    } catch (err: any) {
      setError(err.message || 'Не удалось создать платёж');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="max-w-md mx-auto px-5 text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-xl font-bold text-text mb-2">Платёж создан</h1>
          <p className="text-sm text-text-muted mb-6">Перенаправляем на страницу оплаты ЮKassa...</p>
          <Link href="/" className="text-sm text-brand underline">На главную</Link>
        </div>
      </div>
    );
  }

  const allAccepted = acceptedOffer && acceptedPrivacy;

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-2xl mx-auto px-5 py-16">
        <Link href="/pricing" className="inline-flex items-center gap-1.5 text-sm text-brand hover:text-brand mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> К ценам
        </Link>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-text mb-2">Оформление заказа</h1>
          <p className="text-sm text-text-muted">Активация AI-агента для вашего бизнеса</p>
        </div>

        {/* Order summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface rounded-2xl border border-border p-6 mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center">
              <Bot size={20} className="text-brand" />
            </div>
            <div>
              <h2 className="font-semibold text-text">AI-Агент</h2>
              <p className="text-xs text-text-muted">Полноценный цифровой сотрудник</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-text-muted" />
                <span className="text-sm text-text">Создание и настройка</span>
              </div>
              <span className="text-sm text-text-muted">Включено</span>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Zap size={14} className="text-text-muted" />
                <span className="text-sm text-text">Первый месяц работы</span>
              </div>
              <span className="text-sm text-text-muted">Включено</span>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Brain size={14} className="text-text-muted" />
                <span className="text-sm text-text">AI-баланс</span>
              </div>
              <span className="text-sm text-brand font-medium">1 000 ₽ / мес</span>
            </div>

            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-text-muted" />
                <span className="text-sm text-text">Следующие месяцы</span>
              </div>
              <span className="text-sm text-text-muted">2 499 ₽ / мес</span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
            <span className="text-sm text-text">Итого к оплате</span>
            <span className="text-2xl font-bold text-brand">4 499 ₽</span>
          </div>
        </motion.div>

        {/* Consent Checkboxes */}
        <div className="space-y-3 mb-8">
          <h2 className="text-sm font-semibold text-text uppercase tracking-wider mb-3">Примите условия</h2>

          <label className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
            acceptedOffer ? 'border-brand bg-brand/5' : 'border-border bg-surface'
          }`}>
            <input
              type="checkbox"
              className="sr-only peer"
              checked={acceptedOffer}
              onChange={(e) => setAcceptedOffer(e.target.checked)}
            />
            <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 mt-0.5 transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-brand/50 peer-focus-visible:ring-offset-1 ${
              acceptedOffer ? 'bg-brand border-brand' : 'border-border'
            }`}>
              {acceptedOffer && <Check className="w-3.5 h-3.5 text-white" />}
            </div>
            <div className="text-sm text-text-muted leading-relaxed">
              Я принимаю условия <Link href="/offer" target="_blank" className="text-brand underline">Публичной оферты</Link> и соглашаюсь с порядком оказания услуг, возврата средств и рекуррентных платежей.
            </div>
          </label>

          <label className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
            acceptedPrivacy ? 'border-brand bg-brand/5' : 'border-border bg-surface'
          }`}>
            <input
              type="checkbox"
              className="sr-only peer"
              checked={acceptedPrivacy}
              onChange={(e) => setAcceptedPrivacy(e.target.checked)}
            />
            <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 mt-0.5 transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-brand/50 peer-focus-visible:ring-offset-1 ${
              acceptedPrivacy ? 'bg-brand border-brand' : 'border-border'
            }`}>
              {acceptedPrivacy && <Check className="w-3.5 h-3.5 text-white" />}
            </div>
            <div className="text-sm text-text-muted leading-relaxed">
              Я даю согласие на обработку моих персональных данных в соответствии с <Link href="/privacy" target="_blank" className="text-brand underline">Политикой конфиденциальности</Link> (ФЗ-152).
            </div>
          </label>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div className="text-sm text-red-500">{error}</div>
          </div>
        )}

        {/* Pay Button */}
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={handlePayment}
          disabled={!allAccepted || loading}
          className={`w-full py-4 px-6 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
            allAccepted && !loading
              ? 'bg-brand text-white hover:bg-brand-hover shadow-lg shadow-brand/20'
              : 'bg-accent-soft text-text-muted cursor-not-allowed'
          }`}
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Создание платежа...
            </>
          ) : (
            <>
              <CreditCard className="w-5 h-5" />
              Оплатить 4 499 ₽
            </>
          )}
        </motion.button>

        {!allAccepted && (
          <p className="mt-3 text-xs text-text-muted text-center">
            Примите условия оферты и политики конфиденциальности для продолжения
          </p>
        )}

        {/* Security note */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-text-muted">
          <Lock size={12} /> Безопасная оплата через ЮKassa. TLS/SSL шифрование.
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-brand animate-spin mx-auto mb-4" />
          <p className="text-text-secondary">Загрузка...</p>
        </div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
