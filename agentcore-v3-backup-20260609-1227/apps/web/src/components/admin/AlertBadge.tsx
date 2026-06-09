'use client';

import { CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react';

export type AlertType = 'success' | 'warning' | 'error' | 'info';

interface AlertBadgeProps {
  type: AlertType;
  label?: string;
  size?: 'sm' | 'md';
}

const config: Record<AlertType, { icon: typeof CheckCircle; className: string; label: string }> = {
  success: { icon: CheckCircle, className: 'bg-success-soft text-success border-success/10', label: 'Success' },
  warning: { icon: AlertTriangle, className: 'bg-warning-soft text-warning border-warning/10', label: 'Warning' },
  error: { icon: XCircle, className: 'bg-danger-soft text-danger border-danger/10', label: 'Error' },
  info: { icon: Info, className: 'bg-brand-light text-brand border-brand/10', label: 'Info' },
};

export default function AlertBadge({ type, label, size = 'sm' }: AlertBadgeProps) {
  const c = config[type];
  const Icon = c.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-pill border ${c.className} ${size === 'sm' ? 'px-2 py-0.5 text-[10px] font-medium' : 'px-2.5 py-1 text-xs font-semibold'}`}>
      <Icon size={size === 'sm' ? 12 : 14} />
      {label ?? c.label}
    </span>
  );
}
