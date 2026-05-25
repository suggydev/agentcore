import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/auth";
import { useServerFn } from "@tanstack/react-start";
import { verify2FA } from "@/lib/two-factor.functions";
import { toast } from "sonner";
import { Loader2, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/login")({ component: LoginPage });

function LoginPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { session, workspace, loading, signOut } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [pending2FA, setPending2FA] = useState(false);
  const [totpCode, setTotpCode] = useState("");
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);

  const $verify2FA = useServerFn(verify2FA);

  useEffect(() => {
    if (!loading && session && !pending2FA) {
      navigate({ to: workspace.companyId ? "/app" : "/onboarding" });
    }
  }, [loading, session, workspace.companyId, navigate, pending2FA]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Login failed");
        return;
      }

      // Check if 2FA is required
      if (data.pending2FA) {
        setPendingUserId(data.userId);
        setPending2FA(true);
        return;
      }

      toast.success(t('login.welcomeBack'));
      // Refresh auth state (re-fetches /api/auth/me via the hook)
      window.location.href = workspace.companyId ? "/app" : "/onboarding";
    } catch (err: any) {
      toast.error(err.message ?? "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  const onVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingUserId || totpCode.length !== 6) return;
    setSubmitting(true);
    try {
      await $verify2FA({ data: { userId: pendingUserId, code: totpCode } });
      setPending2FA(false);
      toast.success(t('login.welcomeBack'));
      window.location.href = workspace.companyId ? "/app" : "/onboarding";
    } catch (err: any) {
      toast.error(err.message ?? t('login.invalidCode'));
    } finally {
      setSubmitting(false);
    }
  };

  if (pending2FA) {
    return (
      <AuthShell title={t('login.twoFactorTitle')} subtitle={t('login.twoFactorSubtitle')}>
        <form onSubmit={onVerify2FA} className="space-y-4">
          <div style={{ textAlign: "center", marginBottom: 8 }}>
            <ShieldCheck size={32} className="text-blue-600" style={{ margin: "0 auto 8px" }} />
          </div>
          <label className="auth-field">
            <span>{t('login.confirmationCode')}</span>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={totpCode}
              autoFocus
              onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
              style={{ textAlign: "center", fontFamily: "monospace", fontSize: 20, letterSpacing: 6 }}
              required
            />
          </label>
          <button type="submit" disabled={submitting || totpCode.length !== 6} className="auth-btn-primary">
            {submitting ? <Loader2 className="animate-spin" size={16} /> : t('login.confirm')}
          </button>
          <button
            type="button"
            className="auth-btn-secondary"
            onClick={async () => {
              await signOut();
              setPending2FA(false);
              setPendingUserId(null);
              setTotpCode("");
            }}
          >
            {t('common.cancel')}
          </button>
        </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell title={t('login.title')} subtitle={t('login.subtitle')}>
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label={t('login.email')} type="email" value={email} onChange={setEmail} required autoFocus />
        <Field label={t('login.password')} type="password" value={password} onChange={setPassword} required />
        <button type="submit" disabled={submitting} className="auth-btn-primary">
          {submitting ? <Loader2 className="animate-spin" size={16} /> : t('login.signIn')}
        </button>
      </form>
      <div className="auth-meta">
        <Link to="/forgot-password">{t('login.forgotPassword')}</Link>
        <span>·</span>
        <Link to="/signup" search={{ invite: undefined }}>{t('login.createAccount')}</Link>
      </div>
    </AuthShell>
  );
}

function Field({
  label, type, value, onChange, required, autoFocus,
}: { label: string; type: string; value: string; onChange: (v: string) => void; required?: boolean; autoFocus?: boolean }) {
  return (
    <label className="auth-field">
      <span>{label}</span>
      <input type={type} value={value} required={required} autoFocus={autoFocus} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

export function AuthShell({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" className="auth-brand">AgentCore</Link>
        <h1>{title}</h1>
        {subtitle && <p className="auth-sub">{subtitle}</p>}
        {children}
      </div>
    </div>
  );
}
