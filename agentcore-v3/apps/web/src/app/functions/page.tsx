'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FunctionSquare, Plus, Code, Clock, CheckCircle2, XCircle } from 'lucide-react';

const FUNCTIONS = [
  { id: '1', name: 'sendEmail', description: 'Отправка email через SMTP', runtime: 'nodejs', timeout: '30s', status: 'active' },
  { id: '2', name: 'processPayment', description: 'Обработка платежа через YooKassa', runtime: 'nodejs', timeout: '60s', status: 'active' },
  { id: '3', name: 'generateReport', description: 'Генерация PDF-отчёта', runtime: 'nodejs', timeout: '120s', status: 'inactive' },
  { id: '4', name: 'sendWebhook', description: 'Отправка webhook-уведомления', runtime: 'nodejs', timeout: '30s', status: 'active' },
];

export default function FunctionsPage() {
  const [functions] = useState(FUNCTIONS);

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto" data-testid="functions-page">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <p className="text-[11px] font-semibold uppercase tracking-label text-[var(--brand)] mb-2">Автоматизация</p>
        <h1 className="font-display font-bold text-3xl text-[var(--text)] tracking-tight">Функции</h1>
        <p className="text-[var(--text-muted)] mt-1 text-sm">Серверные функции для автоматизации.</p>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-surface rounded-2xl border border-[var(--border)] shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[var(--accent-soft)] flex items-center justify-center ring-1 ring-[var(--border)]/60">
              <FunctionSquare className="w-[18px] h-[18px] text-[var(--brand)]" />
            </div>
            <div>
              <h3 className="font-semibold text-[var(--text)]">Список функций</h3>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">{functions.length} функций</p>
            </div>
          </div>
          <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--accent)] text-white text-sm font-semibold hover:bg-[var(--accent)] transition-all duration-200 shadow-sm focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-1" data-testid="create-function-button">
            <Plus className="w-4 h-4" />
            Создать
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-testid="functions-table">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="text-left py-3 px-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Функция</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Описание</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Runtime</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Таймаут</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Статус</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Действия</th>
              </tr>
            </thead>
            <tbody className="function-list">
              {functions.map((func) => (
                <tr key={func.id} className="border-b border-[var(--border)]/60 hover:bg-[var(--accent-soft)]/30 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <Code className="w-4 h-4 text-[var(--brand)]" />
                      <code className="font-mono text-sm font-medium text-[var(--text)]">{func.name}</code>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-[var(--text-muted)]">{func.description}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-[var(--bg)] text-[var(--text-muted)] font-medium border border-[var(--border)]">{func.runtime}</span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="text-xs">{func.timeout}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {func.status === 'active' ? (
                      <span className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full bg-[var(--success-soft)] text-[var(--success)] font-medium">
                        <CheckCircle2 className="w-3 h-3" />
                        Активна
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full bg-[var(--surface-2)] text-[var(--text-muted)] font-medium">
                        <XCircle className="w-3 h-3" />
                        Неактивна
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button className="text-xs text-[var(--text-muted)] hover:text-[var(--brand)] transition-colors">
                      Редактировать
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
