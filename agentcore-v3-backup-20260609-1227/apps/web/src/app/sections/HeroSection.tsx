'use client';

import { useRef, useCallback } from 'react';
import { motion, useSpring, useTransform, useMotionValue } from 'framer-motion';
import { Send, CheckCheck } from 'lucide-react';
import { DEMO_CHAT } from '../../data/landingContent';

const PARTICLES = [
  { size: 320, x: '15%', y: '20%', color: 'var(--brand)', delay: 0, duration: 18 },
  { size: 240, x: '75%', y: '55%', color: 'var(--brand)', delay: 2, duration: 22 },
  { size: 180, x: '60%', y: '15%', color: 'var(--brand)', delay: 5, duration: 20 },
  { size: 280, x: '25%', y: '70%', color: 'var(--brand)', delay: 3, duration: 24 },
  { size: 200, x: '85%', y: '35%', color: 'var(--brand)', delay: 7, duration: 19 },
];

export default function HeroSection() {
  const cardRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [8, -8]), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-8, 8]), { stiffness: 300, damping: 30 });

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const card = cardRef.current;
      if (!card) return;
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      mouseX.set(x);
      mouseY.set(y);
    },
    [mouseX, mouseY]
  );

  const handleMouseLeave = useCallback(() => {
    mouseX.set(0);
    mouseY.set(0);
  }, [mouseX, mouseY]);

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-20 lg:pt-28 pb-12 lg:pb-16 bg-[var(--bg)]">
      {/* Floating gradient particles */}
      {PARTICLES.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: p.size,
            height: p.size,
            left: p.x,
            top: p.y,
            background: `radial-gradient(circle, ${p.color} 0%, transparent 70%)`,
            opacity: 0.08,
            filter: 'blur(40px)',
          }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{
            opacity: [0.06, 0.12, 0.06],
            scale: [1, 1.15, 1],
            x: [0, 30, -20, 0],
            y: [0, -20, 30, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 w-full grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        <div className="text-center lg:text-left">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="heading-1 text-[var(--text)] mb-6 max-w-xl mx-auto lg:mx-0 leading-[1.05]"
          >
            Ваш бизнес работает
            <br />
            даже когда вы спите
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="body-large max-w-lg mx-auto lg:mx-0 mb-9"
          >
            Цифровой сотрудник отвечает клиентам в Telegram, WhatsApp и на сайте — 24/7. Создайте за 2 минуты.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center lg:items-start gap-2"
          >
            <a
              href="/login"
              className="btn-primary px-8 py-4 text-base"
            >
              Создать агента
            </a>
            <span className="text-xs text-[var(--text-muted)] font-medium">
              14 дней пробного периода, без карты
            </span>
          </motion.div>
        </div>

        <div className="hidden lg:block" style={{ perspective: '1200px' }}>
          <motion.div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            style={{ rotateX, rotateY }}
            className="relative max-w-sm mx-auto bg-surface rounded-xl border border-[var(--border)] overflow-hidden cursor-default"
          >
            <div
              className="absolute inset-0 pointer-events-none z-20 opacity-[0.06]"
              style={{
                background: 'radial-gradient(circle, var(--brand) 0%, transparent 70%)',
              }}
            />
            <div className="px-5 py-3.5 flex items-center gap-3 border-b border-[var(--border)]">
              <div className="w-8 h-8 rounded-full bg-[var(--surface-2)] flex items-center justify-center text-sm">💬</div>
              <div className="flex-1">
                <p className="text-[var(--text)] text-sm font-semibold leading-tight">
                  Чат с клиентом
                </p>
                <p className="text-[var(--text-muted)] text-xs flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)]" />
                  онлайн
                </p>
              </div>
            </div>

            <div className="p-4 space-y-3 bg-[var(--bg)]">
              <div className="flex justify-end">
                <div className="max-w-[80%] bg-surface rounded-xl rounded-br-md px-4 py-2.5 border border-[var(--border)]">
                  <p className="text-[13px] text-[var(--text)] leading-relaxed">
                    {DEMO_CHAT.user}
                  </p>
                  <span className="block text-[10px] text-[var(--text-muted)] mt-1 text-right">
                    {DEMO_CHAT.userTime}
                  </span>
                </div>
              </div>

              <div className="flex justify-start">
                <div className="max-w-[85%] bg-[var(--brand-light)] rounded-xl rounded-bl-md px-4 py-2.5 border border-[var(--border)]">
                  <p className="text-[13px] text-[var(--text)] leading-relaxed">
                    {DEMO_CHAT.agent}
                  </p>
                  <div className="flex items-center justify-end gap-1 mt-1">
                    <CheckCheck className="w-3 h-3 text-[var(--brand)]" />
                    <span className="text-[10px] text-[var(--text-muted)]">{DEMO_CHAT.agentTime}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-start">
                <div className="flex items-center gap-1.5 px-4 py-2.5 bg-surface rounded-xl rounded-bl-md border border-[var(--border)]">
                  <span className="text-[var(--text-muted)] text-sm tracking-wider">...</span>
                  <span className="text-[11px] text-[var(--text-muted)]">
                    печатает
                  </span>
                </div>
              </div>

              <div className="pt-1">
                <div className="flex items-center gap-2 bg-surface border border-[var(--border)] rounded-xl px-4 py-3">
                  <input
                    type="text"
                    placeholder="Написать сообщение..."
                    className="flex-1 text-[13px] bg-transparent outline-none text-[var(--text)] placeholder:text-[var(--text-muted)]"
                    readOnly
                  />
                  <div className="w-8 h-8 rounded-xl bg-[var(--accent)] flex items-center justify-center">
                    <Send className="w-3.5 h-3.5 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
