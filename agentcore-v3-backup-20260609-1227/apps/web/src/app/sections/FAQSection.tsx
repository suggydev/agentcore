'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const FAQ_ITEMS = [
  {
    question: 'Сколько времени занимает запуск цифрового сотрудника?',
    answer:
      'Буквально 2 минуты. Выберите сферу бизнеса, и агент готов к работе. Остальные настройки можно сделать позже.',
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
      'Первые 14 дней — пробный период с ₽1 000 кредитов на AI-запросы, без карты. Дальше ₽2 900 в месяц за агента. Никаких скрытых платежей, отменить можно в любой момент.',
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section id="faq" className="py-16 sm:py-24 bg-[var(--bg)]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-[var(--surface-2)] border border-[var(--border)] text-xs font-semibold text-[var(--text)] tracking-wide uppercase mb-4">
            FAQ
          </span>
          <h2 className="heading-2 text-[var(--text)] mb-3">
            Часто задаваемые вопросы
          </h2>
          <p className="body-large max-w-lg mx-auto">
            Всё, что нужно знать перед стартом
          </p>
        </motion.div>

        <div className="space-y-3">
          {FAQ_ITEMS.map((item, i) => {
            const isOpen = openIndex === i;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              >
                <div
                  className={`rounded-xl border transition-all duration-300 cursor-pointer ${
                    isOpen
                      ? 'border-[var(--brand)]/30 bg-surface shadow-sm shadow-[var(--brand)]/5'
                      : 'border-[var(--border)] bg-surface hover:border-[var(--brand)]/20 hover:shadow-sm'
                  }`}
                >
                  <button
                    onClick={() => toggle(i)}
                    className="w-full flex items-center justify-between p-5 text-left gap-4"
                    aria-expanded={isOpen}
                  >
                    <span className={`text-base font-semibold pr-4 transition-colors duration-200 ${
                      isOpen ? 'text-[var(--text)]' : 'text-[var(--text)]'
                    }`}>{item.question}</span>
                    <motion.span
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                      className="flex-shrink-0"
                    >
                      <ChevronDown className={`w-5 h-5 transition-colors duration-200 ${
                        isOpen ? 'text-[var(--brand)]' : 'text-[var(--text-muted)]'
                      }`} />
                    </motion.span>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        key="content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ height: { duration: 0.35, ease: [0.16, 1, 0.3, 1] }, opacity: { duration: 0.25, ease: 'easeOut' } }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-5 border-t border-[var(--border)]">
                          <p className="text-sm leading-relaxed text-[var(--text-muted)] pt-4">{item.answer}</p>
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
