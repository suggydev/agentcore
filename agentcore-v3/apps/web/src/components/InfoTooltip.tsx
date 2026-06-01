'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info } from 'lucide-react';

interface InfoTooltipProps {
  content: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  iconSize?: number;
}

export default function InfoTooltip({
  content,
  side = 'top',
  className = '',
  iconSize = 14,
}: InfoTooltipProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        ref.current &&
        !ref.current.contains(e.target as Node) &&
        !triggerRef.current?.contains(e.target as Node)
      ) {
        close();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open, close]);

  const positionStyles: Record<string, string> = {
    top: 'bottom-full mb-2 left-1/2 -translate-x-1/2',
    bottom: 'top-full mt-2 left-1/2 -translate-x-1/2',
    left: 'right-full mr-2 top-1/2 -translate-y-1/2',
    right: 'left-full ml-2 top-1/2 -translate-y-1/2',
  };

  const arrowStyles: Record<string, string> = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-ink-800 border-l-transparent border-r-transparent border-b-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-ink-800 border-l-transparent border-r-transparent border-t-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-ink-800 border-t-transparent border-b-transparent border-r-transparent',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-ink-800 border-t-transparent border-b-transparent border-l-transparent',
  };

  return (
    <span className={`relative inline-flex items-center ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(!open)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        aria-label="More information"
        aria-expanded={open}
        className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-mauve-100/80 hover:bg-mauve-200 text-mauve-500 hover:text-mauve-700 transition-colors duration-150 flex-shrink-0 cursor-help"
      >
        <Info size={iconSize} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            ref={ref}
            initial={{ opacity: 0, scale: 0.92, y: side === 'bottom' ? -4 : 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: side === 'bottom' ? -4 : 4 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className={`absolute z-50 ${positionStyles[side]} w-56 px-3 py-2.5 rounded-xl bg-ink-800 text-white text-xs leading-relaxed shadow-lg shadow-ink-900/20 pointer-events-none`}
            role="tooltip"
          >
            {content}
            <div className={`absolute w-0 h-0 border-4 ${arrowStyles[side]}`} />
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
}
