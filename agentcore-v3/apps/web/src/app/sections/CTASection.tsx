'use client';

import { useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import MagneticButton from '../../components/MagneticButton';

export default function CTASection() {
  const sectionRef = useRef<HTMLElement>(null);

  return (
    <section ref={sectionRef} className="py-24 lg:py-32 section-padding relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full opacity-40"
          style={{
            background: 'radial-gradient(circle, rgba(212,182,216,0.2) 0%, rgba(168,150,171,0.06) 40%, transparent 70%)',
            filter: 'blur(80px)',
          }}
        />
        <div className="absolute bottom-0 -left-[10%] w-[500px] h-[500px] rounded-full opacity-30"
          style={{
            background: 'radial-gradient(circle, rgba(212,182,216,0.15) 0%, rgba(168,150,171,0.04) 50%, transparent 70%)',
            filter: 'blur(70px)',
          }}
        />
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="relative rounded-3xl bg-gradient-to-br from-ink-900 via-ink-900 to-mauve-900 p-10 sm:p-14 md:p-16 text-center overflow-hidden shadow-2xl shadow-mauve-600/15 border border-white/5"
        >
          <div className="absolute inset-0 grid-lines opacity-[0.04]" />
          <div className="absolute top-0 right-0 w-80 h-80 bg-mauve-500/12 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-mauve-400/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/4 w-48 h-48 bg-mauve-300/6 rounded-full blur-2xl" />

          <div className="absolute top-6 right-6 w-14 h-14 sm:w-20 sm:h-20 border border-white/8 rounded-xl rotate-[15deg] hidden md:block" />
          <div className="absolute bottom-6 left-6 w-12 h-12 sm:w-16 sm:h-16 border border-white/8 rounded-full hidden md:block" />
          <div className="absolute top-12 left-12 w-8 h-8 border border-white/5 rounded-lg rotate-45 hidden md:block" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-7">
              <Sparkles className="w-4 h-4 text-mauve-300" />
              <span className="text-sm text-ink-300 font-medium">Готовы попробовать?</span>
            </div>

            <h2 className="heading-2 text-white mb-4 max-w-lg mx-auto">
              Создайте ИИ-сотрудника за 60 секунд
            </h2>
            <p className="text-ink-300 max-w-md mx-auto mb-9 text-base">
              Бесплатно первые 7 дней. Без карты. Без риска.
            </p>
            <MagneticButton strength={0.15}>
              <a href="/login" className="inline-flex items-center gap-2 px-9 py-4 bg-white text-ink-900 rounded-2xl font-semibold text-base hover:bg-ink-50 transition-colors shadow-lg shadow-white/10 cta-pulse-light">
                Создать бесплатно <ArrowRight className="w-5 h-5" />
              </a>
            </MagneticButton>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
