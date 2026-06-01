'use client';

import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { USE_CASES } from '../../data/landingContent';

const cardContainer = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const cardItem = {
  hidden: { opacity: 0, y: 60 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
};

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

export default function UseCasesSection() {
  return (
    <section id="use-cases" className="py-20 lg:py-28 section-padding bg-white relative overflow-hidden">
      <div className="absolute inset-0 dot-pattern opacity-[0.04] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-100px' }}
          variants={headerContainer}
          className="text-center mb-16"
        >
          <motion.span variants={headerItem} className="inline-block px-4 py-1.5 rounded-full bg-mauve-50 border border-mauve-200/50 text-xs font-semibold text-mauve-600 tracking-wide uppercase mb-4">
            Готовые сценарии
          </motion.span>
          <motion.h2 variants={headerItem} className="heading-2 text-ink-900 mb-4 max-w-2xl mx-auto">
            ИИ-сотрудник для любого бизнеса
          </motion.h2>
          <motion.p variants={headerItem} className="body-large max-w-xl mx-auto">
            Примеры сценариев использования агентов
          </motion.p>
        </motion.div>

        <motion.div
          variants={cardContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {USE_CASES.map((useCase) => (
            <motion.div
              key={useCase.title}
              variants={cardItem}
              className="group p-7 rounded-2xl bg-white border border-ink-100/70 relative overflow-hidden cursor-default hover:shadow-lg hover:shadow-mauve-600/6 hover:-translate-y-1 hover:border-mauve-200/60 transition-all duration-500"
            >
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-mauve-50/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="relative z-10">
                <div className="text-5xl mb-5">{useCase.emoji}</div>
                <h3 className="heading-4 text-ink-900 mb-2">{useCase.title}</h3>
                <p className="body-small mb-5">{useCase.description}</p>

                <div className="flex flex-col gap-2">
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                    className="self-end text-[13px] px-3 py-2 rounded-2xl rounded-br-sm max-w-[85%] bg-ink-900 text-white leading-relaxed"
                  >
                    {useCase.chat.user}
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.55, duration: 0.4 }}
                    className="self-start text-[13px] px-3 py-2 rounded-2xl rounded-bl-sm max-w-[85%] bg-mauve-50 text-mauve-700 border border-mauve-100 leading-relaxed"
                  >
                    {useCase.chat.agent}
                  </motion.div>
                </div>

                <a
                  href="/login"
                  className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-mauve-600 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0"
                >
                  Попробовать <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
