'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';

interface LoginFormProps {
  onSubmit: (email: string, password: string) => Promise<void>;
  loading: boolean;
  error: string;
  onForgotPassword?: () => void;
}

const inputClass = "w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-surface focus:outline-none focus:ring-2 focus-visible:ring-[var(--brand)] focus-visible:border-[var(--brand)] transition-all text-[var(--text)] placeholder:text-[var(--text-muted)] text-sm";
const inputClassErr = "w-full px-4 py-3 rounded-xl border border-[var(--danger)] bg-surface focus:outline-none focus:ring-2 focus-visible:ring-[var(--danger)] transition-all text-[var(--text)] placeholder:text-[var(--text-muted)] text-sm";

const errorId = 'login-error-message';

export default function LoginForm({ onSubmit, loading, error, onForgotPassword }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(email, password);
  };

  const hasFieldError = (field: string) => {
    if (!error) return false;
    const msg = error.toLowerCase();
    if (field === 'email' && (msg.includes('email') || msg.includes('почт'))) return true;
    if (field === 'password' && (msg.includes('парол') || msg.includes('password'))) return true;
    if (!msg.includes('email') && !msg.includes('парол') && !msg.includes('имя') && !msg.includes('совпада')) return true;
    return false;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="login-email" className="block text-sm font-medium text-[var(--text)] mb-1.5">Email</label>
        <input id="login-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required
          aria-invalid={hasFieldError('email')}
          aria-describedby={error ? errorId : undefined}
          className={hasFieldError('email') ? inputClassErr : inputClass} placeholder="you@company.com" />
      </div>
      <div>
        <label htmlFor="login-password" className="block text-sm font-medium text-[var(--text)] mb-1.5">Пароль</label>
        <div className="relative">
          <input id="login-password" type={showPassword ? 'text' : 'password'} value={password}
            onChange={e => setPassword(e.target.value)} required minLength={6}
            aria-invalid={hasFieldError('password')}
            aria-describedby={error ? errorId : undefined}
            className={`${hasFieldError('password') ? inputClassErr : inputClass} pr-12`} placeholder="••••••••" />
          <button type="button" onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
            aria-pressed={showPassword}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-muted)] transition-colors">
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>
      {error && (
        <motion.div id={errorId} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
          aria-live="polite"
          aria-atomic="true"
          className="p-3 rounded-xl bg-danger-soft border border-[var(--danger-soft)] text-danger text-sm text-center">{error}</motion.div>
      )}
      <div className="flex items-center justify-end">
        <button type="button" onClick={onForgotPassword}
          className="text-sm text-[var(--brand)] hover:underline underline-offset-2">
          Забыли пароль?
        </button>
      </div>
      <button type="submit" disabled={loading}
        className="w-full btn-primary text-sm py-3 disabled:opacity-60">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><span>Войти</span> <ArrowRight className="w-4 h-4" /></>}
      </button>
    </form>
  );
}
