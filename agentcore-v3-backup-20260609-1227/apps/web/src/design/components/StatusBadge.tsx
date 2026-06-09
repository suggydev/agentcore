'use client';

import { t } from '@/design/i18n';

type StatusVariant = 'active' | 'inactive' | 'draft' | 'error';

interface StatusBadgeProps {
  variant: StatusVariant;
  label?: string;
  className?: string;
}

const variantConfig: Record<StatusVariant, { dotColor: string; textColor: string; bgClass: string }> = {
  active: { dotColor: 'bg-[var(--success)]', textColor: 'text-[var(--success)]', bgClass: 'bg-[var(--success)]/10' },
  inactive: { dotColor: 'bg-[var(--text-muted)]', textColor: 'text-[var(--text-muted)]', bgClass: 'bg-[var(--surface-2)]' },
  draft: { dotColor: 'bg-[var(--warning)]', textColor: 'text-[var(--warning)]', bgClass: 'bg-[var(--warning)]/10' },
  error: { dotColor: 'bg-[var(--danger)]', textColor: 'text-[var(--danger)]', bgClass: 'bg-[var(--danger)]/10' },
};

const defaultLabels: Record<StatusVariant, string> = {
  active: t('agents.status.active'),
  inactive: t('agents.status.inactive'),
  draft: t('agents.status.draft'),
  error: t('agents.status.error'),
};

export function StatusBadge({ variant, label, className = '' }: StatusBadgeProps) {
  const config = variantConfig[variant];
  const displayLabel = label ?? defaultLabels[variant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-medium leading-[16px] rounded-[var(--radius-pill)] ${config.bgClass} ${config.textColor} ${className}`}
      role="status"
      aria-label={displayLabel}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dotColor}`} />
      {displayLabel}
    </span>
  );
}
