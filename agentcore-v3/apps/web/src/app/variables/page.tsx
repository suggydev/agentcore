'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Variable, Plus, Hash, Type, ToggleLeft, Calendar } from 'lucide-react';

const VARIABLES = [
  { id: '1', name: 'COMPANY_NAME', type: 'string', value: 'AgentCore', description: 'Название компании' },
  { id: '2', name: 'MAX_TOKENS', type: 'number', value: '2048', description: 'Максимальное количество токенов' },
  { id: '3', name: 'DEBUG_MODE', type: 'boolean', value: 'false', description: 'Режим отладки' },
  { id: '4', name: 'DEFAULT_LANGUAGE', type: 'string', value: 'ru', description: 'Язык по умолчанию' },
];

const TYPE_ICONS = {
  string: Type,
  number: Hash,
  boolean: ToggleLeft,
};

export default function VariablesPage() {
  const [variables] = useState(VARIABLES);

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto" data-testid="variables-page">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <p className="text-[11px] font-semibold uppercase tracking-label text-[var(--brand)] mb-2">Конфигурация</p>
        <h1 className="font-display font-bold text-3xl text-[var(--text)] tracking-tight">Переменные</h1>
        <p className="text-[var(--text-muted)] mt-1 text-sm">Управление переменными окружения.</p>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-surface rounded-2xl border border-[var(--border)] shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[var(--accent-soft)] flex items-center justify-center ring-1 ring-[var(--border)]/60">
              <Variable className="w-[18px] h-[18px] text-[var(--brand)]" />
            </div>
            <div>
              <h3 className="font-semibold text-[var(--text)]">Переменные окружения</h3>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">{variables.length} переменных</p>
            </div>
          </div>
          <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--accent)] text-white text-sm font-semibold hover:bg-[var(--accent)] transition-all duration-200 shadow-sm focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-1" data-testid="create-variable-button">
            <Plus className="w-4 h-4" />
            Создать
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-testid="variables-table">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="text-left py-3 px-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Название</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Тип</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Значение</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Описание</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Действия</th>
              </tr>
            </thead>
            <tbody className="variable-list">
              {variables.map((variable) => {
                const Icon = TYPE_ICONS[variable.type as keyof typeof TYPE_ICONS] || Type;
                return (
                  <tr key={variable.id} className="border-b border-[var(--border)]/60 hover:bg-[var(--accent-soft)]/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Variable className="w-4 h-4 text-[var(--brand)]" />
                        <code className="font-mono text-sm font-medium text-[var(--text)]">{variable.name}</code>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <Icon className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-[var(--bg)] text-[var(--text-muted)] font-medium border border-[var(--border)]">{variable.type}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <code className="text-xs font-mono text-[var(--text)] bg-[var(--accent-soft)] px-2 py-1 rounded-lg border border-[var(--border)]">{variable.value}</code>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-[var(--text-muted)]">{variable.description}</span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button className="text-xs text-[var(--text-muted)] hover:text-[var(--brand)] transition-colors">
                        Редактировать
                      </button>
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
