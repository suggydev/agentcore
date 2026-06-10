'use client';

import { motion } from 'framer-motion';
import { MessageCircle, Check, ArrowRight } from 'lucide-react';

const CHANNELS = [
  {
    name: 'Telegram',
    icon: '💬',
    steps: [
      'Создаёте бота в @BotFather',
      'Копируете API-токен',
      'Вставляете в AgentCore — готово',
    ],
    time: '2 минуты',
  },
  {
    name: 'WhatsApp',
    icon: '📱',
    steps: [
      'Получаете API-ключ в WhatsApp Business',
      'Указываете номер телефона',
      'Агент начинает отвечать клиентам',
    ],
    time: '5 минут',
  },
  {
    name: 'Чат на сайте',
    icon: '🌐',
    steps: [
      'Копируете готовый скрипт',
      'Вставляете на сайт',
      'Клиенты пишут прямо на сайте',
    ],
    time: '1 минута',
  },
];

export default function IntegrationSection() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-[1200px] mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <span className="label mb-3 block" style={{ color: '#ff3e00' }}>
            Интеграции
          </span>
          <h2 className="heading-2 mb-4">
            Подключите за пару минут
          </h2>
          <p className="body-large max-w-lg mx-auto">
            Не нужен программист. Не нужно читать документацию. Просто следуйте шагам.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {CHANNELS.map((channel, i) => (
            <motion.div
              key={channel.name}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              className="bg-[#f8f7f4] rounded-[10px] p-6"
              style={{ boxShadow: 'color(display-p3 0.949 0.941 0.929) 0px 0px 0px 1px inset' }}
            >
              <div className="flex items-center gap-3 mb-6">
                <span className="text-2xl">{channel.icon}</span>
                <div>
                  <h3 className="font-semibold text-[#343433]">{channel.name}</h3>
                  <div className="text-xs text-[#848281]">{channel.time}</div>
                </div>
              </div>

              <div className="space-y-3">
                {channel.steps.map((step, j) => (
                  <div key={j} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#f8f7f4] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-[#ff3e00]" />
                    </div>
                    <span className="text-sm text-[#474645]">{step}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="mt-10 text-center"
        >
          <p className="text-sm text-[#848281] mb-4">
            Также доступны: Instagram, VK, Avito, Viber, Email, SMS
          </p>
          <a
            href="https://t.me/agentcore_support"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost"
          >
            Записаться на демонстрацию подключения
            <ArrowRight className="w-4 h-4" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}
