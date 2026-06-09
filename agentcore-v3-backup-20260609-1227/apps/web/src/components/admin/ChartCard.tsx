'use client';

import { motion } from 'framer-motion';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export default function ChartCard({ title, subtitle, children, delay = 0, className = '' }: ChartCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: [0.2, 0.8, 0.2, 1] }}
      className={`bg-surface border border-border rounded-card overflow-hidden ${className}`}
    >
      <div className="px-5 py-4 border-b border-border">
        <h3 className="text-sm font-semibold text-text">{title}</h3>
        {subtitle && <p className="text-xs text-text-muted mt-0.5">{subtitle}</p>}
      </div>
      <div className="p-5">
        {children}
      </div>
    </motion.div>
  );
}
