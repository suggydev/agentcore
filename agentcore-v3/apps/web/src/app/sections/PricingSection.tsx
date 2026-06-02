'use client';

import { motion } from 'framer-motion';
import { Check, Zap } from 'lucide-react';
import Link from 'next/link';
import { PLAN_CARDS } from '../../data/pricingConfig';

const proPrice = PLAN_CARDS.find(p => p.id === 'pro')?.price || '$29';

const PRO_FEATURES = [
  'Цифровой сотрудник (работает 24/7)',
  'Все каналы (WhatsApp, Instagram, Telegram, Web)',
  'Все интеграции (CRM, календарь, платежи)',
  'История диалогов и аналитика',
  'Обучение на ваших документах',
  'Поддержка в рабочее время',
];

export default function PricingSection() {
  return (
    <section id="pricing" className="py-24 bg-[var(--surface)]">
      <div className="max-w-4xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <span className="label text-[var(--brand)] mb-3 block">Стоимость</span>
          <h2 className="heading-2 text-[var(--text)] mb-3">
            14 дней бесплатно, потом $29 в месяц
          </h2>
          <p className="body-large max-w-lg mx-auto">
            $10 кредитов на AI в пробном периоде. Никаких скрытых платежей. Отменить можно в любой момент.
          </p>
        </motion.div>

        <div className="flex flex-col items-center gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="w-full max-w-md relative"
          >
            <div className="relative p-7 rounded-xl border border-[var(--border)] bg-white">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <span className="px-4 py-1 rounded-full bg-[var(--accent)] text-white text-[11px] font-semibold flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  Популярный
                </span>
              </div>

              <h3 className="font-mono-display font-semibold text-base text-[var(--text)] mb-0.5">
                Pro
              </h3>
              <p className="text-xs text-[var(--text-muted)] mb-5">Для малого бизнеса и частных предпринимателей</p>

              <div className="mb-6">
                <span className="text-3xl font-mono-display font-bold text-[var(--text)]">{proPrice}</span>
                <span className="text-[var(--text-muted)] text-sm">/месяц</span>
              </div>

              <div className="h-px bg-[var(--border)] mb-5" />

              <ul className="space-y-3 mb-6">
                {PRO_FEATURES.map(f => (
                  <li key={f} className="flex items-start gap-3 text-sm text-[var(--text)]">
                    <div className="w-5 h-5 rounded-full bg-[var(--surface-2)] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5 text-[var(--brand)]" strokeWidth={2.5} />
                    </div>
                    <span className="leading-snug">{f}</span>
                  </li>
                ))}
              </ul>

              <Link href="/login" className="block w-full py-3 rounded-xl font-semibold text-sm btn-primary text-center">
                Попробовать бесплатно
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-full max-w-md"
          >
            <div className="p-5 rounded-xl border border-[var(--border)] bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-mono-display font-semibold text-sm text-[var(--text)] mb-0.5">
                    Старт
                  </h3>
                  <p className="text-xs text-[var(--text-muted)]">Бесплатно 14 дней — $10 кредитов на AI, полный доступ, без карты</p>
                </div>
                <Link href="/login" className="px-4 py-2 rounded-lg font-semibold text-xs btn-secondary whitespace-nowrap inline-block">
                  Попробовать
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
