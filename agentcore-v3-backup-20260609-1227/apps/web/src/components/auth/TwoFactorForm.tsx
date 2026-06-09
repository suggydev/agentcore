'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Shield } from 'lucide-react';

interface TwoFactorFormProps {
  onSubmit: (code: string) => Promise<void>;
  loading: boolean;
  error: string;
}

export default function TwoFactorForm({ onSubmit, loading, error }: TwoFactorFormProps) {
  const [code, setCode] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length === 6) onSubmit(code);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-center mb-4">
        <div className="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center mx-auto mb-3">
          <Shield className="w-6 h-6 text-brand" />
        </div>
        <h3 className="font-semibold text-text">Двухфакторная аутентификация</h3>
        <p className="text-sm text-text-muted mt-1">Введите код из приложения</p>
      </div>

      <div>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="000000"
          className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-center text-xl tracking-[0.5em] font-mono focus:outline-none focus:ring-2 focus:ring-brand/30 transition-all"
          maxLength={6}
          autoComplete="one-time-code"
        />
      </div>

      {error && (
        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
          className="p-3 rounded-xl bg-danger-soft border border-[var(--danger-soft)] text-danger text-sm text-center">
          {error}
        </motion.div>
      )}

      <button type="submit" disabled={loading || code.length !== 6}
        className="w-full btn-primary text-sm py-3 disabled:opacity-60">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Подтвердить'}
      </button>
    </form>
  );
}
