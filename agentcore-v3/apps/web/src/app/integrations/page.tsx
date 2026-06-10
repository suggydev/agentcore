'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plug, Zap, MessageSquare, BarChart3, ShoppingCart, Globe, CheckCircle2, Plus } from 'lucide-react';

const INTEGRATIONS = [
  { id: '1', name: 'Telegram', description: 'Подключите бота к Telegram для общения с клиентами', icon: MessageSquare, status: 'connected', category: 'Мессенджеры' },
  { id: '2', name: 'WhatsApp', description: 'Интеграция с WhatsApp Business API', icon: MessageSquare, status: 'disconnected', category: 'Мессенджеры' },
  { id: '3', name: 'Google Analytics', description: 'Отслеживайте конверсии и поведение пользователей', icon: BarChart3, status: 'connected', category: 'Аналитика' },
  { id: '4', name: 'YooKassa', description: 'Приём платежей через YooKassa', icon: ShoppingCart, status: 'connected', category: 'Платежи' },
  { id: '5', name: 'AmoCRM', description: 'Синхронизация сделок и контактов', icon: Zap, status: 'disconnected', category: 'CRM' },
  { id: '6', name: 'Website', description: 'Встройте виджет на любой сайт', icon: Globe, status: 'connected', category: 'Каналы' },
];

export default function IntegrationsPage() {
  const [integrations] = useState(INTEGRATIONS);

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto" data-testid="integrations-page">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <p className="text-[11px] font-semibold uppercase tracking-label text-[var(--brand)] mb-2">Интеграции</p>
        <h1 className="font-display font-bold text-3xl text-[var(--text)] tracking-tight">Интеграции</h1>
        <p className="text-[var(--text-muted)] mt-1 text-sm">Подключение сторонних сервисов и каналов.</p>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {integrations.map((integration) => {
          const Icon = integration.icon;
          return (
            <motion.div
              key={integration.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-surface rounded-2xl border border-[var(--border)] shadow-sm p-5 group hover:shadow-md hover:border-[var(--border)] transition-all integration-card"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--brand)] to-[var(--brand)]/60 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                {integration.status === 'connected' ? (
                  <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-[var(--success-soft)] text-[var(--success)] font-medium border border-[var(--success-soft)]">
                    <CheckCircle2 className="w-3 h-3" />
                    Подключено
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--surface-2)] text-[var(--text-muted)] font-medium border border-[var(--border)]">
                    Не подключено
                  </span>
                )}
              </div>
              <h3 className="font-bold text-[var(--text)] mb-1">{integration.name}</h3>
              <p className="text-[var(--text-muted)] text-sm mb-2">{integration.description}</p>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--accent-soft)] text-[var(--brand)] font-medium border border-[var(--border)]">
                {integration.category}
              </span>
              <div className="mt-4 pt-4 border-t border-[var(--border)]">
                <button
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 w-full justify-center focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-1 ${
                    integration.status === 'connected'
                      ? 'border border-[var(--border)] text-[var(--text)] hover:bg-[var(--accent-soft)]/50'
                      : 'bg-[var(--accent)] text-white hover:bg-[var(--accent)] shadow-sm'
                  }`}
                  data-testid={`connect-integration-${integration.id}`}
                >
                  <Plug className="w-4 h-4" />
                  {integration.status === 'connected' ? 'Управлять' : 'Подключить'}
                </button>
              </div>
            </motion.div>
          );
        })}

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface rounded-2xl border border-[var(--border)] border-dashed shadow-sm p-5 flex flex-col items-center justify-center text-center cursor-pointer hover:border-[var(--brand)]/40 hover:bg-[var(--accent-soft)]/30 transition-all min-h-[200px]"
        >
          <div className="w-10 h-10 rounded-xl bg-[var(--accent-soft)] flex items-center justify-center mb-3">
            <Plus className="w-5 h-5 text-[var(--brand)]" />
          </div>
          <p className="text-sm font-medium text-[var(--text)]">Добавить интеграцию</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">Запросить новую интеграцию</p>
        </motion.div>
      </motion.div>
    </div>
  );
}
