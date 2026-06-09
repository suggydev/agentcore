'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { 
  Zap, Shield, Clock, Brain, Sparkles, 
  MessageCircle, Send, Smartphone, Bot,
  ChevronDown, ArrowRight, Play, Check
} from 'lucide-react';
import Link from 'next/link';

/* ============================================
   FAMILY.CO CLONE — ADAPTED FOR AGENTCORE
   Structure mimics family.co layout
   ============================================ */

const FEATURES = [
  { icon: Sparkles, title: 'Просто', desc: 'Создаётся за 2 минуты без программистов' },
  { icon: Clock, title: 'Быстро', desc: 'Отвечает клиентам за 8 секунд' },
  { icon: Shield, title: 'Надёжно', desc: 'Работает 24/7 без выходных' },
  { icon: Brain, title: 'Умно', desc: 'Учится на ваших документах и FAQ' },
  { icon: Zap, title: 'Мощно', desc: 'Подключается к CRM, календарю, платежам' },
];

const ACTIONS = [
  { icon: Send, title: 'Отвечает', desc: 'Автоматические ответы в WhatsApp, Telegram, Instagram' },
  { icon: MessageCircle, title: 'Записывает', desc: 'Клиенты записываются сами, без администратора' },
  { icon: Smartphone, title: 'Продаёт', desc: 'Консультирует, помогает выбрать, оформляет заказ' },
];

const TESTIMONIALS = [
  { quote: 'AgentCore обрабатывает 200+ заявок в месяц. Конверсия выросла на 35%.', author: 'Асхат К.', role: 'Asem.kz' },
  { quote: 'Неявки сократились в 3 раза, администратор освободил 15 часов в неделю.', author: 'Гульнара М.', role: 'Glam Studio' },
  { quote: 'Агент отвечает на 80% вопросов. Сократили штат с 3 до 1 оператора.', author: 'Серик Д.', role: 'AutoExpert.kz' },
  { quote: '40% броней проходят полностью через чат без администратора.', author: 'Ержан Н.', role: 'Rixos Almaty' },
];

const FAQ = [
  { q: 'Сколько времени занимает запуск?', a: 'Буквально 2 минуты. Выберите сферу бизнеса, и агент готов к работе.' },
  { q: 'Нужен ли программист?', a: 'Нет. Всё настраивается без кода через понятный интерфейс.' },
  { q: 'В какие каналы можно подключить?', a: 'WhatsApp, Telegram, Instagram, чат на сайте, Email, VK. Один агент для всех каналов.' },
  { q: 'Может ли агент заменить менеджера?', a: 'На 80% — да. Сложные случаи передаёт живому сотруднику.' },
];

