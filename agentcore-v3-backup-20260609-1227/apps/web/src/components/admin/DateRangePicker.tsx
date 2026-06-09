'use client';

import { useState } from 'react';
import { Calendar } from 'lucide-react';

export interface DateRange {
  start: string;
  end: string;
  label: string;
  days: number;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

const presets: { label: string; days: number }[] = [
  { label: 'Последние 7 дней', days: 7 },
  { label: 'Последние 30 дней', days: 30 },
  { label: 'Последние 90 дней', days: 90 },
];

export default function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [customStart, setCustomStart] = useState(value.start);
  const [customEnd, setCustomEnd] = useState(value.end);
  const [showCustom, setShowCustom] = useState(false);

  const applyPreset = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    const range: DateRange = {
      start: start.toISOString().slice(0, 10),
      end: end.toISOString().slice(0, 10),
      label: `Последние ${days} дней`,
      days,
    };
    onChange(range);
    setShowCustom(false);
  };

  const applyCustom = () => {
    if (!customStart || !customEnd) return;
    const start = new Date(customStart);
    const end = new Date(customEnd);
    const diff = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    onChange({ start: customStart, end: customEnd, label: 'Произвольный', days: diff });
    setShowCustom(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setShowCustom((v) => !v)}
        className="flex items-center gap-2 px-3 py-2 text-sm bg-surface border border-border rounded-button hover:bg-surface-2 transition-colors focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1"
      >
        <Calendar size={14} className="text-text-muted" />
        <span className="text-text-secondary">{value.label}</span>
      </button>

      {showCustom && (
        <div className="absolute right-0 mt-2 w-64 bg-surface border border-border rounded-card shadow-lg z-50 p-3">
          <div className="space-y-1 mb-3">
            {presets.map((p) => (
              <button
                key={p.days}
                type="button"
                onClick={() => applyPreset(p.days)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  value.days === p.days && value.label === p.label
                    ? 'bg-brand-light text-brand font-medium'
                    : 'text-text-secondary hover:bg-surface-2'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="h-px bg-border mb-3" />
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="flex-1 px-2 py-1.5 text-sm bg-surface-2 border border-border rounded-button text-text outline-none focus-visible:ring-1 focus-visible:ring-brand"
              />
              <span className="text-text-muted text-xs">по</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="flex-1 px-2 py-1.5 text-sm bg-surface-2 border border-border rounded-button text-text outline-none focus-visible:ring-1 focus-visible:ring-brand"
              />
            </div>
            <button
              type="button"
              onClick={applyCustom}
              className="w-full px-3 py-2 text-sm font-medium bg-brand text-white rounded-button hover:bg-brand-hover transition-colors"
            >
              Применить
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
