'use client';

import { forwardRef, useState, useEffect, useCallback } from 'react';

type InputVariant = 'default' | 'monospace';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  variant?: InputVariant;
  label?: string;
  helperText?: string;
  error?: boolean;
  loading?: boolean;
}

const variantClasses: Record<InputVariant, string> = {
  default: 'bg-[var(--surface-2)] border-[var(--border)]',
  monospace: "bg-transparent border-[var(--border)] font-mono text-[14px] tracking-[-0.02em]",
};

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      variant = 'default',
      label,
      helperText,
      error = false,
      loading = false,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id ?? (label ? `input-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined);

    if (loading) {
      return (
        <div className={`flex flex-col gap-1.5 ${className}`}>
          {label && <div className="h-4 w-24 bg-[var(--surface-2)] rounded animate-shimmer" />}
          <div className="h-10 w-full bg-[var(--surface-2)] rounded-[var(--radius-button)] animate-shimmer" />
        </div>
      );
    }

    return (
      <div className={`flex flex-col gap-1.5 ${className}`}>
        {label && (
          <label htmlFor={inputId} className="text-[12px] font-medium text-[var(--text-muted)] leading-[16px]">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`w-full h-10 px-3 rounded-[var(--radius-button)] border text-[var(--text)] text-[14px] leading-[22px] transition-[border-color,box-shadow] duration-150 placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:ring-offset-1 focus:border-[var(--brand)] ${error ? 'border-[var(--danger)]' : ''} ${variantClasses[variant]}`}
          aria-invalid={error || undefined}
          aria-describedby={helperText ? `${inputId}-helper` : undefined}
          {...props}
        />
        {helperText && (
          <span id={`${inputId}-helper`} className={`text-[12px] leading-[16px] ${error ? 'text-[var(--danger)]' : 'text-[var(--text-muted)]'}`}>
            {helperText}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

interface TextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {
  variant?: InputVariant;
  label?: string;
  helperText?: string;
  error?: boolean;
  loading?: boolean;
  autoResize?: boolean;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      variant = 'default',
      label,
      helperText,
      error = false,
      loading = false,
      autoResize = false,
      className = '',
      id,
      value,
      onChange,
      ...props
    },
    ref
  ) => {
    const [internalRef, setInternalRef] = useState<HTMLTextAreaElement | null>(null);
    const textareaId = id ?? (label ? `textarea-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined);

    const resize = useCallback(() => {
      if (internalRef && autoResize) {
        internalRef.style.height = 'auto';
        internalRef.style.height = `${internalRef.scrollHeight}px`;
      }
    }, [internalRef, autoResize]);

    useEffect(() => {
      resize();
    }, [value, resize]);

    const setRef = useCallback(
      (el: HTMLTextAreaElement | null) => {
        setInternalRef(el);
        if (typeof ref === 'function') ref(el);
        else if (ref) (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = el;
      },
      [ref]
    );

    if (loading) {
      return (
        <div className={`flex flex-col gap-1.5 ${className}`}>
          {label && <div className="h-4 w-24 bg-[var(--surface-2)] rounded animate-shimmer" />}
          <div className="h-20 w-full bg-[var(--surface-2)] rounded-[var(--radius-button)] animate-shimmer" />
        </div>
      );
    }

    const textareaVariantClasses: Record<InputVariant, string> = {
      default: 'bg-[var(--surface-2)] border-[var(--border)]',
      monospace: "bg-transparent border-[var(--border)] font-mono text-[14px] tracking-[-0.02em]",
    };

    return (
      <div className={`flex flex-col gap-1.5 ${className}`}>
        {label && (
          <label htmlFor={textareaId} className="text-[12px] font-medium text-[var(--text-muted)] leading-[16px]">
            {label}
          </label>
        )}
        <textarea
          ref={setRef}
          id={textareaId}
          value={value}
          onChange={(e) => {
            onChange?.(e);
            if (autoResize) resize();
          }}
          className={`w-full px-3 py-2 rounded-[var(--radius-button)] border text-[var(--text)] text-[14px] leading-[22px] transition-[border-color,box-shadow] duration-150 placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:ring-offset-1 focus:border-[var(--brand)] resize-none ${error ? 'border-[var(--danger)]' : ''} ${textareaVariantClasses[variant]}`}
          aria-invalid={error || undefined}
          aria-describedby={helperText ? `${textareaId}-helper` : undefined}
          {...props}
        />
        {helperText && (
          <span id={`${textareaId}-helper`} className={`text-[12px] leading-[16px] ${error ? 'text-[var(--danger)]' : 'text-[var(--text-muted)]'}`}>
            {helperText}
          </span>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export { Input, Textarea };
export type { InputProps, TextareaProps, InputVariant };
