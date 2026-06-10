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
  const shimmerClass = 'animate-shimmer rounded-[var(--radius-sm)]';

  if (variant === 'avatar') {
    return (
      <div
        className={`${shimmerClass} rounded-full ${className}`}
        style={{ width: width ?? 40, height: height ?? 40 }}
        role="status"
        aria-label="Loading"
      />
    );
  }

  if (variant === 'card') {
    return (
      <div
        className={`${shimmerClass} rounded-[var(--radius-card)] ${className}`}
        style={{ width: width ?? '100%', height: height ?? 120 }}
        role="status"
        aria-label="Loading"
      />
    );
  }

  if (variant === 'paragraph') {
    return (
      <div className={`flex flex-col gap-2 ${className}`} role="status" aria-label="Loading">
        <div className={shimmerClass} style={{ width: '100%', height: height ?? 14 }} />
        <div className={shimmerClass} style={{ width: '90%', height: height ?? 14 }} />
        <div className={shimmerClass} style={{ width: '60%', height: height ?? 14 }} />
      </div>
    );
  }

  return (
    <div
      className={`${shimmerClass} ${className}`}
      style={{ width: width ?? '100%', height: height ?? 14 }}
      role="status"
      aria-label="Loading"
    />
  );
}
