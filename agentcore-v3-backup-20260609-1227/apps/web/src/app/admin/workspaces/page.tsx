'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUserRole } from '@/utils/auth';
import DataTable from '@/components/admin/DataTable';
import { useAdminStore } from '@/store/adminStore';
import { Search, Building2, Trash2 } from 'lucide-react';

export default function AdminWorkspacesPage() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const { workspaces, isLoading, error, fetchWorkspaces, deleteWorkspace } = useAdminStore();

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
    fetchWorkspaces({ search: search || undefined, plan: planFilter || undefined });
  }, [checked, search, planFilter, fetchWorkspaces]);

  if (!checked) return null;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Building2 size={20} className="text-brand" />
        <h1 className="text-xl font-semibold text-text tracking-heading">Рабочие пространства</h1>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-card bg-danger-soft border border-danger/10 text-sm text-danger">
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по названию..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-surface border border-border rounded-button text-text placeholder:text-text-muted outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1"
          />
        </div>
        <select
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value)}
          className="px-3 py-2 text-sm bg-surface border border-border rounded-button text-text outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1"
        >
          <option value="">Все тарифы</option>
          <option value="BASE">Базовый</option>
          <option value="PRO">Про</option>
          <option value="BUSINESS">Бизнес</option>
        </select>
      </div>

      <DataTable
        columns={[
          { key: 'name', header: 'Название', sortable: true },
          { key: 'plan', header: 'Тариф', sortable: true, render: (row) => {
            const plan = String(row.plan || '');
            return (
              <span className={`inline-block px-2 py-0.5 rounded-pill text-[10px] font-semibold ${
                plan === 'BUSINESS' ? 'bg-brand-light text-brand' :
                plan === 'PRO' ? 'bg-success-soft text-success' :
                'bg-surface-2 text-text-muted'
              }`}>
                {plan || 'Базовый'}
              </span>
            );
          }},
          { key: 'users', header: 'Пользователи', render: (row) => <span className="text-xs">{(row.users as { length?: number } | undefined)?.length ?? 0}</span> },
          { key: 'agents', header: 'Агенты', render: (row) => <span className="text-xs">{(row._count as { agents?: number } | undefined)?.agents ?? 0}</span> },
          { key: 'conversations', header: 'Диалоги', render: (row) => <span className="text-xs">{(row._count as { conversations?: number } | undefined)?.conversations ?? 0}</span> },
          { key: 'contacts', header: 'Контакты', render: (row) => <span className="text-xs">{(row._count as { crmContacts?: number } | undefined)?.crmContacts ?? 0}</span> },
          {
            key: 'createdAt',
            header: 'Создано',
            sortable: true,
            render: (row) => (
              <span className="text-xs text-text-muted">
                {new Date(row.createdAt as string).toLocaleDateString('ru-RU')}
              </span>
            ),
          },
          {
            key: 'actions',
            header: '',
            render: (row) => (
              <button
                type="button"
                onClick={async () => {
                  if (confirm('Удалить рабочее пространство? Это действие необратимо.')) {
                    await deleteWorkspace(row.id as string);
                    fetchWorkspaces({ search: search || undefined, plan: planFilter || undefined });
                  }
                }}
                className="p-1.5 rounded-md hover:bg-surface-2 text-text-muted hover:text-danger transition-colors"
                title="Удалить"
              >
                <Trash2 size={14} />
              </button>
            ),
          },
        ]}
        data={workspaces}
        loading={isLoading}
        pageSize={10}
        emptyMessage="Рабочие пространства не найдены"
      />
    </div>
  );
}
