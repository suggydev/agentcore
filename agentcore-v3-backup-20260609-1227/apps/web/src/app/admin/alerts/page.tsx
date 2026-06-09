'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUserRole } from '@/utils/auth';
import DataTable from '@/components/admin/DataTable';
import AlertBadge from '@/components/admin/AlertBadge';
import { useAdminStore } from '@/store/adminStore';
import { Bell, CheckCircle, Trash2, Loader2 } from 'lucide-react';

export default function AdminAlertsPage() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [typeFilter, setTypeFilter] = useState('');
  const [resolvedFilter, setResolvedFilter] = useState('false');
  const { alerts, isLoading, error, fetchAlerts, resolveAlert, deleteAlert } = useAdminStore();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    const role = getUserRole();
    const allowed = ['SUPERADMIN', 'ADMIN', 'SUPPORT'];
    if (!role || !allowed.includes(role)) {
      router.push('/agents');
      return;
    }
    setChecked(true);
  }, [router]);

  useEffect(() => {
    if (!checked) return;
    fetchAlerts({
      type: typeFilter || undefined,
      resolved: resolvedFilter === 'all' ? undefined : resolvedFilter === 'true',
    });
  }, [checked, typeFilter, resolvedFilter, fetchAlerts]);

  if (!checked) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-brand animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Bell size={20} className="text-brand" />
        <h1 className="text-xl font-semibold text-text tracking-heading">Алерты</h1>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-card bg-danger-soft border border-danger/10 text-sm text-danger">
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted">Тип:</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 text-sm bg-surface border border-border rounded-button text-text outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1"
          >
            <option value="">Все типы</option>
            <option value="error">Ошибка</option>
            <option value="warning">Предупреждение</option>
            <option value="info">Информация</option>
            <option value="success">Успех</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted">Статус:</span>
          <select
            value={resolvedFilter}
            onChange={(e) => setResolvedFilter(e.target.value)}
            className="px-3 py-1.5 text-sm bg-surface border border-border rounded-button text-text outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1"
          >
            <option value="false">Не решённые</option>
            <option value="true">Решённые</option>
            <option value="all">Все</option>
          </select>
        </div>
      </div>

      <DataTable
        columns={[
          {
            key: 'type',
            header: 'Тип',
            render: (row) => <AlertBadge type={String(row.type) as 'error' | 'warning' | 'info' | 'success'} />,
          },
          { key: 'title', header: 'Заголовок', sortable: true },
          { key: 'message', header: 'Сообщение', render: (row) => <span className="text-xs text-text-muted max-w-xs truncate">{String(row.message ?? '')}</span> },
          {
            key: 'resolved',
            header: 'Статус',
            render: (row) => (
              Boolean(row.resolved) ? (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
                  <CheckCircle size={12} />
                  Решён
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-warning">
                  <Bell size={12} />
                  Открыт
                </span>
              )
            ),
          },
          {
            key: 'createdAt',
            header: 'Создан',
            sortable: true,
            render: (row) => (
              <span className="text-xs text-text-muted">
                {new Date(row.createdAt as string).toLocaleString('ru-RU')}
              </span>
            ),
          },
          {
            key: 'actions',
            header: '',
            render: (row) => (
              <div className="flex items-center gap-2">
                {!Boolean(row.resolved) && (
                  <button
                    type="button"
                    onClick={async () => {
                      await resolveAlert(row.id as string);
                    }}
                    className="px-3 py-1.5 text-xs font-medium bg-brand text-white rounded-button hover:bg-brand-hover transition-colors"
                  >
                    Решить
                  </button>
                )}
                <button
                  type="button"
                  onClick={async () => {
                    if (confirm('Удалить алерт?')) {
                      await deleteAlert(row.id as string);
                      fetchAlerts({
                        type: typeFilter || undefined,
                        resolved: resolvedFilter === 'all' ? undefined : resolvedFilter === 'true',
                      });
                    }
                  }}
                  className="p-1.5 rounded-md hover:bg-surface-2 text-text-muted hover:text-danger transition-colors"
                  title="Удалить"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ),
          },
        ]}
        data={alerts}
        loading={isLoading}
        pageSize={15}
        emptyMessage="Алерты не найдены"
      />
    </div>
  );
}
