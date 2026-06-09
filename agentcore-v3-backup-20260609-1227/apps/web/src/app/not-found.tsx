'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

function ParticleDots() {
  const dots = useMemo(() =>
    Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 2 + Math.random() * 4,
      duration: 12 + Math.random() * 20,
      delay: Math.random() * 8,
      opacity: 0.08 + Math.random() * 0.12,
    })),
  []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {dots.map((dot) => (
        <motion.div
          key={dot.id}
          className="absolute rounded-full bg-[var(--brand)]"
          style={{
            left: `${dot.x}%`,
            top: `${dot.y}%`,
            width: dot.size,
            height: dot.size,
            opacity: dot.opacity,
          }}
          animate={{
            y: [0, -40, 0, 30, 0],
            x: [0, 20, -15, 10, 0],
            opacity: [dot.opacity, dot.opacity * 1.8, dot.opacity, dot.opacity * 0.6, dot.opacity],
          }}
          transition={{
            duration: dot.duration,
            delay: dot.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center px-5 relative overflow-hidden">
      <ParticleDots />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.25 }}
        transition={{ duration: 1.5 }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full"
        style={{ background: 'radial-gradient(circle, var(--brand) 0%, transparent 70%)' }}
      />

      <div className="text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--accent-soft)] border border-[var(--border)] text-sm text-[var(--text-muted)] mb-6"
        >
          <span className="w-2 h-2 rounded-full bg-[var(--brand)] animate-pulse" />
          AgentCore
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="text-6xl font-bold text-[var(--text)] mb-4"
        >
          404
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-lg text-[var(--text-muted)] mb-8"
        >
          Страница не найдена
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.45 }}
        >
          <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--brand)] text-white font-medium text-sm hover:bg-[var(--brand)]/90 transition-all">
            <ArrowLeft size={16} /> На главную
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
