'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, type LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  trend?: number;
  trendLabel?: string;
  icon: LucideIcon;
  color?: 'brand' | 'success' | 'warning' | 'danger';
  delay?: number;
}

const colorMap = {
  brand: 'bg-brand-light text-brand border-brand/10',
  success: 'bg-success-soft text-success border-success/10',
  warning: 'bg-warning-soft text-warning border-warning/10',
  danger: 'bg-danger-soft text-danger border-danger/10',
};

export default function KpiCard({ title, value, trend, trendLabel, icon: Icon, color = 'brand', delay = 0 }: KpiCardProps) {
  const isPositive = trend !== undefined ? trend >= 0 : undefined;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: [0.2, 0.8, 0.2, 1] }}
      className="bg-surface border border-border rounded-card p-5 hover:shadow-sm transition-shadow duration-200"
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">{title}</p>
          <p className="text-2xl font-bold font-mono text-text tracking-tight">{value}</p>
        </div>
        <div className={`p-2 rounded-lg border ${colorMap[color]}`}>
          <Icon size={18} />
        </div>
      </div>
      {trend !== undefined && (
        <div className="mt-3 flex items-center gap-1.5">
          {isPositive ? (
            <TrendingUp size={14} className="text-success" />
          ) : (
            <TrendingDown size={14} className="text-danger" />
          )}
          <span className={`text-xs font-medium ${isPositive ? 'text-success' : 'text-danger'}`}>
            {isPositive ? '+' : ''}{trend}%
          </span>
          {trendLabel && <span className="text-xs text-text-muted">{trendLabel}</span>}
        </div>
      )}
    </motion.div>
  );
}
