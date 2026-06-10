'use client';

import { motion } from 'framer-motion';
import { Zap, Target, Heart, Rocket } from 'lucide-react';

const TEAM_VALUES = [
  {
    icon: Zap,
    title: 'Рождены в цифре',
    description: 'Нам 14 лет, и мы выросли с Telegram, TikTok и нейросетями. Технологии — это наш родной язык.',
  },
  {
    icon: Target,
    title: 'Работаем быстрее',
    description: 'Не нужно объяснять, что такое AI. Мы сами тестируем новые модели, пока другие ещё читают про них статьи.',
  },
  {
    icon: Heart,
    title: 'Делаем честно',
    description: 'Нам не нужно скрывать возраст — мы гордимся тем, что уже создаем продукты, которые помогают реальному бизнесу.',
  },
  {
    icon: Rocket,
    title: 'Двигаемся смело',
    description: 'Несмотря на сомнения и «невозможно», мы делаем то, во что верим. И это работает.',
  },
];

export default function AboutTeamSection() {
  return (
    <section className="py-24" style={{ background: 'var(--bg)' }}>
      <div className="max-w-[1200px] mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <span className="label mb-3 block text-brand">
            О команде
          </span>
          <h2 className="heading-2 mb-4 max-w-2xl mx-auto">
            Нам 14 лет. И это наша сила.
          </h2>
          <p className="body-large max-w-xl mx-auto">
            Мы не прячем возраст — мы делаем его частью истории. Потому что быть молодым в tech — это не минус, а преимущество.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 mb-14">
          {TEAM_VALUES.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              className="p-6 bg-white rounded-[10px] shadow-inset"
            >
              <div className="w-10 h-10 rounded-[10px] bg-parchment-card flex items-center justify-center mb-4">
                <item.icon className="w-5 h-5 text-brand" />
              </div>
              <h3 className="font-semibold text-charcoal mb-2 text-sm">{item.title}</h3>
              <p className="text-sm text-graphite leading-relaxed">{item.description}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-midnight rounded-[10px] p-8 md:p-10 text-white max-w-3xl mx-auto"
        >
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="w-14 h-14 rounded-[40px] bg-brand flex items-center justify-center flex-shrink-0">
              <span className="text-2xl font-bold text-white">14</span>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">Почему вы доверяете нам?</h3>
              <p className="text-white/70 leading-relaxed mb-4">
                Мы новое поколение, и нам 14 лет. Мы гораздо быстрее и легче разбираемся в этих технологиях, чем люди, которым 30+. Мы росли с этими инструментами, а не учимся их использовать.
              </p>
              <p className="text-white/70 leading-relaxed mb-4">
                Да, нам не 30. Но мы уже помогли десяткам компаний автоматизировать ответы клиентам, сократить расходы и увеличить продажи. У нас есть навыки и компетенции — и результат, который можно проверить.
              </p>
              <p className="text-white/70 leading-relaxed">
                Согласитесь: это нормально. Поэтому мы этим и занимаемся.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
