'use client';

import { useState } from 'react';
import { Filter, X } from 'lucide-react';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  path?: string;
  message: string;
  status?: number;
}

interface LogViewerProps {
  logs: LogEntry[];
  loading?: boolean;
}

const levelColors: Record<string, string> = {
  info: 'text-brand',
  warn: 'text-warning',
  error: 'text-danger',
  debug: 'text-text-muted',
};

const levelBg: Record<string, string> = {
  info: 'bg-brand-light',
  warn: 'bg-warning-soft',
  error: 'bg-danger-soft',
  debug: 'bg-surface-2',
};

export default function LogViewer({ logs, loading }: LogViewerProps) {
  const [filterLevel, setFilterLevel] = useState<string | null>(null);
  const [filterPath, setFilterPath] = useState('');

  const filtered = logs.filter((log) => {
    if (filterLevel && log.level !== filterLevel) return false;
    if (filterPath && !log.path?.toLowerCase().includes(filterPath.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="bg-surface border border-border rounded-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5">
          <Filter size={14} className="text-text-muted" />
          <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Фильтры</span>
        </div>
        <div className="flex items-center gap-1">
          {(['info', 'warn', 'error', 'debug'] as const).map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => setFilterLevel((prev) => (prev === lvl ? null : lvl))}
              className={`px-2 py-1 rounded-md text-[11px] font-medium capitalize transition-colors ${
                filterLevel === lvl
                  ? `${levelBg[lvl]} ${levelColors[lvl]}`
                  : 'bg-surface-2 text-text-muted hover:text-text'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={filterPath}
          onChange={(e) => setFilterPath(e.target.value)}
          placeholder="Фильтр по пути..."
          className="ml-auto min-w-[140px] px-2.5 py-1.5 text-xs bg-surface-2 border border-border rounded-button text-text placeholder:text-text-muted outline-none focus-visible:ring-1 focus-visible:ring-brand"
        />
        {(filterLevel || filterPath) && (
          <button
            type="button"
            onClick={() => { setFilterLevel(null); setFilterPath(''); }}
            className="p-1 rounded-md hover:bg-surface-2 text-text-muted"
            aria-label="Clear filters"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-surface z-10">
            <tr className="border-b border-border">
              <th className="px-4 py-2 text-left text-text-muted font-semibold w-[140px]">Time</th>
              <th className="px-4 py-2 text-left text-text-muted font-semibold w-[60px]">Level</th>
              <th className="px-4 py-2 text-left text-text-muted font-semibold w-[120px]">Path</th>
              <th className="px-4 py-2 text-left text-text-muted font-semibold">Message</th>
              {logs.some((l) => l.status !== undefined) && (
                <th className="px-4 py-2 text-left text-text-muted font-semibold w-[60px]">Status</th>
              )}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-b border-border last:border-b-0">
                  <td colSpan={5} className="px-4 py-2">
                    <div className="h-3 bg-surface-3 rounded animate-pulse w-full" />
                  </td>
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-text-muted">Нет логов по выбранным фильтрам</td>
              </tr>
            ) : (
              filtered.map((log) => (
                <tr key={log.id} className="border-b border-border last:border-b-0 hover:bg-surface-2/50 transition-colors">
                  <td className="px-4 py-2 text-text-muted tabular-nums whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString('ru-RU')}
                  </td>
                  <td className="px-4 py-2">
                    <span className={`inline-block px-1.5 py-0.5 rounded-md font-semibold capitalize ${levelBg[log.level]} ${levelColors[log.level]}`}>
                      {log.level}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-text-muted whitespace-nowrap">{log.path || '—'}</td>
                  <td className="px-4 py-2 text-text-secondary max-w-md truncate">{log.message}</td>
                  {logs.some((l) => l.status !== undefined) && (
                    <td className="px-4 py-2 text-text-muted whitespace-nowrap">
                      {log.status ?? '—'}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
