'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUserRole } from '@/utils/auth';
import LogViewer from '@/components/admin/LogViewer';
import AlertBadge from '@/components/admin/AlertBadge';
import { useAdminStore } from '@/store/adminStore';
import { Settings, Server, Database, Activity, Clock } from 'lucide-react';

function HealthCard({ label, value, status, icon: Icon }: { label: string; value: string; status: 'ok' | 'warn' | 'error'; icon: typeof Server }) {
  const color = status === 'ok' ? 'text-success' : status === 'warn' ? 'text-warning' : 'text-danger';
  const bg = status === 'ok' ? 'bg-success-soft' : status === 'warn' ? 'bg-warning-soft' : 'bg-danger-soft';
  return (
    <div className="bg-surface border border-border rounded-card p-5">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">{label}</p>
          <p className={`text-lg font-bold font-mono tracking-tight ${color}`}>{value}</p>
        </div>
        <div className={`p-2 rounded-lg border ${bg} ${color}`}>
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}

export default function AdminSystemPage() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const { systemHealth, systemConfig, isLoading, error, fetchSystemHealth, fetchSystemConfig } = useAdminStore();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    const role = getUserRole();
    const allowed = ['SUPERADMIN', 'ADMIN'];
    if (!role || !allowed.includes(role)) {
      router.push('/agents');
      return;
    }
    setChecked(true);
  }, [router]);

  useEffect(() => {
    if (!checked) return;
    fetchSystemHealth();
    fetchSystemConfig();
    const interval = setInterval(fetchSystemHealth, 30000);
    return () => clearInterval(interval);
  }, [checked, fetchSystemHealth, fetchSystemConfig]);

  if (!checked) return null;

  const metrics = systemHealth?.metrics;
  const uptimeHours = systemHealth ? Math.floor(systemHealth.apiUptime / 3600) : 0;
  const uptimeMins = systemHealth ? Math.floor((systemHealth.apiUptime % 3600) / 60) : 0;

  const logEntries = (systemHealth?.lastErrors || []).map((e) => ({
    id: e.id,
    timestamp: e.createdAt,
    level: 'error' as const,
    message: e.message,
    path: undefined,
  }));

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Settings size={20} className="text-brand" />
        <h1 className="text-xl font-semibold text-text tracking-heading">Система</h1>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-card bg-danger-soft border border-danger/10 text-sm text-danger">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <HealthCard label="База данных" value={systemHealth?.dbStatus === 'ok' ? 'Здорова' : 'Ошибка'} status={systemHealth?.dbStatus === 'ok' ? 'ok' : 'error'} icon={Database} />
        <HealthCard label="Аптайм API" value={`${uptimeHours}ч ${uptimeMins}м`} status="ok" icon={Clock} />
        <HealthCard label="CPU" value={metrics ? `${metrics.cpuUsage}%` : '—'} status={metrics && metrics.cpuUsage > 80 ? 'warn' : 'ok'} icon={Activity} />
        <HealthCard label="RAM" value={metrics ? `${metrics.ramUsage}%` : '—'} status={metrics && metrics.ramUsage > 80 ? 'warn' : 'ok'} icon={Server} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-surface border border-border rounded-card p-5">
          <h3 className="text-sm font-semibold text-text mb-3">Метрики системы</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-muted">Использование диска</span>
              <span className="font-mono text-text">{metrics ? `${metrics.diskUsage}%` : '—'}</span>
            </div>
            <div className="w-full bg-surface-2 rounded-full h-2">
              <div className="bg-brand h-2 rounded-full transition-all" style={{ width: `${Math.min(metrics?.diskUsage ?? 0, 100)}%` }} />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-muted">Подключения к БД</span>
              <span className="font-mono text-text">{metrics?.dbConnections ?? '—'}</span>
            </div>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-card p-5">
          <h3 className="text-sm font-semibold text-text mb-3">Конфигурация</h3>
          {systemConfig ? (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-text-muted">Порт</span><span className="font-mono text-text">{systemConfig.PORT}</span></div>
              <div className="flex justify-between"><span className="text-text-muted">Окружение</span><span className="font-mono text-text">{systemConfig.NODE_ENV}</span></div>
              <div className="flex justify-between"><span className="text-text-muted">Дни триала</span><span className="font-mono text-text">{systemConfig.TRIAL_DAYS}</span></div>
              <div className="flex justify-between"><span className="text-text-muted">Кредит триала</span><span className="font-mono text-text">₽{systemConfig.TRIAL_CREDIT_AMOUNT}</span></div>
              <div className="flex justify-between"><span className="text-text-muted">Кредит Pro</span><span className="font-mono text-text">₽{systemConfig.PRO_CREDIT_AMOUNT}</span></div>
              <div className="flex justify-between"><span className="text-text-muted">Кредит Business</span><span className="font-mono text-text">₽{systemConfig.BUSINESS_CREDIT_AMOUNT}</span></div>
            </div>
          ) : (
            <div className="text-sm text-text-muted">Загрузка конфигурации...</div>
          )}
        </div>
      </div>

      <div className="bg-surface border border-border rounded-card p-5">
        <h3 className="text-sm font-semibold text-text mb-3">Последние ошибки</h3>
        <LogViewer logs={logEntries} loading={isLoading} />
      </div>
    </div>
  );
}
