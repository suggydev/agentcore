'use client';

import { motion } from 'framer-motion';
import { Users, Workflow, Zap, Database } from 'lucide-react';

const LAYERS = [
  {
    title: 'Слой интерфейса',
    subtitle: 'Web · Чат · API · Голос',
    icon: Users,
    tags: ['Web', 'Telegram', 'WhatsApp', 'API'],
    dark: false,
  },
  {
    title: 'Маршрутизатор',
    subtitle: 'Smart-модели · Классификация задач',
    icon: Workflow,
    tags: ['Code', 'Vision', 'Creative', 'Analysis', 'General', 'Voice'],
    dark: false,
  },
  {
    title: 'Слой обработки',
    subtitle: 'Специализированные модели · Параллельное исполнение',
    icon: Zap,
    tags: [],
    dark: false,
  },
  {
    title: 'Выход и хранение',
    subtitle: 'Структурированные ответы · Аудит · Аналитика',
    icon: Database,
    tags: ['Диалоги', 'CRM', 'База знаний', 'Отчёты'],
    dark: true,
  },
];

export default function ArchitectureSection() {
  return (
    <section className="py-24 bg-[var(--surface)]">
      <div className="max-w-3xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <span className="label text-[var(--brand)] mb-3 block">Архитектура</span>
          <h2 className="heading-2 text-[var(--text)] mb-3">
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
              className={`rounded-xl border p-5 ${
                layer.dark
                  ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                  : 'bg-white border-[var(--border)]'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  layer.dark ? 'bg-white/10' : 'bg-[var(--surface-2)]'
                }`}>
                  <layer.icon className={`w-4 h-4 ${layer.dark ? 'text-white' : 'text-[var(--brand)]'}`} />
                </div>
                <div>
                  <div className={`font-semibold text-sm ${layer.dark ? 'text-white' : 'text-[var(--text)]'}`}>{layer.title}</div>
                  <div className={`text-xs ${layer.dark ? 'text-white/60' : 'text-[var(--text-muted)]'}`}>{layer.subtitle}</div>
                </div>
              </div>

              {layer.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {layer.tags.map((tag) => (
                    <span
                      key={tag}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold ${
                        layer.dark
                          ? 'bg-white/10 text-white/80'
                          : 'bg-[var(--surface-2)] text-[var(--text)]'
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
