'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Check, Zap, Brain, ArrowRight, Shield, Sparkles, Bot, MessageSquare, CreditCard, Clock, Mail } from 'lucide-react';
import Footer from '../../components/Footer';
import { PLAN_CARDS } from '@/data/pricingConfig';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export default function PricingPage() {
  const [companyData, setCompanyData] = useState({ email: 'hello@agentcore.work' });
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const router = useRouter();

  const monthlyPrice = 2499;
  const yearlyPrice = 1999;
  const yearlyTotal = yearlyPrice * 12;
  const yearlySavingsPercent = Math.round((1 - yearlyPrice / monthlyPrice) * 100);

  useEffect(() => {
    fetch(`${API_BASE}/api/legal/legal`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.email) setCompanyData(prev => ({ ...prev, ...data }));
      })
      .catch(() => {});
  }, []);

  const handleCreateAgent = () => {
    const token = localStorage.getItem('token');
    if (token) {
      router.push('/agents/create');
    } else {
      router.push('/login?redirect=/agents/create');
    }
  };

  const features = [
    'Создание и настройка агента под ваш бизнес',
    'Первый месяц работы включён',
    '1 000 ₽ AI-баланса ежемесячно',
    'Все интеграции (Telegram, WhatsApp, VK, Email, WebChat)',
    'Неограниченные правки агента',
    'AI-архитектор для проектирования логики',
    'Поддержка 24/7',
    'Безопасные платежи через ЮKassa',
  ];

  const howItWorks = [
    {
      step: '1',
      title: 'Опишите задачу',
      description: 'Расскажите, что должен делать ваш агент — AI задаст уточняющие вопросы',
      icon: MessageSquare,
    },
    {
      step: '2',
      title: 'AI проектирует',
      description: 'Смотрите, как AI строит архитектуру цифрового сотрудника в реальном времени',
      icon: Brain,
    },
    {
      step: '3',
      title: 'Активируйте',
      description: 'Оплатите 4 499 ₽ — агент начнёт работать на ваш бизнес сразу',
      icon: Zap,
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="max-w-5xl mx-auto px-5 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand/10 border border-brand/20 text-sm text-brand mb-6">
              <Sparkles size={14} /> Простая и прозрачная цена
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-[var(--text)] mb-4">
              Один агент — <span className="text-brand">одна цена</span>
            </h1>
            <p className="text-lg text-[var(--text-muted)] max-w-2xl mx-auto">
              Никаких подписок и скрытых платежей. Платите только за тех агентов, которых создаёте. Все цены в рублях РФ, включая НДС 20%.
            </p>
          </motion.div>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex bg-[var(--surface)] rounded-xl p-1 border border-[var(--border)]">
            <button
              type="button"
              onClick={() => setBillingPeriod('monthly')}
              className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                billingPeriod === 'monthly'
                  ? 'bg-[var(--brand)] text-white shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              Месяц
            </button>
            <button
              type="button"
              onClick={() => setBillingPeriod('yearly')}
              className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-1.5 ${
                billingPeriod === 'yearly'
                  ? 'bg-[var(--brand)] text-white shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              Год
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                billingPeriod === 'yearly' ? 'bg-white/20' : 'bg-[var(--success)]/10 text-[var(--success)]'
              }`}>
                -{yearlySavingsPercent}%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="max-w-2xl mx-auto mb-16"
        >
          <motion.div
            whileHover={{ y: -4, boxShadow: '0 20px 40px -12px rgba(0,0,0,0.15)' }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="bg-surface rounded-3xl border border-border p-8 md:p-10 shadow-xl shadow-black/5 relative overflow-hidden"
          >
            {/* Background glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />

            <div className="relative">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-brand/10 flex items-center justify-center">
                  <Bot size={24} className="text-brand" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-text">AI-Агент</h2>
                  <p className="text-sm text-text-muted">Полноценный цифровой сотрудник</p>
                </div>
              </div>

              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-5xl font-bold text-text">4 499</span>
                <span className="text-2xl font-bold text-text">₽</span>
              </div>
              <p className="text-sm text-text-muted mb-8">
                Единоразовый платёж. Включает создание, настройку и первый месяц работы.
              </p>

              {/* Features */}
              <div className="grid sm:grid-cols-2 gap-3 mb-8">
                {features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <Check size={16} className="text-green-500 mt-0.5 shrink-0" />
                    <span className="text-sm text-text-secondary">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Monthly cost */}
              <div className="p-4 rounded-2xl bg-brand/5 border border-brand/10 mb-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-brand" />
                    <span className="text-sm text-text">
                      {billingPeriod === 'yearly' ? 'При оплате за год' : 'Следующие месяцы'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-brand">
                      {billingPeriod === 'yearly' ? `${yearlyPrice.toLocaleString()} ₽` : '2 499 ₽'}
                    </span>
                    <span className="text-xs text-text-muted block">/ месяц</span>
                  </div>
                </div>
                {billingPeriod === 'yearly' && (
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className="text-xs text-[var(--success)] font-medium">
                      Экономия {yearlySavingsPercent}% — {yearlyTotal.toLocaleString()} ₽ вместо {(monthlyPrice * 12).toLocaleString()} ₽ в год
                    </span>
                  </div>
                )}
                <p className="text-xs text-text-muted mt-2">
                  Оплачивается только если хотите продолжить работу агента. Можно отключить в любой момент.
                </p>
              </div>

              {/* AI Credits */}
              <div className="p-4 rounded-2xl bg-surface-2 border border-border mb-8">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Brain size={16} className="text-text-muted" />
                    <span className="text-sm text-text">AI Баланс</span>
                  </div>
                  <span className="text-sm font-medium text-text">1 000 ₽ / мес</span>
                </div>
                <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden mb-2">
                  <div className="h-full bg-brand rounded-full w-full" />
                </div>
                <p className="text-xs text-text-muted">
                  Обновляется ежемесячно для каждого агента. Дополнительный баланс можно купить в любой момент.
                </p>
              </div>

              {/* CTA */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={handleCreateAgent}
                className="w-full flex items-center justify-center gap-2.5 py-4 rounded-xl bg-brand text-white font-medium text-sm hover:bg-brand-hover transition-all shadow-lg shadow-brand/20"
              >
                <Sparkles size={18} />
                Создать агента
                <ArrowRight size={16} />
              </motion.button>

              <div className="flex items-center justify-center gap-2 mt-3 text-xs text-text-muted">
                <Shield size={12} /> Безопасная оплата через ЮKassa
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Maintenance Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="max-w-2xl mx-auto mb-8"
        >
          <motion.div
            whileHover={{ y: -4, boxShadow: '0 20px 40px -12px rgba(0,0,0,0.1)' }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="bg-surface rounded-3xl border border-border p-8 md:p-10 shadow-lg shadow-black/5"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-[var(--brand)]/10 flex items-center justify-center">
                <Zap size={24} className="text-[var(--brand)]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-text">Поддержка агента</h2>
                <p className="text-sm text-text-muted">Ежемесячная поддержка и работа агента</p>
              </div>
            </div>

            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-5xl font-bold text-text">
                {billingPeriod === 'yearly' ? yearlyPrice.toLocaleString() : '2 499'}
              </span>
              <span className="text-2xl font-bold text-text">₽</span>
              <span className="text-lg text-text-muted">/мес</span>
            </div>
            <p className="text-sm text-text-muted mb-8">
              {billingPeriod === 'yearly'
                ? `Годовой платёж: ${yearlyTotal.toLocaleString()} ₽. Экономия ${yearlySavingsPercent}%.`
                : 'Ежемесячный платёж за поддержку агента. Можно отключить в любой момент.'}
            </p>

            <div className="grid sm:grid-cols-2 gap-3 mb-8">
              {PLAN_CARDS.find(p => p.id === 'maintenance')?.features.map((feature, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <Check size={16} className="text-green-500 mt-0.5 shrink-0" />
                  <span className="text-sm text-text-secondary">{feature}</span>
                </div>
              ))}
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={handleCreateAgent}
              className="w-full flex items-center justify-center gap-2.5 py-4 rounded-xl bg-surface text-text border border-border hover:bg-[var(--accent-soft)] transition-all font-medium text-sm"
            >
              Подробнее
              <ArrowRight size={16} />
            </motion.button>
          </motion.div>
        </motion.div>

        {/* Enterprise Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="max-w-2xl mx-auto mb-16"
        >
          <motion.div
            whileHover={{ y: -4, boxShadow: '0 24px 48px -12px rgba(0,0,0,0.18)' }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="bg-surface rounded-3xl border-2 border-[var(--brand)]/30 p-8 md:p-10 shadow-xl shadow-black/5 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--brand)]/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />

            <div className="relative">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-[var(--brand)]/10 flex items-center justify-center">
                  <Shield size={24} className="text-[var(--brand)]" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-text">Enterprise</h2>
                    <span className="px-2.5 py-0.5 rounded-full bg-[var(--brand)]/10 text-xs font-medium text-[var(--brand)]">Корпоративный</span>
                  </div>
                  <p className="text-sm text-text-muted">Для масштабирования бизнеса</p>
                </div>
              </div>

              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-5xl font-bold text-text">9 999</span>
                <span className="text-2xl font-bold text-text">₽</span>
                <span className="text-lg text-text-muted">/мес</span>
              </div>
              <p className="text-sm text-text-muted mb-8">
                Неограниченные агенты, все возможности, приоритетная поддержка.
              </p>

              <div className="grid sm:grid-cols-2 gap-3 mb-8">
                {[
                  'Неограниченное количество агентов',
                  'Все интеграции и каналы',
                  'Выделенная поддержка 24/7',
                  'Корпоративная аналитика',
                  'White Label',
                  'REST API доступ',
                  'Индивидуальное обучение',
                  'Персональный менеджер',
                ].map((feature, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <Check size={16} className="text-green-500 mt-0.5 shrink-0" />
                    <span className="text-sm text-text-secondary">{feature}</span>
                  </div>
                ))}
              </div>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => window.location.href = 'mailto:enterprise@agentcore.work'}
                className="w-full flex items-center justify-center gap-2.5 py-4 rounded-xl bg-[var(--brand)] text-white font-medium text-sm hover:bg-[var(--brand)]/90 transition-all shadow-lg shadow-[var(--brand)]/20"
              >
                <Mail size={18} className="inline" />
                Связаться с нами
                <ArrowRight size={16} />
              </motion.button>

              <div className="flex items-center justify-center gap-2 mt-3 text-xs text-text-muted">
                <Shield size={12} /> Индивидуальные условия и сопровождение
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* How it works */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-text text-center mb-8">Как это работает</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {howItWorks.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="bg-surface rounded-2xl border border-border p-6 text-center"
                >
                  <div className="w-12 h-12 rounded-2xl bg-brand/10 flex items-center justify-center mx-auto mb-4">
                    <Icon size={20} className="text-brand" />
                  </div>
                  <div className="w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center text-sm font-bold mx-auto mb-3 -mt-10 relative z-10">
                    {step.step}
                  </div>
                  <h3 className="font-semibold text-text mb-2">{step.title}</h3>
                  <p className="text-sm text-text-muted">{step.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto space-y-4 mb-12">
          <h2 className="text-xl font-bold text-text mb-6 text-center">Частые вопросы</h2>

          <div className="p-4 rounded-xl border border-border bg-surface">
            <div className="font-medium text-text mb-2">Сколько агентов можно создать?</div>
            <p className="text-sm text-text-muted">Столько, сколько нужно вашему бизнесу. Каждый агент оплачивается отдельно: 4 499 ₽ за создание + 2 499 ₽/мес за поддержку.</p>
          </div>

          <div className="p-4 rounded-xl border border-border bg-surface">
            <div className="font-medium text-text mb-2">Можно ли отменить подписку?</div>
            <p className="text-sm text-text-muted">Да, в любой момент. Агент останется в вашем кабинете, но перестанет отвечать клиентам. Возобновить работу можно за 2 499 ₽.</p>
          </div>

          <div className="p-4 rounded-xl border border-border bg-surface">
            <div className="font-medium text-text mb-2">Есть ли возврат средств?</div>
            <p className="text-sm text-text-muted">Да, в течение 7 дней с момента оплаты при условии использования менее 10% AI-баланса. Подробные условия на странице <Link href="/refund" className="text-brand underline">Правила возврата</Link>.</p>
          </div>

          <div className="p-4 rounded-xl border border-border bg-surface">
            <div className="font-medium text-text mb-2">Что входит в AI-баланс?</div>
            <p className="text-sm text-text-muted">1 000 ₽ на разговоры с клиентами через AI. Обычно этого хватает на ~500-1000 сообщений. Баланс обновляется каждый месяц для каждого агента.</p>
          </div>
        </div>

        {/* Security note */}
        <div className="flex items-center justify-center gap-2 text-sm text-text-muted">
          <Shield size={16} />
          <span>Безопасные платежи через защищённый шлюз ЮKassa. TLS/SSL шифрование.</span>
        </div>

        {/* Legal note */}
        <div className="mt-6 p-4 rounded-xl bg-accent-soft border border-border text-sm text-text-muted max-w-3xl mx-auto">
          <div className="flex items-start gap-2">
            <CreditCard size={16} className="text-brand shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-text mb-1">Юридическая информация</p>
              <p>Все цены указаны в рублях РФ и включают НДС 20%. Подробные условия оказания услуг, возврата средств и рекуррентных платежей изложены в <Link href="/offer" className="text-brand underline">Договоре публичной оферты</Link>.</p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
