'use client';

import { useRef } from 'react';
import { motion } from 'framer-motion';
import { Square, CircleDot, Database, Link2, Settings, FileText } from 'lucide-react';

const STEPS = [
  {
    number: '01',
    title: 'Определите структуру',
    description: 'Отобразите процесс как структурированную систему. Определите входы, точки принятия решений и выходы с чёткими архитектурными границами.',
    visual: (
      <div className="flex items-center justify-center gap-3 md:gap-5">
        <motion.div 
          className="w-14 h-14 rounded-xl bg-ink-900 flex items-center justify-center shadow-lg"
          whileHover={{ scale: 1.08 }}
        >
          <Square className="w-6 h-6 text-white" />
        </motion.div>
        <div className="flex flex-col items-center gap-1">
          <div className="w-10 h-px bg-mauve-400" />
          <div className="w-2 h-2 rounded-full bg-mauve-600" />
          <div className="w-10 h-px bg-mauve-400" />
        </div>
        <motion.div 
          className="w-14 h-14 rounded-xl bg-mauve-600 flex items-center justify-center shadow-lg shadow-mauve-600/20"
          whileHover={{ scale: 1.08 }}
        >
          <CircleDot className="w-6 h-6 text-white" />
        </motion.div>
        <div className="flex flex-col items-center gap-1">
          <div className="w-10 h-px bg-mauve-400" />
          <div className="w-2 h-2 rounded-full bg-mauve-600" />
          <div className="w-10 h-px bg-mauve-400" />
        </div>
        <motion.div 
          className="w-14 h-14 rounded-xl bg-ink-900 flex items-center justify-center shadow-lg"
          whileHover={{ scale: 1.08 }}
        >
          <Square className="w-6 h-6 text-white" />
        </motion.div>
      </div>
    ),
  },
  {
    number: '02',
    title: 'Подключите системы',
    description: 'Интегрируйтесь с существующей инфраструктурой. API, базы данных и сторонние сервисы соединяются через стандартизированные интерфейсы.',
    visual: (
      <div className="flex items-center justify-center gap-3 md:gap-5">
        <motion.div 
          className="w-16 h-16 rounded-2xl bg-white border border-ink-100 flex items-center justify-center shadow-sm"
          whileHover={{ y: -3 }}
        >
          <Database className="w-7 h-7 text-ink-500" />
        </motion.div>
        <div className="flex flex-col items-center gap-1">
          <div className="w-8 h-px bg-mauve-400" />
          <Link2 className="w-4 h-4 text-mauve-600" />
          <div className="w-8 h-px bg-mauve-400" />
        </div>
        <motion.div 
          className="w-16 h-16 rounded-2xl bg-mauve-50 border border-mauve-200/30 flex items-center justify-center shadow-sm"
          whileHover={{ y: -3 }}
        >
          <Settings className="w-7 h-7 text-mauve-600" />
        </motion.div>
        <div className="flex flex-col items-center gap-1">
          <div className="w-8 h-px bg-mauve-400" />
          <Link2 className="w-4 h-4 text-mauve-600" />
          <div className="w-8 h-px bg-mauve-400" />
        </div>
        <motion.div 
          className="w-16 h-16 rounded-2xl bg-white border border-ink-100 flex items-center justify-center shadow-sm"
          whileHover={{ y: -3 }}
        >
          <FileText className="w-7 h-7 text-ink-500" />
        </motion.div>
      </div>
    ),
  },
  {
    number: '03',
    title: 'Мониторинг и оптимизация',
    description: 'Реальная видимость производительности системы. Выявляйте узкие места и итерируйте структуру на основе данных.',
    visual: (
      <div className="flex items-end justify-center gap-2 h-24 md:h-28 px-4">
          {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
          <motion.div
            key={i}
            className="flex-1 max-w-[36px] rounded-t-xl bg-gradient-to-t from-mauve-600/20 to-mauve-600/50 origin-bottom"
            initial={{ scaleY: 0 }}
            whileInView={{ scaleY: 1 }}
            transition={{
              type: 'spring',
              stiffness: 200,
              damping: 20,
              mass: 0.8,
              delay: i * 0.06,
            }}
            viewport={{ once: true }}
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    ),
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

export default function WorkflowSection() {
  const sectionRef = useRef<HTMLElement>(null);

  return (
    <section ref={sectionRef} id="workflow" className="py-20 lg:py-28 section-padding bg-[#F8F9FB] relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full opacity-25"
        style={{
          background: 'radial-gradient(circle, rgba(212,182,216,0.15) 0%, rgba(168,150,171,0.04) 50%, transparent 70%)',
          filter: 'blur(50px)',
        }}
      />

      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-100px' }}
          variants={headerContainer}
          className="text-center mb-16"
        >
          <motion.span variants={headerItem} className="inline-block px-4 py-1.5 rounded-full bg-white border border-mauve-200/50 text-xs font-semibold text-mauve-600 tracking-wide uppercase mb-4 shadow-sm">
            Как это работает
          </motion.span>
          <motion.h2 variants={headerItem} className="heading-2 text-ink-900 mb-4">
            Три шага к структурированной автоматизации
          </motion.h2>
          <motion.p variants={headerItem} className="body-large max-w-lg mx-auto">
            Чёткий путь от идеи к интеллектуальной системе.
          </motion.p>
        </motion.div>

        <div className="space-y-24 md:space-y-28">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.number}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-100px' }}
              variants={{
                hidden: {},
                show: {
                  transition: {
                    staggerChildren: 0.1,
                  },
                },
              }}
              className={`grid lg:grid-cols-2 gap-10 lg:gap-14 items-center ${
                i % 2 === 1 ? 'lg:flex-row-reverse' : ''
              }`}
            >
              <motion.div
                variants={{
                  hidden: { opacity: 0, x: i % 2 === 0 ? -40 : 40 },
                  show: { opacity: 1, x: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
                }}
                className={`${i % 2 === 1 ? 'lg:order-2' : ''}`}
              >
                <div className="text-6xl sm:text-7xl md:text-8xl font-mono font-bold text-ink-100 mb-4 leading-none tracking-tight" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {step.number}
                </div>
                <h3 className="heading-3 text-ink-900 mb-3">{step.title}</h3>
                <p className="body-large">{step.description}</p>
                
                <div className="mt-6 w-16 h-px bg-gradient-to-r from-mauve-600 to-transparent" />
              </motion.div>
              
              <motion.div
                variants={{
                  hidden: { opacity: 0, x: i % 2 === 0 ? 40 : -40 },
                  show: { opacity: 1, x: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
                }}
                className={`${i % 2 === 1 ? 'lg:order-1' : ''}`}
              >
                <div className="bg-white rounded-2xl p-8 md:p-10 border border-ink-100/70 shadow-sm">
                  {step.visual}
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
