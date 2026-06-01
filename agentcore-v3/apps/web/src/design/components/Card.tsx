'use client';

import { motion } from 'framer-motion';

type CardPadding = 'default' | 'large';

interface CardProps {
  hoverable?: boolean;
  padding?: CardPadding;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}

const paddingClasses: Record<CardPadding, string> = {
  default: 'p-5',
  large: 'p-6',
};

export function Card({
  hoverable = false,
  padding = 'default',
  className = '',
  children,
  onClick,
}: CardProps) {
  const Component = hoverable ? motion.div : 'div';
  const hoverProps = hoverable
    ? {
        whileHover: { y: -1 },
        transition: { duration: 0.2, ease: [0.2, 0.8, 0.2, 1] },
      }
    : {};

  const hoverClass = hoverable
    ? 'hover:bg-[var(--surface-2)] hover:shadow-[var(--shadow-hover)] cursor-pointer'
    : '';

  return (
    <Component
      className={`bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-card)] transition-[background-color,box-shadow] duration-200 ${paddingClasses[padding]} ${hoverClass} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={onClick ? 'Interactive card' : undefined}
      {...hoverProps}
    >
      {children}
    </Component>
  );
}
