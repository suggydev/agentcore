'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { ArrowRight, Send, CheckCheck, Zap } from 'lucide-react';
import MagneticButton from '../../components/MagneticButton';
import { AI_MODELS, COMPANIES_COUNT, DEMO_CHAT, FLOATING_CARDS } from '../../data/landingContent';

gsap.registerPlugin(ScrollTrigger);

const floatingCardVariants = {
  animate: (delay: number) => ({
    y: [0, -10, 0],
    rotate: [0, -2, 0],
    transition: {
      duration: 5,
      repeat: Infinity,
      delay,
      ease: 'easeInOut',
    },
  }),
};

export default function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const mockupRef = useRef<HTMLDivElement>(null);
  const orbRef = useRef<HTMLDivElement>(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const mainOrbX = useSpring(mouseX, { stiffness: 30, damping: 60 });
  const mainOrbY = useSpring(mouseY, { stiffness: 30, damping: 60 });
  const secondaryOrbX = useSpring(mouseX, { stiffness: 20, damping: 70 });
  const secondaryOrbY = useSpring(mouseY, { stiffness: 20, damping: 70 });

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to(orbRef.current, {
        scale: 1.3,
        opacity: 0.3,
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      });

      gsap.to(titleRef.current, {
        scale: 0.88,
        opacity: 0,
        y: -50,
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: '45% top',
          scrub: true,
        },
      });

      gsap.to(subtitleRef.current, {
        opacity: 0,
        y: -35,
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: '5% top',
          end: '35% top',
          scrub: true,
        },
      });

      gsap.to(ctaRef.current, {
        opacity: 0,
        y: -25,
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: '10% top',
          end: '30% top',
          scrub: true,
        },
      });

      gsap.to(badgeRef.current, {
        opacity: 0,
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: '3% top',
          end: '20% top',
          scrub: true,
        },
      });

      gsap.to(mockupRef.current, {
        y: -30,
        opacity: 0.15,
        scale: 0.95,
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: '60% top',
          scrub: true,
        },
      });
    }, sectionRef);

    const handleMouseMove = (e: MouseEvent) => {
      const rect = sectionRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      mouseX.set(x * 40);
      mouseY.set(y * 30);
    };

    const section = sectionRef.current;
    if (section) {
      section.addEventListener('mousemove', handleMouseMove, { passive: true });
    }

    const refreshTimeout = setTimeout(() => ScrollTrigger.refresh(), 100);
    return () => {
      clearTimeout(refreshTimeout);
      if (section) section.removeEventListener('mousemove', handleMouseMove);
      ctx.revert();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen lg:min-h-[110vh] flex items-center overflow-hidden pt-20 lg:pt-28 pb-12 lg:pb-16"
    >
      <div className="absolute top-0 right-0 w-full h-full overflow-hidden pointer-events-none">
        <motion.div
          ref={orbRef}
          className="absolute top-[-5%] -right-[15%] w-[900px] h-[900px] rounded-full opacity-100"
          style={{
            background: 'radial-gradient(circle, rgba(212,182,216,0.25) 0%, rgba(168,150,171,0.08) 40%, transparent 70%)',
            filter: 'blur(80px)',
            transformOrigin: 'center center',
            x: mainOrbX,
            y: mainOrbY,
          }}
        />
        <motion.div
          className="absolute top-[40%] -left-[10%] w-[600px] h-[600px] rounded-full opacity-60"
          style={{
            background: 'radial-gradient(circle, rgba(212,182,216,0.18) 0%, rgba(168,150,171,0.05) 40%, transparent 70%)',
            filter: 'blur(60px)',
            x: secondaryOrbX,
            y: secondaryOrbY,
          }}
        />
      </div>

      <div className="absolute inset-0 dot-pattern opacity-[0.06] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 w-full grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
        <div className="text-center lg:text-left">
          <motion.div
            ref={badgeRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-mauve-100/70 border border-mauve-200/50 mb-8 backdrop-blur-sm"
          >
            <Zap className="w-3.5 h-3.5 text-mauve-600" />
            <span className="text-sm font-semibold text-mauve-600">
              ИИ-сотрудники для бизнеса
            </span>
          </motion.div>

          <h1
            ref={titleRef}
            className="heading-1 text-ink-900 mb-6 max-w-xl mx-auto lg:mx-0 leading-[1.05]"
          >
            Ваш бизнес работает
            <br />
            24/7 с{' '}
            <span className="text-gradient-mauve">ИИ-сотрудником</span>
          </h1>

          <p
            ref={subtitleRef}
            className="body-large max-w-lg mx-auto lg:mx-0 mb-9 text-ink-500"
          >
            Подключите агента за 60 секунд. Он сам отвечает клиентам в
            WhatsApp, Instagram и на сайте, собирает заявки и помогает
            продавать.
          </p>

          <div ref={ctaRef} className="flex flex-col items-center lg:items-start gap-2">
            <MagneticButton strength={0.15}>
              <a
                href="/login"
                className="btn-primary inline-flex items-center gap-2 px-8 py-4 text-base font-semibold rounded-2xl shadow-lg shadow-mauve-600/20 hover:shadow-xl hover:shadow-mauve-600/30"
              >
                Попробовать бесплатно <ArrowRight className="w-5 h-5" />
              </a>
            </MagneticButton>
            <span className="text-xs text-ink-400 font-medium">
              14 дней без карты
            </span>
          </div>

          <div className="mt-12 flex items-center justify-center lg:justify-start gap-4 flex-wrap">
            {AI_MODELS.map((name) => (
              <span
                key={name}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-ink-100 text-xs font-medium text-ink-500 shadow-sm"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-mauve-400" />
                {name}
              </span>
            ))}
          </div>

          <p className="mt-6 text-xs font-medium text-ink-400 flex items-center justify-center lg:justify-start gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-400" />
            Уже используют {COMPANIES_COUNT}
          </p>
        </div>

        <div ref={mockupRef} className="hidden lg:block relative">
          <div className="text-center mb-2">
            <span className="inline-block px-2 py-0.5 rounded bg-ink-100 text-ink-500 text-[10px] font-medium uppercase tracking-wider">
              Демо-чат — визуальный пример
            </span>
          </div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[540px] h-[500px] rounded-full opacity-40"
            style={{
              background: 'radial-gradient(circle, rgba(212,182,216,0.18) 0%, rgba(168,150,171,0.06) 50%, transparent 70%)',
              filter: 'blur(60px)',
            }}
          />

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 max-w-sm mx-auto bg-white rounded-3xl shadow-2xl shadow-mauve-600/8 border border-mauve-100/50 overflow-hidden"
          >
            <div className="bg-gradient-to-r from-mauve-600 to-mauve-500 px-5 py-3.5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm">💬</div>
              <div className="flex-1">
                <p className="text-white text-sm font-semibold leading-tight">
                  Чат с клиентом
                </p>
                <p className="text-white/70 text-xs flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  онлайн
                </p>
              </div>
            </div>

            <div className="p-4 space-y-3 bg-[#F8F9FB]">
              <div className="flex justify-end">
                <div className="max-w-[80%] bg-white rounded-2xl rounded-br-md px-4 py-2.5 shadow-sm border border-ink-100/60">
                  <p className="text-[13px] text-ink-800 leading-relaxed">
                    {DEMO_CHAT.user}
                  </p>
                  <span className="block text-[10px] text-ink-400 mt-1 text-right">
                    {DEMO_CHAT.userTime}
                  </span>
                </div>
              </div>

              <div className="flex justify-start">
                <div className="max-w-[85%] bg-mauve-50 rounded-2xl rounded-bl-md px-4 py-2.5 border border-mauve-100/60">
                  <p className="text-[13px] text-ink-800 leading-relaxed">
                    {DEMO_CHAT.agent}
                  </p>
                  <div className="flex items-center justify-end gap-1 mt-1">
                    <CheckCheck className="w-3 h-3 text-mauve-400" />
                    <span className="text-[10px] text-ink-400">{DEMO_CHAT.agentTime}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-start">
                <div className="flex items-center gap-1.5 px-4 py-2.5 bg-white rounded-2xl rounded-bl-md border border-ink-100/60 shadow-sm">
                  <motion.div
                    className="flex items-center gap-1"
                    initial="initial"
                    animate="animate"
                    variants={{
                      animate: {
                        transition: {
                          staggerChildren: 0.18,
                          repeat: Infinity,
                          repeatDelay: 0.15,
                        },
                      },
                    }}
                  >
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        className="w-2 h-2 rounded-full bg-mauve-400 inline-block"
                        variants={{
                          initial: { y: 0, opacity: 0.4 },
                          animate: {
                            y: [-2, -8, -2],
                            opacity: [0.4, 1, 0.4],
                            transition: { duration: 0.7, repeat: Infinity },
                          },
                        }}
                      />
                    ))}
                  </motion.div>
                  <span className="text-[11px] text-ink-400 ml-1">
                    печатает...
                  </span>
                </div>
              </div>

              <div className="pt-1">
                <div className="flex items-center gap-2 bg-white border border-ink-100/60 rounded-2xl px-4 py-3 shadow-sm">
                  <input
                    type="text"
                    placeholder="Написать сообщение..."
                    className="flex-1 text-[13px] bg-transparent outline-none text-ink-500 placeholder:text-ink-300"
                    readOnly
                  />
                  <div className="w-8 h-8 rounded-xl bg-mauve-600 flex items-center justify-center">
                    <Send className="w-3.5 h-3.5 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Floating decorative cards */}
          <motion.div
            custom={0.3}
            variants={floatingCardVariants}
            animate="animate"
            className="absolute top-[8%] -right-[4%] xl:-right-[8%] z-20 bg-white rounded-2xl border border-mauve-100/60 shadow-xl px-4 py-3 flex items-center gap-3 backdrop-blur-sm"
            style={{ rotate: 6 }}
          >
            <div className="w-9 h-9 rounded-xl bg-mauve-100 flex items-center justify-center">
              <span className="text-lg">{FLOATING_CARDS[0].icon}</span>
            </div>
            <div>
              <p className="text-sm font-bold text-ink-900">{FLOATING_CARDS[0].value}</p>
              <p className="text-[11px] text-ink-500">{FLOATING_CARDS[0].label}</p>
            </div>
          </motion.div>

          <motion.div
            custom={0.8}
            variants={floatingCardVariants}
            animate="animate"
            className="absolute bottom-[12%] -left-[3%] xl:-left-[6%] z-20 bg-white rounded-2xl border border-mauve-100/60 shadow-xl px-4 py-3 backdrop-blur-sm"
            style={{ rotate: -4 }}
          >
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="w-7 h-7 rounded-full bg-mauve-200 border-2 border-white flex items-center justify-center text-[10px] font-bold text-mauve-600"
                  >
                    {String.fromCharCode(63 + i)}
                  </div>
                ))}
              </div>
              <p className="text-[12px] font-semibold text-ink-700">
                {FLOATING_CARDS[1].label}
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
