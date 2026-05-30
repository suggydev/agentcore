'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, Sparkles } from 'lucide-react';
import MagneticButton from '../../components/MagneticButton';

gsap.registerPlugin(ScrollTrigger);

export default function CTASection() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(cardRef.current, {
        y: 60,
        opacity: 0,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 75%',
          toggleActions: 'play none none none',
        },
      });

      gsap.from('.cta-shape', {
        y: 50,
        opacity: 0,
        duration: 0.9,
        stagger: 0.15,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%',
          toggleActions: 'play none none none',
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-20 lg:py-24 section-padding">
      <div className="max-w-4xl mx-auto">
        <div 
          ref={cardRef}
          className="relative rounded-3xl bg-ink-900 p-10 md:p-14 text-center overflow-hidden"
        >
          <div className="absolute inset-0 grid-lines opacity-10" />
          <div className="cta-shape absolute top-0 right-0 w-56 h-56 bg-mauve/10 rounded-full blur-3xl" />
          <div className="cta-shape absolute bottom-0 left-0 w-40 h-40 bg-mauve-300/10 rounded-full blur-3xl" />
          
          <div className="absolute top-6 right-6 w-16 h-16 border border-white/5 rounded-lg rotate-12 hidden md:block" />
          <div className="absolute bottom-6 left-6 w-12 h-12 border border-white/5 rounded-full hidden md:block" />
          
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-6">
              <Sparkles className="w-3.5 h-3.5 text-mauve-300" />
              <span className="text-xs text-ink-300 font-medium">Готовы к структуре?</span>
            </div>

            <h2 className="font-mono-display font-bold text-2xl md:text-3xl text-white mb-3">
              Готовы структурировать ваши операции?
            </h2>
            <p className="text-ink-300 max-w-md mx-auto mb-8 text-sm">
              Присоединяйтесь к командам, строящим интеллектуальные системы с чёткой архитектурой.
            </p>
            <MagneticButton strength={0.15}>
              <a href="/login" className="inline-flex items-center gap-2 px-7 py-3.5 bg-white text-ink-900 rounded-xl font-semibold text-sm hover:bg-ink-50 transition-colors">
                Начать строить <ArrowRight className="w-4 h-4" />
              </a>
            </MagneticButton>
          </div>
        </div>
      </div>
    </section>
  );
}
