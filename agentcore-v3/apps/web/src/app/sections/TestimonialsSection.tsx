'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Quote, Star } from 'lucide-react';
import { TESTIMONIALS, AUTOPLAY_INTERVAL } from '../../data/landingContent';

const headerContainer = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const headerItem = {
  hidden: { opacity: 0, y: 35 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
};

export default function TestimonialsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const nextSlide = useCallback(() => {
    setDirection(1);
    setActiveIndex((prev) => (prev + 1) % TESTIMONIALS.length);
  }, []);

  const goToSlide = useCallback((idx: number) => {
    setDirection(idx > activeIndex ? 1 : -1);
    setActiveIndex(idx);
  }, [activeIndex]);

  useEffect(() => {
    timerRef.current = setInterval(nextSlide, AUTOPLAY_INTERVAL);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [nextSlide]);

  const handleMouseEnter = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleMouseLeave = () => {
    timerRef.current = setInterval(nextSlide, AUTOPLAY_INTERVAL);
  };

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -80 : 80, opacity: 0 }),
  };

  return (
    <section
      ref={sectionRef}
      id="testimonials"
      className="py-20 lg:py-24 section-padding relative overflow-hidden"
      style={{ backgroundColor: '#F8F9FB' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: 'radial-gradient(circle, #5A4D59 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-100px' }}
          variants={headerContainer}
          className="text-center mb-14"
        >
          <motion.span variants={headerItem} className="label text-mauve-600 mb-3 block">
            Нам доверяют
          </motion.span>
          <motion.h2 variants={headerItem} className="heading-2 text-ink-900">
            Что говорят клиенты
          </motion.h2>
          <motion.p variants={headerItem} className="text-sm text-ink-400 mt-2">
            Примеры работы агентов в реальных сценариях
          </motion.p>
        </motion.div>

        <div className="relative flex justify-center">
          <div className="w-full max-w-2xl relative" style={{ minHeight: '260px' }}>
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={activeIndex}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-0"
              >
                <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-ink-100/80">
                  <Quote className="w-8 h-8 text-mauve-600/30 mb-4" />

                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < TESTIMONIALS[activeIndex].rating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-ink-200'
                        }`}
                      />
                    ))}
                  </div>

                  <p className="text-ink-600 leading-relaxed text-base md:text-lg mb-6">
                    {TESTIMONIALS[activeIndex].quote}
                  </p>

                  <div className="flex items-center gap-3 border-t border-ink-100 pt-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-mauve-400 to-mauve-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                      {TESTIMONIALS[activeIndex].author[0]}
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-ink-900">
                        {TESTIMONIALS[activeIndex].author}
                      </div>
                      <div className="text-xs text-ink-400">{TESTIMONIALS[activeIndex].role}</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 mt-8">
          {TESTIMONIALS.map((_, i) => (
            <button
              key={i}
              onClick={() => goToSlide(i)}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                i === activeIndex
                  ? 'bg-mauve-600 w-6'
                  : 'bg-ink-200 hover:bg-mauve-400/50'
              }`}
              aria-label={`Перейти к отзыву ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
