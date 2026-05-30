'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion } from 'framer-motion';
import { Grid3X3, GitBranch, Layers, Blocks, Shield, BarChart3, ArrowUpRight } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const CAPABILITIES = [
  {
    icon: Grid3X3,
    title: 'Мульти-канальная оркестрация',
    description: 'Объедините web, мессенджеры и голосовые каналы в единый структурированный workflow.',
    color: 'bg-mauve-50 text-mauve-600',
    accent: 'border-mauve/15',
  },
  {
    icon: GitBranch,
    title: 'Интеллектуальная маршрутизация',
    description: 'Задачи проходят через деревья решений, автоматически направляясь по оптимальным путям.',
    color: 'bg-ink-100 text-ink-700',
    accent: 'border-ink-200',
  },
  {
    icon: Layers,
    title: 'Многоуровневая архитектура',
    description: 'Модульная система с чётким разделением ответственности и масштабируемыми слоями.',
    color: 'bg-mauve-50 text-mauve-600',
    accent: 'border-mauve/15',
  },
  {
    icon: Blocks,
    title: 'Компонуемые модули',
    description: 'Собирайте кастомные workflow из готовых, протестированных компонентов.',
    color: 'bg-ink-100 text-ink-700',
    accent: 'border-ink-200',
  },
  {
    icon: Shield,
    title: 'Enterprise-безопасность',
    description: 'Ролевой доступ, аудит-трейлы и compliance-ready обработка данных.',
    color: 'bg-mauve-50 text-mauve-600',
    accent: 'border-mauve/15',
  },
  {
    icon: BarChart3,
    title: 'Структурированная аналитика',
    description: 'Прозрачные дашборды: состояние системы, throughput и performance-метрики.',
    color: 'bg-ink-100 text-ink-700',
    accent: 'border-ink-200',
  },
];

export default function CapabilitiesSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(headerRef.current?.querySelectorAll('.reveal') || [], {
        y: 35,
        opacity: 0,
        duration: 0.7,
        stagger: 0.08,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: headerRef.current,
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
      });

      const cards = gridRef.current?.querySelectorAll('.cap-card') || [];
      gsap.from(cards, {
        y: 60,
        opacity: 0,
        duration: 0.7,
        stagger: 0.06,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: gridRef.current,
          start: 'top 80%',
          toggleActions: 'play none none none',
        },
      });

      cards.forEach((card, i) => {
        const direction = i % 2 === 0 ? -1 : 1;
        gsap.to(card, {
          y: direction * 12,
          rotation: direction * 0.5,
          ease: 'none',
          scrollTrigger: {
            trigger: gridRef.current,
            start: 'top center',
            end: 'bottom center',
            scrub: 1,
          },
        });
      });

      gsap.to(cards[1], {
        scale: 1.02,
        boxShadow: '0 20px 40px rgba(17, 19, 24, 0.08)',
        ease: 'none',
        scrollTrigger: {
          trigger: gridRef.current,
          start: 'top center',
          end: '40% center',
          scrub: 1,
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="capabilities" className="py-20 lg:py-24 section-padding bg-white">
      <div className="max-w-7xl mx-auto">
        <div ref={headerRef} className="text-center mb-14">
          <span className="label text-mauve-600 mb-3 block reveal">Возможности</span>
          <h2 className="heading-2 text-ink-900 mb-3 max-w-2xl mx-auto reveal">
            Структурированные возможности
            <br />
            для современных операций
          </h2>
          <p className="body-large max-w-xl mx-auto reveal">
            Каждая функция — компонуемый модуль в рамках единой системной архитектуры.
          </p>
        </div>

        <div ref={gridRef} className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 perspective-1000">
          {CAPABILITIES.map((cap, i) => (
            <motion.div 
              key={cap.title}
              className={`cap-card group p-6 rounded-2xl bg-[#F8F9FB] border ${cap.accent} card-glow relative overflow-hidden cursor-default`}
              whileHover={{ y: -6, transition: { duration: 0.25 } }}
            >
              <div className="absolute top-0 right-0 w-20 h-20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                  <path d="M80 0 L80 80 L0 80" stroke="currentColor" strokeOpacity="0.06" strokeWidth="1" />
                </svg>
              </div>

              <div className={`w-11 h-11 rounded-xl ${cap.color} flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110`}>
                <cap.icon className="w-5 h-5" />
              </div>
              <h3 className="heading-4 text-ink-900 mb-2">{cap.title}</h3>
              <p className="body-small">{cap.description}</p>
              <div className="mt-5 flex items-center gap-1.5 text-xs font-semibold text-mauve-600 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                Подробнее <ArrowUpRight className="w-3.5 h-3.5" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
