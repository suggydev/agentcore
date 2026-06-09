'use client';

import { motion } from 'framer-motion';
import { Video, ArrowRight } from 'lucide-react';

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
          Увидите, как это работает, за 15 минут в Zoom. Или создайте агента сами — бесплатно.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <a
            href="https://t.me/agentcore_support"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-white text-[var(--accent)] px-8 py-4 rounded-xl font-semibold text-base hover:opacity-90 transition-opacity"
          >
            <Video className="w-4 h-4" />
            Записаться на демонстрацию
            <ArrowRight className="w-4 h-4" />
          </a>
          <a
            href="/login"
            className="inline-flex items-center gap-2 text-white/80 px-8 py-4 rounded-xl font-medium text-base hover:text-white transition-colors"
          >
            Создать агента самому
          </a>
        </motion.div>
      </div>
    </section>
  );
}
