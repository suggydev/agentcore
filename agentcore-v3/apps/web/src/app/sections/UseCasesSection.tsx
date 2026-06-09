'use client';

import { motion } from 'framer-motion';
import { USE_CASES } from '../../data/landingContent';

export default function UseCasesSection() {
  return (
    <section id="use-cases" className="py-24" style={{ background: 'var(--bg)' }}>
      <div className="max-w-[1200px] mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-[6px] bg-[#f8f7f4] text-xs font-semibold text-[#343433] tracking-wide uppercase mb-4">
            Готовые сценарии
          </span>
          <h2 className="heading-2 mb-4 max-w-2xl mx-auto">
            Цифровой сотрудник для любого бизнеса
          </h2>
          <p className="body-large max-w-xl mx-auto">
            Примеры сценариев использования агентов
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {USE_CASES.map((useCase, i) => (
            <motion.div
              key={useCase.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.4 }}
              className="p-7 rounded-[10px] bg-white"
              style={{ boxShadow: 'color(display-p3 0.949 0.941 0.929) 0px 0px 0px 1px inset' }}
            >
              <div className="text-5xl mb-5">{useCase.emoji}</div>
              <h3 className="heading-4 mb-2">{useCase.title}</h3>
              <p className="body-small mb-5">{useCase.description}</p>

              <div className="flex flex-col gap-2">
                <div className="self-end text-[13px] px-3 py-2 rounded-xl rounded-br-sm max-w-[85%] bg-[#121212] text-white leading-relaxed">
                  {useCase.chat.user}
                </div>
                <div className="self-start text-[13px] px-3 py-2 rounded-xl rounded-bl-sm max-w-[85%] leading-relaxed" style={{ background: 'var(--brand-light)', color: '#343433', boxShadow: 'color(display-p3 0.949 0.941 0.929) 0px 0px 0px 1px inset' }}>
                  {useCase.chat.agent}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
