'use client';

import { motion } from 'framer-motion';
import { Users, Workflow, Zap, Database } from 'lucide-react';

const LAYERS = [
  {
    title: 'Слой интерфейса',
    subtitle: 'Web · Чат · API · Голос',
    icon: Users,
    tags: ['Web', 'Telegram', 'WhatsApp', 'API'],
  },
  {
    title: 'Маршрутизатор',
    subtitle: 'Smart-модели · Классификация задач',
    icon: Workflow,
    tags: ['Code', 'Vision', 'Creative', 'Analysis', 'General', 'Voice'],
  },
  {
    title: 'Слой обработки',
    subtitle: 'Специализированные модели · Параллельное исполнение',
    icon: Zap,
    tags: [],
  },
  {
    title: 'Выход и хранение',
    subtitle: 'Структурированные ответы · Аудит · Аналитика',
    icon: Database,
    tags: ['Диалоги', 'CRM', 'База знаний', 'Отчёты'],
  },
];

export default function ArchitectureSection() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-3xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <span className="label mb-3 block" style={{ color: '#ff3e00' }}>Архитектура</span>
          <h2 className="heading-2 mb-3">
            Как устроена система
          </h2>
          <p className="body-large max-w-lg mx-auto">
            Чёткие слои. Определённые интерфейсы. Предсказуемый поток данных.
          </p>
        </motion.div>

        <div className="space-y-3">
          {LAYERS.map((layer, i) => (
            <motion.div
              key={layer.title}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              className={`rounded-[10px] p-5 ${
                i === LAYERS.length - 1
                  ? 'bg-[#121212] text-white'
                  : 'bg-white'
              }`}
              style={i === LAYERS.length - 1 ? {} : { boxShadow: 'color(display-p3 0.949 0.941 0.929) 0px 0px 0px 1px inset' }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-9 h-9 rounded-[10px] flex items-center justify-center ${
                  i === LAYERS.length - 1 ? 'bg-white/10' : 'bg-[#f8f7f4]'
                }`}>
                  <layer.icon className={`w-4 h-4 ${i === LAYERS.length - 1 ? 'text-white' : 'text-[#ff3e00]'}`} />
                </div>
                <div>
                  <div className={`font-semibold text-sm ${i === LAYERS.length - 1 ? 'text-white' : 'text-[#343433]'}`}>{layer.title}</div>
                  <div className={`text-xs ${i === LAYERS.length - 1 ? 'text-white/60' : 'text-[#848281]'}`}>{layer.subtitle}</div>
                </div>
              </div>

              {layer.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {layer.tags.map((tag) => (
                    <span
                      key={tag}
                      className={`px-2.5 py-1 rounded-[6px] text-[11px] font-semibold ${
                        i === LAYERS.length - 1
                          ? 'bg-white/10 text-white/80'
                          : 'bg-[#f8f7f4] text-[#343433]'
                      }`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
