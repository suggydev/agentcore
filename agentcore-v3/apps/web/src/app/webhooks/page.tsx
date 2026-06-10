'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Webhook, Plus, Link2, CheckCircle2, XCircle, Calendar } from 'lucide-react';

const WEBHOOKS = [
  { id: '1', name: 'Order Created', url: 'https://api.example.com/webhooks/orders', status: 'active', events: ['order.created'], createdAt: '2024-01-15' },
  { id: '2', name: 'User Registered', url: 'https://api.example.com/webhooks/users', status: 'inactive', events: ['user.registered'], createdAt: '2024-02-01' },
];

export default function WebhooksPage() {
  const [webhooks] = useState(WEBHOOKS);

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto" data-testid="webhooks-page">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <p className="text-[11px] font-semibold uppercase tracking-label text-[var(--brand)] mb-2">Интеграции</p>
        <h1 className="font-display font-bold text-3xl text-[var(--text)] tracking-tight">Вебхуки</h1>
        <p className="text-[var(--text-muted)] mt-1 text-sm">Управление webhook-эндпоинтами.</p>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-surface rounded-2xl border border-[var(--border)] shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[var(--accent-soft)] flex items-center justify-center ring-1 ring-[var(--border)]/60">
              <Webhook className="w-[18px] h-[18px] text-[var(--brand)]" />
            </div>
            <div>
              <h3 className="font-semibold text-[var(--text)]">Webhook-эндпоинты</h3>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">{webhooks.length} настроенных вебхуков</p>
            </div>
          </div>
          <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--accent)] text-white text-sm font-semibold hover:bg-[var(--accent)] transition-all duration-200 shadow-sm focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-1" data-testid="create-webhook-button">
            <Plus className="w-4 h-4" />
            Создать
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-testid="webhooks-table">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="text-left py-3 px-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Название</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">URL</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">События</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Статус</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Действия</th>
              </tr>
            </thead>
            <tbody className="webhook-list">
              {webhooks.map((webhook) => (
                <tr key={webhook.id} className="border-b border-[var(--border)]/60 hover:bg-[var(--accent-soft)]/30 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <Link2 className="w-4 h-4 text-[var(--brand)]" />
                      <p className="font-medium text-[var(--text)]">{webhook.name}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <code className="text-xs font-mono text-[var(--text-muted)] bg-[var(--bg)] px-2 py-1 rounded-lg border border-[var(--border)]">{webhook.url}</code>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1">
                      {webhook.events.map((event) => (
                        <span key={event} className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--accent-soft)] text-[var(--brand)] font-medium border border-[var(--border)]">
                          {event}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {webhook.status === 'active' ? (
                      <span className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full bg-[var(--success-soft)] text-[var(--success)] font-medium">
                        <CheckCircle2 className="w-3 h-3" />
                        Активен
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full bg-[var(--surface-2)] text-[var(--text-muted)] font-medium">
                        <XCircle className="w-3 h-3" />
                        Неактивен
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
