'use client';

import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { t } from '@/design/i18n';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'pill';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-[12px] gap-1.5',
  md: 'px-4 py-2 text-[14px] gap-2',
  lg: 'px-6 py-3 text-[16px] gap-2.5',
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-[var(--accent)] text-white hover:opacity-90',
  secondary: 'bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] hover:bg-[var(--surface)]',
  ghost: 'bg-transparent text-[var(--text)] hover:bg-[var(--surface-2)]',
  danger: 'bg-[var(--danger)] text-white hover:opacity-90',
  pill: 'bg-[var(--accent-soft)] text-[var(--brand)] rounded-[var(--radius-pill)]',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled = false,
      leftIcon,
      rightIcon,
      children,
      className = '',
      ...props
    },
    ref
  ) => {
    const isPill = variant === 'pill';
    const baseClasses = isPill
      ? 'inline-flex items-center justify-center font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-1 rounded-[var(--radius-pill)]'
      : 'inline-flex items-center justify-center font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-1 rounded-[var(--radius-button)]';

    return (
      <motion.button
        ref={ref}
        className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabled || loading ? 'opacity-50 pointer-events-none' : ''} ${className}`}
        whileHover={!disabled && !loading ? { y: -1 } : undefined}
        whileTap={!disabled && !loading ? { scale: 0.98 } : undefined}
        transition={{ duration: 0.15, ease: [0.2, 0.8, 0.2, 1] }}
        disabled={disabled || loading}
        aria-busy={loading}
        aria-label={props['aria-label']}
        {...(props as Record<string, unknown>)}
      >
        {loading && <Loader2 className="animate-spin" size={size === 'sm' ? 12 : size === 'lg' ? 18 : 14} />}
        {!loading && leftIcon}
        {children}
        {!loading && rightIcon}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';
export { Button };
export type { ButtonProps, ButtonVariant, ButtonSize };
