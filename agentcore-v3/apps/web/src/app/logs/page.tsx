'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Search, Filter, Calendar, AlertCircle, CheckCircle2, Info } from 'lucide-react';

const LOGS = [
  { id: '1', level: 'error', message: 'Failed to connect to database', source: 'api', timestamp: '2024-03-20 14:32:15', details: 'Connection timeout after 5000ms' },
  { id: '2', level: 'info', message: 'Agent created successfully', source: 'agents', timestamp: '2024-03-20 14:28:03', details: 'Agent ID: agent_123' },
  { id: '3', level: 'warning', message: 'High memory usage detected', source: 'system', timestamp: '2024-03-20 14:15:42', details: 'Memory usage: 87%' },
  { id: '4', level: 'info', message: 'API key generated', source: 'api', timestamp: '2024-03-20 14:10:11', details: 'Key ID: key_456' },
  { id: '5', level: 'error', message: 'Webhook delivery failed', source: 'webhooks', timestamp: '2024-03-20 13:55:28', details: 'HTTP 404: Not Found' },
];

const LEVEL_ICONS = {
  error: AlertCircle,
  warning: AlertCircle,
  info: Info,
  success: CheckCircle2,
};

const LEVEL_COLORS = {
  error: 'text-danger bg-danger-soft',
  warning: 'text-warning bg-warning-soft',
  info: 'text-[var(--brand)] bg-[var(--accent-soft)]',
  success: 'text-[var(--success)] bg-[var(--success-soft)]',
};

export default function LogsPage() {
  const [logs] = useState(LOGS);
  const [filter, setFilter] = useState('');

  const filteredLogs = logs.filter((log) =>
    log.message.toLowerCase().includes(filter.toLowerCase()) ||
    log.source.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto" data-testid="logs-page">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <p className="text-[11px] font-semibold uppercase tracking-label text-[var(--brand)] mb-2">Мониторинг</p>
        <h1 className="font-display font-bold text-3xl text-[var(--text)] tracking-tight">Логи</h1>
        <p className="text-[var(--text-muted)] mt-1 text-sm">Журнал системных событий.</p>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-surface rounded-2xl border border-[var(--border)] shadow-sm p-6">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[var(--accent-soft)] flex items-center justify-center ring-1 ring-[var(--border)]/60">
              <FileText className="w-[18px] h-[18px] text-[var(--brand)]" />
            </div>
            <div>
              <h3 className="font-semibold text-[var(--text)]">Журнал событий</h3>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">{filteredLogs.length} записей</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <input
                type="text"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Поиск по логам..."
                className="pl-9 pr-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus-visible:ring-[var(--brand)] focus-visible:border-[var(--brand)] transition-all w-64"
                data-testid="logs-filter"
              />
            </div>
            <button className="inline-flex items-center gap-2 px-3 py-2.5 rounded-xl border border-[var(--border)] text-sm text-[var(--text-muted)] hover:bg-[var(--accent-soft)]/50 hover:text-[var(--text)] transition-all" data-testid="logs-filter-button">
              <Filter className="w-4 h-4" />
              Фильтр
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-testid="logs-table">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="text-left py-3 px-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Уровень</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Сообщение</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Источник</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Время</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Детали</th>
              </tr>
            </thead>
            <tbody className="log-list">
              {filteredLogs.map((log) => {
                const Icon = LEVEL_ICONS[log.level as keyof typeof LEVEL_ICONS] || Info;
                return (
                  <tr key={log.id} className="border-b border-[var(--border)]/60 hover:bg-[var(--accent-soft)]/30 transition-colors">
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full font-medium ${LEVEL_COLORS[log.level as keyof typeof LEVEL_COLORS] || LEVEL_COLORS.info}`}>
                        <Icon className="w-3 h-3" />
                        {log.level === 'error' ? 'Ошибка' : log.level === 'warning' ? 'Предупреждение' : log.level === 'success' ? 'Успех' : 'Инфо'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-[var(--text)]">{log.message}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[11px] px-2 py-0.5 rounded-md bg-[var(--bg)] text-[var(--text-muted)] font-medium border border-[var(--border)]">
                        {log.source}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
                        <Calendar className="w-3.5 h-3.5" />
                        <span className="text-xs">{log.timestamp}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-xs text-[var(--text-muted)]">{log.details}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
