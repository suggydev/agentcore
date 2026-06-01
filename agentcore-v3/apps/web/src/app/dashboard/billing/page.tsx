'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  CreditCard,
  Sparkles,
  Check,
  X,
  Loader2,
  AlertCircle,
  Clock,
  ArrowRight,
  Zap,
  Shield,
  BarChart3,
  MessageSquare,
  Bot,
  Users,
  FileText,
  Infinity,
  Headphones,
  Coins,
  Receipt,
  Package,
} from 'lucide-react';
import InfoTooltip from '../../../components/InfoTooltip';
import {
  FREE_LIMITS,
  PRO_FEATURES,
  ENTERPRISE_FEATURES,
  PLAN_CARDS,
  buildFeatureRows,
  MONTHLY_BONUS_AMOUNT,
  TRIAL_DAYS,
  type PlanCard,
  type FeatureRow,
} from '@/data/pricingConfig';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

interface TrialStatus {
  daysLeft: number;
  isTrialing: boolean;
  trialEndsAt: string;
  totalDays?: number;
  isExpired?: boolean;
}

interface PlanInfo {
  name: string;
  price: string;
  conversationsLimit: number;
  agentsLimit: number;
  knowledgeLimit: number;
  features: string[];
}

interface BalanceData {
  balance: number;
  toppedUpBalance?: number;
  subscriptionCredit?: number;
  subscriptionActive?: boolean;
  plan?: string;
}

