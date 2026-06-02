'use client';

import { motion } from 'framer-motion';

export default function CTASection() {
  return (
    <section className="py-24 bg-[var(--accent)] text-white">
      <div className="max-w-4xl mx-auto text-center px-6">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="heading-2 text-white mb-4"
        >
          Начните сегодня
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-white/70 max-w-md mx-auto mb-9 text-base"
        >
          14 дней бесплатно. Настройте агента за 2 минуты.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <a
            href="/login"
            className="inline-flex items-center gap-2 bg-white text-[var(--accent)] px-8 py-4 rounded-xl font-semibold text-base hover:opacity-90 transition-opacity"
          >
            Создать агента
          </a>
        </motion.div>
      </div>
    </section>
  );
}
