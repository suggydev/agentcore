'use client';

import { useRef } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Brain, MessageSquare, BarChart3, Check } from 'lucide-react';

const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
};

export default function ValuePropSection() {
  const sectionRef = useRef<HTMLElement>(null);

  return (
    <section ref={sectionRef} className="py-20 lg:py-28 section-padding relative overflow-hidden bg-white">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div
          className="absolute top-[20%] -right-[10%] w-[500px] h-[500px] rounded-full opacity-30"
          style={{
            background: 'radial-gradient(circle, rgba(212,182,216,0.12) 0%, rgba(168,150,171,0.04) 50%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-100px' }}
            variants={containerVariants}
          >
            <motion.span variants={itemVariants} className="inline-block px-4 py-1.5 rounded-full bg-mauve-50 border border-mauve-200/50 text-xs font-semibold text-mauve-600 tracking-wide uppercase mb-5">
              Как это работает
            </motion.span>
            <motion.h2 variants={itemVariants} className="heading-2 text-ink-900 mb-5">
              ИИ-сотрудник, который
              <br />
              <span className="text-gradient-mauve">реально помогает</span>
            </motion.h2>
            <motion.p variants={itemVariants} className="body-large mb-8">
              Не просто чат-бот, а полноценный цифровой сотрудник. Он понимает ваш бизнес,
              общается с клиентами и приносит продажи.
            </motion.p>
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
                  initial={{ opacity: 0, x: -15 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 + 0.2, duration: 0.4 }}
                  viewport={{ once: true }}
                >
                  <div className="w-5 h-5 rounded-full bg-mauve-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-mauve-600" />
                  </div>
                  <span className="text-ink-700 font-medium text-sm leading-relaxed">{item}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            viewport={{ once: true, margin: '-100px' }}
            className="relative"
          >
            <div className="relative aspect-square max-w-md mx-auto">
              <div className="absolute inset-0 grid grid-cols-2 gap-3 p-3">
                {[
                  { icon: MessageCircle, title: 'Клиент пишет', sub: 'Web, WhatsApp, Telegram, Instagram', accent: false },
                  { icon: Brain, title: 'ИИ понимает', sub: 'Вопрос, жалоба, заказ — сам разберётся', accent: false },
                  { icon: MessageSquare, title: 'ИИ отвечает', sub: 'Консультация, запись, продажа', accent: false },
                  { icon: BarChart3, title: 'Вы видите результат', sub: 'Заявки в CRM, запись в календаре, оплата', accent: true },
                ].map((card, i) => (
                  <motion.div 
                    key={i}
                    className={`rounded-2xl border p-4 sm:p-5 shadow-sm flex flex-col justify-between cursor-default min-h-[120px] sm:min-h-[140px] ${
                      card.accent 
                        ? 'bg-ink-900 text-white border-ink-800 shadow-lg' 
                        : 'bg-white border-ink-100 hover:border-mauve-200/50 transition-colors'
                    }`}
                    whileHover={{ y: -5, scale: 1.02, transition: { duration: 0.25 } }}
                  >
                    <card.icon className={`w-6 h-6 sm:w-7 sm:h-7 ${card.accent ? 'text-mauve-300' : 'text-mauve-600'}`} />
                    <div>
                      <div className={`font-semibold text-xs sm:text-sm ${card.accent ? 'text-white' : 'text-ink-900'}`}>{card.title}</div>
                      <div className={`text-[10px] sm:text-[11px] mt-1 leading-relaxed ${card.accent ? 'text-ink-300' : 'text-ink-400'}`}>{card.sub}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-mauve-600 rounded-full z-10 pulse-glow" />
              <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
                <line x1="25%" y1="50%" x2="75%" y2="50%" stroke="#E2E4EB" strokeWidth="1" strokeDasharray="4 3">
                  <animate attributeName="stroke-dashoffset" from="0" to="-14" dur="2s" repeatCount="indefinite" begin="0s" />
                </line>
                <line x1="50%" y1="25%" x2="50%" y2="75%" stroke="#E2E4EB" strokeWidth="1" strokeDasharray="4 3">
                  <animate attributeName="stroke-dashoffset" from="0" to="-14" dur="2s" repeatCount="indefinite" begin="0.5s" />
                </line>
              </svg>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
