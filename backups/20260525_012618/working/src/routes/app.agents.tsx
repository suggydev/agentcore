import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/auth";
import { useServerFn } from "@tanstack/react-start";
import { listAgents, toggleAgentStatus } from "@/lib/data-access.functions";
import { useDemoMode } from "@/lib/use-demo-mode";
import { DEMO_AGENTS } from "@/lib/demo-data";
import { Plus, Bot, Loader2, Pause, Play, AlertTriangle, Download } from "lucide-react";
import { toast } from "sonner";
import { ExportModal } from "@/components/export-modal";

export const Route = createFileRoute("/app/agents")({ component: AgentsPage });

type AgentRow = { id: string; name: string; type: string; status: string; dailyBudgetUsd: string | null; updatedAt: Date | string };

function AgentsPage() {
  const { t } = useTranslation();
  const { workspace, hasMinRole } = useAuth();
  const { isDemo } = useDemoMode();
  const listFn = useServerFn(listAgents);
  const toggleFn = useServerFn(toggleAgentStatus);
  const [rows, setRows] = useState<AgentRow[] | null>(null);
  const [exportOpen, setExportOpen] = useState(false);

  const load = async () => {
    if (!workspace.companyId) return;
    if (isDemo) {
      setRows(DEMO_AGENTS.map((a, i) => ({
        id: a.id, name: a.name, type: ["sales","support","ops","research"][i % 4],
        status: a.status, dailyBudgetUsd: String(5 + i * 2),
        updatedAt: new Date(Date.now() - i * 3600_000).toISOString(),
      })));
      return;
    }
    try {
      const data = await listFn({ data: { companyId: workspace.companyId } });
      setRows(data as AgentRow[]);
    } catch {
      setRows([]);
    }
  };

  useEffect(() => { load(); }, [workspace.companyId, isDemo]);

  const toggle = async (a: AgentRow) => {
    const next = a.status === "active" ? "paused" : "active";
    try {
      await toggleFn({ data: { agentId: a.id, status: next as any } });
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <div className="page-eyebrow">{t('agent.aiAgents')}</div>
          <h1 className="page-title">{t('agent.agents')}</h1>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn-ghost" onClick={() => setExportOpen(true)}><Download size={14}/> {t('common.export')}</button>
          {hasMinRole("admin") && (
            <Link to="/app/agents/new" className="btn-solid"><Plus size={14} /> {t('agent.orderAgent')}</Link>
          )}
        </div>
      </header>

      <div className="panel">
        {rows === null ? (
          <div className="panel-empty"><Loader2 className="animate-spin" /></div>
        ) : rows.length === 0 ? (
          <div className="panel-empty">
            <Bot size={36} />
            <p>{t('agent.noAgents')}</p>
            {hasMinRole("admin") && <Link to="/app/agents/new" className="btn-solid"><Plus size={14} /> {t('agent.orderAgent')}</Link>}
          </div>
        ) : (
          <>
          <table className="data-table">
            <thead><tr><th>{t('agent.name')}</th><th>{t('agent.type')}</th><th>{t('agent.status')}</th><th>{t('agent.budgetDay')}</th><th>{t('agent.updated')}</th><th></th></tr></thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.id}>
                  <td><Link to="/app/agents/$agentId" params={{ agentId: a.id }} className="link">{a.name}</Link></td>
                  <td><span className="chip">{a.type}</span></td>
                  <td><StatusBadge status={a.status} /></td>
                  <td>${Number(a.dailyBudgetUsd).toFixed(2)}</td>
                  <td className="muted">{new Date(a.updatedAt).toLocaleString("ru-RU")}</td>
                  <td className="row-actions">
                    {hasMinRole("operator") && (
                      <button className="icon-btn" onClick={() => toggle(a)} title={a.status === "active" ? t('agent.pause') : t('agent.start')}>
                        {a.status === "active" ? <Pause size={14} /> : <Play size={14} />}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mobile-card-list">
            {rows.map((a) => (
              <div key={a.id} className="mobile-card">
                <div className="mobile-card-row">
                  <span className="mobile-card-label">{t('agent.name')}</span>
                  <span className="mobile-card-value"><Link to="/app/agents/$agentId" params={{ agentId: a.id }} className="link">{a.name}</Link></span>
                </div>
                <div className="mobile-card-row">
                  <span className="mobile-card-label">{t('agent.type')}</span>
                  <span className="mobile-card-value"><span className="chip">{a.type}</span></span>
                </div>
                <div className="mobile-card-row">
                  <span className="mobile-card-label">{t('agent.status')}</span>
                  <span className="mobile-card-value"><StatusBadge status={a.status} /></span>
                </div>
                <div className="mobile-card-row">
                  <span className="mobile-card-label">{t('agent.budgetDay')}</span>
                  <span className="mobile-card-value">${Number(a.dailyBudgetUsd).toFixed(2)}</span>
                </div>
                <div className="mobile-card-row">
                  <span className="mobile-card-label">{t('agent.updated')}</span>
                  <span className="mobile-card-value muted small">{new Date(a.updatedAt).toLocaleString("ru-RU")}</span>
                </div>
                <div className="mobile-card-actions">
                  {hasMinRole("operator") && (
                    <button className="icon-btn" onClick={() => toggle(a)} title={a.status === "active" ? t('agent.pause') : t('agent.start')}>
                      {a.status === "active" ? <><Pause size={14} /> {t('agent.pause')}</> : <><Play size={14} /> {t('agent.start')}</>}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          </>
        )}
      </div>

      <ExportModal
        open={exportOpen}
        onOpenChange={setExportOpen}
        resource="agents"
        resourceLabel={t('agent.agents')}
        companyId={workspace.companyId}
        data={rows ? rows as unknown as Record<string, unknown>[] : undefined}
      />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  const map: Record<string, { cls: string; label: string }> = {
    active: { cls: "ok", label: t('agent.active') },
    paused: { cls: "muted", label: t('agent.pause') },
    error: { cls: "bad", label: t('agent.error') },
    draft: { cls: "muted", label: t('agent.draft') },
  };
  const v = map[status] ?? map.draft;
  return <span className={`status-badge ${v.cls}`}>{v.cls === "bad" && <AlertTriangle size={10} />} {v.label}</span>;
}
