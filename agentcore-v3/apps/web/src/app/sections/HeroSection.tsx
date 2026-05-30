'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion } from 'framer-motion';
import { ArrowRight, Zap, BarChart3, Shield, GitBranch } from 'lucide-react';
import MagneticButton from '../../components/MagneticButton';

gsap.registerPlugin(ScrollTrigger);

const FLOATING_CARDS = [
  { icon: Zap, label: 'Автоматизация', value: '2.4s', delay: 0, top: '5%', right: '75%' },
  { icon: BarChart3, label: 'Аналитика', value: '98%', delay: 0.5, top: '2%', right: '5%' },
  { icon: Shield, label: 'Безопасность', value: '256-bit', delay: 1, top: '55%', right: '80%' },
  { icon: GitBranch, label: 'Интеграции', value: '50+', delay: 1.5, top: '72%', right: '10%' },
];

export default function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const laptopRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const layer1Ref = useRef<HTMLDivElement>(null);
  const layer2Ref = useRef<HTMLDivElement>(null);
  const layer3Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Parallax layers
      [layer1Ref, layer2Ref, layer3Ref].forEach((ref, i) => {
        gsap.to(ref.current, {
          y: -(60 + i * 30),
          ease: 'none',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: true,
          },
        });
      });

      // Background zoom-out
      gsap.to(bgRef.current, {
        scale: 1.12,
        opacity: 0.4,
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      });

      // Title scale and split
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

      // Subtitle fade
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

      // CTA fade
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

      // Badge fade
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

      // Laptop parallax (slower, stays longer)
      gsap.to(laptopRef.current, {
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

    return () => ctx.revert();
  }, []);

  return (
    <section 
      ref={sectionRef}
      className="relative min-h-[110vh] flex items-center overflow-hidden pt-24 pb-12"
    >
      {/* Background Grid */}
      <div 
        ref={bgRef}
        className="absolute inset-0 grid-lines opacity-50"
        style={{ transformOrigin: 'center center' }}
      />

      {/* Parallax Layer 1 */}
      <div ref={layer1Ref} className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[15%] left-[8%] w-28 h-28 border border-ink-200/50 rounded-xl rotate-12 float-slow" />
        <div className="absolute top-[55%] right-[10%] w-20 h-20 border border-mauve/20 rounded-full float-medium" />
        <div className="absolute bottom-[25%] left-[15%] w-14 h-14 bg-mauve/[0.04] rounded-lg -rotate-6 float-fast" />
      </div>

      {/* Parallax Layer 2 - Structural lines */}
      <div ref={layer2Ref} className="absolute inset-0 pointer-events-none">
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <line x1="12%" y1="22%" x2="22%" y2="32%" stroke="#E2E4EB" strokeWidth="1.5" strokeDasharray="6 4" className="breathe" />
          <line x1="78%" y1="18%" x2="88%" y2="28%" stroke="#E2E4EB" strokeWidth="1.5" strokeDasharray="6 4" className="breathe" style={{ animationDelay: '1s' }} />
          <circle cx="18%" cy="75%" r="3" fill="#5A4D59" className="pulse-glow" style={{ opacity: 0.3 }} />
          <circle cx="82%" cy="65%" r="3" fill="#D4B6D8" className="pulse-glow" style={{ animationDelay: '2s', opacity: 0.3 }} />
        </svg>
      </div>

      {/* Parallax Layer 3 - Dots */}
      <div ref={layer3Ref} className="absolute inset-0 pointer-events-none dot-pattern opacity-25" />

      {/* Main Content - 2 columns on desktop */}
      <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 w-full grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
        {/* Left: Text */}
        <div className="text-center lg:text-left">
          <div
            ref={badgeRef}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-ink-200 mb-6 shadow-sm"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-mauve-300 animate-pulse" />
            <span className="text-xs font-semibold text-ink-600 tracking-wide uppercase">Платформа структурированного интеллекта</span>
          </div>

          <h1
            ref={titleRef}
            className="heading-1 text-ink-900 mb-5 max-w-2xl mx-auto lg:mx-0"
          >
            Создавайте системы,
            <br />
            которые <span className="text-gradient-mauve">мыслят ясно</span>
          </h1>

          <p
            ref={subtitleRef}
            className="body-large max-w-lg mx-auto lg:mx-0 mb-8 text-ink-500"
          >
            AgentCore структурирует ваши операции в интеллектуальные, компонуемые модули. 
            Чистая архитектура. Предсказуемые результаты. Создано для профессионалов.
          </p>

          <div ref={ctaRef} className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
            <MagneticButton strength={0.15}>
              <a href="/login" className="btn-primary inline-flex items-center gap-2 text-sm">
                Начать строить <ArrowRight className="w-4 h-4" />
              </a>
            </MagneticButton>
            <a href="#capabilities" className="btn-secondary inline-flex items-center gap-2 text-sm">
              Исследовать
            </a>
          </div>

          {/* Quick stats under CTA */}
          <div className="mt-10 flex items-center justify-center lg:justify-start gap-6">
            {[
              { num: '9+', label: 'Моделей' },
              { num: '2s', label: 'Ответ' },
              { num: '99.9%', label: 'Uptime' },
            ].map((s, i) => (
              <div key={i} className="text-center lg:text-left">
                <div className="font-mono-display text-lg font-bold text-ink-900">{s.num}</div>
                <div className="caption">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Laptop Mockup with floating cards */}
        <div ref={laptopRef} className="hidden lg:block relative">
          <div className="laptop-frame max-w-lg mx-auto float-slow">
            <div className="laptop-screen aspect-[16/10] p-4 relative bg-gradient-to-br from-[#F8F9FB] to-white">
              {/* Mockup UI Header */}
              <div className="flex items-center gap-2 mb-3">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#D4B6D8]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FFC347]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#3CCF4A]" />
                </div>
                <div className="flex-1 h-5 bg-ink-100 rounded-md ml-2" />
              </div>

              {/* Mockup Content Grid */}
              <div className="grid grid-cols-3 gap-2 h-[calc(100%-2rem)]">
                <div className="col-span-2 bg-white rounded-lg border border-ink-100 p-3 shadow-sm">
                  <div className="h-2 w-16 bg-mauve/20 rounded mb-2" />
                  <div className="space-y-1.5">
                    <div className="h-1.5 w-full bg-ink-100 rounded" />
                    <div className="h-1.5 w-4/5 bg-ink-100 rounded" />
                    <div className="h-1.5 w-3/4 bg-ink-100 rounded" />
                  </div>
                    <div className="mt-3 flex gap-1.5">
                      <div className="h-8 flex-1 bg-mauve-50 rounded border border-mauve/10" />
                      <div className="h-8 flex-1 bg-ink-50 rounded border border-ink-100" />
                    </div>
                </div>
                <div className="space-y-2">
                    <div className="h-16 bg-mauve-50 rounded-lg border border-mauve/10 flex items-end p-2">
                    <div className="flex items-end gap-1 w-full">
                      {[30, 60, 40, 80, 55].map((h, i) => (
                        <div key={i} className="flex-1 rounded-sm bg-mauve/30" style={{ height: `${h}%` }} />
                      ))}
                    </div>
                  </div>
                  <div className="h-16 bg-white rounded-lg border border-ink-100 p-2 shadow-sm">
                    <div className="h-1.5 w-8 bg-ink-200 rounded mb-1" />
                    <div className="h-2 w-12 bg-ink-900 rounded" />
                  </div>
                </div>
              </div>
            </div>
            <div className="laptop-base" />
          </div>

          {/* Floating Cards around laptop */}
          {FLOATING_CARDS.map((card, i) => (
            <motion.div
              key={i}
              className="absolute bg-white rounded-xl border border-ink-100 shadow-lg p-3 flex items-center gap-3"
              style={{
                top: card.top,
                right: card.right,
              }}
              animate={{
                y: [0, -10, 0],
                rotate: [0, 1, -1, 0],
              }}
              transition={{
                duration: 4 + i,
                repeat: Infinity,
                delay: card.delay,
                ease: 'easeInOut',
              }}
            >
              <div className="w-8 h-8 rounded-lg bg-mauve-50 flex items-center justify-center">
                <card.icon className="w-4 h-4 text-mauve-600" />
              </div>
              <div>
                <div className="text-[10px] text-ink-400 uppercase tracking-wider leading-none">{card.label}</div>
                <div className="text-sm font-bold text-ink-900 font-mono-display">{card.value}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
