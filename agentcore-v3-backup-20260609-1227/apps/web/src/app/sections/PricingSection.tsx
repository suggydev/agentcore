'use client';

import { motion } from 'framer-motion';
import { Check, Zap, Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const FEATURES = [
  'Создание и настройка агента под ваш бизнес',
  'Все каналы (WhatsApp, Instagram, Telegram, Web, Email)',
  'Все интеграции (CRM, календарь, платежи)',
  'История диалогов и аналитика',
  'Обучение на ваших документах',
  'Поддержка 24/7',
  'AI-архитектор для проектирования логики',
];

export default function PricingSection() {
  return (
    <section id="pricing" className="py-16 sm:py-24 bg-[var(--surface)]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <span className="label text-[var(--brand)] mb-3 block">Стоимость</span>
          <h2 className="heading-2 text-[var(--text)] mb-3">
            Один агент — одна прозрачная цена
          </h2>
          <p className="body-large max-w-lg mx-auto">
            Платите только за агентов, которых создаёте. Никаких подписок и скрытых платежей. Все цены в рублях РФ, включая НДС 20%.
          </p>
        </motion.div>

        <div className="flex flex-col items-center gap-4">
          {/* Main pricing card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="w-full max-w-md relative"
          >
            <div className="relative p-7 rounded-xl border border-[var(--border)] bg-surface">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <span className="px-4 py-1 rounded-full bg-[var(--accent)] text-white text-[11px] font-semibold flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  Всё включено
                </span>
              </div>

              <h3 className="font-mono-display font-semibold text-base text-[var(--text)] mb-0.5">
                AI-Агент
              </h3>
              <p className="text-xs text-[var(--text-muted)] mb-5">Полноценный цифровой сотрудник</p>

              <div className="mb-2">
                <span className="text-3xl font-mono-display font-bold text-[var(--text)]">4 499</span>
                <span className="text-[var(--text-muted)] text-sm">₽</span>
              </div>
              <p className="text-xs text-[var(--text-muted)] mb-6">
                Единоразовый платёж. Включает создание, настройку и первый месяц работы.
              </p>

              <div className="h-px bg-[var(--border)] mb-5" />

              <ul className="space-y-3 mb-6">
                {FEATURES.map(f => (
                  <li key={f} className="flex items-start gap-3 text-sm text-[var(--text)]">
                    <div className="w-5 h-5 rounded-full bg-[var(--surface-2)] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5 text-[var(--brand)]" strokeWidth={2.5} />
                    </div>
                    <span className="leading-snug">{f}</span>
                  </li>
                ))}
              </ul>

              <div className="p-4 rounded-xl bg-[var(--accent-soft)] border border-[var(--border)] mb-5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-[var(--text-muted)]">Следующие месяцы</span>
                  <span className="text-sm font-bold text-[var(--text)]">2 499 ₽ / мес</span>
                </div>
                <p className="text-[10px] text-[var(--text-muted)]">
                  Оплачивается только если продолжаете работу. Можно отключить в любой момент.
                </p>
              </div>

              <div className="flex items-center gap-2 mb-1">
                <Sparkles size={12} className="text-[var(--brand)]" />
                <span className="text-xs text-[var(--text-muted)]">1 000 ₽ AI-баланса ежемесячно на каждого агента</span>
              </div>

              <Link href="/login" className="block w-full py-3 rounded-xl font-semibold text-sm btn-primary text-center mt-4">
                Создать агента <ArrowRight size={14} className="inline ml-1" />
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
