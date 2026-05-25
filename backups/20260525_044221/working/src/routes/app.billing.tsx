import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Wallet, ArrowUpRight, ArrowDownRight, ExternalLink, CreditCard, Check, Calendar, Download } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useServerFn } from "@tanstack/react-start";
import { listWalletTransactions, createTopup } from "@/lib/wallet.functions";
import { getAgentcoreSettings } from "@/lib/agentcore-settings.functions";
import { useDemoMode } from "@/lib/use-demo-mode";
import { PLANS } from "@/lib/billing-plans";
import { createSubscriptionCheckout, getCurrentSubscription, cancelSubscription } from "@/lib/billing.functions";
import { getPlanUsage } from "@/lib/plan-limits.functions";
import { toast } from "sonner";
import { ExportModal } from "@/components/export-modal";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/app/billing")({ component: BillingPage });

const PRESETS = [50000, 100000, 250000, 500000, 1000000, 2000000];

function fmt(kopecks: number) {
  return (kopecks / 100).toLocaleString("ru-RU", { maximumFractionDigits: 2 }) + " ₽";
}

type Tx = {
  id: string;
  type: "topup" | "usage" | "refund" | "adjustment" | "subscription";
  status: "pending" | "succeeded" | "failed" | "canceled";
  amountKopecks: number;
  description: string | null;
  externalId: string | null;
  createdAt: Date | string;
};

type Subscription = {
  id: string;
  plan: string;
  status: string;
  currentPeriodEnd: Date | string | null;
  paymentMethodId: string | null;
};

