'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUserRole } from '@/utils/auth';
import KpiCard from '@/components/admin/KpiCard';
import ChartCard from '@/components/admin/ChartCard';
import ActivityFeed from '@/components/admin/ActivityFeed';
import { useAdminStore } from '@/store/adminStore';
import {
  Users,
  Building2,
  MessageSquare,
  Bot,
  DollarSign,
  AlertTriangle,
  Activity,
  TrendingUp,
  Server,
  Loader2,
} from 'lucide-react';

function formatCurrency(n: number) {
  return `₽${n.toLocaleString('ru-RU', { maximumFractionDigits: 0 })}`;
}

function SimpleBarChart({ data, label }: { data: { date: string; value: number }[]; label: string }) {
  if (!data.length) return <div className="text-sm text-text-muted">Нет данных</div>;
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="space-y-2">
      <div className="flex items-end gap-1 h-[120px]">
        {data.slice(-14).map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div
              className="w-full bg-brand/70 rounded-sm hover:bg-brand transition-colors"
              style={{ height: `${(d.value / max) * 100}%`, minHeight: d.value > 0 ? 4 : 0 }}
              title={`${d.date}: ${d.value}`}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-text-muted">
        <span>{data[0]?.date}</span>
        <span>{label}</span>
        <span>{data[data.length - 1]?.date}</span>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const {
    dashboardKPIs,
    analyticsSignups,
    analyticsRevenue,
    isLoading,
    error,
    fetchDashboard,
    fetchAnalytics,
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
    fetchDashboard();
    fetchAnalytics(14);
    const interval = setInterval(() => {
      fetchDashboard();
    }, 30000);
    return () => clearInterval(interval);
  }, [checked, fetchDashboard, fetchAnalytics]);

  if (!checked) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-brand animate-spin" />
      </div>
    );
  }

  const kpi = dashboardKPIs;

  const signupData = analyticsSignups.map((s) => ({ date: s.date, value: s.count ?? 0 }));
  const revenueData = analyticsRevenue.map((r) => ({ date: r.date, value: r.amount ?? 0 }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-text tracking-heading">Обзор</h1>
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <Activity size={14} className="text-success" />
          <span>Онлайн</span>
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-card bg-danger-soft border border-danger/10 text-sm text-danger">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          title="Всего пользователей"
          value={kpi?.totalUsers ?? 0}
          trend={12}
          trendLabel="за месяц"
          icon={Users}
          color="brand"
          delay={0}
        />
        <KpiCard
          title="Рабочие пространства"
          value={kpi?.totalWorkspaces ?? 0}
          icon={Building2}
          color="success"
          delay={0.05}
        />
        <KpiCard
          title="Всего сообщений"
          value={kpi?.totalMessages?.toLocaleString() ?? 0}
          icon={MessageSquare}
          color="warning"
          delay={0.1}
        />
        <KpiCard
          title="Выручка"
          value={formatCurrency(kpi?.totalRevenue ?? 0)}
          trend={8}
          trendLabel="за месяц"
          icon={DollarSign}
          color="success"
          delay={0.15}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          <ChartCard title="Регистрации" subtitle="Последние 14 дней" delay={0.2}>
            <SimpleBarChart data={signupData} label="Пользователи" />
          </ChartCard>
          <ChartCard title="Выручка" subtitle="Последние 14 дней" delay={0.25}>
            <SimpleBarChart data={revenueData} label="Выручка" />
          </ChartCard>
        </div>

        <ChartCard title="Активность" subtitle="События в реальном времени" delay={0.3}>
          <ActivityFeed />
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Агенты"
          value={kpi?.totalAgents ?? 0}
          icon={Bot}
          color="brand"
          delay={0.35}
        />
        <KpiCard
          title="Активны сегодня"
          value={kpi?.activeUsersToday ?? 0}
          icon={TrendingUp}
          color="success"
          delay={0.4}
        />
        <KpiCard
          title="Алерты"
          value={kpi?.unresolvedAlerts ?? 0}
          icon={AlertTriangle}
          color={kpi?.unresolvedAlerts ? 'danger' : 'success'}
          delay={0.45}
        />
        <KpiCard
          title="Аптайм системы"
          value={kpi?.systemHealth ? `${Math.floor(kpi.systemHealth.uptime / 3600)}ч` : '—'}
          icon={Server}
          color="brand"
          delay={0.5}
        />
      </div>
    </div>
  );
}
