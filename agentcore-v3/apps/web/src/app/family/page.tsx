'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef, useState } from 'react';
import { 
  Zap, Shield, Clock, Brain, Sparkles, 
  MessageCircle, Send, Smartphone, Bot,
  ChevronDown, ArrowRight, Play, Check,
  Star, TrendingUp, Users, Phone
} from 'lucide-react';
import Link from 'next/link';

/* ============================================
   FAMILY.CO — PIXEL-PERFECT CLONE
   Адаптировано для AgentCore
   ============================================ */

/* ─── DESIGN TOKENS ─── */
const COLORS = {
  beige: '#fbfaf9',
  beigeDark: '#f6f4ef',
  body: '#343433',
  heading: '#171717',
  muted: '#848281',
  border: '#f2f0ed',
  primary: '#171717',
  secondary: '#f6f4ef',
  accent: '#ff3e00',
  gold: '#c98e30',
  green: '#43c679',
  gray: '#74747a',
  dark: '#121212',
  white: '#ffffff',
};

const CARD_SHADOW = 'color(display-p3 0.949 0.941 0.929) 0px 0px 0px 1px inset';

/* ─── DATA ─── */
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

const USE_CASES = [
  { emoji: '💐', title: 'Цветочный', desc: 'Букеты и доставка' },
  { emoji: '💅', title: 'Салон', desc: 'Запись на процедуры' },
  { emoji: '🔧', title: 'Автосервис', desc: 'ТО и ремонт' },
  { emoji: '🛍️', title: 'Магазин', desc: 'Заказы и доставка' },
  { emoji: '🏥', title: 'Клиника', desc: 'Запись к врачу' },
  { emoji: '🏠', title: 'Риэлтор', desc: 'Объекты и просмотры' },
];

const STATS = [
  { value: '35%', label: 'рост конверсии', desc: 'Asem.kz' },
  { value: '15 ч', label: 'экономия в неделю', desc: 'Glam Studio' },
  { value: '40%', label: 'броней без админа', desc: 'Rixos Almaty' },
  { value: '80%', label: 'вопросов автоматом', desc: 'AutoExpert.kz' },
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

/* ─── ANIMATIONS ─── */
const fadeInUp = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-100px' },
  transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] }
};

const staggerContainer = {
  initial: {},
  whileInView: { transition: { staggerChildren: 0.08 } },
  viewport: { once: true, margin: '-100px' }
};

const staggerItem = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] }
};

/* ─── COMPONENTS ─── */

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
        <rect x="4" y="4" width="14" height="14" rx="3" fill={COLORS.heading} />
        <rect x="22" y="4" width="14" height="14" rx="3" fill={COLORS.accent} />
        <rect x="4" y="22" width="14" height="14" rx="3" fill={COLORS.accent} />
        <circle cx="29" cy="29" r="6" fill={COLORS.heading} />
      </svg>
      <span className="font-semibold text-[15px] tracking-[-0.18px]" style={{ color: COLORS.body }}>
        AgentCore
      </span>
    </div>
  );
}

function PhoneMockup({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mx-auto" style={{ maxWidth: '300px', perspective: '1000px' }}>
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
          {children}
        </div>
      </div>
    </div>
  );
}

function PillButton({ 
  children, 
  variant = 'primary', 
  href, 
  onClick,
  className = ''
}: { 
  children: React.ReactNode; 
  variant?: 'primary' | 'secondary' | 'dark';
  href?: string;
  onClick?: () => void;
  className?: string;
}) {
  const baseClasses = 'inline-flex items-center gap-2 rounded-[32px] font-medium transition-all duration-200 text-[15px] tracking-[-0.18px]';
  
  const variants = {
    primary: 'bg-[#171717] text-white px-6 py-3.5 hover:opacity-90',
    secondary: 'bg-[#f6f4ef] text-[#121212] px-6 py-3.5 hover:bg-[#eae8e3]',
    dark: 'bg-white text-[#121212] px-6 py-3.5 hover:opacity-90',
  };
  
  const classes = `${baseClasses} ${variants[variant]} ${className}`;
  
  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={classes}>
        {children}
      </a>
    );
  }
  
  return (
    <button onClick={onClick} className={classes}>
      {children}
    </button>
  );
}

