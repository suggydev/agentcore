'use client';

import { motion } from 'framer-motion';
import { Calendar, Video, Clock, ArrowRight } from 'lucide-react';

export default function DemoCTASection() {
  return (
    <section className="py-20 bg-[var(--surface)]">
      <div className="max-w-4xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <span className="label text-[var(--brand)] mb-3 block">
            Быстрый старт
          </span>
          <h2 className="heading-2 text-[var(--text)] mb-4">
            Увидите, как это работает, за 15 минут
          </h2>
          <p className="body-large max-w-lg mx-auto">
            Покажем в Zoom, как создать агента и подключить к Telegram/WhatsApp. Зададите любые вопросы.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-[var(--bg)] rounded-2xl border border-[var(--border)] p-8 md:p-10"
        >
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[var(--brand-light)] flex items-center justify-center">
                <Video className="w-5 h-5 text-[var(--brand)]" />
              </div>
              <div>
                <div className="font-semibold text-sm text-[var(--text)]">Демонстрация экрана</div>
                <div className="text-xs text-[var(--text-muted)] mt-1">Покажем каждый шаг в реальном времени</div>
              </div>
            </div>
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[var(--brand-light)] flex items-center justify-center">
                <Clock className="w-5 h-5 text-[var(--brand)]" />
              </div>
              <div>
                <div className="font-semibold text-sm text-[var(--text)]">15 минут</div>
                <div className="text-xs text-[var(--text-muted)] mt-1">От регистрации до работающего агента</div>
              </div>
            </div>
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[var(--brand-light)] flex items-center justify-center">
                <Calendar className="w-5 h-5 text-[var(--brand)]" />
              </div>
              <div>
                <div className="font-semibold text-sm text-[var(--text)]">Бесплатно</div>
                <div className="text-xs text-[var(--text-muted)] mt-1">Без обязательств и платежей</div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="https://t.me/agentcore_support"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary px-8 py-4 text-base inline-flex items-center gap-2"
            >
              Записаться на демонстрацию
              <ArrowRight className="w-4 h-4" />
            </a>
            <span className="text-xs text-[var(--text-muted)] font-medium">
              Обычно проводим в тот же день
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
