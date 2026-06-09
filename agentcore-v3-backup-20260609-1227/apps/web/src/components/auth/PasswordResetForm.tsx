'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Mail, ArrowLeft } from 'lucide-react';

interface PasswordResetFormProps {
  onSubmit: (email: string) => Promise<void>;
  onBack: () => void;
  loading: boolean;
  error: string;
  success: boolean;
}

const errorId = 'reset-error-message';

export default function PasswordResetForm({ onSubmit, onBack, loading, error, success }: PasswordResetFormProps) {
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(email);
  };

  if (success) {
    return (
      <div className="text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-success/15 flex items-center justify-center mx-auto">
          <Mail className="w-6 h-6 text-success" />
        </div>
        <h3 className="font-semibold text-text">Проверьте почту</h3>
        <p className="text-sm text-text-muted">
          Мы отправили ссылку для сброса пароля на {email}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-center mb-4">
        <h3 className="font-semibold text-text">Сброс пароля</h3>
        <p className="text-sm text-text-muted mt-1">Введите email, мы отправим ссылку</p>
      </div>

      <div>
        <input
          id="reset-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          required
          aria-label="Email"
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          className="w-full px-4 py-3 rounded-xl border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-brand/30 transition-all text-text placeholder:text-text-muted text-sm"
        />
      </div>

      {error && (
        <motion.div id={errorId} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
          aria-live="polite"
          aria-atomic="true"
          className="p-3 rounded-xl bg-danger-soft border border-[var(--danger-soft)] text-danger text-sm text-center">
          {error}
        </motion.div>
      )}

      <button type="submit" disabled={loading}
        className="w-full btn-primary text-sm py-3 disabled:opacity-60">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Отправить'}
      </button>

      <button type="button" onClick={onBack}
        className="w-full flex items-center justify-center gap-1.5 text-sm text-text-muted hover:text-text transition-colors">
        <ArrowLeft className="w-4 h-4" /> Назад ко входу
      </button>
    </form>
  );
}
