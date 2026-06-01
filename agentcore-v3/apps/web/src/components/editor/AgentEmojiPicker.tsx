'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { t } from '@/design/i18n';

interface AgentEmojiPickerProps {
  value: string;
  onChange: (emoji: string) => void;
}

const EMOJI_CATEGORIES: Record<string, string[]> = {
  'Люди': ['👤', '👩‍💼', '👨‍💼', '🧑‍💻', '👩‍🔧', '👨‍🔧', '👩‍🏫', '👨‍🏫', '👩‍⚕️', '👨‍⚕️', '🧑‍🎓', '👩‍🍳', '👨‍🍳', '🧑‍🎨'],
  'Бизнес': ['💼', '📊', '📈', '🏪', '🏢', '🏬', '🏗️', '🏭', '💡', '🎯', '⭐', '🏆', '💎', '🔔'],
  'Природа': ['🌸', '🌺', '🌻', '🪻', '🌿', '🍀', '🌴', '🌵', '🌊', '☀️', '🌙', '❄️', '🔥', '💧'],
  'Еда': ['☕', '🍕', '🍔', '🧁', '🍰', '🍩', '🥐', '🍜', '🍷', '🧋', '🫖', '🥗', '🍣', '🥨'],
  'Разное': ['🎨', '🎵', '📷', '✈️', '🚗', '🏠', '📱', '💻', '🤖', '🧠', '⚡', '🛡️', '🎪', '🎭'],
};

export default function AgentEmojiPicker({ value, onChange }: AgentEmojiPickerProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleSelect = useCallback((emoji: string) => {
    onChange(emoji);
    setOpen(false);
  }, [onChange]);

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-9 h-9 rounded-[var(--radius-button)] bg-[var(--accent-soft)] flex items-center justify-center text-[20px] hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]"
        aria-label={t('editor.name')}
      >
        {value || '🤖'}
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-card)] shadow-[0_8px_30px_rgba(0,0,0,0.08)] p-3 w-[280px] max-h-[300px] overflow-y-auto">
          {Object.entries(EMOJI_CATEGORIES).map(([category, emojis]) => (
            <div key={category} className="mb-2 last:mb-0">
              <p className="text-[11px] font-medium text-[var(--text-muted)] mb-1">{category}</p>
              <div className="flex flex-wrap gap-1">
                {emojis.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleSelect(emoji)}
                    className="w-8 h-8 rounded-[var(--radius-sm)] flex items-center justify-center text-[18px] hover:bg-[var(--surface-2)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]"
                    aria-label={emoji}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
