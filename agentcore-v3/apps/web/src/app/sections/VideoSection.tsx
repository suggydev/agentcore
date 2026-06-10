'use client';

import { motion } from 'framer-motion';
import { Play, Monitor, Smartphone, Bot } from 'lucide-react';

export default function VideoSection() {
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
          <span className="label mb-3 block" style={{ color: '#ff3e00' }}>
            Как это работает
          </span>
          <h2 className="heading-2 mb-4">
            Создать агента проще, чем завести соцсеть
          </h2>
          <p className="body-large max-w-lg mx-auto">
            Посмотрите, как за 2 минуты создаётся цифровой сотрудник и начинает отвечать клиентам.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="relative max-w-3xl mx-auto mb-12"
        >
          <div className="aspect-video bg-white rounded-[10px] flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-[#ff3e00] transition-colors group"
            style={{ boxShadow: 'color(display-p3 0.949 0.941 0.929) 0px 0px 0px 1px inset' }}>
            <div className="w-16 h-16 rounded-[40px] bg-[#ff3e00] flex items-center justify-center group-hover:scale-110 transition-transform">
              <Play className="w-6 h-6 text-white ml-1" />
            </div>
            <div className="text-center">
              <div className="font-semibold text-[#343433]">Посмотреть демонстрацию</div>
              <div className="text-sm text-[#848281] mt-1">2:30 минуты</div>
            </div>
          </div>
          <div className="flex justify-center mt-3">
            <a
              href="#pricing"
              className="btn-primary text-sm"
            >
              Записаться на живую демонстрацию
            </a>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: Monitor,
              title: 'Создаёте в браузере',
              description: 'Заполняете форму, выбираете тип бизнеса — агент готов через 2 минуты',
            },
            {
              icon: Smartphone,
              title: 'Подключаете мессенджеры',
              description: 'Просто указываете номер телефона или токен бота — всё настраивается автоматически',
            },
            {
              icon: Bot,
              title: 'Агент работает 24/7',
              description: 'Отвечает клиентам, собирает заявки, передаёт в CRM — пока вы спите или заняты',
            },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              className="bg-white rounded-[10px] p-6"
              style={{ boxShadow: 'color(display-p3 0.949 0.941 0.929) 0px 0px 0px 1px inset' }}
            >
              <div className="w-10 h-10 rounded-[10px] bg-[#f8f7f4] flex items-center justify-center mb-4">
                <item.icon className="w-5 h-5 text-[#ff3e00]" />
              </div>
              <h3 className="font-semibold text-[#343433] mb-2">{item.title}</h3>
              <p className="text-sm text-[#474645] leading-relaxed">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
