'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Check, Zap, ArrowLeft, Shield, Sparkles, Loader2 } from 'lucide-react';
import Footer from '../../../components/Footer';
import { PLAN_CARDS } from '../../../data/pricingConfig';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export default function UpgradePage() {
  const router = useRouter();
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { setLoading(false); return; }
    fetch(`${API_BASE}/api/billing/balance`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : Promise.reject(r))
      .then(data => setBalance(data.balance ?? 0))
      .catch(err => console.error('[Upgrade] Failed to load balance:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="max-w-5xl mx-auto px-5 py-16">
        <Link href="/settings" className="inline-flex items-center gap-1.5 text-sm text-brand hover:text-brand mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Назад к настройкам
        </Link>

        <div className="text-center mb-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand/10 border border-brand/20 text-sm text-brand mb-6">
              <Sparkles size={14} /> Пополнение баланса
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-text mb-4">Пополнить AI-баланс</h1>
            <p className="text-lg text-text-muted max-w-2xl mx-auto">
              Выберите тариф для пополнения баланса и активации AI-агентов
            </p>
          </motion.div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-brand animate-spin" />
          </div>
        ) : (
          <>
            {balance !== null && (
              <div className="max-w-md mx-auto mb-10 p-4 rounded-xl bg-gradient-to-br from-brand/10 to-brand/5 border border-brand/20 text-center">
                <span className="text-sm text-text-muted">Текущий баланс</span>
                <div className="text-3xl font-bold text-brand mt-1">{balance.toFixed(2).replace('.', ',')} ₽</div>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {PLAN_CARDS.map((plan) => (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className={`relative bg-surface rounded-2xl border ${plan.accentClass} p-6 flex flex-col`}
                >
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-brand text-white text-xs font-semibold">
                      {plan.badge}
                    </div>
                  )}
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-text">{plan.name}</h3>
                    <p className="text-sm text-text-muted mt-1">{plan.description}</p>
                  </div>
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-3xl font-bold text-text">{plan.price}</span>
                    <span className="text-sm text-text-muted">{plan.period}</span>
                  </div>
                  <ul className="space-y-2.5 mb-6 flex-1">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                        <Check size={14} className="text-green-500 mt-0.5 shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => {
                      const token = localStorage.getItem('token');
                      if (!token) { router.push('/login'); return; }
                      if (plan.id === 'agent') {
                        router.push('/agents/create');
                      } else {
                        router.push('/billing');
                      }
                    }}
                    className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all ${plan.btnClass}`}
                  >
                    {plan.btnLabel}
                  </button>
                </motion.div>
              ))}
            </div>

            <div className="max-w-3xl mx-auto mt-8 p-4 rounded-xl bg-accent-soft border border-border text-sm text-text-muted text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Shield size={14} className="text-brand" />
                <span className="font-medium text-text">Безопасная оплата</span>
              </div>
              <p>Все платежи обрабатываются через защищённый шлюз ЮKassa. Данные банковских карт не хранятся на наших серверах.</p>
            </div>
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}
