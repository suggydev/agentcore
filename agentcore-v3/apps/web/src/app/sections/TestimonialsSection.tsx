'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Quote, Star } from 'lucide-react';
import { TESTIMONIALS, AUTOPLAY_INTERVAL } from '../../data/landingContent';

export default function TestimonialsSection() {
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
      id="testimonials"
      className="py-24 bg-[var(--surface)]"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <span className="label text-[var(--brand)] mb-3 block">
            Нам доверяют
          </span>
          <h2 className="heading-2 text-[var(--text)]">
            Что говорят клиенты
          </h2>
          <p className="text-sm text-[var(--text-muted)] mt-2">
            Примеры работы агентов в реальных сценариях
          </p>
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
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-0"
              >
                <div className="bg-white rounded-xl p-6 md:p-8 border border-[var(--border)]">
                  <Quote className="w-8 h-8 text-[var(--brand)]/30 mb-4" />

                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < TESTIMONIALS[activeIndex].rating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-[var(--border)]'
                        }`}
                      />
                    ))}
                  </div>

                  <p className="text-[var(--text)] leading-relaxed text-base md:text-lg mb-6">
                    {TESTIMONIALS[activeIndex].quote}
                  </p>

                  <div className="flex items-center gap-3 border-t border-[var(--border)] pt-4">
                    <div className="w-10 h-10 rounded-full bg-[var(--brand)] flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                      {TESTIMONIALS[activeIndex].author[0]}
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-[var(--text)]">
                        {TESTIMONIALS[activeIndex].author}
                      </div>
                      <div className="text-xs text-[var(--text-muted)]">{TESTIMONIALS[activeIndex].role}</div>
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
                  ? 'bg-[var(--accent)] w-6'
                  : 'bg-[var(--border)] hover:bg-[var(--text-muted)]'
              }`}
              aria-label={`Перейти к отзыву ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
