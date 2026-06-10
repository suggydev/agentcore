'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Mail, MessageSquare, Smartphone, Save, CheckCircle2, AlertTriangle, Info } from 'lucide-react';

const NOTIFICATIONS = [
  { id: '1', title: 'Агент "Продавец" создан', message: 'Новый агент успешно создан и активирован', type: 'success', time: '2 минуты назад' },
  { id: '2', title: 'Ошибка webhook', message: 'Не удалось доставить webhook на endpoint', type: 'error', time: '15 минут назад' },
  { id: '3', title: 'Пополнение баланса', message: 'Баланс пополнен на $50.00', type: 'info', time: '1 час назад' },
];

const TYPE_CONFIG = {
  success: { icon: CheckCircle2, color: 'text-[var(--success)] bg-[var(--success-soft)]' },
  error: { icon: AlertTriangle, color: 'text-danger bg-danger-soft' },
  info: { icon: Info, color: 'text-[var(--brand)] bg-[var(--accent-soft)]' },
};

export default function NotificationsPage() {
  const [notifications] = useState(NOTIFICATIONS);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto" data-testid="notifications-page">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <p className="text-[11px] font-semibold uppercase tracking-label text-[var(--brand)] mb-2">Центр уведомлений</p>
        <h1 className="font-display font-bold text-3xl text-[var(--text)] tracking-tight">Уведомления</h1>
        <p className="text-[var(--text-muted)] mt-1 text-sm">История уведомлений и настройки.</p>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-surface rounded-2xl border border-[var(--border)] shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-lg bg-[var(--accent-soft)] flex items-center justify-center ring-1 ring-[var(--border)]/60">
              <Bell className="w-[18px] h-[18px] text-[var(--brand)]" />
            </div>
            <div>
              <h3 className="font-semibold text-[var(--text)]">Последние уведомления</h3>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">{notifications.length} новых</p>
            </div>
          </div>

          <div className="space-y-3 notification-list">
            {notifications.map((notification) => {
              const config = TYPE_CONFIG[notification.type as keyof typeof TYPE_CONFIG] || TYPE_CONFIG.info;
              const Icon = config.icon;
              return (
                <div
                  key={notification.id}
                  className="flex items-start gap-3 p-3 rounded-xl border border-[var(--border)] hover:bg-[var(--accent-soft)]/30 transition-colors notification-item"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${config.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text)]">{notification.title}</p>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">{notification.message}</p>
                    <p className="text-[10px] text-[var(--text-muted)] mt-1">{notification.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-surface rounded-2xl border border-[var(--border)] shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-lg bg-[var(--accent-soft)] flex items-center justify-center ring-1 ring-[var(--border)]/60">
              <Bell className="w-[18px] h-[18px] text-[var(--brand)]" />
            </div>
            <div>
              <h3 className="font-semibold text-[var(--text)]">Настройки уведомлений</h3>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">Как и когда получать уведомления</p>
            </div>
          </div>

          <form className="space-y-4 settings-form" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
            <div className="flex items-center justify-between py-3 border-b border-[var(--border)]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[var(--bg)] flex items-center justify-center">
                  <Mail className="w-4 h-4 text-[var(--text-muted)]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--text)]">Email-уведомления</p>
                  <p className="text-xs text-[var(--text-muted)]">Получать уведомления на email</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={emailEnabled} onChange={(e) => setEmailEnabled(e.target.checked)} className="sr-only peer" />
                <div className="w-11 h-6 bg-[var(--border)] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[var(--brand)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--accent)]"></div>
              </label>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-[var(--border)]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[var(--bg)] flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-[var(--text-muted)]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--text)]">Push-уведомления</p>
                  <p className="text-xs text-[var(--text-muted)]">Push в браузере</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={pushEnabled} onChange={(e) => setPushEnabled(e.target.checked)} className="sr-only peer" />
                <div className="w-11 h-6 bg-[var(--border)] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[var(--brand)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--accent)]"></div>
              </label>
            </div>

            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[var(--bg)] flex items-center justify-center">
                  <Smartphone className="w-4 h-4 text-[var(--text-muted)]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--text)]">SMS-уведомления</p>
                  <p className="text-xs text-[var(--text-muted)]">Только для критических ошибок</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={smsEnabled} onChange={(e) => setSmsEnabled(e.target.checked)} className="sr-only peer" />
                <div className="w-11 h-6 bg-[var(--border)] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[var(--brand)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--accent)]"></div>
              </label>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 w-full justify-center focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-1 ${
                  saved
                    ? 'bg-[var(--success-soft)] text-[var(--success)] border border-[var(--success-soft)]'
                    : 'bg-[var(--accent)] text-white hover:bg-[var(--accent)] shadow-sm'
                }`}
                data-testid="save-notifications"
              >
                <Save className="w-4 h-4" />
                {saved ? 'Сохранено' : 'Сохранить настройки'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
