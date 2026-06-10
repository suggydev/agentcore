'use client';

import { motion } from 'framer-motion';

const STEPS = [
  {
    number: '01',
    title: 'Создайте агента',
    description: 'Выберите шаблон для вашего бизнеса или создайте с нуля. Укажите, как агент должен общаться с клиентами.',
  },
  {
    number: '02',
    title: 'Подключите каналы',
    description: 'WhatsApp, Telegram, Instagram, чат на сайте — агент работает во всех каналах одновременно.',
  },
  {
    number: '03',
    title: 'Собирайте заявки',
    description: 'Агент отвечает на вопросы, записывает клиентов, собирает заказы — всё автоматически попадает в CRM.',
  },
];

export default function WorkflowSection() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-[1200px] mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-[6px] bg-parchment-card text-xs font-semibold text-charcoal tracking-wide uppercase mb-4">
            Как это работает
          </span>
          <h2 className="heading-2 mb-4">
            Три шага к автоматизации
          </h2>
          <p className="body-large max-w-lg mx-auto">
            Чёткий путь от идеи к работающему агенту.
          </p>
        </motion.div>

        <div className="space-y-6">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              className="flex gap-6 items-start"
            >
              <div className="text-4xl font-mono font-bold text-brand leading-none flex-shrink-0 w-14">
                {step.number}
              </div>
              <div className="pt-1">
                <h3 className="heading-3 mb-2">{step.title}</h3>
                <p className="body-large">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
