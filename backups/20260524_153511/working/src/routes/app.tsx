import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/auth";
import { DemoModeProvider, useDemoMode } from "@/lib/use-demo-mode";
import { SupportChatWidget } from "@/components/support-chat-widget";
import { OnboardingTour, useRestartOnboardingTour } from "@/components/onboarding-tour";
import { LanguageSwitcher } from "@/components/language-switcher";
import {
  LayoutDashboard, Bot, CreditCard, Settings, Shield, LogOut, Loader2, Activity, Bell, Users, Plug, FileSearch, Terminal, Sparkles, Menu, X, BookOpen, BarChart3, MessageSquare, HelpCircle,
} from "lucide-react";

export const Route = createFileRoute("/app")({ component: AppLayout });

const NAV_KEYS = [
  { to: "/app", labelKey: "nav.dashboard", icon: LayoutDashboard, exact: true },
  { to: "/app/agents", labelKey: "nav.agents", icon: Bot },
  { to: "/app/executions", labelKey: "nav.executions", icon: Terminal },
  { to: "/app/leads", labelKey: "nav.leads", icon: Users },
  { to: "/app/alerts", labelKey: "nav.alerts", icon: Bell },
  { to: "/app/knowledge", labelKey: "nav.knowledge", icon: BookOpen },
  { to: "/app/integrations", labelKey: "nav.integrations", icon: Plug },
  { to: "/app/reports", labelKey: "nav.reports", icon: BarChart3 },
  { to: "/app/ai-assistant", labelKey: "nav.aiAssistant", icon: MessageSquare },
  { to: "/app/billing", labelKey: "nav.billing", icon: CreditCard },
  { to: "/app/settings", labelKey: "nav.settings", icon: Settings },
  { to: "/app/audit", labelKey: "nav.audit", icon: FileSearch },
  { to: "/app/admin", labelKey: "nav.admin", icon: Shield },
  { to: "/support", labelKey: "nav.support", icon: Activity },
];

function HelpButton() {
  const { t } = useTranslation();
  const restart = useRestartOnboardingTour();
  return (
    <button className="app-nav-item" onClick={restart} title={t('nav.help')} style={{ fontSize: 12, marginBottom: 8, color: "var(--color-graphite)" }}>
      <HelpCircle size={16} /> <span>{t('nav.platformTour')}</span>
    </button>
  );
}

function AppLayout() {
  const navigate = useNavigate();
  const { loading, session, workspace, signOut, user } = useAuth();
  const { t } = useTranslation();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!session) navigate({ to: "/login" });
    else if (!workspace.companyId) navigate({ to: "/onboarding" });
  }, [loading, session, workspace.companyId, navigate]);

  // close drawer on route change
  useEffect(() => { setMobileOpen(false); }, [path]);

  if (loading || !session || !workspace.companyId) {
    return <div className="app-loading"><Loader2 className="animate-spin" /></div>;
  }

  const role = workspace.roles[0] ?? "viewer";

  const sidebarContent = (
    <>
      <Link to="/app" className="app-brand"><span className="app-brand-dot" /> AgentCore</Link>
      <div className="app-workspace">
        <div className="app-ws-name">{workspace.companyName}</div>
        <div className="app-ws-role">{role}</div>
      </div>
      <nav className="app-nav">
        {NAV_KEYS.map((n) => {
          const active = n.exact ? path === n.to : path.startsWith(n.to);
          const Icon = n.icon;
          return (
            <Link key={n.to} to={n.to} className={`app-nav-item ${active ? "active" : ""}`}>
              <Icon size={16} /> <span>{t(n.labelKey)}</span>
            </Link>
          );
        })}
      </nav>
      <div className="app-sidebar-footer">
        <HelpButton />
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, marginLeft: 12 }}>
          <LanguageSwitcher />
        </div>
        <div className="app-user">
          <div className="app-user-avatar">{(user?.email ?? "?")[0].toUpperCase()}</div>
          <div className="app-user-meta">
            <div className="app-user-email">{user?.email}</div>
            <div className="app-user-status"><Activity size={10} /> {t('common.online')}</div>
          </div>
        </div>
        <button className="app-logout" onClick={signOut} title={t('nav.logout')}><LogOut size={14} /></button>
      </div>
    </>
  );

  return (
    <div className="app-shell">
      <aside className="app-sidebar">{sidebarContent}</aside>

      {/* Mobile top bar */}
      <div className="app-mobile-bar">
        <Link to="/app" className="app-brand"><span className="app-brand-dot" /> AgentCore</Link>
        <button className="app-mobile-burger" onClick={() => setMobileOpen(true)} aria-label={t('nav.menu')}>
          <Menu size={20} />
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div className="app-mobile-backdrop" onClick={() => setMobileOpen(false)} />
          <aside className="app-mobile-drawer">
            <button className="app-mobile-close" onClick={() => setMobileOpen(false)} aria-label={t('nav.closeMenu')}>
              <X size={18} />
            </button>
            {sidebarContent}
          </aside>
        </>
      )}

      <main className="app-main">
        <DemoModeProvider>
          <DemoBanner />
          <Outlet />
        </DemoModeProvider>
      </main>

      {/* Support Chat Widget */}
      <SupportChatWidget />

      {/* Onboarding Tour */}
      <OnboardingTour />
    </div>
  );
}

function DemoBanner() {
  const { isDemo, loading } = useDemoMode();
  const { t } = useTranslation();
  if (loading || !isDemo) return null;
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10, padding: "10px 16px",
      background: "linear-gradient(90deg, rgba(99,102,241,0.08), rgba(168,85,247,0.08))",
      borderBottom: "1px solid var(--color-faded-gray)", fontSize: 13, color: "var(--color-midnight-ink)",
    }}>
      <Sparkles size={14} style={{ color: "#7c3aed" }} />
      <strong>{t('demo.mode')}</strong>
      <span style={{ color: "var(--color-graphite)" }}>
        {t('demo.dataGenerated')}
      </span>
      <Link to="/app/admin" style={{ fontWeight: 600, textDecoration: "underline" }}>Admin → AgentCore</Link>
      <span style={{ color: "var(--color-graphite)" }}>{t('demo.andHere')}</span>
    </div>
  );
}
