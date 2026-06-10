'use client';

import { motion } from 'framer-motion';
import { TrendingUp, Clock, Users, MessageCircle } from 'lucide-react';

const RESULTS = [
  {
    icon: TrendingUp,
    value: '35%',
    label: 'рост конверсии',
    description: 'Клиенты получают ответ за 8 секунд вместо 2 часов',
    source: 'Интернет-магазин Asem.kz',
  },
  {
    icon: Clock,
    value: '15 ч',
    label: 'экономия в неделю',
    description: 'Администратор освободил время от рутинных ответов',
    source: 'Сеть салонов Glam Studio',
  },
  {
    icon: Users,
    value: '40%',
    label: 'броней без администратора',
    description: 'Гости бронируют номера полностью через чат',
    source: 'Отель Rixos Almaty',
  },
  {
    icon: MessageCircle,
    value: '80%',
    label: 'вопросов автоматически',
    description: 'Сократили штат операторов с 3 до 1 человека',
    source: 'Магазин AutoExpert.kz',
  },
];

export default function ResultsSection() {
  return (
    <section className="py-24 text-white" style={{ background: '#121212' }}>
      <div className="max-w-[1200px] mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <span className="inline-block px-4 py-1.5 rounded-[6px] bg-white/10 border border-white/20 text-xs font-semibold text-white tracking-wide uppercase mb-4">
            Результаты клиентов
          </span>
          <h2 className="heading-2 text-white mb-4">
            Конкретные цифры, не обещания
          </h2>
          <p className="text-white/70 max-w-lg mx-auto text-base">
            Вот что изменилось в бизнесах, которые уже используют AgentCore.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {RESULTS.map((result, i) => (
            <motion.div
              key={result.label}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              className="bg-white/10 rounded-[10px] p-6 border border-white/20"
            >
              <div className="w-10 h-10 rounded-[10px] bg-white/20 flex items-center justify-center mb-4">
                <result.icon className="w-5 h-5 text-white" />
              </div>
              <div className="text-3xl font-bold text-white mb-1">{result.value}</div>
              <div className="text-sm font-semibold text-white/90 mb-2">{result.label}</div>
              <p className="text-sm text-white/70 leading-relaxed mb-3">{result.description}</p>
              <div className="text-xs text-white/50">{result.source}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