function BillingPage() {
  const { t } = useTranslation();
  const { workspace, hasMinRole, hasPermission } = useAuth();
  const { isDemo } = useDemoMode();
  const list = useServerFn(listWalletTransactions);
  const settings = useServerFn(getAgentcoreSettings);
  const topup = useServerFn(createTopup);
  const subscribe = useServerFn(createSubscriptionCheckout);
  const getSub = useServerFn(getCurrentSubscription);
  const cancelSub = useServerFn(cancelSubscription);
  const fetchPlanUsage = useServerFn(getPlanUsage);

  const [balance, setBalance] = useState<number>(0);
  const [tx, setTx] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState<number>(100000);
  const [busy, setBusy] = useState(false);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [subLoading, setSubLoading] = useState(false);
  const [planUsage, setPlanUsage] = useState<{
    planId: string;
    planName: string;
    usage: {
      agents: { current: number; limit: number };
      integrations: { current: number; limit: number };
      api_calls: { current: number; limit: number };
      users: { current: number; limit: number };
      tokens: { current: number; limit: number };
      analyses: { current: number; limit: number };
    };
  } | null>(null);
  const [exportOpen, setExportOpen] = useState(false);

  const load = async () => {
    if (!workspace.companyId) return;
    setLoading(true);
    if (isDemo) {
      setBalance(247350);
      const now = Date.now();
      setTx([
        { id: "d1", type: "topup", status: "succeeded", amountKopecks: 500000, description: "Пополнение через ЮKassa (demo)", externalId: "yk_demo_8a12", createdAt: new Date(now - 36e5 * 26).toISOString() },
        { id: "d2", type: "usage", status: "succeeded", amountKopecks: -18420, description: "API · gpt-4o-mini · 184k токенов", externalId: null, createdAt: new Date(now - 36e5 * 18).toISOString() },
        { id: "d3", type: "usage", status: "succeeded", amountKopecks: -7240, description: "API · gpt-4o-mini · 72k токенов", externalId: null, createdAt: new Date(now - 36e5 * 11).toISOString() },
        { id: "d4", type: "topup", status: "succeeded", amountKopecks: 100000, description: "Пополнение через ЮKassa (demo)", externalId: "yk_demo_b441", createdAt: new Date(now - 36e5 * 6).toISOString() },
        { id: "d5", type: "usage", status: "succeeded", amountKopecks: -22990, description: "API · gpt-4o · 76k токенов", externalId: null, createdAt: new Date(now - 36e5 * 2).toISOString() },
      ]);
      setSubscription({
        id: "demo-sub",
        plan: "extended",
        status: "active",
        currentPeriodEnd: new Date(now + 30 * 24 * 60 * 60 * 1000).toISOString(),
        paymentMethodId: null,
      });
      setPlanUsage({
        planId: "extended",
        planName: t('billing.planNames.extended'),
        usage: {
          agents: { current: 2, limit: 8 },
          integrations: { current: 3, limit: 999 },
          api_calls: { current: 142, limit: 50000 },
          users: { current: 3, limit: 8 },
          tokens: { current: 12_500_000, limit: 50_000_000 },
          analyses: { current: 3, limit: 15 },
        },
      });
      setLoading(false);
      return;
    }
    try {
      const [s, l, sub, usage] = await Promise.all([
        settings({ data: { companyId: workspace.companyId } }),
        list({ data: { companyId: workspace.companyId, limit: 50 } }),
        getSub({ data: { companyId: workspace.companyId } }),
        fetchPlanUsage({ data: { companyId: workspace.companyId } }),
      ]);
      setBalance(Number((s as any).balanceKopecks ?? (s as any).balance_kopecks ?? 0));
      setTx((l.items as any[]).map((item: any) => ({
        ...item,
        amountKopecks: item.amountKopecks ?? item.amount_kopecks ?? 0,
        externalId: item.externalId ?? item.external_id ?? null,
        createdAt: item.createdAt ?? item.created_at ?? new Date(),
      })) as Tx[]);
      setSubscription((sub as any)?.subscription ? {
        ...((sub as any).subscription),
        currentPeriodEnd: (sub as any).subscription.currentPeriodEnd ?? (sub as any).subscription.current_period_end,
        paymentMethodId: (sub as any).subscription.paymentMethodId ?? (sub as any).subscription.payment_method_id,
      } : null);
      setPlanUsage(usage);
    } catch (e: any) { toast.error(e.message); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [workspace.companyId, isDemo]);

  const onTopup = async () => {
    if (isDemo) { toast.info(t('billing.demoMode')); return; }
    if (!workspace.companyId || !hasMinRole("admin")) { toast.error(t('billing.onlyAdmin')); return; }
    if (amount < 10000) { toast.error(t('billing.minAmount')); return; }
    setBusy(true);
    try {
      const r = await topup({
        data: {
          companyId: workspace.companyId,
          amountKopecks: amount,
          returnUrl: `${window.location.origin}/app/billing`,
        },
      });
      window.location.href = r.confirmationUrl;
    } catch (e: any) { toast.error(e.message); setBusy(false); }
  };

  const onSubscribe = async (planId: string) => {
    if (isDemo) { toast.info(t('billing.demoMode')); return; }
    if (!workspace.companyId || !hasPermission("billing.manage")) { toast.error(t('billing.noPermission')); return; }
    setSubLoading(true);
    try {
      const r = await subscribe({
        data: {
          companyId: workspace.companyId,
          plan: planId as "basic" | "extended" | "premium",
          returnUrl: `${window.location.origin}/app/billing`,
        },
      });
      window.location.href = r.confirmationUrl;
    } catch (e: any) { toast.error(e.message); setSubLoading(false); }
  };

  const onCancelSubscription = async () => {
    if (!subscription) return;
    try {
      await cancelSub({ data: { subscriptionId: subscription.id } });
      toast.success(t('billing.subscriptionCancelled'));
      setSubscription(null);
    } catch (e: any) { toast.error(e.message); }
  };

  const currentPlan = subscription?.plan || "none";

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <div className="page-eyebrow">{t('billing.walletSub')}</div>
          <h1 className="page-title">{t('billing.title')}</h1>
          <p className="page-sub">{t('billing.subtitle')}</p>
        </div>
        <button className="btn-ghost" onClick={() => setExportOpen(true)}><Download size={14}/> {t('common.export')}</button>
      </header>

      {/* Active subscription banner */}
      {subscription && subscription.status === "active" && (
        <section className="panel" style={{ marginBottom: 16, background: "rgba(16,185,129,0.05)", borderColor: "#10b981" }}>
          <div className="panel-body" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Check size={16} color="#10b981" />
                <strong>{t('billing.activeSubscription', { plan: PLANS.find(p => p.id === currentPlan)?.name || currentPlan })}</strong>
              </div>
              <div className="muted small" style={{ marginTop: 4 }}>
                <Calendar size={12} style={{ marginRight: 4, verticalAlign: "-1px" }} />
                {t('billing.renewal')} {subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd as any).toLocaleDateString("ru-RU") : "—"}
              </div>
            </div>
            <button className="btn-ghost" onClick={onCancelSubscription} style={{ fontSize: 12 }}>
              {t('billing.cancelSubscription')}
            </button>
          </div>
        </section>
      )}

      {/* Current usage vs plan limits */}
      {planUsage && (
        <section className="panel" style={{ marginBottom: 16 }}>
          <header className="panel-head">{t('billing.planUsage', { planName: planUsage.planName })}</header>
          <div className="panel-body">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(200px, 100%), 1fr))", gap: 16 }}>
              <UsageBar label={t('billing.agents')} current={planUsage.usage.agents.current} limit={planUsage.usage.agents.limit} />
              <UsageBar label={t('billing.users')} current={planUsage.usage.users.current} limit={planUsage.usage.users.limit} />
              <UsageBar label={t('billing.integrations')} current={planUsage.usage.integrations.current} limit={planUsage.usage.integrations.limit} />
              <UsageBar label={t('billing.tokens')} current={planUsage.usage.tokens.current} limit={planUsage.usage.tokens.limit} format="millions" />
              <UsageBar label={t('billing.apiCallsMonth')} current={planUsage.usage.api_calls.current} limit={planUsage.usage.api_calls.limit} />
              <UsageBar label={t('billing.analysesMonth')} current={planUsage.usage.analyses.current} limit={planUsage.usage.analyses.limit} />
            </div>
          </div>
        </section>
      )}

      {/* Plan cards */}
      <section className="panel" style={{ marginBottom: 16 }}>
        <header className="panel-head"><CreditCard size={14} style={{ marginRight: 8, verticalAlign: "-2px" }} /> {t('billing.plans')}</header>
        <div className="panel-body">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(220px, 100%), 1fr))", gap: 14 }}>
            {PLANS.map((plan) => (
              <PlanCard
                key={plan.id}
                name={plan.name}
                price={plan.price}
                sub={plan.features.slice(0, 2).join(" · ")}
                features={plan.features}
                highlight={plan.id === "extended"}
                current={currentPlan === plan.id && subscription?.status === "active"}
                ctaLabel={currentPlan === plan.id && subscription?.status === "active" ? t('billing.current') : plan.id === "custom" ? t('billing.contact') : t('billing.selectPlan')}
                ctaHref={plan.id === "custom" ? "/contacts" : undefined}
                onSubscribe={plan.id !== "custom" && !(currentPlan === plan.id && subscription?.status === "active") ? () => onSubscribe(plan.id) : undefined}
                subLoading={subLoading}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Balance */}
      <section className="panel">
        <header className="panel-head"><Wallet size={14} style={{ marginRight: 8, verticalAlign: "-2px" }} /> {t('billing.balance')}</header>
        <div className="panel-body">
          {loading ? <Loader2 className="animate-spin" size={16} /> : (
            <>
              <div className="balance-display">
                <div className="balance-amount">{fmt(balance)}</div>
                <div className={`balance-status ${balance <= 0 ? "low" : balance < 10000 ? "warn" : "ok"}`}>
                  {balance <= 0 ? t('billing.exhausted') : balance < 10000 ? t('billing.lowBalance') : t('billing.activeBalance')}
                </div>
              </div>
              <div className="topup-row">
                {PRESETS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={`preset-chip ${amount === p ? "active" : ""}`}
                    onClick={() => setAmount(p)}
                  >
                    {fmt(p)}
                  </button>
                ))}
                <input
                  type="number"
                  min={100}
                  step={100}
                  value={Math.round(amount / 100)}
                  onChange={(e) => setAmount(Math.max(10000, Math.round(Number(e.target.value || 0)) * 100))}
                  className="topup-input"
                  placeholder="₽"
                />
                <button className="btn-solid" disabled={busy} onClick={onTopup}>
                  {busy ? <Loader2 size={14} className="animate-spin" /> : <>{t('billing.topupYookassa')} <ExternalLink size={12} /></>}
                </button>
              </div>
              <p className="muted" style={{ fontSize: 12, marginTop: 12 }}>
                {t('billing.paymentSecure')}
              </p>
            </>
          )}
        </div>
      </section>

      {/* Transaction history */}
      <section className="panel" style={{ marginTop: 16 }}>
        <header className="panel-head">{t('billing.transactionHistory')}</header>
        <div className="panel-body">
          {tx.length === 0 ? (
            <div className="panel-empty">{t('billing.noTransactions')}</div>
          ) : (
            <>
            <table className="data-table">
              <thead><tr><th>{t('billing.date')}</th><th>{t('billing.type')}</th><th>{t('billing.amount')}</th><th>{t('billing.status')}</th><th>{t('billing.description')}</th></tr></thead>
              <tbody>
                {tx.map((txItem) => (
                  <tr key={txItem.id}>
                    <td className="muted">{new Date(txItem.createdAt as any).toLocaleString("ru-RU")}</td>
                    <td>
                      <span className={`tx-type tx-${txItem.type}`}>
                        {txItem.amountKopecks >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                        {txItem.type}
                      </span>
                    </td>
                    <td><strong>{txItem.amountKopecks >= 0 ? "+" : ""}{fmt(txItem.amountKopecks)}</strong></td>
                    <td><span className={`status status-${txItem.status === "succeeded" ? "ok" : txItem.status === "failed" || txItem.status === "canceled" ? "err" : "muted"}`}>{txItem.status}</span></td>
                    <td className="muted">{txItem.description ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mobile-card-list">
              {tx.map((txItem) => (
                <div key={txItem.id} className="mobile-card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span className={`tx-type tx-${txItem.type}`}>
                      {txItem.amountKopecks >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                      {txItem.type}
                    </span>
                    <strong>{txItem.amountKopecks >= 0 ? "+" : ""}{fmt(txItem.amountKopecks)}</strong>
                  </div>
                  <div className="mobile-card-row">
                    <span className="mobile-card-label">{t('billing.status')}</span>
                    <span className="mobile-card-value"><span className={`status status-${txItem.status === "succeeded" ? "ok" : txItem.status === "failed" || txItem.status === "canceled" ? "err" : "muted"}`}>{txItem.status}</span></span>
                  </div>
                  <div className="mobile-card-row">
                    <span className="mobile-card-label">{t('billing.description')}</span>
                    <span className="mobile-card-value muted">{txItem.description ?? "—"}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--color-silver-mist)", marginTop: 2 }}>
                    {new Date(txItem.createdAt as any).toLocaleString("ru-RU")}
                  </div>
                </div>
              ))}
            </div>
            </>
          )}
        </div>
      </section>

      <ExportModal
        open={exportOpen}
        onOpenChange={setExportOpen}
        resource="wallet_transactions"
        resourceLabel={t('billing.transactions')}
        companyId={workspace.companyId}
        data={tx as unknown as Record<string, unknown>[]}
      />
    </div>
  );
}

function PlanCard({ name, price, sub, features, highlight, current, ctaLabel, ctaHref, onSubscribe, subLoading }: { name: string; price: string; sub: string; features: string[]; highlight?: boolean; current?: boolean; ctaLabel?: string; ctaHref?: string; onSubscribe?: () => void; subLoading?: boolean }) {
  const { t } = useTranslation();
  return (
    <div style={{
      border: highlight ? "1px solid var(--primary, #6366f1)" : "1px solid var(--color-faded-gray)",
      borderRadius: 10,
      padding: 18,
      background: highlight ? "rgba(99,102,241,0.04)" : "white",
      position: "relative",
    }}>
      {current && <div style={{ position: "absolute", top: -8, right: 14, fontSize: 10, padding: "2px 8px", background: "#10b981", color: "white", borderRadius: 4, fontFamily: "monospace", letterSpacing: 0.5, textTransform: "uppercase" }}>{t('billing.current')}</div>}
      <div style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>{name}</div>
      <div style={{ fontSize: 22, fontWeight: 600, marginBottom: 2 }}>{price}</div>
      <div className="muted small" style={{ fontSize: 12, marginBottom: 14 }}>{sub}</div>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
        {features.map((f) => (
          <li key={f} style={{ fontSize: 12, color: "var(--color-graphite)" }}>· {f}</li>
        ))}
      </ul>
      {onSubscribe && (
        <button className={highlight ? "btn-solid" : "btn-ghost"} style={{ display: "block", width: "100%", textAlign: "center", padding: "8px 12px", fontSize: 12, textDecoration: "none" }} onClick={onSubscribe} disabled={subLoading}>
          {subLoading ? <Loader2 size={12} className="animate-spin" /> : ctaLabel || t('billing.selectPlan')}
        </button>
      )}
      {ctaHref && !onSubscribe && (
        <a href={ctaHref} className={highlight ? "btn-solid" : "btn-ghost"} style={{ display: "block", textAlign: "center", padding: "8px 12px", fontSize: 12, textDecoration: "none" }}>
          {ctaLabel}
        </a>
      )}
      {current && !onSubscribe && !ctaHref && <div className="muted small" style={{ fontSize: 11, fontStyle: "italic" }}>{t('billing.currentPlan')}</div>}
    </div>
  );
}

function UsageBar({ label, current, limit, format }: { label: string; current: number; limit: number; format?: "millions" }) {
  const { t } = useTranslation();
  const pct = limit > 0 ? Math.min(100, Math.round((current / limit) * 100)) : 0;
  const isAtLimit = current >= limit;
  const barColor = isAtLimit ? "#ef4444" : pct >= 80 ? "#f59e0b" : "#10b981";
  const fmtVal = (v: number) => {
    if (v >= 999_999_999) return "∞";
    if (format === "millions") return v >= 1_000_000 ? `${(v / 1_000_000).toFixed(0)}M` : v.toLocaleString("ru-RU");
    if (v >= 999) return "∞";
    return String(v);
  };
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>{label}</span>
        <span style={{ fontSize: 13, fontFamily: "monospace", color: isAtLimit ? "#ef4444" : "inherit" }}>
          {fmtVal(current)}/{fmtVal(limit)}
        </span>
      </div>
      <div style={{ height: 8, borderRadius: 4, background: "var(--color-faded-gray, #e5e7eb)", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, borderRadius: 4, background: barColor, transition: "width 0.3s" }} />
      </div>
      {isAtLimit && (
        <div className="muted small" style={{ marginTop: 4, color: "#ef4444", fontSize: 11 }}>
          {t('billing.limitReached')}
        </div>
      )}
    </div>
  );
}
