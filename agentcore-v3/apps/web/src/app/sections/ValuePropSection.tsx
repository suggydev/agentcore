'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion } from 'framer-motion';
import { Box, GitBranch, Layers, TrendingUp, Check, ArrowUpRight } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export default function ValuePropSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const diagramRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(textRef.current?.querySelectorAll('.reveal-item') || [], {
        y: 40,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 75%',
          toggleActions: 'play none none none',
        },
      });

      gsap.from(diagramRef.current, {
        y: 60,
        opacity: 0,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 65%',
          toggleActions: 'play none none none',
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-20 lg:py-24 section-padding relative">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div ref={textRef}>
            <span className="label text-mauve-600 mb-4 block reveal-item">Почему AgentCore</span>
            <h2 className="heading-2 text-ink-900 mb-4 reveal-item">
              Интеллект через
              <br />
              <span className="text-gradient-mauve">структуру</span>
            </h2>
            <p className="body-large mb-6 reveal-item">
              Большинство инструментов автоматизации хаотичны. AgentCore — другой. 
              Каждый процесс определён как структурированная система с чёткими входами, 
              точками принятия решений и выходами.
            </p>
            <div className="space-y-3">
              {['Компонуемая архитектура', 'Предсказуемые результаты', 'Прозрачные аудит-трейлы', 'Масштабируемость из коробки'].map((item, i) => (
                <motion.div 
                  key={item}
                  className="flex items-center gap-3 reveal-item"
                  initial={{ opacity: 0, x: -15 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 + 0.2, duration: 0.4 }}
                  viewport={{ once: true }}
                >
                  <div className="w-5 h-5 rounded-full bg-mauve-50 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-mauve-600" />
                  </div>
                  <span className="text-ink-700 font-medium text-sm">{item}</span>
                </motion.div>
              ))}
            </div>

            <motion.a
              href="#capabilities"
              className="inline-flex items-center gap-2 mt-8 text-sm font-semibold text-mauve-600 hover:text-mauve-500 transition-colors group reveal-item"
              whileHover={{ x: 4 }}
            >
              Смотреть возможности <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </motion.a>
          </div>

          <div ref={diagramRef} className="relative">
            <div className="relative aspect-square max-w-md mx-auto">
              <div className="absolute inset-0 grid grid-cols-2 gap-3 p-3">
                {[
                  { icon: Box, title: 'Входной модуль', sub: 'Web · API · Voice', accent: false },
                  { icon: GitBranch, title: 'Маршрутизация', sub: 'Правила · Модели · Поток', accent: false },
                  { icon: Layers, title: 'Слой обработки', sub: 'Трансформация · Обогащение', accent: false },
                  { icon: TrendingUp, title: 'Выход и аналитика', sub: 'Доставка · Измерение', accent: true },
                ].map((card, i) => (
                  <motion.div 
                    key={i}
                    className={`rounded-xl border p-4 shadow-sm flex flex-col justify-between cursor-default ${
                      card.accent 
                        ? 'bg-ink-900 text-white border-ink-800' 
                        : 'bg-white border-ink-200'
                    }`}
                    whileHover={{ y: -5, scale: 1.02, transition: { duration: 0.25 } }}
                  >
                    <card.icon className={`w-6 h-6 ${card.accent ? 'text-mauve-300' : 'text-mauve-600'}`} />
                    <div>
                      <div className={`font-semibold text-sm ${card.accent ? 'text-white' : 'text-ink-900'}`}>{card.title}</div>
                      <div className={`text-[11px] mt-0.5 ${card.accent ? 'text-ink-300' : 'text-ink-400'}`}>{card.sub}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
              {/* Center pulse */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-mauve-600 rounded-full z-10 pulse-glow" />
              {/* Connection lines SVG */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
                <line x1="25%" y1="50%" x2="75%" y2="50%" stroke="#E2E4EB" strokeWidth="1" strokeDasharray="4 3">
                  <animate attributeName="stroke-dashoffset" from="0" to="14" dur="2s" repeatCount="indefinite" />
                </line>
                <line x1="50%" y1="25%" x2="50%" y2="75%" stroke="#E2E4EB" strokeWidth="1" strokeDasharray="4 3">
                  <animate attributeName="stroke-dashoffset" from="0" to="14" dur="2s" repeatCount="indefinite" />
                </line>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