function SectionHeading({ label, title, centered = true }: { label?: string; title: string; centered?: boolean }) {
  return (
    <motion.div 
      {...fadeInUp}
      className={centered ? 'text-center' : ''}
    >
      {label && (
        <span className="text-[12px] font-semibold uppercase tracking-[0.08em] mb-4 block" style={{ color: COLORS.muted }}>
          {label}
        </span>
      )}
      <h2 
        className="font-medium leading-[1.09] tracking-[-1.14px]"
        style={{ 
          fontSize: 'clamp(1.75rem, 4vw, 2.75rem)',
          color: COLORS.heading
        }}
      >
        {title}
      </h2>
    </motion.div>
  );
}

/* ─── MAIN PAGE ─── */
export default function FamilyClonePage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  const heroY = useTransform(scrollYProgress, [0, 0.2], [0, -80]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div ref={containerRef} className="min-h-screen" style={{ background: COLORS.beige }}>
      
      {/* ====== NAVIGATION ====== */}
      <nav 
        className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-6"
        style={{ 
          background: 'rgba(251, 250, 249, 0.9)', 
          backdropFilter: 'blur(12px)',
          borderBottom: `1px solid ${COLORS.border}`
        }}
      >
        <div className="max-w-[1200px] w-full mx-auto flex items-center justify-between">
          <Logo />
          <div className="hidden md:flex items-center gap-7">
            <a href="#features" className="text-[14px] font-medium tracking-[-0.18px] hover:text-[#848281] transition-colors" style={{ color: COLORS.body }}>
              Возможности
            </a>
            <a href="#how-it-works" className="text-[14px] font-medium tracking-[-0.18px] hover:text-[#848281] transition-colors" style={{ color: COLORS.body }}>
              Как работает
            </a>
            <a href="#pricing" className="text-[14px] font-medium tracking-[-0.18px] hover:text-[#848281] transition-colors" style={{ color: COLORS.body }}>
              Тарифы
            </a>
            <Link href="/login">
              <PillButton variant="primary">Попробовать</PillButton>
            </Link>
          </div>
        </div>
      </nav>

      {/* ====== HERO ====== */}
      <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
        <motion.div 
          style={{ y: heroY, opacity: heroOpacity }} 
          className="text-center max-w-4xl mx-auto px-6"
        >
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 
              className="font-medium leading-[1.09] mb-6"
              style={{ 
                fontSize: 'clamp(2.5rem, 8vw, 5rem)',
                letterSpacing: '-2.11px',
                color: COLORS.heading
              }}
            >
              Ваш цифровой
              <br />
              сотрудник
            </h1>
            <p 
              className="leading-[1.47] tracking-[-0.22px] max-w-lg mx-auto mb-10"
              style={{ fontSize: '17px', color: COLORS.body }}
            >
              Создайте AI-агента за 2 минуты. Он ответит клиентам в Telegram, WhatsApp и на сайте — пока вы спите.
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <PillButton variant="primary" href="https://t.me/agentcore_support">
                <Play className="w-4 h-4" />
                Записаться на демо
              </PillButton>
              <Link href="/login">
                <PillButton variant="secondary">
                  Создать бесплатно
                </PillButton>
              </Link>
            </div>
          </motion.div>

          {/* 3D Phone Mockup */}
          <motion.div
            initial={{ opacity: 0, y: 60, rotateY: -15 }}
            animate={{ opacity: 1, y: 0, rotateY: -5 }}
            transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="mt-16"
            style={{ perspective: '1000px' }}
          >
            <PhoneMockup>
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-full bg-[#f8f7f4] flex items-center justify-center text-sm">🤖</div>
                  <div className="text-[13px] font-semibold" style={{ color: COLORS.heading }}>AgentCore</div>
                  <div className="ml-auto text-[10px]" style={{ color: COLORS.muted }}>онлайн</div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-end">
                    <div className="bg-[#171717] text-white text-[13px] px-4 py-2.5 rounded-2xl rounded-br-sm max-w-[80%]">
                      Сколько стоит букет из 25 роз?
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="bg-[#f8f7f4] text-[13px] px-4 py-2.5 rounded-2xl rounded-bl-sm max-w-[85%]" style={{ color: COLORS.heading }}>
                      12 000 ₸ с доставкой! Какой цвет предпочитаете? 🌹
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="bg-[#f8f7f4] text-[13px] px-4 py-2.5 rounded-2xl rounded-bl-sm max-w-[85%]" style={{ color: COLORS.heading }}>
                      Желаете оформить заказ?
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <div className="flex-1 h-9 rounded-full bg-[#f8f7f4] flex items-center px-4 text-[12px]" style={{ color: COLORS.muted }}>
                    Написать сообщение...
                  </div>
                  <div className="w-9 h-9 rounded-full bg-[#171717] flex items-center justify-center">
                    <Send className="w-4 h-4 text-white" />
                  </div>
                </div>
              </div>
            </PhoneMockup>
          </motion.div>
        </motion.div>
      </section>

      {/* ====== FEATURES GRID ====== */}
      <section id="features" className="py-24 px-6 max-w-[1200px] mx-auto">
        <SectionHeading label="Возможности" title="AI-агент, который реально помогает" />

        <motion.div 
          className="grid md:grid-cols-2 lg:grid-cols-5 gap-4 mt-16"
          {...staggerContainer}
        >
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              variants={staggerItem}
              className="bg-white rounded-[10px] p-6"
              style={{ boxShadow: CARD_SHADOW }}
            >
              <div className="w-10 h-10 rounded-[10px] bg-[#f8f7f4] flex items-center justify-center mb-4">
                <f.icon className="w-5 h-5" style={{ color: COLORS.accent }} />
              </div>
              <h3 className="font-semibold text-[15px] tracking-[-0.2px] mb-1" style={{ color: COLORS.heading }}>
                {f.title}
              </h3>
              <p className="text-[13px] leading-[1.55] tracking-[-0.17px]" style={{ color: COLORS.body }}>
                {f.desc}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ====== ACTIONS (Send/Receive/Swap mimic) ====== */}
      <section id="how-it-works" className="py-24 px-6 max-w-[1200px] mx-auto">
        <SectionHeading label="Как это работает" title="Отвечайте, записывайте, продавайте" />

        <div className="grid lg:grid-cols-2 gap-12 items-center mt-16">
          {/* Left: Tabs */}
          <motion.div {...fadeInUp} className="space-y-4">
            {ACTIONS.map((action, i) => (
              <motion.div
                key={action.title}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className={`p-5 rounded-[10px] cursor-pointer transition-all duration-200 ${
                  activeTab === i ? 'bg-white' : 'bg-transparent'
                }`}
                style={{ 
                  boxShadow: activeTab === i ? CARD_SHADOW : 'none',
                }}
                onClick={() => setActiveTab(i)}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-[10px] bg-[#f8f7f4] flex items-center justify-center">
                    <action.icon className="w-5 h-5" style={{ color: COLORS.accent }} />
                  </div>
                  <h3 className="font-semibold text-[17px] tracking-[-0.22px]" style={{ color: COLORS.heading }}>
                    {action.title}
                  </h3>
                </div>
                <p className="text-[14px] leading-[1.55] tracking-[-0.18px] ml-13" style={{ color: COLORS.body }}>
                  {action.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>

          {/* Right: Phone Mockup */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <PhoneMockup>
              <div className="p-4">
                <div className="text-[11px] font-medium uppercase tracking-wide mb-3" style={{ color: COLORS.muted }}>
                  {ACTIONS[activeTab].title}
                </div>
                <div className="space-y-3">
                  {activeTab === 0 && (
                    <>
                      <div className="flex justify-end">
                        <div className="bg-[#171717] text-white text-[12px] px-3 py-2 rounded-xl rounded-br-sm">
                          Какая стоимость доставки?
                        </div>
                      </div>
                      <div className="flex justify-start">
                        <div className="bg-[#f8f7f4] text-[12px] px-3 py-2 rounded-xl rounded-bl-sm max-w-[90%]" style={{ color: COLORS.heading }}>
                          Доставка по Алматы — 1500 ₸, по Казахстану — 3000 ₸. Бесплатно при заказе от 15 000 ₸
                        </div>
                      </div>
                    </>
                  )}
                  {activeTab === 1 && (
                    <>
                      <div className="flex justify-end">
                        <div className="bg-[#171717] text-white text-[12px] px-3 py-2 rounded-xl rounded-br-sm">
                          Запишите меня на маникюр
                        </div>
                      </div>
                      <div className="flex justify-start">
                        <div className="bg-[#f8f7f4] text-[12px] px-3 py-2 rounded-xl rounded-bl-sm max-w-[90%]" style={{ color: COLORS.heading }}>
                          На какой день и время? У меня есть свободные окна на завтра: 10:00, 14:00, 16:00
                        </div>
                      </div>
                    </>
                  )}
                  {activeTab === 2 && (
                    <>
                      <div className="flex justify-end">
                        <div className="bg-[#171717] text-white text-[12px] px-3 py-2 rounded-xl rounded-br-sm">
                          Хочу заказать букет
                        </div>
                      </div>
                      <div className="flex justify-start">
                        <div className="bg-[#f8f7f4] text-[12px] px-3 py-2 rounded-xl rounded-bl-sm max-w-[90%]" style={{ color: COLORS.heading }}>
                          Отлично! Какой букет вас интересует? У нас есть: розы от 8000 ₸, пионы от 12000 ₸, микс от 10000 ₸
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </PhoneMockup>
          </motion.div>
        </div>
      </section>

      {/* ====== USE CASES ====== */}
      <section className="py-24 px-6 max-w-[1200px] mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div {...fadeInUp}>
            <span className="text-[12px] font-semibold uppercase tracking-[0.08em] mb-4 block" style={{ color: COLORS.muted }}>
              Сценарии
            </span>
            <h2 
              className="font-medium leading-[1.09] tracking-[-1.14px] mb-4"
              style={{ fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', color: COLORS.heading }}
            >
              Для любого бизнеса
            </h2>
            <p className="text-[15px] leading-[1.47] tracking-[-0.2px] mb-6" style={{ color: COLORS.body }}>
              Цветочный магазин, салон красоты, автосервис, интернет-магазин, клиника, риэлтор — агент адаптируется под вашу сферу.
            </p>
            <div className="space-y-3">
              {['Консультирует по услугам', 'Записывает на приём', 'Принимает заказы', 'Отвечает на вопросы 24/7'].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#f8f7f4] flex items-center justify-center">
                    <Check className="w-3 h-3" style={{ color: COLORS.accent }} />
                  </div>
                  <span className="text-[14px] tracking-[-0.18px]" style={{ color: COLORS.body }}>{item}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="grid grid-cols-2 gap-3"
          >
            {USE_CASES.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                className="bg-white rounded-[10px] p-5"
                style={{ boxShadow: CARD_SHADOW }}
              >
                <div className="text-3xl mb-2">{item.emoji}</div>
                <div className="font-semibold text-[14px] tracking-[-0.18px]" style={{ color: COLORS.heading }}>{item.title}</div>
                <div className="text-[12px] tracking-[-0.14px]" style={{ color: COLORS.muted }}>{item.desc}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ====== RESULTS ====== */}
      <section className="py-24 px-6 max-w-[1200px] mx-auto">
        <SectionHeading label="Результаты" title="Конкретные цифры, не обещания" />

        <motion.div 
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-16"
          {...staggerContainer}
        >
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              variants={staggerItem}
              className="bg-white rounded-[10px] p-6 text-center"
              style={{ boxShadow: CARD_SHADOW }}
            >
              <div className="text-[2.5rem] font-bold tracking-[-1.14px] mb-1" style={{ color: COLORS.heading }}>
                {stat.value}
              </div>
              <div className="text-[14px] font-semibold tracking-[-0.18px] mb-1" style={{ color: COLORS.heading }}>
                {stat.label}
              </div>
              <div className="text-[12px] tracking-[-0.14px]" style={{ color: COLORS.muted }}>{stat.desc}</div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ====== TESTIMONIALS ====== */}
      <section className="py-24 px-6 max-w-[1200px] mx-auto">
        <SectionHeading label="Нам доверяют" title="Что говорят клиенты" />

        <motion.div 
          className="grid md:grid-cols-2 gap-4 mt-16"
          {...staggerContainer}
        >
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={i}
              variants={staggerItem}
              className="bg-white rounded-[10px] p-6"
              style={{ boxShadow: CARD_SHADOW }}
            >
              <p className="text-[15px] leading-[1.47] tracking-[-0.2px] mb-4" style={{ color: COLORS.body }}>
                "{t.quote}"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-[13px]" style={{ background: COLORS.accent }}>
                  {t.author[0]}
                </div>
                <div>
                  <div className="font-semibold text-[14px] tracking-[-0.18px]" style={{ color: COLORS.heading }}>{t.author}</div>
                  <div className="text-[12px] tracking-[-0.14px]" style={{ color: COLORS.muted }}>{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ====== FAQ ====== */}
      <section className="py-24 px-6 max-w-[800px] mx-auto">
        <motion.div {...fadeInUp} className="text-center mb-14">
          <h2 
            className="font-medium leading-[1.09] tracking-[-1.14px]"
            style={{ fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', color: COLORS.heading }}
          >
            FAQ
          </h2>
        </motion.div>

        <motion.div 
          className="space-y-3"
          {...staggerContainer}
        >
          {FAQ.map((item, i) => (
            <motion.div
              key={i}
              variants={staggerItem}
              className="bg-white rounded-[10px] overflow-hidden"
              style={{ boxShadow: CARD_SHADOW }}
            >
              <details className="group">
                <summary className="flex items-center justify-between p-5 cursor-pointer list-none">
                  <span className="text-[16px] font-semibold tracking-[-0.22px] pr-4" style={{ color: COLORS.heading }}>
                    {item.q}
                  </span>
                  <ChevronDown className="w-5 h-5 transition-transform duration-200 group-open:rotate-180" style={{ color: COLORS.muted }} />
                </summary>
                <div className="px-5 pb-5 text-[15px] leading-[1.47] tracking-[-0.2px]" style={{ color: COLORS.body }}>
                  {item.a}
                </div>
              </details>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ====== CTA ====== */}
      <section className="py-24 px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="max-w-[1200px] mx-auto rounded-[24px] p-10 md:p-16 text-center"
          style={{ background: COLORS.dark }}
        >
          <h2 
            className="font-medium leading-[1.09] tracking-[-1.14px] text-white mb-4"
            style={{ fontSize: 'clamp(1.75rem, 4vw, 2.75rem)' }}
          >
            Начните сегодня
          </h2>
          <p className="text-[17px] leading-[1.47] tracking-[-0.22px] max-w-md mx-auto mb-8" style={{ color: 'rgba(255,255,255,0.7)' }}>
            Увидите, как это работает, за 15 минут в Zoom. Или создайте агента сами — бесплатно.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="https://t.me/agentcore_support" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white text-[#121212] px-8 py-4 rounded-[32px] text-[14px] font-semibold hover:opacity-90 transition-opacity">
              <Play className="w-4 h-4" />
              Записаться на демо
              <ArrowRight className="w-4 h-4" />
            </a>
            <Link href="/login"
              className="inline-flex items-center gap-2 text-white/80 px-8 py-4 rounded-[32px] text-[14px] font-medium hover:text-white transition-colors">
              Создать бесплатно
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ====== FOOTER ====== */}
      <footer className="py-12 px-6" style={{ background: COLORS.beige, boxShadow: 'rgba(0,0,0,0.04) 0px 0px 0px 1px inset' }}>
        <div className="max-w-[1200px] mx-auto">
          <div className="grid md:grid-cols-4 gap-10 mb-10">
            <div className="md:col-span-2">
              <Logo />
              <p className="mt-3 max-w-xs text-[14px] leading-[1.55] tracking-[-0.18px]" style={{ color: COLORS.muted }}>
                Цифровые сотрудники для вашего бизнеса. Отвечают клиентам 24/7, собирают заявки, помогают продавать.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-[12px] uppercase tracking-wider" style={{ color: COLORS.heading }}>Продукт</h4>
              <ul className="space-y-3 text-[14px] tracking-[-0.18px]" style={{ color: COLORS.muted }}>
                <li><a href="#features" className="hover:text-[#343433] transition-colors">Возможности</a></li>
                <li><a href="#pricing" className="hover:text-[#343433] transition-colors">Тарифы</a></li>
                <li><Link href="/login" className="hover:text-[#343433] transition-colors">Дашборд</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-[12px] uppercase tracking-wider" style={{ color: COLORS.heading }}>Компания</h4>
              <ul className="space-y-3 text-[14px] tracking-[-0.18px]" style={{ color: COLORS.muted }}>
                <li><Link href="/contacts" className="hover:text-[#343433] transition-colors">Контакты</Link></li>
                <li><Link href="/privacy" className="hover:text-[#343433] transition-colors">Конфиденциальность</Link></li>
                <li><Link href="/terms" className="hover:text-[#343433] transition-colors">Оферта</Link></li>
              </ul>
            </div>
          </div>
          <div className="h-px mb-6" style={{ background: COLORS.border }} />
          <div className="flex flex-col md:flex-row justify-between items-center gap-3">
            <p className="text-[12px] tracking-[-0.14px]" style={{ color: COLORS.muted }}>
              © 2026 ТОО «AgentCore». Все права защищены.
            </p>
            <div className="flex gap-5 text-[12px] tracking-[-0.14px]" style={{ color: COLORS.muted }}>
              <Link href="/privacy" className="hover:text-[#343433] transition-colors">Конфиденциальность</Link>
              <Link href="/terms" className="hover:text-[#343433] transition-colors">Оферта</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
