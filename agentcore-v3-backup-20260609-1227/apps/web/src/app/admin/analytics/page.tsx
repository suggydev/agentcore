'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUserRole } from '@/utils/auth';
import ChartCard from '@/components/admin/ChartCard';
import DateRangePicker, { type DateRange } from '@/components/admin/DateRangePicker';
import { useAdminStore } from '@/store/adminStore';
import { BarChart3 } from 'lucide-react';

function SvgBarChart({ data, label }: { data: { label: string; value: number }[]; label: string }) {
  if (!data.length) return <div className="text-sm text-text-muted">Нет данных</div>;
  const max = Math.max(...data.map((d) => d.value), 1);
  const height = 160;
  const barWidth = Math.max(4, (data.length > 0 ? 100 / data.length : 0));
  return (
    <div className="space-y-2">
      <div className="flex items-end gap-1 h-[160px]">
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div
              className="w-full bg-brand/70 rounded-sm hover:bg-brand transition-colors"
              style={{ height: `${(d.value / max) * 100}%`, minHeight: d.value > 0 ? 4 : 0 }}
              title={`${d.label}: ${d.value}`}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-text-muted">
        <span>{data[0]?.label}</span>
        <span>{label}</span>
        <span>{data[data.length - 1]?.label}</span>
      </div>
    </div>
  );
}

function ModelTable({ data }: { data: { model: string; tokensIn: number; tokensOut: number; cost: number; avgLatency: number; count: number }[] }) {
  if (!data.length) return <div className="text-sm text-text-muted">Нет данных об использовании моделей</div>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border">
            <th className="px-3 py-2 text-left text-text-muted font-semibold">Модель</th>
            <th className="px-3 py-2 text-right text-text-muted font-semibold">Запросы</th>
            <th className="px-3 py-2 text-right text-text-muted font-semibold">Токены (вход)</th>
            <th className="px-3 py-2 text-right text-text-muted font-semibold">Токены (выход)</th>
            <th className="px-3 py-2 text-right text-text-muted font-semibold">Стоимость</th>
            <th className="px-3 py-2 text-right text-text-muted font-semibold">Средняя задержка</th>
          </tr>
        </thead>
        <tbody>
          {data.map((m, i) => (
            <tr key={i} className="border-b border-border last:border-b-0 hover:bg-surface-2/50 transition-colors">
              <td className="px-3 py-2 text-text-secondary font-medium">{m.model}</td>
              <td className="px-3 py-2 text-right tabular-nums">{m.count.toLocaleString()}</td>
              <td className="px-3 py-2 text-right tabular-nums">{m.tokensIn.toLocaleString()}</td>
              <td className="px-3 py-2 text-right tabular-nums">{m.tokensOut.toLocaleString()}</td>
              <td className="px-3 py-2 text-right tabular-nums">₽{m.cost.toFixed(2).replace('.', ',')}</td>
              <td className="px-3 py-2 text-right tabular-nums">{m.avgLatency}ms</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminAnalyticsPage() {
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
  const {
    analyticsSignups,
    analyticsActivity,
    analyticsRevenue,
    analyticsModels,
    isLoading,
    error,
    fetchAnalytics,
    setDateRange: storeSetDateRange,
  } = useAdminStore();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    const role = getUserRole();
    const allowed = ['SUPERADMIN', 'ADMIN', 'SUPPORT', 'ANALYST'];
    if (!role || !allowed.includes(role)) {
      router.push('/agents');
      return;
    }
    setChecked(true);
  }, [router]);

  useEffect(() => {
    if (!checked) return;
    storeSetDateRange({ start: dateRange.start, end: dateRange.end, days: dateRange.days });
    fetchAnalytics(dateRange.days);
  }, [checked, dateRange, fetchAnalytics, storeSetDateRange]);

  if (!checked) return null;

  const signups = analyticsSignups.map((s) => ({ label: s.date.slice(5), value: s.count ?? 0 }));
  const revenue = analyticsRevenue.map((r) => ({ label: r.date.slice(5), value: r.amount ?? 0 }));
  const dau = analyticsActivity.map((a) => ({ label: a.date.slice(5), value: a.dau ?? 0 }));
  const sessions = analyticsActivity.map((a) => ({ label: a.date.slice(5), value: a.sessions ?? 0 }));

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <BarChart3 size={20} className="text-brand" />
          <h1 className="text-xl font-semibold text-text tracking-heading">Аналитика</h1>
        </div>
        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </div>

      {error && (
        <div className="px-4 py-3 rounded-card bg-danger-soft border border-danger/10 text-sm text-danger">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartCard title="Регистрации" subtitle={dateRange.label} delay={0}>
          <SvgBarChart data={signups} label="Новые пользователи" />
        </ChartCard>
        <ChartCard title="Выручка" subtitle={dateRange.label} delay={0.05}>
          <SvgBarChart data={revenue} label="Выручка" />
        </ChartCard>
        <ChartCard title="DAU" subtitle={dateRange.label} delay={0.1}>
          <SvgBarChart data={dau} label="Активные пользователи" />
        </ChartCard>
        <ChartCard title="Сессии" subtitle={dateRange.label} delay={0.15}>
          <SvgBarChart data={sessions} label="Сессии" />
        </ChartCard>
      </div>

      <ChartCard title="Использование моделей" subtitle={dateRange.label} delay={0.2} className="">
        <ModelTable data={analyticsModels} />
      </ChartCard>
    </div>
  );
}
