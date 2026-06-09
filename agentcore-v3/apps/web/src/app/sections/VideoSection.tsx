'use client';

import { motion } from 'framer-motion';
import { Play, Monitor, Smartphone, Bot } from 'lucide-react';

export default function VideoSection() {
  return (
    <section className="py-24 bg-[var(--bg)]">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <span className="label text-[var(--brand)] mb-3 block">
            Как это работает
          </span>
          <h2 className="heading-2 text-[var(--text)] mb-4">
            Создать агента проще, чем завести соцсеть
          </h2>
          <p className="body-large max-w-lg mx-auto">
            Посмотрите, как за 2 минуты создаётся цифровой сотрудник и начинает отвечать клиентам.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="relative max-w-3xl mx-auto mb-12"
        >
          <div className="aspect-video bg-[var(--surface)] rounded-2xl border border-[var(--border)] flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-[var(--brand)] transition-colors group">
            <div className="w-16 h-16 rounded-full bg-[var(--brand)] flex items-center justify-center group-hover:scale-110 transition-transform">
              <Play className="w-6 h-6 text-white ml-1" />
            </div>
            <div className="text-center">
              <div className="font-semibold text-[var(--text)]">Посмотреть демонстрацию</div>
              <div className="text-sm text-[var(--text-muted)] mt-1">2:30 минуты</div>
            </div>
          </div>
          <p className="text-xs text-[var(--text-muted)] text-center mt-3">
            Скоро здесь будет видео. Пока можно записаться на живую демонстрацию.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: Monitor,
              title: 'Создаёте в браузере',
              description: 'Заполняете форму, выбираете тип бизнеса — агент готов через 2 минуты',
            },
            {
              icon: Smartphone,
              title: 'Подключаете мессенджеры',
              description: 'Просто указываете номер телефона или токен бота — всё настраивается автоматически',
            },
            {
              icon: Bot,
              title: 'Агент работает 24/7',
              description: 'Отвечает клиентам, собирает заявки, передаёт в CRM — пока вы спите или заняты',
            },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              className="bg-[var(--surface)] rounded-xl p-6 border border-[var(--border)]"
            >
              <div className="w-10 h-10 rounded-lg bg-[var(--brand-light)] flex items-center justify-center mb-4">
                <item.icon className="w-5 h-5 text-[var(--brand)]" />
              </div>
              <h3 className="font-semibold text-[var(--text)] mb-2">{item.title}</h3>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
