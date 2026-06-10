'use client';

import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { t } from '@/design/i18n';

type ToastVariant = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  variant: ToastVariant;
  message: string;
  undo?: () => void;
}

interface ToastContextValue {
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const variantConfig: Record<ToastVariant, { icon: typeof CheckCircle; bgClass: string; borderClass: string; textClass: string }> = {
  success: { icon: CheckCircle, bgClass: 'bg-[var(--success)]/10', borderClass: 'border-[var(--success)]/30', textClass: 'text-[var(--success)]' },
  error: { icon: XCircle, bgClass: 'bg-[var(--danger)]/10', borderClass: 'border-[var(--danger)]/30', textClass: 'text-[var(--danger)]' },
  warning: { icon: AlertTriangle, bgClass: 'bg-[var(--warning)]/10', borderClass: 'border-[var(--warning)]/30', textClass: 'text-[var(--warning)]' },
  info: { icon: Info, bgClass: 'bg-[var(--brand)]/10', borderClass: 'border-[var(--brand)]/30', textClass: 'text-[var(--brand)]' },
};

const variantLabel: Record<ToastVariant, string> = {
  success: t('toast.success'),
  error: t('toast.error'),
  warning: t('toast.warning'),
  info: t('toast.info'),
};

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const config = variantConfig[toast.variant];
  const Icon = config.icon;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dismissDuration = 3000;

  const dismiss = useCallback(() => {
    onRemove(toast.id);
  }, [onRemove, toast.id]);

  useEffect(() => {
    if (!toast.undo) {
      timerRef.current = setTimeout(dismiss, dismissDuration);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [dismiss, toast.undo]);

  const handleMouseEnter = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (!toast.undo) {
      timerRef.current = setTimeout(dismiss, dismissDuration);
    }
  }, [dismiss, toast.undo]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`flex items-start gap-3 p-4 rounded-[var(--radius-card)] border ${config.bgClass} ${config.borderClass} bg-[var(--surface)] shadow-[0_8px_30px_rgba(0,0,0,0.08)] min-w-[320px] max-w-[420px]`}
      role="alert"
      aria-live="assertive"
      data-testid={`toast-${toast.variant}`}
    >
      <Icon size={18} className={config.textClass} />
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-medium text-[var(--text-muted)] mb-0.5">{variantLabel[toast.variant]}</p>
        <p className="text-[14px] text-[var(--text)] leading-[22px]">{toast.message}</p>
        {toast.undo && (
          <button
            onClick={() => {
              toast.undo?.();
              onRemove(toast.id);
            }}
            className="text-[12px] font-medium text-[var(--brand)] hover:underline mt-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] rounded"
            aria-label={t('common.undo')}
          >
            {t('common.undo')}
          </button>
        )}
      </div>
      <button
        onClick={() => onRemove(toast.id)}
        className="p-0.5 text-[var(--text-muted)] hover:text-[var(--text)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] rounded"
        aria-label={t('common.close')}
      >
        <X size={14} />
      </button>
    </motion.div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counterRef = useRef(0);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (toast: Omit<Toast, 'id'>) => {
      counterRef.current += 1;
      const id = `toast-${counterRef.current}`;
      setToasts((prev) => [...prev, { ...toast, id }]);
    },
    []
  );

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2" aria-label="Notifications">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
