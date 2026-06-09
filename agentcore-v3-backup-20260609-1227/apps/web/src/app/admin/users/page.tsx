'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUserRole } from '@/utils/auth';
import DataTable from '@/components/admin/DataTable';
import AlertBadge from '@/components/admin/AlertBadge';
import { useAdminStore } from '@/store/adminStore';
import { Search, Users, Trash2, Pencil, Loader2 } from 'lucide-react';

export default function AdminUsersPage() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [newRole, setNewRole] = useState('');
  const { users, isLoading, error, fetchUsers, deleteUser, updateUserRole } = useAdminStore();

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
    fetchUsers({ search: search || undefined, role: roleFilter || undefined });
  }, [checked, search, roleFilter, fetchUsers]);

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
        <Users size={20} className="text-brand" />
        <h1 className="text-xl font-semibold text-text tracking-heading">Пользователи</h1>
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
            placeholder="Поиск по имени или email..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-surface border border-border rounded-button text-text placeholder:text-text-muted outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-2 text-sm bg-surface border border-border rounded-button text-text outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1"
        >
          <option value="">Все роли</option>
          <option value="OWNER">Владелец</option>
          <option value="ADMIN">Админ</option>
          <option value="SUPPORT">Поддержка</option>
          <option value="ANALYST">Аналитик</option>
        </select>
      </div>

      <DataTable
        columns={[
          { key: 'name', header: 'Имя', sortable: true },
          { key: 'email', header: 'Email', sortable: true },
          { key: 'role', header: 'Роль', sortable: true, render: (row) => <span className="text-xs font-medium">{row.role}</span> },
          {
            key: 'workspace',
            header: 'Рабочее пространство',
            render: (row) => <span className="text-xs text-text-muted">{(row.workspace as { name?: string } | undefined)?.name || '—'}</span>,
          },
          {
            key: 'plan',
            header: 'Тариф',
            render: (row) => <span className="text-xs text-text-muted">{(row.workspace as { plan?: string } | undefined)?.plan || '—'}</span>,
          },
          {
            key: 'createdAt',
            header: 'Дата регистрации',
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
              <div className="flex items-center gap-2">
                {editingUser === row.id ? (
                  <>
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value)}
                      className="px-2 py-1 text-xs bg-surface border border-border rounded-button text-text outline-none"
                    >
                      <option value="">Роль</option>
                      <option value="OWNER">Владелец</option>
                      <option value="ADMIN">Админ</option>
                      <option value="SUPPORT">Поддержка</option>
                      <option value="ANALYST">Аналитик</option>
                      <option value="USER">Пользователь</option>
                    </select>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!newRole) return;
                        await updateUserRole(row.id as string, newRole);
                        setEditingUser(null);
                        setNewRole('');
                        fetchUsers({ search: search || undefined, role: roleFilter || undefined });
                      }}
                      className="px-2 py-1 text-xs bg-brand text-white rounded-button hover:bg-brand-hover transition-colors"
                    >
                      Сохранить
                    </button>
                    <button
                      type="button"
                      onClick={() => { setEditingUser(null); setNewRole(''); }}
                      className="px-2 py-1 text-xs bg-surface-2 text-text rounded-button hover:bg-surface transition-colors"
                    >
                      Отмена
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => { setEditingUser(row.id as string); setNewRole(row.role as string); }}
                      className="p-1.5 rounded-md hover:bg-surface-2 text-text-muted hover:text-brand transition-colors"
                      title="Изменить роль"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (confirm('Удалить пользователя? Это действие необратимо.')) {
                          await deleteUser(row.id as string);
                          fetchUsers({ search: search || undefined, role: roleFilter || undefined });
                        }
                      }}
                      className="p-1.5 rounded-md hover:bg-surface-2 text-text-muted hover:text-danger transition-colors"
                      title="Удалить"
                    >
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
              </div>
            ),
          },
        ]}
        data={users}
        loading={isLoading}
        pageSize={10}
        emptyMessage="Пользователи не найдены"
      />
    </div>
  );
}
