'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUserRole } from '@/utils/auth';
import DataTable from '@/components/admin/DataTable';
import AlertBadge from '@/components/admin/AlertBadge';
import DateRangePicker, { type DateRange } from '@/components/admin/DateRangePicker';
import { useAdminStore } from '@/store/adminStore';
import { CreditCard, DollarSign } from 'lucide-react';

export default function AdminBillingPage() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>({
    start: '',
    end: '',
    label: 'Последние 30 дней',
    days: 30,
  });

  useEffect(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 30);
    setDateRange({
      start: start.toISOString().slice(0, 10),
      end: end.toISOString().slice(0, 10),
      label: 'Последние 30 дней',
      days: 30,
    });
  }, []);
  const [statusFilter, setStatusFilter] = useState('');
  const { billingTransactions, isLoading, error, fetchBillingTransactions, fetchAnalytics, analyticsRevenue } = useAdminStore();

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
    fetchBillingTransactions({ status: statusFilter || undefined });
    fetchAnalytics(dateRange.days);
  }, [checked, statusFilter, dateRange, fetchBillingTransactions, fetchAnalytics]);

  if (!checked) return null;

  const totalRevenue = analyticsRevenue.reduce((sum, r) => sum + (r.amount ?? 0), 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <CreditCard size={20} className="text-brand" />
          <h1 className="text-xl font-semibold text-text tracking-heading">Биллинг</h1>
        </div>
        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </div>

      {error && (
        <div className="px-4 py-3 rounded-card bg-danger-soft border border-danger/10 text-sm text-danger">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface border border-border rounded-card p-5">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Выручка за период</p>
              <p className="text-2xl font-bold font-mono text-text tracking-tight">₽{totalRevenue.toLocaleString('ru-RU', { maximumFractionDigits: 0 })}</p>
            </div>
            <div className="p-2 rounded-lg bg-success-soft border border-success/10 text-success">
              <DollarSign size={18} />
            </div>
          </div>
        </div>
        <div className="bg-surface border border-border rounded-card p-5">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Транзакции</p>
              <p className="text-2xl font-bold font-mono text-text tracking-tight">{billingTransactions.length}</p>
            </div>
            <div className="p-2 rounded-lg bg-brand-light border border-brand/10 text-brand">
              <CreditCard size={18} />
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-text-muted">Статус:</span>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 text-sm bg-surface border border-border rounded-button text-text outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1"
        >
          <option value="">Все</option>
          <option value="completed">Завершено</option>
          <option value="pending">В обработке</option>
          <option value="failed">Ошибка</option>
          <option value="refunded">Возврат</option>
        </select>
      </div>

      <DataTable
        columns={[
          { key: 'id', header: 'ID', sortable: true, render: (row) => <span className="text-xs font-mono text-text-muted">{(row.id as string).slice(0, 8)}</span> },
          { key: 'workspace', header: 'Рабочее пространство', render: (row) => <span className="text-xs">{(row.workspace as { name?: string } | undefined)?.name || '—'}</span> },
          { key: 'type', header: 'Тип', sortable: true, render: (row) => <span className="text-xs font-medium capitalize">{row.type}</span> },
          {
            key: 'status',
            header: 'Статус',
            sortable: true,
            render: (row) => {
              const status = String(row.status);
              return (
                <span className={`inline-block px-2 py-0.5 rounded-pill text-[10px] font-semibold ${
                  status === 'completed' ? 'bg-success-soft text-success' :
                  status === 'pending' ? 'bg-warning-soft text-warning' :
                  status === 'failed' ? 'bg-danger-soft text-danger' :
                  'bg-surface-2 text-text-muted'
                }`}>
                  {status === 'completed' ? 'Завершено' : status === 'pending' ? 'В обработке' : status === 'failed' ? 'Ошибка' : status === 'refunded' ? 'Возврат' : status}
                </span>
              );
            },
          },
          {
            key: 'amount',
            header: 'Сумма',
            sortable: true,
            render: (row) => <span className="text-xs font-mono tabular-nums">₽{Number(row.amount).toFixed(2).replace('.', ',')}</span>,
          },
          {
            key: 'createdAt',
            header: 'Дата',
            sortable: true,
            render: (row) => (
              <span className="text-xs text-text-muted">
                {new Date(row.createdAt as string).toLocaleString('ru-RU')}
              </span>
            ),
          },
        ]}
        data={billingTransactions}
        loading={isLoading}
        pageSize={15}
        emptyMessage="Транзакции не найдены"
      />
    </div>
  );
}
