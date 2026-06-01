'use client';

import { useRef } from 'react';
import { motion } from 'framer-motion';
import { Zap, MessageCircle, Globe, FileText, Brain, Rocket, ArrowUpRight } from 'lucide-react';

const CAPABILITIES = [
  {
    icon: Zap,
    title: 'Отвечает 24/7',
    description: 'Ваш ИИ-сотрудник на связи всегда — ночью, в выходные, в праздники. Клиенты не ждут.',
    color: 'bg-mauve-50 text-mauve-600',
  },
  {
    icon: MessageCircle,
    title: 'Понимает клиентов',
    description: 'Разбирается что нужно клиенту: вопрос, жалоба или заказ. Сам решает, что делать.',
    color: 'bg-ink-100 text-ink-700',
  },
  {
    icon: Globe,
    title: 'Работает везде',
    description: 'WhatsApp, Telegram, Instagram, чат на сайте, Email — один сотрудник для всех каналов.',
    color: 'bg-mauve-50 text-mauve-600',
  },
  {
    icon: FileText,
    title: 'Собирает заявки',
    description: 'Имя, телефон, email — всё попадает в CRM автоматически. Заявка не потеряется.',
    color: 'bg-ink-100 text-ink-700',
  },
  {
    icon: Brain,
    title: 'Помнит клиентов',
    description: 'Помнит кто обращался раньше, что заказывал, какие были вопросы. Как настоящий менеджер.',
    color: 'bg-mauve-50 text-mauve-600',
  },
  {
    icon: Rocket,
    title: 'Подключается за 60 секунд',
    description: 'Без программистов, без настроек серверов. Просто выберите шаблон и запустите.',
    color: 'bg-ink-100 text-ink-700',
  },
];

const cardContainer = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const cardItem = {
  hidden: { opacity: 0, y: 50 },
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

export default function CapabilitiesSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  return (
    <section ref={sectionRef} id="capabilities" className="py-20 lg:py-28 section-padding bg-[#F8F9FB] relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full opacity-30"
        style={{
          background: 'radial-gradient(circle, rgba(212,182,216,0.15) 0%, rgba(168,150,171,0.04) 50%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          ref={sectionRef}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-100px' }}
          variants={headerContainer}
          className="text-center mb-16"
        >
          <motion.span variants={headerItem} className="inline-block px-4 py-1.5 rounded-full bg-white border border-mauve-200/50 text-xs font-semibold text-mauve-600 tracking-wide uppercase mb-4 shadow-sm">
            Возможности
          </motion.span>
          <motion.h2 variants={headerItem} className="heading-2 text-ink-900 mb-4 max-w-2xl mx-auto">
            Что умеет ваш ИИ-сотрудник
          </motion.h2>
          <motion.p variants={headerItem} className="body-large max-w-xl mx-auto">
            Простые и понятные функции, которые работают на вас каждый день.
          </motion.p>
        </motion.div>

        <motion.div
          variants={cardContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5"
        >
          {CAPABILITIES.map((cap) => (
            <motion.div
              key={cap.title}
              variants={cardItem}
              className="group p-5 md:p-7 rounded-2xl bg-white border border-ink-100/70 relative overflow-hidden cursor-default hover:shadow-md hover:shadow-mauve-600/6 hover:-translate-y-1 transition-all duration-500 min-w-0"
            >
              <div className="absolute top-0 right-0 w-28 h-28 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                <svg width="112" height="112" viewBox="0 0 80 80" fill="none">
                  <path d="M80 0 L80 80 L0 80" stroke="#D4B6D8" strokeOpacity="0.25" strokeWidth="1.2" />
                  <path d="M60 0 L60 20 L80 20" stroke="#D4B6D8" strokeOpacity="0.15" strokeWidth="0.8" />
                </svg>
              </div>

              <div className={`w-12 h-12 rounded-xl ${cap.color} flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110`}>
                <cap.icon className="w-6 h-6" />
              </div>
              <h3 className="heading-4 text-ink-900 mb-2">{cap.title}</h3>
              <p className="body-small">{cap.description}</p>
              <div className="mt-5 flex items-center gap-1.5 text-xs font-semibold text-mauve-600 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                Подробнее <ArrowUpRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
