'use client';

import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Zap } from 'lucide-react';
import Link from 'next/link';
import { PLAN_CARDS } from '../../data/pricingConfig';

const proPrice = PLAN_CARDS.find(p => p.id === 'pro')?.price || '$29';

const PRO_FEATURES = [
  'ИИ-сотрудник (работает 24/7)',
  'Все каналы (WhatsApp, Instagram, Telegram, Web)',
  'Все интеграции (CRM, календарь, платежи)',
  'История диалогов и аналитика',
  'Обучение на ваших документах',
  'Поддержка в рабочее время',
];

const headerContainer = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const headerItem = {
  hidden: { opacity: 0, y: 35 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
};

const cardContainer = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.12,
    },
  },
};

const cardItem = {
  hidden: { opacity: 0, y: 50 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
};

export default function PricingSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  return (
    <section ref={sectionRef} id="pricing" className="py-20 lg:py-24 section-padding relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-mauve-50/20 to-transparent pointer-events-none" />

      <div className="max-w-4xl mx-auto relative">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-100px' }}
          variants={headerContainer}
          className="text-center mb-14"
        >
          <motion.span variants={headerItem} className="label text-mauve-600 mb-3 block">Стоимость</motion.span>
          <motion.h2 variants={headerItem} className="heading-2 text-ink-900 mb-3">
            14 дней бесплатно, потом $29 в месяц
          </motion.h2>
          <motion.p variants={headerItem} className="body-large max-w-lg mx-auto">
            $10 кредитов на AI в пробном периоде. Никаких скрытых платежей. Отменить можно в любой момент.
          </motion.p>
        </motion.div>

        <motion.div
          variants={cardContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          className="flex flex-col items-center gap-4"
        >
          {/* Main Pro Card */}
          <motion.div
            variants={cardItem}
            className="w-full max-w-md relative"
            onMouseEnter={() => setHoveredCard('pro')}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <div className="absolute inset-0 -inset-x-4 -inset-y-8 rounded-3xl bg-gradient-to-b from-mauve-400/10 via-mauve-200/5 to-transparent blur-xl pointer-events-none" />
            <motion.div 
              className="relative p-7 rounded-2xl border border-ink-200 bg-white shadow-lg hover:shadow-xl"
              animate={{
                y: hoveredCard === 'pro' ? -6 : 0,
                scale: hoveredCard === 'pro' ? 1.015 : 1,
              }}
              transition={{ duration: 0.45, ease: [0.22, 0.61, 0.36, 1] }}
            >
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <motion.span
                  className="px-4 py-1 rounded-full bg-ink-900 text-white text-[11px] font-semibold flex items-center gap-1 shadow-md"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <Zap className="w-3 h-3" />
                  Популярный
                </motion.span>
              </div>

              <h3 className="font-mono-display font-semibold text-base text-ink-900 mb-0.5">
                Pro
              </h3>
              <p className="text-xs text-ink-400 mb-5">Для малого бизнеса и частных предпринимателей</p>
              
              <div className="mb-6">
                <span className="text-3xl font-mono-display font-bold text-ink-900">{proPrice}</span>
                <span className="text-ink-400 text-sm">/месяц</span>
              </div>

              <div className="h-px bg-gradient-to-r from-ink-100 via-ink-200 to-ink-100 mb-5" />

              <ul className="space-y-3 mb-6">
                {PRO_FEATURES.map(f => (
                  <li key={f} className="flex items-start gap-3 text-sm text-ink-600">
                    <div className="w-5 h-5 rounded-full bg-mauve-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5 text-mauve-700" strokeWidth={2.5} />
                    </div>
                    <span className="leading-snug">{f}</span>
                  </li>
                ))}
              </ul>

              <Link href="/login" className="block w-full py-3 rounded-xl font-semibold text-sm btn-primary text-center">
                Попробовать бесплатно
              </Link>
            </motion.div>
          </motion.div>

          {/* Secondary Start Card */}
          <motion.div
            variants={cardItem}
            className="w-full max-w-md"
            onMouseEnter={() => setHoveredCard('start')}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <motion.div 
              className="p-5 rounded-2xl border border-ink-200/60 bg-white/70 backdrop-blur-sm shadow-sm hover:shadow-md"
              animate={{
                y: hoveredCard === 'start' ? -4 : 0,
                scale: hoveredCard === 'start' ? 1.01 : 1,
              }}
              transition={{ duration: 0.45, ease: [0.22, 0.61, 0.36, 1] }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-mono-display font-semibold text-sm text-ink-900 mb-0.5">
                    Старт
                  </h3>
                  <p className="text-xs text-ink-400">Бесплатно 14 дней — $10 кредитов на AI, полный доступ, без карты</p>
                </div>
                <Link href="/login" className="px-4 py-2 rounded-lg font-semibold text-xs btn-secondary whitespace-nowrap inline-block">
                  Попробовать
                </Link>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
