'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ErrorPage() {
  return (
    <div className="flex items-center justify-center min-h-[80vh]" data-testid="error-page">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-md mx-auto p-8"
      >
        <div className="w-20 h-20 rounded-3xl bg-danger-soft flex items-center justify-center mx-auto mb-6 ring-1 ring-[var(--danger-soft)]/60">
          <AlertTriangle className="w-10 h-10 text-danger" />
        </div>
        <h1 className="font-display font-bold text-4xl text-[var(--text)] tracking-tight mb-3">
          Ошибка
        </h1>
        <p className="text-[var(--text-muted)] text-lg mb-2">
          Что-то пошло не так
        </p>
        <p className="text-[var(--text-muted)] text-sm mb-8">
          Произошла непредвиденная ошибка. Попробуйте обновить страницу или вернуться назад.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--accent)] text-white text-sm font-semibold hover:bg-[var(--accent)] transition-all duration-200 shadow-sm focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-1"
          >
            <ArrowLeft className="w-4 h-4" />
            На главную
          </Link>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[var(--border)] text-sm text-[var(--text)] font-semibold hover:bg-[var(--accent-soft)]/50 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-1"
          >
            Обновить страницу
          </button>
        </div>
      </motion.div>
    </div>
  );
}
