'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Coins, ArrowRight, Clock, Info, Wallet, CreditCard, Plus, Loader2, Gift, Shield, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import InfoTooltip from '../../../components/InfoTooltip';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export default function CreditsPage() {
  const [balance, setBalance] = useState(0);
  const [toppedUp, setToppedUp] = useState(0);
  const [subCredit, setSubCredit] = useState(0);
  const [subActive, setSubActive] = useState(false);
  const [plan, setPlan] = useState('');
  const [loading, setLoading] = useState(true);
  const [balanceError, setBalanceError] = useState('');
  const [topUpAmount, setTopUpAmount] = useState('');
  const [topUpLoading, setTopUpLoading] = useState(false);
  const [topUpError, setTopUpError] = useState('');
  const [topUpSuccess, setTopUpSuccess] = useState('');

  const fetchBalance = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) { window.location.href = '/login'; return; }
    setBalanceError('');
    fetch(`${API_BASE}/api/billing/suggy-balance`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.ok ? res.json() : Promise.reject(res))
      .then((data) => {
        setBalance(data.balance ?? 0);
        setToppedUp(data.toppedUpBalance ?? 0);
        setSubCredit(data.subscriptionCredit ?? 0);
        setSubActive(data.subscriptionActive ?? false);
        setPlan(data.plan ?? '');
      })
      .catch((err) => {
        console.error('Failed to fetch balance:', err);
        setBalanceError('Не удалось загрузить баланс');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchBalance(); }, [fetchBalance]);

  const handleTopUp = async () => {
    const amount = parseFloat(topUpAmount);
    if (isNaN(amount) || amount < 1) {
      setTopUpError('Минимальная сумма пополнения $1');
      return;
    }
    setTopUpLoading(true);
    setTopUpError('');
    setTopUpSuccess('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/billing/top-up`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setTopUpSuccess(`Баланс пополнен на $${amount.toFixed(2)}`);
      setTopUpAmount('');
      fetchBalance();
    } catch (err: unknown) {
      setTopUpError(err instanceof Error ? err.message : 'Ошибка пополнения');
    } finally {
      setTopUpLoading(false);
    }
  };

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.05 } } };
  const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } } };

  return (
    <>
      <div className="p-6 lg:p-10 max-w-4xl mx-auto">
        <motion.div variants={container} initial="hidden" animate="show" className="mb-10">
          <motion.div variants={item}>
            <p className="text-[11px] font-semibold uppercase tracking-label text-mauve-500 mb-2">Кредиты</p>
            <h1 className="font-display font-bold text-3xl text-ink-900 tracking-tight">Баланс и кредиты</h1>
            <p className="text-ink-500 mt-1 text-sm">Управляйте балансом для AI-запросов через Suggy API.</p>
          </motion.div>
        </motion.div>

        <motion.div variants={container} initial="hidden" animate="show" className="grid lg:grid-cols-3 gap-6 mb-10">
          <motion.div
            variants={item}
            whileHover={{ y: -3, transition: { duration: 0.2 } }}
            className="bg-white rounded-2xl border border-mauve-100 shadow-sm p-6 group hover:shadow-md transition-all duration-300 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-mauve-400/0 via-mauve-400/40 to-mauve-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-mauve-100 to-mauve-200 flex items-center justify-center ring-1 ring-mauve-100/60 group-hover:shadow-md transition-shadow duration-300">
                <Wallet className="w-5 h-5 text-mauve-600" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[11px] font-medium text-ink-400 uppercase tracking-wider flex items-center gap-1">Общий баланс <InfoTooltip content="Сумма кредитов подписки и средств пополнения. Используется для AI-запросов." iconSize={12} /></span>
                {loading ? (
                  <div className="h-8 w-24 bg-ink-100 rounded-lg animate-pulse mt-1" />
                ) : (
                  <div className="font-mono font-bold text-2xl text-ink-900 tracking-tight">${balance.toFixed(2)}</div>
                )}
              </div>
            </div>
          </motion.div>

          <motion.div
            variants={item}
            whileHover={{ y: -3, transition: { duration: 0.2 } }}
            className="bg-gradient-to-br from-mauve-50 via-mauve-50 to-purple-50 rounded-2xl border border-mauve-200 p-6 group hover:shadow-md transition-all duration-300 relative overflow-hidden"
          >
            <div className="absolute -top-6 -right-6 w-16 h-16 rounded-full bg-mauve-100/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-white/90 flex items-center justify-center ring-1 ring-mauve-200/60 group-hover:shadow-md transition-shadow duration-300">
                <Gift className="w-5 h-5 text-mauve-600" />
              </div>
              <div>
                <span className="text-[11px] font-medium text-ink-400 uppercase tracking-wider flex items-center gap-1">Кредиты подписки <InfoTooltip content="$10 начисляются ежемесячно при активной подписке. Остаток сгорает каждый месяц." iconSize={12} /></span>
                {loading ? (
                  <div className="h-8 w-20 bg-mauve-200 rounded-lg animate-pulse mt-1" />
                ) : (
                  <>
                    <div className="font-mono font-bold text-2xl text-mauve-700 tracking-tight">${subCredit.toFixed(2)}</div>
                    <p className="text-[10px] text-mauve-500 font-medium">обновляются ежемесячно</p>
                  </>
                )}
              </div>
            </div>
          </motion.div>

          <motion.div
            variants={item}
            whileHover={{ y: -3, transition: { duration: 0.2 } }}
            className="bg-white rounded-2xl border border-mauve-100 shadow-sm p-6 group hover:shadow-md transition-all duration-300 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-mauve-400/0 via-mauve-400/40 to-mauve-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-mauve-50 flex items-center justify-center ring-1 ring-mauve-100/60 group-hover:shadow-md transition-shadow duration-300">
                <Shield className="w-5 h-5 text-mauve-500" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[11px] font-medium text-ink-400 uppercase tracking-wider flex items-center gap-1">Пополнения <InfoTooltip content="Средства, добавленные вручную. Не сгорают и сохраняются даже после окончания подписки." iconSize={12} /></span>
                {loading ? (
                  <div className="h-8 w-20 bg-ink-100 rounded-lg animate-pulse mt-1" />
                ) : (
                  <>
                    <div className="font-mono font-bold text-2xl text-ink-900 tracking-tight">${toppedUp.toFixed(2)}</div>
                    <p className="text-[10px] text-ink-400 font-medium">не сгорают</p>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>

        {balanceError && (
          <motion.div variants={item} initial="hidden" animate="show"
            className="bg-red-50/60 rounded-2xl border border-red-200/60 p-5 mb-8 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-red-800">Ошибка загрузки</div>
              <p className="text-xs text-red-600 mt-0.5 leading-relaxed">{balanceError}</p>
            </div>
          </motion.div>
        )}
        {!subActive && plan === 'TRIAL' && (
          <motion.div variants={item} initial="hidden" animate="show"
            className="bg-amber-50/60 rounded-2xl border border-amber-200/60 p-5 mb-8 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-amber-800">Пробный период</div>
              <p className="text-xs text-amber-600 mt-0.5 leading-relaxed">
                Подписные кредиты ($10/мес) начисляются только активным подписчикам.
                {' '}<Link href="/dashboard/billing/upgrade" className="underline font-medium">Оформить подписку</Link>
              </p>
            </div>
          </motion.div>
        )}

        {/* Top-up form */}
        <motion.div variants={container} initial="hidden" animate="show" className="bg-white rounded-2xl border border-mauve-100 shadow-sm p-6 mb-8">
          <motion.div variants={item}>
            <h2 className="font-display font-semibold text-lg text-ink-900 mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-mauve-500" />
              Пополнить баланс
            </h2>
            <p className="text-sm text-ink-500 mb-4">Средства пополнения не сгорают и суммируются с кредитами подписки.</p>

            {topUpError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm mb-3">{topUpError}</div>
            )}
            {topUpSuccess && (
              <div className="p-3 rounded-xl bg-green-50 border border-green-100 text-green-600 text-sm mb-3">{topUpSuccess}</div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 text-sm font-medium">$</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={topUpAmount}
                  onChange={e => { setTopUpAmount(e.target.value); setTopUpError(''); }}
                  placeholder="10"
                  className={`w-full pl-8 pr-4 py-3 rounded-xl border bg-white focus:outline-none focus:ring-2 focus:ring-mauve-400/30 focus:border-mauve-400 transition-all text-ink-900 text-sm ${
                    topUpError ? 'border-red-300 ring-2 ring-red-400/20' : 'border-mauve-200'
                  }`}
                />
              </div>
              <button
                onClick={handleTopUp}
                disabled={topUpLoading}
                className="btn-primary text-sm py-3 px-6 disabled:opacity-60"
              >
                {topUpLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Пополнить <ArrowRight className="w-4 h-4" /></>}
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {[5, 10, 25, 50, 100].map(amt => (
                <button key={amt} type="button" onClick={() => { setTopUpAmount(String(amt)); setTopUpError(''); }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 border
                    ${topUpAmount === String(amt)
                      ? 'bg-mauve-600 text-white border-mauve-600 shadow-sm shadow-mauve-600/20 scale-105'
                      : 'bg-white text-ink-600 border-mauve-200 hover:border-mauve-400 hover:text-mauve-600 hover:scale-105 active:scale-95'}`}>
                  ${amt}
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>

        {/* How it works */}
        <motion.div variants={container} initial="hidden" animate="show" className="bg-white rounded-2xl border border-mauve-100 shadow-sm p-6 mb-8">
          <motion.div variants={item}>
            <h2 className="font-display font-semibold text-lg text-ink-900 mb-5 flex items-center gap-2">
              <Info className="w-5 h-5 text-mauve-500" />
              Как работает баланс
            </h2>
            <div className="space-y-0">
              {[
                { step: 1, text: 'При оформлении подписки на ваш счёт начисляется $10 кредитов для AI-запросов.', important: false, icon: Gift },
                { step: 2, text: 'Эти $10 обновляются каждый месяц — остаток сгорает, начисляется новый.', important: true, icon: Clock },
                { step: 3, text: 'Средства пополнения баланса не сгорают никогда и прибавляются к ежемесячным $10.', important: false, icon: Shield },
                { step: 4, text: 'При окончании подписки подписные кредиты сгорают. Деньги с пополнений — сохраняются.', important: true, icon: AlertCircle },
                { step: 5, text: 'Баланс расходуется на API-запросы к AI-моделям через Suggy.', important: false, icon: Coins },
              ].map((s, i, arr) => {
                const StepIcon = s.icon;
                return (
                  <div key={s.step} className="flex">
                    <div className="flex flex-col items-center mr-4">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        s.important
                          ? 'bg-mauve-100 border-2 border-mauve-300 shadow-sm'
                          : 'bg-ink-50 border-2 border-ink-200'
                      }`}>
                        <StepIcon className={`w-4 h-4 ${s.important ? 'text-mauve-600' : 'text-ink-500'}`} />
                      </div>
                      {i < arr.length - 1 && (
                        <div className={`w-0.5 flex-1 min-h-[20px] mt-1 mb-1 ${s.important ? 'bg-mauve-200' : 'bg-ink-100'}`} />
                      )}
                    </div>
                    <div className={`pb-6 ${i === arr.length - 1 ? 'pb-0' : ''}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                          s.important ? 'bg-mauve-100 text-mauve-700' : 'bg-ink-100 text-ink-500'
                        }`}>Шаг {s.step}</span>
                        {s.important && <span className="text-[10px] font-semibold text-mauve-500 uppercase tracking-wider">Важно</span>}
                      </div>
                      <p className="text-sm text-ink-600 leading-relaxed">{s.text}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </motion.div>

        {/* Upgrade CTA */}
        {!subActive && (
          <motion.div variants={container} initial="hidden" animate="show">
            <motion.div variants={item} className="bg-gradient-to-r from-mauve-600 to-mauve-700 rounded-2xl p-6 text-white">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="font-display font-semibold text-lg mb-1">Оформите подписку</h2>
                  <p className="text-mauve-200 text-sm">Получите $10 ежемесячно на AI-запросы и полный доступ.</p>
                </div>
                <Link href="/dashboard/billing/upgrade"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-mauve-700 text-sm font-semibold hover:bg-mauve-50 transition-all">
                  Выбрать план <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}

        <div className="h-8" />
      </div>
    </>
  );
}
