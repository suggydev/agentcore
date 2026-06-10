'use client';

import { motion } from 'framer-motion';
import { MessageCircle, Brain, MessageSquare, BarChart3, Check } from 'lucide-react';

export default function ValuePropSection() {
  return (
    <section id="value-prop" className="py-24 relative bg-white">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-block px-4 py-1.5 rounded-[6px] bg-parchment-card text-xs font-semibold text-charcoal tracking-wide uppercase mb-5">
              Как это работает
            </span>
            <h2 className="heading-2 mb-5">
              Цифровой сотрудник,
              <br />
              <span className="text-brand">который реально помогает</span>
            </h2>
            <p className="body-large mb-8">
              Не просто чат-бот, а полноценный цифровой сотрудник. Он понимает ваш бизнес,
              общается с клиентами и приносит продажи.
            </p>
            <div className="space-y-3.5">
              {[
                'Отвечает за 8 секунд в WhatsApp, Telegram, Instagram',
                'Работает 24/7 без выходных и больничных',
                'Сам учится на ваших документах и FAQ',
                'Подключается к CRM, календарю, платёжным системам',
              ].map((item, i) => (
                <motion.div
                  key={item}
                  className="flex items-start gap-3.5"
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.4 }}
                  viewport={{ once: true }}
                >
                  <div className="w-5 h-5 rounded-full bg-parchment-card flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-brand" />
                  </div>
                  <span className="text-graphite font-medium text-sm leading-relaxed">{item}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="relative aspect-square max-w-md mx-auto">
              <div className="absolute inset-0 grid grid-cols-2 gap-3 p-3">
                {[
                  { icon: MessageCircle, title: 'Клиент пишет', sub: 'Web, WhatsApp, Telegram, Instagram' },
                  { icon: Brain, title: 'Агент понимает', sub: 'Вопрос, жалоба, заказ — сам разберётся' },
                  { icon: MessageSquare, title: 'Агент отвечает', sub: 'Консультация, запись, продажа' },
                  { icon: BarChart3, title: 'Вы видите результат', sub: 'Заявки в CRM, запись в календаре, оплата', accent: true },
                ].map((card, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1, duration: 0.4 }}
                    viewport={{ once: true }}
                    className={`rounded-[10px] p-4 sm:p-5 flex flex-col justify-between cursor-default min-h-[120px] sm:min-h-[140px] ${
                      card.accent
                        ? 'bg-midnight text-white'
                        : 'bg-white shadow-inset'
                    }`}
                  >
                    <card.icon className={`w-6 h-6 sm:w-7 sm:h-7 ${card.accent ? 'text-white/70' : 'text-brand'}`} />
                    <div>
                      <div className={`font-semibold text-xs sm:text-sm ${card.accent ? 'text-white' : 'text-charcoal'}`}>{card.title}</div>
                      <div className={`text-[10px] sm:text-[11px] mt-1 leading-relaxed ${card.accent ? 'text-white/60' : 'text-text-muted'}`}>{card.sub}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