export default function FamilyClonePage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  const heroY = useTransform(scrollYProgress, [0, 0.2], [0, -100]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);

  return (
    <div ref={containerRef} className="min-h-screen" style={{ background: '#fbfaf9' }}>
      {/* ====== NAVIGATION ====== */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-6 max-w-[1200px] mx-auto"
        style={{ background: 'rgba(251, 250, 249, 0.9)', backdropFilter: 'blur(12px)' }}>
        <div className="flex items-center gap-2.5">
          <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
            <rect x="4" y="4" width="14" height="14" rx="3" fill="#121212" />
            <rect x="22" y="4" width="14" height="14" rx="3" fill="#ff3e00" />
            <rect x="4" y="22" width="14" height="14" rx="3" fill="#ff3e00" />
            <circle cx="29" cy="29" r="6" fill="#121212" />
          </svg>
          <span className="font-semibold text-[#343433] text-[15px] tracking-[-0.18px]">AgentCore</span>
        </div>
        <div className="hidden md:flex items-center gap-7">
          <a href="#features" className="text-[14px] font-medium text-[#343433] tracking-[-0.18px] hover:text-[#848281] transition-colors">Возможности</a>
          <a href="#how-it-works" className="text-[14px] font-medium text-[#343433] tracking-[-0.18px] hover:text-[#848281] transition-colors">Как работает</a>
          <a href="#pricing" className="text-[14px] font-medium text-[#343433] tracking-[-0.18px] hover:text-[#848281] transition-colors">Тарифы</a>
          <Link href="/login" className="bg-[#121212] text-white px-5 py-2 rounded-[32px] text-[14px] font-medium hover:bg-[#343433] transition-colors">
            Попробовать
          </Link>
        </div>
      </nav>

      {/* ====== HERO ====== */}
      <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="text-center max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 className="font-medium text-[clamp(2.5rem,8vw,5rem)] leading-[1.09] tracking-[-2.11px] text-[#343433] mb-6">
              Ваш цифровой
              <br />
              сотрудник
            </h1>
            <p className="text-[17px] text-[#474645] leading-[1.47] tracking-[-0.22px] max-w-lg mx-auto mb-10">
              Создайте AI-агента за 2 минуты. Он ответит клиентам в Telegram, WhatsApp и на сайте — пока вы спите.
            </p>
            <div className="flex items-center justify-center gap-4">
              <a href="https://t.me/agentcore_support" target="_blank" rel="noopener noreferrer"
                className="bg-[#121212] text-white px-7 py-3.5 rounded-[32px] text-[14px] font-medium hover:bg-[#343433] transition-colors inline-flex items-center gap-2">
                <Play className="w-4 h-4" />
                Записаться на демо
              </a>
              <Link href="/login"
                className="bg-[#f6f4ef] text-[#121212] px-7 py-3.5 rounded-[32px] text-[14px] font-medium hover:bg-[#eae8e3] transition-colors">
                Создать бесплатно
              </Link>
            </div>
          </motion.div>

          {/* Phone Mockup */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="mt-16 max-w-sm mx-auto"
          >
            <div className="bg-[#121212] rounded-[24px] p-4 shadow-[rgba(0,0,0,0.15)_0px_0px_24px_0px]">
              <div className="bg-[#fbfaf9] rounded-[20px] overflow-hidden p-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-[40px] bg-[#f8f7f4] flex items-center justify-center text-sm">💬</div>
                  <div className="text-[13px] font-semibold text-[#343433]">AgentCore Bot</div>
                  <div className="ml-auto text-[10px] text-[#848281]">онлайн</div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-end">
                    <div className="bg-[#121212] text-white text-[13px] px-4 py-2.5 rounded-xl rounded-br-sm max-w-[80%]">
                      Сколько стоит букет из 25 роз?
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="bg-[#f8f7f4] text-[#343433] text-[13px] px-4 py-2.5 rounded-xl rounded-bl-sm max-w-[85%]">
                      12 000 ₸ с доставкой! Какой цвет предпочитаете? 🌹
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="bg-[#f8f7f4] text-[#343433] text-[13px] px-4 py-2.5 rounded-xl rounded-bl-sm max-w-[85%]">
                      Желаете оформить заказ?
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ====== FEATURES GRID ====== */}
      <section id="features" className="py-24 px-6 max-w-[1200px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="text-[12px] font-semibold uppercase tracking-wide text-[#848281] mb-4 block">
            Возможности
          </span>
          <h2 className="text-[clamp(1.75rem,4vw,2.75rem)] font-semibold leading-[1.09] tracking-[-1.14px] text-[#343433]">
            AI-агент, который реально помогает
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              className="bg-white rounded-[10px] p-6"
              style={{ boxShadow: 'color(display-p3 0.949 0.941 0.929) 0px 0px 0px 1px inset' }}
            >
              <div className="w-10 h-10 rounded-[10px] bg-[#f8f7f4] flex items-center justify-center mb-4">
                <f.icon className="w-5 h-5 text-[#ff3e00]" />
              </div>
              <h3 className="font-semibold text-[#343433] text-[15px] tracking-[-0.2px] mb-1">{f.title}</h3>
              <p className="text-[13px] text-[#474645] leading-[1.55] tracking-[-0.17px]">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ====== ACTIONS (Send/Receive/Swap mimic) ====== */}
      <section id="how-it-works" className="py-24 px-6 max-w-[1200px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <span className="text-[12px] font-semibold uppercase tracking-wide text-[#848281] mb-4 block">
            Как это работает
          </span>
          <h2 className="text-[clamp(1.75rem,4vw,2.75rem)] font-semibold leading-[1.09] tracking-[-1.14px] text-[#343433]">
            Отвечайте, записывайте, продавайте
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {ACTIONS.map((action, i) => (
            <motion.div
              key={action.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              className="relative"
            >
              <div className="bg-white rounded-[10px] p-6"
                style={{ boxShadow: 'color(display-p3 0.949 0.941 0.929) 0px 0px 0px 1px inset' }}>
                <div className="w-12 h-12 rounded-[10px] bg-[#f8f7f4] flex items-center justify-center mb-4">
                  <action.icon className="w-6 h-6 text-[#ff3e00]" />
                </div>
                <h3 className="font-semibold text-[#343433] text-[19px] tracking-[-0.25px] mb-2">{action.title}</h3>
                <p className="text-[15px] text-[#474645] leading-[1.47] tracking-[-0.2px]">{action.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ====== USE CASES ====== */}
      <section className="py-24 px-6 max-w-[1200px] mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="text-[12px] font-semibold uppercase tracking-wide text-[#848281] mb-4 block">
              Сценарии
            </span>
            <h2 className="text-[clamp(1.75rem,4vw,2.75rem)] font-semibold leading-[1.09] tracking-[-1.14px] text-[#343433] mb-4">
              Для любого бизнеса
            </h2>
            <p className="text-[15px] text-[#474645] leading-[1.47] tracking-[-0.2px] mb-6">
              Цветочный магазин, салон красоты, автосервис, интернет-магазин, клиника, риэлтор — агент адаптируется под вашу сферу.
            </p>
            <div className="space-y-3">
              {['Консультирует по услугам', 'Записывает на приём', 'Принимает заказы', 'Отвечает на вопросы 24/7'].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#f8f7f4] flex items-center justify-center">
                    <Check className="w-3 h-3 text-[#ff3e00]" />
                  </div>
                  <span className="text-[14px] text-[#474645] tracking-[-0.18px]">{item}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="grid grid-cols-2 gap-3"
          >
            {[
              { emoji: '💐', title: 'Цветочный', desc: 'Букеты и доставка' },
              { emoji: '💅', title: 'Салон', desc: 'Запись на процедуры' },
              { emoji: '🔧', title: 'Автосервис', desc: 'ТО и ремонт' },
              { emoji: '🛍️', title: 'Магазин', desc: 'Заказы и доставка' },
              { emoji: '🏥', title: 'Клиника', desc: 'Запись к врачу' },
              { emoji: '🏠', title: 'Риэлтор', desc: 'Объекты и просмотры' },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                className="bg-white rounded-[10px] p-5"
                style={{ boxShadow: 'color(display-p3 0.949 0.941 0.929) 0px 0px 0px 1px inset' }}
              >
                <div className="text-3xl mb-2">{item.emoji}</div>
                <div className="font-semibold text-[#343433] text-[14px] tracking-[-0.18px]">{item.title}</div>
                <div className="text-[12px] text-[#848281] tracking-[-0.14px]">{item.desc}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ====== RESULTS ====== */}
      <section className="py-24 px-6 max-w-[1200px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <span className="text-[12px] font-semibold uppercase tracking-wide text-[#848281] mb-4 block">
            Результаты
          </span>
          <h2 className="text-[clamp(1.75rem,4vw,2.75rem)] font-semibold leading-[1.09] tracking-[-1.14px] text-[#343433]">
            Конкретные цифры, не обещания
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { value: '35%', label: 'рост конверсии', desc: 'Asem.kz' },
            { value: '15 ч', label: 'экономия в неделю', desc: 'Glam Studio' },
            { value: '40%', label: 'броней без админа', desc: 'Rixos Almaty' },
            { value: '80%', label: 'вопросов автоматом', desc: 'AutoExpert.kz' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              className="bg-white rounded-[10px] p-6 text-center"
              style={{ boxShadow: 'color(display-p3 0.949 0.941 0.929) 0px 0px 0px 1px inset' }}
            >
              <div className="text-[2.5rem] font-bold text-[#343433] tracking-[-1.14px] mb-1">{stat.value}</div>
              <div className="text-[14px] font-semibold text-[#343433] tracking-[-0.18px] mb-1">{stat.label}</div>
              <div className="text-[12px] text-[#848281] tracking-[-0.14px]">{stat.desc}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ====== TESTIMONIALS (Friends of Family style) ====== */}
      <section className="py-24 px-6 max-w-[1200px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <span className="text-[12px] font-semibold uppercase tracking-wide text-[#848281] mb-4 block">
            Нам доверяют
          </span>
          <h2 className="text-[clamp(1.75rem,4vw,2.75rem)] font-semibold leading-[1.09] tracking-[-1.14px] text-[#343433]">
            Что говорят клиенты
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-4">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              className="bg-white rounded-[10px] p-6"
              style={{ boxShadow: 'color(display-p3 0.949 0.941 0.929) 0px 0px 0px 1px inset' }}
            >
              <p className="text-[15px] text-[#474645] leading-[1.47] tracking-[-0.2px] mb-4">"{t.quote}"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#ff3e00] flex items-center justify-center text-white font-semibold text-[13px]">
                  {t.author[0]}
                </div>
                <div>
                  <div className="font-semibold text-[14px] text-[#343433] tracking-[-0.18px]">{t.author}</div>
                  <div className="text-[12px] text-[#848281] tracking-[-0.14px]">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ====== FAQ ====== */}
      <section className="py-24 px-6 max-w-[800px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <h2 className="text-[clamp(1.75rem,4vw,2.75rem)] font-semibold leading-[1.09] tracking-[-1.14px] text-[#343433]">
            FAQ
          </h2>
        </motion.div>

        <div className="space-y-3">
          {FAQ.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
              className="bg-white rounded-[10px] overflow-hidden"
              style={{ boxShadow: 'color(display-p3 0.949 0.941 0.929) 0px 0px 0px 1px inset' }}
            >
              <details className="group">
                <summary className="flex items-center justify-between p-5 cursor-pointer list-none">
                  <span className="text-[16px] font-semibold text-[#343433] tracking-[-0.22px] pr-4">{item.q}</span>
                  <ChevronDown className="w-5 h-5 text-[#848281] group-open:rotate-180 transition-transform duration-200" />
                </summary>
                <div className="px-5 pb-5 text-[15px] text-[#474645] leading-[1.47] tracking-[-0.2px]">
                  {item.a}
                </div>
              </details>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ====== CTA ====== */}
      <section className="py-24 px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-[1200px] mx-auto bg-[#121212] rounded-[24px] p-10 md:p-16 text-center"
        >
          <h2 className="text-[clamp(1.75rem,4vw,2.75rem)] font-semibold leading-[1.09] tracking-[-1.14px] text-white mb-4">
            Начните сегодня
          </h2>
          <p className="text-[17px] text-white/70 leading-[1.47] tracking-[-0.22px] max-w-md mx-auto mb-8">
            Увидите, как это работает, за 15 минут в Zoom. Или создайте агента сами — бесплатно.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="https://t.me/agentcore_support" target="_blank" rel="noopener noreferrer"
              className="bg-white text-[#121212] px-8 py-4 rounded-[32px] text-[14px] font-semibold hover:opacity-90 transition-opacity inline-flex items-center gap-2">
              <Play className="w-4 h-4" />
              Записаться на демо
              <ArrowRight className="w-4 h-4" />
            </a>
            <Link href="/login"
              className="text-white/80 px-8 py-4 rounded-[32px] text-[14px] font-medium hover:text-white transition-colors">
              Создать бесплатно
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ====== FOOTER ====== */}
      <footer className="py-12 px-6" style={{ background: '#fbfaf9', boxShadow: 'rgba(0,0,0,0.04) 0px 0px 0px 1px inset' }}>
        <div className="max-w-[1200px] mx-auto">
          <div className="grid md:grid-cols-4 gap-10 mb-10">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2.5 mb-3">
                <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
                  <rect x="4" y="4" width="14" height="14" rx="3" fill="#121212" />
                  <rect x="22" y="4" width="14" height="14" rx="3" fill="#ff3e00" />
                  <rect x="4" y="22" width="14" height="14" rx="3" fill="#ff3e00" />
                  <circle cx="29" cy="29" r="6" fill="#121212" />
                </svg>
                <span className="font-semibold text-[#343433] text-[15px] tracking-[-0.18px]">AgentCore</span>
              </div>
              <p className="text-[#848281] max-w-xs text-[14px] leading-[1.55] tracking-[-0.18px]">
                Цифровые сотрудники для вашего бизнеса. Отвечают клиентам 24/7, собирают заявки, помогают продавать.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-[#343433] mb-4 text-[12px] uppercase tracking-wider">Продукт</h4>
              <ul className="space-y-3 text-[14px] text-[#848281] tracking-[-0.18px]">
                <li><a href="#features" className="hover:text-[#343433] transition-colors">Возможности</a></li>
                <li><a href="#pricing" className="hover:text-[#343433] transition-colors">Тарифы</a></li>
                <li><a href="/login" className="hover:text-[#343433] transition-colors">Дашборд</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-[#343433] mb-4 text-[12px] uppercase tracking-wider">Компания</h4>
              <ul className="space-y-3 text-[14px] text-[#848281] tracking-[-0.18px]">
                <li><Link href="/contacts" className="hover:text-[#343433] transition-colors">Контакты</Link></li>
                <li><Link href="/privacy" className="hover:text-[#343433] transition-colors">Конфиденциальность</Link></li>
                <li><Link href="/terms" className="hover:text-[#343433] transition-colors">Оферта</Link></li>
              </ul>
            </div>
          </div>
          <div className="h-px bg-[#f2f0ed] mb-6" />
          <div className="flex flex-col md:flex-row justify-between items-center gap-3">
            <p className="text-[#848281] text-[12px] tracking-[-0.14px]">© 2026 ТОО «AgentCore». Все права защищены.</p>
            <div className="flex gap-5 text-[#848281] text-[12px] tracking-[-0.14px]">
              <Link href="/privacy" className="hover:text-[#343433] transition-colors">Конфиденциальность</Link>
              <Link href="/terms" className="hover:text-[#343433] transition-colors">Оферта</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
