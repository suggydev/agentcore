'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Key, Plus, Copy, Trash2, Calendar } from 'lucide-react';

const API_KEYS = [
  { id: '1', name: 'Production API Key', key: 'ac_prod_••••••••••••••••••••••••', createdAt: '2024-01-15', lastUsed: '2024-03-20' },
  { id: '2', name: 'Staging API Key', key: 'ac_stag_••••••••••••••••••••••••', createdAt: '2024-02-01', lastUsed: '2024-03-19' },
];

export default function ApiKeysPage() {
  const [keys] = useState(API_KEYS);

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto" data-testid="api-keys-page">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <p className="text-[11px] font-semibold uppercase tracking-label text-[var(--brand)] mb-2">API</p>
        <h1 className="font-display font-bold text-3xl text-[var(--text)] tracking-tight">API-ключи</h1>
        <p className="text-[var(--text-muted)] mt-1 text-sm">Управление ключами доступа к API.</p>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-surface rounded-2xl border border-[var(--border)] shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[var(--accent-soft)] flex items-center justify-center ring-1 ring-[var(--border)]/60">
              <Key className="w-[18px] h-[18px] text-[var(--brand)]" />
            </div>
            <div>
              <h3 className="font-semibold text-[var(--text)]">Ключи доступа</h3>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">{keys.length} активных ключа</p>
            </div>
          </div>
          <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--accent)] text-white text-sm font-semibold hover:bg-[var(--accent)] transition-all duration-200 shadow-sm focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-1" data-testid="create-key-button">
            <Plus className="w-4 h-4" />
            Создать
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-testid="keys-table">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="text-left py-3 px-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Название</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Ключ</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Создан</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Последнее использование</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Действия</th>
              </tr>
            </thead>
            <tbody className="key-list">
              {keys.map((apiKey) => (
                <tr key={apiKey.id} className="border-b border-[var(--border)]/60 hover:bg-[var(--accent-soft)]/30 transition-colors">
                  <td className="py-3 px-4">
                    <p className="font-medium text-[var(--text)]">{apiKey.name}</p>
                  </td>
                  <td className="py-3 px-4">
                    <code className="text-xs font-mono text-[var(--text-muted)] bg-[var(--bg)] px-2 py-1 rounded-lg border border-[var(--border)]">{apiKey.key}</code>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
                      <Calendar className="w-3.5 h-3.5" />
                      <span className="text-xs">{apiKey.createdAt}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
                      <Calendar className="w-3.5 h-3.5" />
                      <span className="text-xs">{apiKey.lastUsed}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-1.5 rounded-lg hover:bg-[var(--accent-soft)] text-[var(--text-muted)] hover:text-[var(--brand)] transition-colors">
                        <Copy className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 rounded-lg hover:bg-danger-soft text-[var(--text-muted)] hover:text-danger transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
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
