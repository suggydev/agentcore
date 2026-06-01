'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle } from 'lucide-react';

const FAQ_ITEMS = [
  {
    question: 'Сколько времени занимает запуск ИИ-сотрудника?',
    answer:
      'Буквально 60 секунд. Выберите сферу бизнеса, и агент готов к работе. Остальные настройки можно сделать позже.',
  },
  {
    question: 'Нужен ли программист для настройки?',
    answer:
      'Нет. Всё настраивается без кода через понятный интерфейс. Если вы умеете пользоваться Telegram — вы справитесь.',
  },
  {
    question: 'В какие каналы можно подключить агента?',
    answer:
      'WhatsApp, Telegram, Instagram, чат на сайте, Email, Slack, Discord, VK. Один агент работает во всех каналах одновременно.',
  },
  {
    question: 'Может ли агент полностью заменить менеджера?',
    answer:
      'На 80% — да. Агент берёт на себя повторяющиеся задачи: ответы на типовые вопросы, сбор заявок, запись. Сложные случаи передаёт живому сотруднику.',
  },
  {
    question: 'Как формируется стоимость?',
    answer:
      'Первые 7 дней — бесплатно и без карты. Дальше $29 в месяц за агента. Никаких скрытых платежей, отменить можно в любой момент.',
  },
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

export default function FAQSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section ref={sectionRef} id="faq" className="py-20 lg:py-24 section-padding bg-white">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-100px' }}
          variants={headerContainer}
          className="text-center mb-14"
        >
          <motion.div variants={headerItem} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-mauve-50 border border-mauve-200/30 mb-4">
            <HelpCircle className="w-3.5 h-3.5 text-mauve-600" />
            <span className="text-xs font-medium text-mauve-600">FAQ</span>
          </motion.div>
          <motion.h2 variants={headerItem} className="heading-2 text-ink-900 mb-3">
            Часто задаваемые вопросы
          </motion.h2>
          <motion.p variants={headerItem} className="body-large max-w-lg mx-auto">
            Всё, что нужно знать перед стартом
          </motion.p>
        </motion.div>

        <div className="space-y-3">
          {FAQ_ITEMS.map((item, i) => {
            const isOpen = openIndex === i;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
              >
                <div
                  className={`rounded-xl border transition-colors duration-300 cursor-pointer ${
                    isOpen
                      ? 'border-mauve-200 bg-white shadow-sm'
                      : 'border-ink-100 bg-white hover:bg-mauve-50/30'
                  }`}
                >
                  <button
                    onClick={() => toggle(i)}
                    className="w-full flex items-center justify-between p-5 text-left"
                    aria-expanded={isOpen}
                  >
                    <span className="text-lg font-semibold text-ink-900 pr-4">{item.question}</span>
                    <motion.span
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                      className="flex-shrink-0"
                    >
                      <ChevronDown className="w-5 h-5 text-mauve-600" />
                    </motion.span>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        key="content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ height: { duration: 0.4, ease: [0.16, 1, 0.3, 1] }, opacity: { duration: 0.25, ease: 'easeOut' } }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-5 border-t border-ink-100">
                          <p className="text-sm leading-relaxed text-ink-500 pt-4">{item.answer}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
