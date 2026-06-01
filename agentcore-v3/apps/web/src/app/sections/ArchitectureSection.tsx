'use client';

import { useRef } from 'react';
import { motion } from 'framer-motion';
import { Users, Workflow, Zap, Database, ArrowDown } from 'lucide-react';

const LAYERS = [
  {
    title: 'Слой интерфейса',
    subtitle: 'Web · Чат · API · Голос',
    icon: Users,
    tags: ['Web', 'Telegram', 'WhatsApp', 'API'],
    bg: 'bg-white',
    border: 'border-ink-200',
    iconBg: 'bg-mauve-50',
    iconColor: 'text-mauve-600',
    shadow: 'shadow-sm',
    tagStyle: 'bg-ink-50 text-ink-600 border border-ink-100',
  },
  {
    title: 'Маршрутизатор',
    subtitle: 'Smart-модели · Классификация задач',
    icon: Workflow,
    tags: ['Code', 'Vision', 'Creative', 'Analysis', 'General', 'Voice'],
    bg: 'bg-mauve-50',
    border: 'border-mauve-200/15',
    iconBg: 'bg-mauve-600',
    iconColor: 'text-white',
    shadow: '',
    tagStyle: 'bg-white border border-mauve-100/10 text-ink-600',
  },
  {
    title: 'Слой обработки',
    subtitle: '9+ специализированных моделей · Параллельное исполнение',
    icon: Zap,
    tags: [],
    bg: 'bg-white',
    border: 'border-ink-200',
    iconBg: 'bg-ink-100',
    iconColor: 'text-ink-600',
    shadow: 'shadow-sm',
    tagStyle: '',
  },
  {
    title: 'Выход и хранение',
    subtitle: 'Структурированные ответы · Аудит · Аналитика',
    icon: Database,
    tags: ['Диалоги', 'CRM', 'База знаний', 'Отчёты'],
    bg: 'bg-ink-900',
    border: 'border-ink-800',
    iconBg: 'bg-white/10',
    iconColor: 'text-white',
    shadow: '',
    tagStyle: 'bg-white/10 text-ink-200',
    textColor: 'text-white',
    subColor: 'text-ink-300',
  },
];

const layerContainer = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.12,
    },
  },
};

const layerItem = {
  hidden: { opacity: 0, clipPath: 'inset(0 100% 0 0)' },
  show: { opacity: 1, clipPath: 'inset(0 0% 0 0)', transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] } },
};

const innerReveal = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, staggerChildren: 0.06, delayChildren: 0.15, ease: [0.16, 1, 0.3, 1] } },
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

export default function ArchitectureSection() {
  const sectionRef = useRef<HTMLElement>(null);

  return (
    <section ref={sectionRef} className="py-20 lg:py-24 section-padding relative overflow-hidden">
      <div className="absolute inset-0 grid-lines opacity-[0.08]" />
      
      <div className="max-w-3xl mx-auto relative">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-100px' }}
          variants={headerContainer}
          className="text-center mb-14"
        >
          <motion.span variants={headerItem} className="label text-mauve-600 mb-3 block">Архитектура системы</motion.span>
          <motion.h2 variants={headerItem} className="heading-2 text-ink-900 mb-3">
            Как устроена система
          </motion.h2>
          <motion.p variants={headerItem} className="body-large max-w-lg mx-auto">
            Чёткие слои. Определённые интерфейсы. Предсказуемый поток данных.
          </motion.p>
        </motion.div>

        <motion.div
          variants={layerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          className="relative space-y-0"
        >
          {LAYERS.map((layer, i) => (
            <div key={layer.title}>
              <motion.div
                variants={layerItem}
                className={`${layer.bg} rounded-2xl border ${layer.border} ${layer.shadow} p-5 md:p-6 relative`}
                whileHover={{ scale: 1.015, transition: { type: 'spring', stiffness: 400, damping: 25 } }}
              >
                <motion.div variants={innerReveal} className="flex items-center gap-3 mb-3">
                  <div className={`w-9 h-9 rounded-lg ${layer.iconBg} flex items-center justify-center`}>
                    <layer.icon className={`w-4 h-4 ${layer.iconColor}`} />
                  </div>
                  <div>
                    <div className={`font-semibold text-sm ${layer.textColor || 'text-ink-900'}`}>{layer.title}</div>
                    <div className={`text-xs ${layer.subColor || 'text-ink-400'}`}>{layer.subtitle}</div>
                  </div>
                </motion.div>
                
                {layer.tags.length > 0 && (
                  <motion.div variants={innerReveal} className="flex flex-wrap gap-2">
                    {layer.tags.map((tag) => (
                      <span 
                        key={tag} 
                        className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all duration-200 hover:scale-105 hover:shadow-sm cursor-default ${layer.tagStyle}`}
                      >
                        {tag}
                      </span>
                    ))}
                  </motion.div>
                )}

                {i < LAYERS.length - 1 && (
                  <div className="hidden md:block absolute left-1/2 -translate-x-1/2 bottom-0 translate-y-full z-10">
                    <motion.div
                      initial={{ scaleY: 0 }}
                      whileInView={{ scaleY: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                      className="w-px h-6 bg-gradient-to-b from-ink-200 to-transparent origin-top"
                    />
                  </div>
                )}
              </motion.div>

              {i < LAYERS.length - 1 && (
                <div className="flex justify-center py-2">
                  <motion.div
                    animate={{ y: [0, 3, 0] }}
                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }}
                  >
                    <ArrowDown className="w-4 h-4 text-ink-300" />
                  </motion.div>
                </div>
              )}
            </div>
          ))}
        </motion.div>

        {/* Side annotation */}
        <div className="hidden lg:block absolute -right-12 top-1/2 -translate-y-1/2">
          <div className="w-px h-40 bg-gradient-to-b from-transparent via-ink-200 to-transparent" />
          <div className="absolute top-1/2 left-2 -translate-y-1/2 whitespace-nowrap">
            <span className="label text-ink-300 rotate-90 origin-left block">Поток данных</span>
          </div>
        </div>
      </div>
    </section>
  );
}
