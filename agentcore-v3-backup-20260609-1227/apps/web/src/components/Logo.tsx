'use client';

import { useRef, useEffect, useState } from 'react';

interface LogoProps {
  className?: string;
  animated?: boolean;
  size?: number;
  showText?: boolean;
}

export default function Logo({ className = '', animated = false, size = 32, showText = true }: LogoProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isRevealed, setIsRevealed] = useState(!animated);

  useEffect(() => {
    if (animated && svgRef.current) {
      const timer = setTimeout(() => setIsRevealed(true), 100);
      return () => clearTimeout(timer);
    }
  }, [animated]);

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <svg 
        ref={svgRef}
        width={size} 
        height={size} 
        viewBox="0 0 40 40" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
        role="img"
        aria-label="AgentCore логотип"
      >
        <rect 
          x="4" y="4" width="14" height="14" rx="3" 
          fill={isRevealed ? '#1A1A1A' : 'none'}
          stroke="#1A1A1A" 
          strokeWidth="2"
          strokeDasharray="200"
          strokeDashoffset={isRevealed ? 0 : 200}
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.16, 1, 0.3, 1), fill 0.6s ease 0.8s' }}
        />
        <rect 
          x="22" y="4" width="14" height="14" rx="3" 
          fill={isRevealed ? '#6E56CF' : 'none'}
          stroke="#6E56CF" 
          strokeWidth="2"
          strokeDasharray="200"
          strokeDashoffset={isRevealed ? 0 : 200}
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.16, 1, 0.3, 1) 0.15s, fill 0.6s ease 0.95s' }}
        />
        <rect 
          x="4" y="22" width="14" height="14" rx="3" 
          fill={isRevealed ? '#6E56CF' : 'none'}
          stroke="#6E56CF" 
          strokeWidth="2"
          strokeDasharray="200"
          strokeDashoffset={isRevealed ? 0 : 200}
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.16, 1, 0.3, 1) 0.3s, fill 0.6s ease 1.1s' }}
        />
        <circle 
          cx="29" cy="29" r="6" 
          fill={isRevealed ? '#1A1A1A' : 'none'}
          stroke="#1A1A1A" 
          strokeWidth="2"
          strokeDasharray="200"
          strokeDashoffset={isRevealed ? 0 : 200}
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.16, 1, 0.3, 1) 0.45s, fill 0.6s ease 1.25s' }}
        />
        <line 
          x1="18" y1="11" x2="22" y2="11" 
          stroke="#E8E5DF" 
          strokeWidth="1"
          strokeDasharray="10"
          strokeDashoffset={isRevealed ? 0 : 10}
          style={{ transition: 'stroke-dashoffset 0.6s ease 0.6s' }}
        />
        <line 
          x1="11" y1="18" x2="11" y2="22" 
          stroke="#E8E5DF" 
          strokeWidth="1"
          strokeDasharray="10"
          strokeDashoffset={isRevealed ? 0 : 10}
          style={{ transition: 'stroke-dashoffset 0.6s ease 0.75s' }}
        />
      </svg>
      {showText && (
        <span className="font-display font-bold text-[var(--text)] text-lg tracking-tight">
          AgentCore
        </span>
      )}
    </div>
  );
}

export function LogoSymbol({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 40 40" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="AgentCore"
    >
      <rect x="4" y="4" width="14" height="14" rx="3" fill="#1A1A1A" />
      <rect x="22" y="4" width="14" height="14" rx="3" fill="#6E56CF" />
      <rect x="4" y="22" width="14" height="14" rx="3" fill="#6E56CF" />
      <circle cx="29" cy="29" r="6" fill="#1A1A1A" />
    </svg>
  );
}
