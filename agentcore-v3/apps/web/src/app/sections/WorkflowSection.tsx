'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion } from 'framer-motion';
import { Square, CircleDot, Database, Link2, Settings, FileText } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const STEPS = [
  {
    number: '01',
    title: 'Определите структуру',
    description: 'Отобразите процесс как структурированную систему. Определите входы, точки принятия решений и выходы с чёткими архитектурными границами.',
    visual: (
      <div className="flex items-center justify-center gap-3 md:gap-5">
        <motion.div 
          className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-ink-900 flex items-center justify-center shadow-lg"
          whileHover={{ scale: 1.08 }}
        >
          <Square className="w-5 h-5 text-white" />
        </motion.div>
        <div className="flex flex-col items-center gap-1">
          <div className="w-8 h-px bg-mauve-600" />
          <div className="w-1.5 h-1.5 rounded-full bg-mauve-600" />
          <div className="w-8 h-px bg-mauve-600" />
        </div>
        <motion.div 
          className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-mauve-600 flex items-center justify-center shadow-lg shadow-mauve-600/20"
          whileHover={{ scale: 1.08 }}
        >
          <CircleDot className="w-5 h-5 text-white" />
        </motion.div>
        <div className="flex flex-col items-center gap-1">
          <div className="w-8 h-px bg-mauve-600" />
          <div className="w-1.5 h-1.5 rounded-full bg-mauve-600" />
          <div className="w-8 h-px bg-mauve-600" />
        </div>
        <motion.div 
          className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-ink-900 flex items-center justify-center shadow-lg"
          whileHover={{ scale: 1.08 }}
        >
          <Square className="w-5 h-5 text-white" />
        </motion.div>
      </div>
    ),
  },
  {
    number: '02',
    title: 'Подключите системы',
    description: 'Интегрируйтесь с существующей инфраструктурой. API, базы данных и сторонние сервисы соединяются через стандартизированные интерфейсы.',
    visual: (
      <div className="flex items-center justify-center gap-3 md:gap-5">
        <motion.div 
          className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-ink-100 border border-ink-200 flex items-center justify-center"
          whileHover={{ y: -3 }}
        >
          <Database className="w-6 h-6 text-ink-500" />
        </motion.div>
        <div className="flex flex-col items-center gap-1">
          <div className="w-6 h-px bg-mauve-600" />
          <Link2 className="w-3.5 h-3.5 text-mauve-600" />
          <div className="w-6 h-px bg-mauve-600" />
        </div>
        <motion.div 
          className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-mauve-50 border border-mauve/20 flex items-center justify-center"
          whileHover={{ y: -3 }}
        >
          <Settings className="w-6 h-6 text-mauve-600" />
        </motion.div>
        <div className="flex flex-col items-center gap-1">
          <div className="w-6 h-px bg-mauve-600" />
          <Link2 className="w-3.5 h-3.5 text-mauve-600" />
          <div className="w-6 h-px bg-mauve-600" />
        </div>
        <motion.div 
          className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-ink-100 border border-ink-200 flex items-center justify-center"
          whileHover={{ y: -3 }}
        >
          <FileText className="w-6 h-6 text-ink-500" />
        </motion.div>
      </div>
    ),
  },
  {
    number: '03',
    title: 'Мониторинг и оптимизация',
    description: 'Реальная видимость производительности системы. Выявляйте узкие места и итерируйте структуру на основе данных.',
    visual: (
      <div className="flex items-end justify-center gap-1.5 h-20 md:h-24 px-4">
        {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
          <motion.div
            key={i}
            className="flex-1 max-w-[32px] rounded-t-md bg-gradient-to-t from-mauve-600/30 to-mauve-600/60"
            initial={{ height: 0 }}
            whileInView={{ height: `${h}%` }}
            transition={{ duration: 0.7, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
            viewport={{ once: true }}
          />
        ))}
      </div>
    ),
  },
];

export default function WorkflowSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const stepsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(stickyRef.current?.querySelectorAll('.reveal') || [], {
        y: 35,
        opacity: 0,
        duration: 0.7,
        stagger: 0.08,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 75%',
          toggleActions: 'play none none none',
        },
      });

      stepsRef.current.forEach((step, i) => {
        if (!step) return;
        const textSide = step.querySelector('.text-side');
        const visualSide = step.querySelector('.visual-side');

        gsap.from(textSide, {
          x: i % 2 === 0 ? -40 : 40,
          opacity: 0,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: step,
            start: 'top 75%',
            toggleActions: 'play none none none',
          },
        });

        gsap.from(visualSide, {
          x: i % 2 === 0 ? 40 : -40,
          opacity: 0,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: step,
            start: 'top 75%',
            toggleActions: 'play none none none',
          },
        });

        const numberEl = step.querySelector('.step-number');
        if (numberEl) {
          gsap.from(numberEl, {
            scale: 0.6,
            opacity: 0,
            duration: 0.7,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: step,
              start: 'top 80%',
              toggleActions: 'play none none none',
            },
          });
        }
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="workflow" className="py-20 lg:py-24 section-padding bg-white">
      <div className="max-w-6xl mx-auto">
        <div ref={stickyRef} className="text-center mb-16">
          <span className="label text-mauve-600 mb-3 block reveal">Как это работает</span>
          <h2 className="heading-2 text-ink-900 mb-3 reveal">
            Три шага к структурированной автоматизации
          </h2>
          <p className="body-large max-w-lg mx-auto reveal">
            Чёткий путь от идеи к интеллектуальной системе.
          </p>
        </div>

        <div className="space-y-24 md:space-y-28">
          {STEPS.map((step, i) => (
            <div
              key={step.number}
              ref={el => { stepsRef.current[i] = el; }}
              className={`grid lg:grid-cols-2 gap-10 lg:gap-14 items-center ${
                i % 2 === 1 ? 'lg:flex-row-reverse' : ''
              }`}
            >
              <div className={`text-side ${i % 2 === 1 ? 'lg:order-2' : ''}`}>
                <div className="step-number text-6xl md:text-7xl font-mono-display font-bold text-ink-100 mb-3 leading-none">
                  {step.number}
                </div>
                <h3 className="heading-3 text-ink-900 mb-3">{step.title}</h3>
                <p className="body-large">{step.description}</p>
                
                <div className="mt-6 w-12 h-px bg-gradient-to-r from-mauve-600 to-transparent" />
              </div>
              
              <div className={`visual-side ${i % 2 === 1 ? 'lg:order-1' : ''}`}>
                <div className="bg-[#F8F9FB] rounded-2xl p-6 md:p-10 border border-ink-200/60 shadow-sm">
                  {step.visual}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