export default function BillingPage() {
  const [trial, setTrial] = useState<TrialStatus | null>(null);
  const [plan, setPlan] = useState<PlanInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [balanceData, setBalanceData] = useState<BalanceData | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
      return;
    }
    const ac = new AbortController();
    let cancelled = false;
    const load = async () => {
      try {
        const [trialRes, planRes, balanceRes] = await Promise.all([
          fetch(`${API_BASE}/api/billing/trial-status`, {
            headers: { Authorization: `Bearer ${token}` }, signal: ac.signal,
          }),
          fetch(`${API_BASE}/api/billing/plan`, {
            headers: { Authorization: `Bearer ${token}` }, signal: ac.signal,
          }),
          fetch(`${API_BASE}/api/billing/suggy-balance`, {
            headers: { Authorization: `Bearer ${token}` }, signal: ac.signal,
          }),
        ]);
        if (cancelled) return;
        if (trialRes.ok) setTrial(await trialRes.json());
        if (planRes.ok) setPlan(await planRes.json());
        if (balanceRes.ok) setBalanceData(await balanceRes.json());
      } catch (err: unknown) {
        if (!cancelled && (err as Error)?.name !== 'AbortError') {
          setError('Не удалось загрузить информацию о тарифах.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; ac.abort(); };
  }, []);

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
  };
  const item = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
  };

  const featureRows = buildFeatureRows();

  const renderFeatureValue = (value: string | number | boolean) => {
    if (typeof value === 'boolean') {
      return value ? (
        <Check className="w-4 h-4 text-emerald-500" />
      ) : (
        <X className="w-4 h-4 text-ink-300" />
      );
    }
    return <span className="text-sm font-medium text-ink-700">{value}</span>;
  };

  if (loading) {
    return (
      <>
        <div className="flex items-center justify-center min-h-[80vh]">
          <Loader2 className="w-8 h-8 text-mauve-500 animate-spin" />
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <div className="flex flex-col items-center justify-center min-h-[80vh] gap-4">
          <AlertCircle className="w-10 h-10 text-red-400" />
          <p className="text-ink-500">{error}</p>
          <button onClick={() => window.location.reload()} className="btn-primary text-sm px-6 py-2.5">Повторить</button>
        </div>
      </>
    );
  }

  const isTrialing = trial?.isTrialing ?? false;
  const daysLeft = trial?.daysLeft ?? 0;
  const totalTrialDays = trial?.totalDays ?? TRIAL_DAYS;
  const currentBalance = balanceData?.balance ?? 0;
  const subscriptionActive = balanceData?.subscriptionActive ?? false;
  const monthlyBonus = balanceData?.subscriptionCredit ?? (subscriptionActive ? MONTHLY_BONUS_AMOUNT : 0);

  const currentPlanId = balanceData?.plan?.toLowerCase() || 'trial';

  return (
    <>
      <div className="p-6 lg:p-10 max-w-7xl mx-auto">
        <motion.div variants={container} initial="hidden" animate="show" className="mb-10">
          <motion.div variants={item}>
            <p className="text-[11px] font-semibold uppercase tracking-label text-mauve-500 mb-2">Тарифы</p>
            <h1 className="font-display font-bold text-3xl text-ink-900 tracking-tight">План и оплата</h1>
            <p className="text-ink-500 mt-1 text-sm">Управление подпиской и обновление плана.</p>
          </motion.div>
        </motion.div>

        {/* Balance Card */}
        <motion.div
          variants={item}
          initial="hidden"
          animate="show"
          className="bg-white rounded-2xl border border-mauve-100 shadow-sm p-5 mb-8"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-mauve-100 to-mauve-200 flex items-center justify-center">
                <Coins className="w-5 h-5 text-mauve-600" />
              </div>
              <div>
                <p className="text-xs text-mauve-500 font-semibold uppercase tracking-wider flex items-center gap-1">
                  Баланс Suggy
                  <InfoTooltip content="Кредиты расходуются на ответы агентов. Каждое сообщение к LLM списывает кредиты с баланса. Пополнить можно в разделе «Баланс»." iconSize={11} />
                </p>
                <div className="font-mono font-bold text-2xl text-ink-900">${currentBalance.toFixed(2)}</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {subscriptionActive && monthlyBonus > 0 && (
                <div className="text-right">
                  <p className="text-xs text-mauve-500">Ежемесячный бонус</p>
                  <p className="text-sm font-mono font-semibold text-ink-700">+${monthlyBonus.toFixed(2)}/мес</p>
                </div>
              )}
              <Link
                href="/dashboard/credits"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-mauve-50 text-mauve-600 text-sm font-medium hover:bg-mauve-100 transition-colors duration-200"
              >
                <Coins className="w-4 h-4" />
                Кредиты
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Trial Banner */}
        {isTrialing && (
          <motion.div
            variants={item}
            initial="hidden"
            animate="show"
            className={`rounded-2xl border shadow-sm p-6 mb-8 ${
              daysLeft <= 3
                ? 'bg-red-50/60 border-red-200'
                : daysLeft <= 7
                ? 'bg-amber-50/60 border-amber-200'
                : 'bg-mauve-50/60 border-mauve-200'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  daysLeft <= 3 ? 'bg-red-100' : daysLeft <= 7 ? 'bg-amber-100' : 'bg-mauve-100'
                }`}>
                  <Clock className={`w-6 h-6 ${
                    daysLeft <= 3 ? 'text-red-600' : daysLeft <= 7 ? 'text-amber-600' : 'text-mauve-600'
                  }`} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h2 className="font-display font-semibold text-lg text-ink-900">
                      {daysLeft <= 0 ? 'Пробный истёк' : 'Бесплатный пробный'}
                    </h2>
                    <InfoTooltip content="Пробный период даёт полный доступ ко всем функциям Pro на ограниченное время. После окончания необходимо выбрать тариф для продолжения работы." />
                  </div>
                  <p className="text-sm text-ink-500">
                    {daysLeft <= 0
                      ? 'Обновите для продолжения использования AgentCore со всеми функциями.'
                      : `${daysLeft} ${daysLeft === 1 ? 'день' : daysLeft < 5 ? 'дня' : 'дней'} осталось — полный доступ ко всем функциям Pro.`}
                  </p>
                </div>
              </div>
              <a
                href="/dashboard/billing/upgrade"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-mauve-600 text-white text-sm font-semibold hover:bg-mauve-700 transition-all duration-200 shadow-sm shadow-mauve-600/10 flex-shrink-0"
              >
                <Sparkles className="w-4 h-4" />
                Обновить до Pro
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
            {daysLeft > 0 && (
              <div className="mt-5">
                <div className="flex items-center justify-between text-xs text-ink-500 mb-2">
                  <span>{totalTrialDays - daysLeft} дней использовано</span>
                  <span>{daysLeft} дней осталось</span>
                </div>
                <div className="w-full bg-white/60 rounded-full h-2.5 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${((totalTrialDays - daysLeft) / totalTrialDays) * 100}%` }}
                    transition={{ duration: 1.2, ease: [0.34, 1.56, 0.64, 1], delay: 0.3 }}
                    className={`h-full rounded-full ${
                      daysLeft <= 3 ? 'bg-red-400' : daysLeft <= 7 ? 'bg-amber-400' : 'bg-mauve-500'
                    }`}
                  />
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Plan Details */}
        {plan && (
          <motion.div
            variants={item}
            initial="hidden"
            animate="show"
            className="bg-white rounded-2xl border border-mauve-100 shadow-sm p-6 mb-8"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-mauve-50 flex items-center justify-center ring-1 ring-mauve-100/60">
                <CreditCard className="w-6 h-6 text-mauve-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-display font-semibold text-lg text-ink-900">{plan.name} План</h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-mauve-100 text-mauve-600 border border-mauve-200">
                    Текущий
                  </span>
                </div>
                <p className="text-sm text-ink-500">{plan.price}/мес</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Pricing Cards */}
        <motion.div variants={container} initial="hidden" animate="show">
          <div className="flex items-center gap-1.5 mb-5">
            <motion.h2 variants={item} className="font-display font-semibold text-xl text-ink-900">Планы</motion.h2>
            <InfoTooltip content="Сравнение тарифов: Free — базовый старт, Pro — полный доступ с приоритетной поддержкой, Enterprise — индивидуальные условия и интеграции." />
          </div>
          <div className="grid lg:grid-cols-3 gap-6 mb-8">
            {PLAN_CARDS.map((card: PlanCard) => {
              const isCurrent = card.id === currentPlanId || (card.id === 'trial' && isTrialing);
              return (
                <motion.div
                  key={card.id}
                  variants={item}
                  whileHover={card.id !== 'trial' ? { y: -4, transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] } } : {}}
                  className={`bg-white rounded-2xl border-2 ${card.accentColor} p-6 relative overflow-hidden group ${card.scale}`}
                >
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${card.topBarGradient}`} />
                  {card.badge && (
                    <div className="absolute top-4 right-4 px-2.5 py-0.5 rounded-full bg-mauve-600 text-white text-[10px] font-bold uppercase tracking-wider">
                      {card.badge}
                    </div>
                  )}
                  <h3 className="font-display font-semibold text-lg text-ink-900 mb-1">{card.name}</h3>
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="font-mono font-bold text-3xl text-ink-900">{card.price}</span>
                    <span className="text-sm text-ink-500">{card.period}</span>
                  </div>
                  <p className="text-sm text-ink-500 mb-4">{card.description}</p>
                  {card.id === 'trial' ? (
                    <button
                      disabled
                      className={`w-full py-2.5 rounded-xl text-sm font-semibold mb-6 ${card.btnClass}`}
                    >
                      {isTrialing ? 'Текущий план' : 'Пробный закончился'}
                    </button>
                  ) : card.id === 'enterprise' ? (
                    <a
                      href="/dashboard/billing/upgrade?plan=enterprise"
                      className={`w-full py-2.5 rounded-xl text-sm font-semibold inline-flex items-center justify-center gap-2 mb-6 ${card.btnClass}`}
                    >
                      {card.btnIcon && <card.btnIcon className="w-4 h-4" />}
                      {card.btnLabel}
                    </a>
                  ) : (
                    <a
                      href="/dashboard/billing/upgrade"
                      className={`w-full py-2.5 rounded-xl text-sm font-semibold inline-flex items-center justify-center gap-2 mb-6 ${card.btnClass}`}
                    >
                      {card.btnIcon && <card.btnIcon className="w-4 h-4" />}
                      {card.btnLabel}
                    </a>
                  )}
                  <ul className="space-y-2.5">
                    {card.features.map((f: string, i: number) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-ink-600">
                        <Check className={`w-4 h-4 ${card.popular ? 'text-mauve-500' : 'text-mauve-400'} flex-shrink-0`} />
                        {f}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Feature Comparison Table */}
        <motion.div variants={container} initial="hidden" animate="show" className="bg-white rounded-2xl border border-mauve-100 shadow-sm p-6 mb-8">
          <div className="flex items-center gap-1.5 mb-5">
            <h2 className="font-display font-semibold text-lg text-ink-900">Сравнение функций</h2>
            <InfoTooltip content="Детальное сравнение возможностей каждого тарифа: лимиты агентов, диалогов, документов, каналов связи и интеграций." />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-ink-100">
                  <th className="text-left py-3 text-xs font-semibold text-ink-500 uppercase tracking-wide">Функция</th>
                  <th className="text-center py-3 text-xs font-semibold text-ink-500 uppercase tracking-wide w-24">Бесплатный</th>
                  <th className="text-center py-3 text-xs font-semibold text-mauve-600 uppercase tracking-wide w-24">Pro</th>
                  <th className="text-center py-3 text-xs font-semibold text-ink-500 uppercase tracking-wide w-24">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {featureRows.map((row: FeatureRow, i: number) => (
                  <motion.tr
                    key={row.label}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 + i * 0.03 }}
                    className="border-b border-ink-50 hover:bg-mauve-50/30 transition-colors"
                  >
                    <td className="py-3 flex items-center gap-2">
                      <row.icon className="w-4 h-4 text-mauve-400" />
                      <span className="text-sm font-medium text-ink-700">{row.label}</span>
                    </td>
                    <td className="py-3 text-center">{renderFeatureValue(row.free)}</td>
                    <td className="py-3 text-center bg-mauve-50/30">{renderFeatureValue(row.pro)}</td>
                    <td className="py-3 text-center">{renderFeatureValue(row.enterprise)}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Billing History */}
        <motion.div variants={container} initial="hidden" animate="show" className="bg-white rounded-2xl border border-mauve-100 shadow-sm p-6">
          <h2 className="font-display font-semibold text-lg text-ink-900 mb-5">История платежей</h2>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="relative mb-5">
              <div className="w-20 h-20 rounded-2xl bg-mauve-50 flex items-center justify-center ring-1 ring-mauve-100/60">
                <Receipt className="w-9 h-9 text-mauve-300" />
              </div>
              <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-mauve-100 flex items-center justify-center">
                <Package className="w-4 h-4 text-mauve-400" />
              </div>
            </div>
            <h3 className="font-display font-semibold text-ink-700 mb-1">Нет транзакций</h3>
            <p className="text-ink-400 text-sm max-w-xs">
              Здесь будет отображаться история ваших платежей и пополнений баланса.
            </p>
            <Link
              href="/dashboard/billing/upgrade"
              className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-mauve-50 text-mauve-600 text-sm font-medium hover:bg-mauve-100 transition-colors duration-200"
            >
              <Sparkles className="w-4 h-4" />
              Обновить план
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </motion.div>

        <div className="h-8" />
      </div>
    </>
  );
}
