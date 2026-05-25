import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n";
import { useAuth } from "@/lib/auth";
import { useServerFn } from "@tanstack/react-start";
import { getDashboardAgents, getDashboardLogs } from "@/lib/data-access.functions";
import { useDemoMode } from "@/lib/use-demo-mode";
import { DEMO_AGENTS, genDemoLogs } from "@/lib/demo-data";
import { Bot, DollarSign, Activity, CheckCircle2, AlertTriangle, Clock, Zap, TrendingUp } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from "recharts";

export const Route = createFileRoute("/app/")({ component: DashboardPage });

type LogRow = {
  id: string;
  agentId: string;
  status: "running" | "success" | "failed" | "timeout";
  taskType: string | null;
  costUsd: string | null;
  tokensUsed: number | null;
  durationMs: number | null;
  errorMessage: string | null;
  createdAt: Date | string;
};

type AgentRow = { id: string; name: string; status: string };

function DashboardPage() {
  const { workspace } = useAuth();
  const { isDemo } = useDemoMode();
  const { t } = useTranslation();
  const agentsFn = useServerFn(getDashboardAgents);
  const logsFn = useServerFn(getDashboardLogs);
  const [agents, setAgents] = useState<AgentRow[]>([]);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<"24h" | "7d" | "30d">("24h");

  const since = useMemo(() => {
    const d = new Date();
    if (range === "24h") d.setHours(d.getHours() - 24);
    if (range === "7d") d.setDate(d.getDate() - 7);
    if (range === "30d") d.setDate(d.getDate() - 30);
    return d.toISOString();
  }, [range]);

  useEffect(() => {
    if (!workspace.companyId) return;
    if (isDemo) {
      setAgents(DEMO_AGENTS);
      setLogs(genDemoLogs(120) as unknown as LogRow[]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    Promise.all([
      agentsFn({ data: { companyId: workspace.companyId } }),
      logsFn({ data: { companyId: workspace.companyId, since, limit: 1000 } }),
    ]).then(([a, l]) => {
      if (cancelled) return;
      setAgents(a as AgentRow[]);
      setLogs(l as LogRow[]);
      setLoading(false);
    }).catch(() => {
      if (cancelled) return;
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [workspace.companyId, since, isDemo]);

  const stats = useMemo(() => {
    const total = logs.length;
    const success = logs.filter((l) => l.status === "success").length;
    const failed = logs.filter((l) => l.status === "failed").length;
    const cost = logs.reduce((s, l) => s + Number(l.costUsd ?? 0), 0);
    const tokens = logs.reduce((s, l) => s + (l.tokensUsed ?? 0), 0);
    const avgMs = total ? Math.round(logs.reduce((s, l) => s + (l.durationMs ?? 0), 0) / total) : 0;
    const successRate = total ? (success / total) * 100 : 0;
    // Human time saved: assume each successful exec replaces ~3 minutes of manual work
    const minutesSaved = success * 3;
    const activeAgents = agents.filter((a) => a.status === "active").length;
    return { total, success, failed, cost, tokens, avgMs, successRate, minutesSaved, activeAgents };
  }, [logs, agents]);

  const series = useMemo(() => {
    // bucket logs into 14 segments across the range
    const buckets = 14;
    const start = new Date(since).getTime();
    const end = Date.now();
    const step = (end - start) / buckets;
    const arr = Array.from({ length: buckets }, (_, i) => ({
      label: new Date(start + step * i).toLocaleString(undefined, range === "24h" ? { hour: "2-digit" } : { month: "short", day: "numeric" }),
      cost: 0,
      tasks: 0,
    }));
    for (const l of logs) {
      const t = new Date(l.createdAt).getTime();
      const idx = Math.min(buckets - 1, Math.max(0, Math.floor((t - start) / step)));
      arr[idx].cost += Number(l.costUsd ?? 0);
      arr[idx].tasks += 1;
    }
    return arr.map((r) => ({ ...r, cost: +r.cost.toFixed(4) }));
  }, [logs, since, range]);

  const agentName = (id: string) => agents.find((a) => a.id === id)?.name ?? "—";

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <div className="page-eyebrow">{t('dashboard.operations')}</div>
          <h1 className="page-title">{t('dashboard.title')}</h1>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <div className="page-pill"><span className="live-dot" /> {t('dashboard.live')}</div>
          <div className="period-selector" style={{ display: "inline-flex", border: "1px solid var(--color-faded-gray)", borderRadius: 8, overflow: "hidden", background: "white" }}>
            {(["24h", "7d", "30d"] as const).map((r) => (
              <button key={r} onClick={() => setRange(r)}
                style={{
                  padding: "6px 12px", fontSize: 12, fontWeight: 600, border: 0,
                  background: range === r ? "var(--color-midnight-ink)" : "transparent",
                  color: range === r ? "white" : "var(--color-graphite)",
                  cursor: "pointer",
                }}>{r}</button>
            ))}
          </div>
        </div>
      </header>

      <section className="kpi-grid">
        <Kpi icon={<Bot size={16} />} label={t('dashboard.activeAgents')} value={`${stats.activeAgents}/${agents.length}`} />
        <Kpi icon={<Activity size={16} />} label={t('agent.aiAgents')} value={stats.total.toLocaleString()} />
        <Kpi icon={<CheckCircle2 size={16} />} label={t('dashboard.successRate')} value={`${stats.successRate.toFixed(1)}%`} accent={stats.successRate >= 90 ? "ok" : stats.failed ? "bad" : undefined} />
        <Kpi icon={<AlertTriangle size={16} />} label={t('dashboard.errors')} value={stats.failed} accent={stats.failed ? "bad" : undefined} />
        <Kpi icon={<DollarSign size={16} />} label={t('dashboard.cost')} value={`$${stats.cost.toFixed(4)}`} />
        <Kpi icon={<Zap size={16} />} label={t('dashboard.tokens')} value={stats.tokens.toLocaleString()} />
        <Kpi icon={<Clock size={16} />} label={t('dashboard.avgLatency')} value={`${stats.avgMs} ms`} />
        <Kpi icon={<TrendingUp size={16} />} label={t('dashboard.timeSaved')} value={`${stats.minutesSaved} ${t('dashboard.minutes')}`} accent="ok" />
      </section>

      <div className="page-grid-2">
        <Panel title={t('dashboard.costsFor', { range })}>
          {logs.length === 0 ? <Empty message={t('dashboard.noDataPeriod')} /> : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={series}>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
                <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <Tooltip contentStyle={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 12 }} />
                <Line type="monotone" dataKey="cost" stroke="#0a0a1a" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Panel>
        <Panel title={t('dashboard.taskVolume')}>
          {logs.length === 0 ? <Empty message={t('dashboard.noExecutions')} /> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={series}>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
                <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <Tooltip contentStyle={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="tasks" fill="#0a0a1a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Panel>
      </div>

      <Panel title={
        <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
          <span>{t('dashboard.liveActivity')}</span>
          <Link to="/app/executions" style={{ fontSize: 12, fontWeight: 500, color: "var(--color-graphite)" }}>{t('dashboard.allExecutions')} →</Link>
        </span>
      }>
        {loading ? <Empty message={t('common.loading')} /> :
         logs.length === 0 ? <Empty message={t('dashboard.startAgent')} /> : (
          <ul className="feed">
            {logs.slice(0, 12).map((l) => (
              <li key={l.id} className={`feed-item ${l.status === "failed" ? "warn" : ""}`}>
                <span className="feed-dot" style={l.status === "running" ? { background: "#3b82f6" } : undefined} />
                <span className="feed-text">
                  <strong>{agentName(l.agentId)}</strong>{" "}
                  {l.status === "success" ? t('dashboard.completedTask') : l.status === "failed" ? t('dashboard.errorMsg', { msg: l.errorMessage ?? "unknown" }) : t('dashboard.running')}
                  {l.tokensUsed ? <span style={{ color: "var(--color-silver-mist)", marginLeft: 8 }}>· {l.tokensUsed} tok · ${Number(l.costUsd ?? 0).toFixed(4)}</span> : null}
                </span>
                <span className="feed-time">{relativeTime(l.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

function Kpi({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: React.ReactNode; accent?: "ok" | "bad" }) {
  return (
    <div className={`kpi ${accent ?? ""}`}>
      <div className="kpi-head"><span className="kpi-icon">{icon}</span><span className="kpi-label">{label}</span></div>
      <div className="kpi-value">{value}</div>
    </div>
  );
}

function Panel({ title, children }: { title: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="panel">
      <header className="panel-head">{title}</header>
      <div className="panel-body">{children}</div>
    </section>
  );
}

function Empty({ message }: { message: string }) {
  return <div className="panel-empty"><Activity size={20} /><span style={{ fontSize: 13 }}>{message}</span></div>;
}

function relativeTime(iso: string | Date): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 5) return i18n.t('dashboard.now');
  if (s < 60) return i18n.t('dashboard.secAgo', { count: s });
  const m = Math.floor(s / 60);
  if (m < 60) return i18n.t('dashboard.minAgo', { count: m });
  const h = Math.floor(m / 60);
  if (h < 24) return i18n.t('dashboard.hAgo', { count: h });
  return new Date(iso).toLocaleDateString();
}
