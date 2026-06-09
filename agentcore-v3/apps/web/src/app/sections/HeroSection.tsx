'use client';

import { motion } from 'framer-motion';
import { Send, CheckCheck, Video, ArrowRight } from 'lucide-react';
import { DEMO_CHAT } from '../../data/landingContent';

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-20 lg:pt-28 pb-12 lg:pb-16" style={{ background: 'var(--bg)' }}>
      <div className="relative z-10 max-w-[1200px] mx-auto px-6 w-full grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        <div className="text-center lg:text-left">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="heading-1 mb-6 max-w-xl mx-auto lg:mx-0"
          >
            Ваш бизнес работает
            <br />
            даже когда вы спите
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="body-large max-w-lg mx-auto lg:mx-0 mb-9"
          >
            Цифровой сотрудник отвечает клиентам в Telegram, WhatsApp и на сайте — 24/7. Создайте за 2 минуты.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center lg:items-start gap-3"
          >
            <a
              href="https://t.me/agentcore_support"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary px-8 py-4 text-base inline-flex items-center gap-2"
            >
              <Video className="w-4 h-4" />
              Записаться на демонстрацию
              <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="/login"
              className="btn-ghost text-[15px]"
            >
              или создать самому — бесплатно
            </a>
            <span className="caption font-medium">
              15 минут в Zoom, покажем каждый шаг
            </span>
          </motion.div>
        </div>

        <div className="hidden lg:block">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-sm mx-auto bg-white rounded-[10px] overflow-hidden"
            style={{ boxShadow: 'color(display-p3 0.949 0.941 0.929) 0px 0px 0px 1px inset' }}
          >
            <div className="px-5 py-3.5 flex items-center gap-3 border-b" style={{ borderColor: 'var(--border)' }}>
              <div className="w-8 h-8 rounded-[40px] flex items-center justify-center text-sm" style={{ background: 'var(--surface-2)' }}>
                💬
              </div>
              <div className="flex-1">
                <p className="text-[#343433] text-sm font-semibold leading-tight">
                  Чат с клиентом
                </p>
                <p className="text-[#848281] text-xs flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--success)' }} />
                  онлайн
                </p>
              </div>
            </div>

            <div className="p-4 space-y-3" style={{ background: 'var(--bg)' }}>
              <div className="flex justify-end">
                <div className="max-w-[80%] bg-white rounded-xl rounded-br-md px-4 py-2.5" style={{ boxShadow: 'color(display-p3 0.949 0.941 0.929) 0px 0px 0px 1px inset' }}>
                  <p className="text-[13px] text-[#343433] leading-relaxed">
                    {DEMO_CHAT.user}
                  </p>
                  <span className="block text-[10px] text-[#848281] mt-1 text-right">
                    {DEMO_CHAT.userTime}
                  </span>
                </div>
              </div>

              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-xl rounded-bl-md px-4 py-2.5" style={{ background: 'var(--brand-light)', boxShadow: 'color(display-p3 0.949 0.941 0.929) 0px 0px 0px 1px inset' }}>
                  <p className="text-[13px] text-[#343433] leading-relaxed">
                    {DEMO_CHAT.agent}
                  </p>
                  <div className="flex items-center justify-end gap-1 mt-1">
                    <CheckCheck className="w-3 h-3" style={{ color: 'var(--brand)' }} />
                    <span className="text-[10px] text-[#848281]">{DEMO_CHAT.agentTime}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-start">
                <div className="flex items-center gap-1.5 px-4 py-2.5 bg-white rounded-xl rounded-bl-md" style={{ boxShadow: 'color(display-p3 0.949 0.941 0.929) 0px 0px 0px 1px inset' }}>
                  <span className="text-[#848281] text-sm tracking-wider">...</span>
                  <span className="text-[11px] text-[#848281]">
                    печатает
                  </span>
                </div>
              </div>

              <div className="pt-1">
                <div className="flex items-center gap-2 bg-white border rounded-xl px-4 py-3" style={{ borderColor: 'var(--border)' }}>
                  <input
                    type="text"
                    placeholder="Написать сообщение..."
                    className="flex-1 text-[13px] bg-transparent outline-none text-[#343433] placeholder:text-[#a7a7a7]"
                    readOnly
                  />
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent)' }}>
                    <Send className="w-3.5 h-3.5 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
