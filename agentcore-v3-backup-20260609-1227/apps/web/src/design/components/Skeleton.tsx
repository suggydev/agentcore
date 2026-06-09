'use client';

type SkeletonVariant = 'text' | 'paragraph' | 'card' | 'avatar';

interface SkeletonProps {
  variant?: SkeletonVariant;
  width?: string | number;
  height?: string | number;
  className?: string;
}

export function Skeleton({
  variant = 'text',
  width,
  height,
  className = '',
}: SkeletonProps) {
  const shimmerBase = 'bg-[var(--surface-2)] relative overflow-hidden rounded-[var(--radius-sm)]';
  const shimmerGradient =
    "after:content-[''] after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-[var(--surface)]/50 after:to-transparent after:animate-shimmer";

  if (variant === 'avatar') {
    return (
      <div
        className={`${shimmerBase} ${shimmerGradient} rounded-full ${className}`}
        style={{ width: width ?? 40, height: height ?? 40 }}
        role="status"
        aria-label="Loading"
      />
    );
  }

  if (variant === 'card') {
    return (
      <div
        className={`${shimmerBase} ${shimmerGradient} rounded-[var(--radius-card)] ${className}`}
        style={{ width: width ?? '100%', height: height ?? 120 }}
        role="status"
        aria-label="Loading"
      />
    );
  }

  if (variant === 'paragraph') {
    return (
      <div className={`flex flex-col gap-2 ${className}`} role="status" aria-label="Loading">
        <div className={`${shimmerBase} ${shimmerGradient}`} style={{ width: '100%', height: height ?? 14 }} />
        <div className={`${shimmerBase} ${shimmerGradient}`} style={{ width: '90%', height: height ?? 14 }} />
        <div className={`${shimmerBase} ${shimmerGradient}`} style={{ width: '60%', height: height ?? 14 }} />
      </div>
    );
  }

  return (
    <div
      className={`${shimmerBase} ${shimmerGradient} ${className}`}
      style={{ width: width ?? '100%', height: height ?? 14 }}
      role="status"
      aria-label="Loading"
    />
  );
}
