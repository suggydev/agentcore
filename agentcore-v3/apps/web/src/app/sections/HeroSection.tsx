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
              data-testid="cta-login"
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
            initial={{ opacity: 0, y: 60, rotateY: -15 }}
            animate={{ opacity: 1, y: 0, rotateY: -5 }}
            transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto"
            style={{ maxWidth: '320px', perspective: '1000px' }}
          >
            <div 
              className="relative bg-[#121212] rounded-[32px] p-3"
              style={{ 
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0,0,0,0.1)',
                transform: 'rotateY(-5deg) rotateX(5deg)',
                transformStyle: 'preserve-3d'
              }}
            >
              <div className="bg-[#fbfaf9] rounded-[24px] overflow-hidden">
                {/* Notch */}
                <div className="flex justify-center pt-2 pb-1">
                  <div className="w-20 h-5 bg-[#121212] rounded-full" />
                </div>
                
                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-full bg-[#f8f7f4] flex items-center justify-center text-sm">🤖</div>
                    <div className="text-[13px] font-semibold text-[#343433]">AgentCore</div>
                    <div className="ml-auto text-[10px] text-[#848281]">онлайн</div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-end">
                      <div className="bg-[#171717] text-white text-[12px] px-4 py-2.5 rounded-2xl rounded-br-sm max-w-[80%]">
                        {DEMO_CHAT.user}
                      </div>
                    </div>
                    <div className="flex justify-start">
                      <div className="bg-[#f8f7f4] text-[#343433] text-[12px] px-4 py-2.5 rounded-2xl rounded-bl-sm max-w-[85%]">
                        {DEMO_CHAT.agent}
                      </div>
                    </div>
                    <div className="flex justify-start">
                      <div className="flex items-center gap-1.5 px-4 py-2.5 bg-[#f8f7f4] rounded-2xl rounded-bl-sm">
                        <span className="text-[#848281] text-sm tracking-wider">...</span>
                        <span className="text-[11px] text-[#848281]">печатает</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 pt-2">
                    <div className="flex-1 h-9 rounded-full bg-[#f8f7f4] flex items-center px-4 text-[12px] text-[#848281]">
                      Написать сообщение...
                    </div>
                    <div className="w-9 h-9 rounded-full bg-[#171717] flex items-center justify-center">
                      <Send className="w-4 h-4 text-white" />
                    </div>
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
