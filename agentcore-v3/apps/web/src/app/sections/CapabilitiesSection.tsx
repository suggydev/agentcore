'use client';

import { motion } from 'framer-motion';
import { Zap, MessageCircle, Globe, FileText, Brain, Rocket } from 'lucide-react';

const CAPABILITIES = [
  {
    icon: Zap,
    title: 'Отвечает 24/7',
    description: 'Ваш цифровой сотрудник на связи всегда — ночью, в выходные, в праздники. Клиенты не ждут.',
  },
  {
    icon: MessageCircle,
    title: 'Понимает клиентов',
    description: 'Разбирается что нужно клиенту: вопрос, жалоба или заказ. Сам решает, что делать.',
  },
  {
    icon: Globe,
    title: 'Работает везде',
    description: 'WhatsApp, Telegram, Instagram, чат на сайте, Email — один сотрудник для всех каналов.',
  },
  {
    icon: FileText,
    title: 'Собирает заявки',
    description: 'Имя, телефон, email — всё попадает в CRM автоматически. Заявка не потеряется.',
  },
  {
    icon: Brain,
    title: 'Помнит клиентов',
    description: 'Помнит кто обращался раньше, что заказывал, какие были вопросы. Как настоящий менеджер.',
  },
  {
    icon: Rocket,
    title: 'Запускается за 2 минуты',
    description: 'Без программистов, без настроек серверов. Просто выберите шаблон и запустите.',
  },
];

export default function CapabilitiesSection() {
  return (
    <section id="capabilities" className="py-24" style={{ background: 'var(--bg)' }}>
      <div className="max-w-[1200px] mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-[6px] bg-parchment-card text-xs font-semibold text-charcoal tracking-wide uppercase mb-4">
            Возможности
          </span>
          <h2 className="heading-2 mb-4 max-w-2xl mx-auto">
            Что умеет ваш цифровой сотрудник
          </h2>
          <p className="body-large max-w-xl mx-auto">
            Простые и понятные функции, которые работают на вас каждый день.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {CAPABILITIES.map((cap, i) => (
            <motion.div
              key={cap.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
              className="p-6 rounded-[10px] bg-white shadow-inset"
            >
              <div className="w-12 h-12 rounded-[10px] bg-parchment-card flex items-center justify-center mb-5">
                <cap.icon className="w-6 h-6 text-brand" />
              </div>
              <h3 className="heading-4 mb-2">{cap.title}</h3>
              <p className="body-small">{cap.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
