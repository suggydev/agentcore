import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  verifyAdmin,
  validateAdminToken,
  getAdminConfig,
  updateAdminConfig,
  executeSupabaseSQL,
  getServiceStatus,
} from "@/lib/admin-config.functions";
import {
  Lock,
  Database,
  Key,
  Server,
  Play,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  Eye,
  EyeOff,
  Copy,
  Save,
  Terminal,
  BookOpen,
  ExternalLink,
  Shield,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  component: AdminConfigPage,
});

type TabId = "supabase" | "integrations" | "service" | "status" | "sql" | "guide";

const TABS: { id: TabId; label: string; icon: any }[] = [
  { id: "supabase", label: "Supabase", icon: Database },
  { id: "integrations", label: "Интеграции", icon: Key },
  { id: "service", label: "Сервис", icon: Server },
  { id: "status", label: "Статусы", icon: Shield },
  { id: "sql", label: "SQL", icon: Terminal },
  { id: "guide", label: "Инструкции", icon: BookOpen },
];

type ConfigKey = string;
type ConfigMap = Record<ConfigKey, { value: string; masked: string; set: boolean }>;

function AdminConfigPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [authToken, setAuthToken] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("admin_token");
    }
    return null;
  });
  const [adminSecret, setAdminSecret] = useState<string>("");
  const [authLoading, setAuthLoading] = useState(false);
  const [tab, setTab] = useState<TabId>("supabase");

  const $verify = useServerFn(verifyAdmin);
  const $validate = useServerFn(validateAdminToken);

  useEffect(() => {
    if (authToken) {
      $validate({ data: { token: authToken } })
        .then(() => {
          setAuthenticated(true);
          setAdminSecret(authToken);
        })
        .catch(() => {
          localStorage.removeItem("admin_token");
          setAuthToken(null);
          setAuthenticated(false);
        });
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setAuthLoading(true);
    try {
      const r = await $verify({ data: { password } });
      setAuthToken(r.token);
      localStorage.setItem("admin_token", r.token);
      setAuthenticated(true);
      setAdminSecret(r.token);
      setPassword("");
    } catch (e: any) {
      toast.error(e.message || "Ошибка авторизации");
    }
    setAuthLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    setAuthToken(null);
    setAuthenticated(false);
  };

  if (!authenticated) {
    return (
      <div className="admin-page">
        <div className="admin-login-wrapper">
          <div className="admin-login-card">
            <div className="admin-login-icon">
              <Shield size={32} />
            </div>
            <h1 className="admin-login-title">AgentCore Admin</h1>
            <p className="admin-login-sub">Введите пароль для доступа к настройкам сервера</p>
            <form onSubmit={handleLogin} className="admin-login-form">
              <div className="admin-field">
                <input
                  type="password"
                  placeholder="Пароль администратора"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                  className="admin-input"
                />
              </div>
              <button type="submit" className="admin-btn-primary" disabled={authLoading}>
                {authLoading ? <Loader2 className="animate-spin" size={16} /> : <><Lock size={14} /> Войти</>}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div>
          <div className="admin-header-eyebrow">Server Configuration</div>
          <h1 className="admin-header-title">AgentCore Admin</h1>
        </div>
        <button className="admin-btn-ghost" onClick={handleLogout}>
          <Lock size={14} /> Выйти
        </button>
      </header>

      <div className="admin-tabs">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              className={`admin-tab ${tab === t.id ? "active" : ""}`}
              onClick={() => setTab(t.id)}
            >
              <Icon size={14} /> {t.label}
            </button>
          );
        })}
      </div>

      <div className="admin-content">
        {tab === "supabase" && <SupabaseTab password={adminSecret} />}
        {tab === "integrations" && <IntegrationsTab password={adminSecret} />}
        {tab === "service" && <ServiceTab password={adminSecret} />}
        {tab === "status" && <StatusTab password={adminSecret} />}
        {tab === "sql" && <SQLTab password={adminSecret} />}
        {tab === "guide" && <GuideTab />}
      </div>
    </div>
  );
}

const SUPABASE_FIELDS: { key: string; label: string; placeholder: string; type?: string }[] = [
  { key: "SUPABASE_URL", label: "Supabase URL", placeholder: "https://your-project.supabase.co" },
  { key: "SUPABASE_PUBLISHABLE_KEY", label: "Anon Key (publishable)", placeholder: "eyJhbGci...", type: "password" },
  { key: "SUPABASE_SERVICE_ROLE_KEY", label: "Service Role Key", placeholder: "eyJhbGci...", type: "password" },
  { key: "VITE_SUPABASE_URL", label: "Vite Supabase URL", placeholder: "https://your-project.supabase.co" },
  { key: "VITE_SUPABASE_PROJECT_ID", label: "Vite Project ID", placeholder: "your-project-id" },
  { key: "VITE_SUPABASE_PUBLISHABLE_KEY", label: "Vite Anon Key", placeholder: "eyJhbGci...", type: "password" },
];

function SupabaseTab({ password }: { password: string }) {
  const $get = useServerFn(getAdminConfig);
  const $save = useServerFn(updateAdminConfig);
  const [config, setConfig] = useState<ConfigMap | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [showValues, setShowValues] = useState<Record<string, boolean>>({});
  const [restartNeeded, setRestartNeeded] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await $get({ data: { password } });
      setConfig(r.keys);
      const initial: Record<string, string> = {};
      for (const f of SUPABASE_FIELDS) {
        initial[f.key] = r.keys[f.key]?.value ?? "";
      }
      setForm(initial);
    } catch (e: any) {
      toast.error(e.message);
    }
    setLoading(false);
  }, [password]);

  useEffect(() => { load(); }, [load]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const values: Record<string, string> = {};
      for (const f of SUPABASE_FIELDS) {
        if (form[f.key] !== undefined) values[f.key] = form[f.key];
      }
      const r = await $save({ data: { password, values } });
      toast.success("Конфигурация Supabase сохранена");
      if (r.restartNeeded) setRestartNeeded(true);
      await load();
    } catch (e: any) {
      toast.error(e.message);
    }
    setSaving(false);
  };

  if (loading) return <div className="admin-panel-empty"><Loader2 className="animate-spin" size={16} /> Загрузка…</div>;

  return (
    <form onSubmit={save} className="admin-section">
      <div className="admin-section-head">
        <Database size={16} /> Supabase Configuration
      </div>
      <div className="admin-section-body">
        {config && (
          <div className="admin-status-grid">
            {SUPABASE_FIELDS.map((f) => (
              <div key={f.key} className="admin-status-item">
                <span className="admin-status-key">{f.key}</span>
                {config[f.key]?.set ? (
                  <span className="admin-status-badge ok"><CheckCircle2 size={10} /> настроен</span>
                ) : (
                  <span className="admin-status-badge err"><XCircle size={10} /> не задан</span>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="admin-fields">
          {SUPABASE_FIELDS.map((f) => (
            <div key={f.key} className="admin-field-group">
              <label className="admin-label">{f.label}</label>
              <div className="admin-input-row">
                <input
                  type={showValues[f.key] ? "text" : (f.type || "text")}
                  className="admin-input"
                  placeholder={f.placeholder}
                  value={form[f.key] ?? ""}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                />
                {(f.type === "password") && (
                  <button
                    type="button"
                    className="admin-btn-icon"
                    onClick={() => setShowValues({ ...showValues, [f.key]: !showValues[f.key] })}
                  >
                    {showValues[f.key] ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                )}
              </div>
              {config?.[f.key]?.set && (
                <div className="admin-hint">Текущее: <code>{config[f.key].masked}</code></div>
              )}
            </div>
          ))}
        </div>

        <div className="admin-actions">
          <button type="submit" className="admin-btn-primary" disabled={saving}>
            {saving ? <Loader2 className="animate-spin" size={14} /> : <><Save size={14} /> Сохранить</>}
          </button>
          <button type="button" className="admin-btn-ghost" onClick={load}>
            <RefreshCw size={14} /> Обновить
          </button>
        </div>

        {restartNeeded && (
          <div className="admin-notice">
            <AlertCircle size={14} />
            <span>Конфигурация сохранена в файл. Для применения изменений требуется перезапуск сервиса: <code>systemctl restart agentcore-web</code></span>
          </div>
        )}
      </div>
    </form>
  );
}

const INTEGRATION_FIELDS: { key: string; label: string; placeholder: string; group: string; type?: string }[] = [
  { key: "YOOKASSA_SHOP_ID", label: "Shop ID", placeholder: "12345", group: "YooKassa" },
  { key: "YOOKASSA_SECRET_KEY", label: "Secret Key", placeholder: "test_...", type: "password", group: "YooKassa" },
  { key: "SLACK_CLIENT_ID", label: "Client ID", placeholder: "1234567890.12345678", group: "Slack" },
  { key: "SLACK_CLIENT_SECRET", label: "Client Secret", placeholder: "abc123...", type: "password", group: "Slack" },
  { key: "SLACK_SIGNING_SECRET", label: "Signing Secret", placeholder: "abc123...", type: "password", group: "Slack" },
  { key: "TWILIO_ACCOUNT_SID", label: "Account SID", placeholder: "ACxxxx...", group: "Twilio" },
  { key: "TWILIO_AUTH_TOKEN", label: "Auth Token", placeholder: "abc123...", type: "password", group: "Twilio" },
  { key: "RESEND_API_KEY", label: "API Key", placeholder: "re_...", type: "password", group: "Resend" },
  { key: "OPENAI_API_KEY", label: "API Key", placeholder: "sk-...", type: "password", group: "OpenAI" },
  { key: "ANTHROPIC_API_KEY", label: "API Key", placeholder: "sk-ant-...", type: "password", group: "Anthropic" },
  { key: "LOVABLE_AI_GATEWAY_KEY", label: "Gateway Key", placeholder: "lv_...", type: "password", group: "Lovable AI" },
];

const INTEGRATION_GROUPS = [...new Set(INTEGRATION_FIELDS.map((f) => f.group))];

function IntegrationsTab({ password }: { password: string }) {
  const $get = useServerFn(getAdminConfig);
  const $save = useServerFn(updateAdminConfig);
  const [config, setConfig] = useState<ConfigMap | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [showValues, setShowValues] = useState<Record<string, boolean>>({});
  const [restartNeeded, setRestartNeeded] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    Object.fromEntries(INTEGRATION_GROUPS.map((g) => [g, true])),
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await $get({ data: { password } });
      setConfig(r.keys);
      const initial: Record<string, string> = {};
      for (const f of INTEGRATION_FIELDS) {
        initial[f.key] = r.keys[f.key]?.value ?? "";
      }
      setForm(initial);
    } catch (e: any) {
      toast.error(e.message);
    }
    setLoading(false);
  }, [password]);

  useEffect(() => { load(); }, [load]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const values: Record<string, string> = {};
      for (const f of INTEGRATION_FIELDS) {
        if (form[f.key] !== undefined) values[f.key] = form[f.key];
      }
      const r = await $save({ data: { password, values } });
      toast.success("Ключи интеграций сохранены");
      if (r.restartNeeded) setRestartNeeded(true);
      await load();
    } catch (e: any) {
      toast.error(e.message);
    }
    setSaving(false);
  };

  if (loading) return <div className="admin-panel-empty"><Loader2 className="animate-spin" size={16} /> Загрузка…</div>;

  return (
    <form onSubmit={save} className="admin-section">
      <div className="admin-section-head">
        <Key size={16} /> Integration Keys
      </div>
      <div className="admin-section-body">
        {config && (
          <div className="admin-status-grid">
            {INTEGRATION_FIELDS.map((f) => (
              <div key={f.key} className="admin-status-item">
                <span className="admin-status-key">{f.key}</span>
                {config[f.key]?.set ? (
                  <span className="admin-status-badge ok"><CheckCircle2 size={10} /> настроен</span>
                ) : (
                  <span className="admin-status-badge err"><XCircle size={10} /> не задан</span>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="admin-fields">
          {INTEGRATION_GROUPS.map((group) => {
            const fields = INTEGRATION_FIELDS.filter((f) => f.group === group);
            const allSet = fields.every((f) => config?.[f.key]?.set);
            const expanded = expandedGroups[group];
            return (
              <div key={group} className="admin-group">
                <button
                  type="button"
                  className="admin-group-header"
                  onClick={() => setExpandedGroups({ ...expandedGroups, [group]: !expanded })}
                >
                  {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  <span>{group}</span>
                  {allSet ? (
                    <span className="admin-status-badge ok" style={{ marginLeft: "auto" }}><CheckCircle2 size={10} /> настроен</span>
                  ) : (
                    <span className="admin-status-badge err" style={{ marginLeft: "auto" }}><XCircle size={10} /> требует настройки</span>
                  )}
                </button>
                {expanded && fields.map((f) => (
                  <div key={f.key} className="admin-field-group">
                    <label className="admin-label">{f.label}</label>
                    <div className="admin-input-row">
                      <input
                        type={showValues[f.key] ? "text" : (f.type || "text")}
                        className="admin-input"
                        placeholder={f.placeholder}
                        value={form[f.key] ?? ""}
                        onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                      />
                      {f.type === "password" && (
                        <button
                          type="button"
                          className="admin-btn-icon"
                          onClick={() => setShowValues({ ...showValues, [f.key]: !showValues[f.key] })}
                        >
                          {showValues[f.key] ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      )}
                    </div>
                    {config?.[f.key]?.set && (
                      <div className="admin-hint">Текущее: <code>{config[f.key].masked}</code></div>
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        <div className="admin-actions">
          <button type="submit" className="admin-btn-primary" disabled={saving}>
            {saving ? <Loader2 className="animate-spin" size={14} /> : <><Save size={14} /> Сохранить все</>}
          </button>
          <button type="button" className="admin-btn-ghost" onClick={load}>
            <RefreshCw size={14} /> Обновить
          </button>
        </div>

        {restartNeeded && (
          <div className="admin-notice">
            <AlertCircle size={14} />
            <span>Конфигурация сохранена. Для применения: <code>systemctl restart agentcore-web</code></span>
          </div>
        )}
      </div>
    </form>
  );
}

const SERVICE_FIELDS: { key: string; label: string; placeholder: string; type?: string; desc: string }[] = [
  {
    key: "AGENTCORE_ENCRYPTION_KEY",
    label: "Encryption Key",
    placeholder: "openssl rand -hex 32",
    type: "password",
    desc: "32-байтный hex-ключ для AES-256-GCM шифрования секретов. Сгенерируйте: openssl rand -hex 32",
  },
  {
    key: "ADMIN_PASSWORD",
    label: "Admin Password",
    placeholder: "agentcore2026",
    type: "password",
    desc: "Пароль для доступа к этой странице администрирования. По умолчанию: agentcore2026",
  },
];

function ServiceTab({ password }: { password: string }) {
  const $get = useServerFn(getAdminConfig);
  const $save = useServerFn(updateAdminConfig);
  const [config, setConfig] = useState<ConfigMap | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [showValues, setShowValues] = useState<Record<string, boolean>>({});
  const [restartNeeded, setRestartNeeded] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await $get({ data: { password } });
      setConfig(r.keys);
      const initial: Record<string, string> = {};
      for (const f of SERVICE_FIELDS) {
        initial[f.key] = r.keys[f.key]?.value ?? "";
      }
      setForm(initial);
    } catch (e: any) {
      toast.error(e.message);
    }
    setLoading(false);
  }, [password]);

  useEffect(() => { load(); }, [load]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const values: Record<string, string> = {};
      for (const f of SERVICE_FIELDS) {
        if (form[f.key] !== undefined) values[f.key] = form[f.key];
      }
      const r = await $save({ data: { password, values } });
      toast.success("Сервисная конфигурация сохранена");
      if (r.restartNeeded) setRestartNeeded(true);
      await load();
    } catch (e: any) {
      toast.error(e.message);
    }
    setSaving(false);
  };

  if (loading) return <div className="admin-panel-empty"><Loader2 className="animate-spin" size={16} /> Загрузка…</div>;

  return (
    <form onSubmit={save} className="admin-section">
      <div className="admin-section-head">
        <Server size={16} /> Service Configuration
      </div>
      <div className="admin-section-body">
        {config && (
          <div className="admin-status-grid">
            {SERVICE_FIELDS.map((f) => (
              <div key={f.key} className="admin-status-item">
                <span className="admin-status-key">{f.key}</span>
                {config[f.key]?.set ? (
                  <span className="admin-status-badge ok"><CheckCircle2 size={10} /> настроен</span>
                ) : (
                  <span className="admin-status-badge err"><XCircle size={10} /> не задан</span>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="admin-fields">
          {SERVICE_FIELDS.map((f) => (
            <div key={f.key} className="admin-field-group">
              <label className="admin-label">{f.label}</label>
              <div className="admin-input-row">
                <input
                  type={showValues[f.key] ? "text" : (f.type || "text")}
                  className="admin-input"
                  placeholder={f.placeholder}
                  value={form[f.key] ?? ""}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                />
                {f.type === "password" && (
                  <button
                    type="button"
                    className="admin-btn-icon"
                    onClick={() => setShowValues({ ...showValues, [f.key]: !showValues[f.key] })}
                  >
                    {showValues[f.key] ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                )}
              </div>
              <div className="admin-hint">{f.desc}</div>
              {config?.[f.key]?.set && (
                <div className="admin-hint">Текущее: <code>{config[f.key].masked}</code></div>
              )}
            </div>
          ))}
        </div>

        <div className="admin-actions">
          <button type="submit" className="admin-btn-primary" disabled={saving}>
            {saving ? <Loader2 className="animate-spin" size={14} /> : <><Save size={14} /> Сохранить</>}
          </button>
          <button type="button" className="admin-btn-ghost" onClick={load}>
            <RefreshCw size={14} /> Обновить
          </button>
        </div>

        {restartNeeded && (
          <div className="admin-notice">
            <AlertCircle size={14} />
            <span>Конфигурация сохранена. Для применения: <code>systemctl restart agentcore-web</code></span>
          </div>
        )}
      </div>
    </form>
  );
}

function StatusTab({ password }: { password: string }) {
  const $status = useServerFn(getServiceStatus);
  const [services, setServices] = useState<Array<{ name: string; label: string; status: string; active: boolean }>>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await $status({ data: { password } });
      setServices(r.services);
    } catch (e: any) {
      toast.error(e.message);
    }
    setLoading(false);
  }, [password]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="admin-section">
      <div className="admin-section-head">
        <Shield size={16} /> Service Status
        <button className="admin-btn-ghost" style={{ marginLeft: "auto" }} onClick={load} disabled={loading}>
          <RefreshCw size={14} /> Обновить
        </button>
      </div>
      <div className="admin-section-body">
        {loading ? (
          <div className="admin-panel-empty"><Loader2 className="animate-spin" size={16} /> Проверка статусов…</div>
        ) : (
          <div className="admin-status-table">
            {services.map((s) => (
              <div key={s.name} className="admin-status-row">
                <div className="admin-status-label">{s.label}</div>
                <div className="admin-status-name"><code>{s.name}</code></div>
                <div>
                  {s.active ? (
                    <span className="admin-status-badge ok"><CheckCircle2 size={10} /> {s.status}</span>
                  ) : (
                    <span className="admin-status-badge err"><XCircle size={10} /> {s.status}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SQLTab({ password }: { password: string }) {
  const $exec = useServerFn(executeSupabaseSQL);
  const [sql, setSql] = useState("");
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const execute = async () => {
    if (!sql.trim()) return;
    setExecuting(true);
    setResult(null);
    setError(null);
    try {
      const r = await $exec({ data: { password, sql } });
      setResult(r.result);
      toast.success("SQL выполнен успешно");
    } catch (e: any) {
      setError(e.message);
      toast.error(e.message);
    }
    setExecuting(false);
  };

  return (
    <div className="admin-section">
      <div className="admin-section-head">
        <Terminal size={16} /> Execute SQL
      </div>
      <div className="admin-section-body">
        <p className="admin-desc">
          Выполните SQL-запросы напрямую в базе данных Supabase через Service Role Key.
          Используйте для применения миграций, RLS-политик и других изменений схемы.
        </p>
        <textarea
          className="admin-textarea"
          rows={12}
          placeholder="-- Вставьте SQL здесь&#10;CREATE TABLE IF NOT EXISTS ...;&#10;ALTER TABLE ... ENABLE ROW LEVEL SECURITY;&#10;CREATE POLICY ... ON ... FOR ...;"
          value={sql}
          onChange={(e) => setSql(e.target.value)}
        />
        <div className="admin-actions">
          <button className="admin-btn-primary" onClick={execute} disabled={executing || !sql.trim()}>
            {executing ? <Loader2 className="animate-spin" size={14} /> : <><Play size={14} /> Выполнить SQL</>}
          </button>
          <button
            type="button"
            className="admin-btn-ghost"
            onClick={() => { navigator.clipboard.writeText(sql); toast.success("Скопировано"); }}
          >
            <Copy size={14} /> Копировать
          </button>
          <button type="button" className="admin-btn-ghost" onClick={() => setSql("")}>
            Очистить
          </button>
        </div>
        {error && (
          <div className="admin-error">
            <AlertCircle size={14} />
            <pre className="admin-pre">{error}</pre>
          </div>
        )}
        {result && (
          <div className="admin-result">
            <div className="admin-result-head"><CheckCircle2 size={14} /> Результат</div>
            <pre className="admin-pre">{typeof result === "string" ? result : JSON.stringify(result, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}

function GuideTab() {
  return (
    <div className="admin-section">
      <div className="admin-section-head">
        <BookOpen size={16} /> Setup Instructions
      </div>
      <div className="admin-section-body">
        <div className="admin-guide">
          <GuideSection title="Supabase" icon={<Database size={16} />}>
            <ol className="admin-guide-steps">
              <li>Перейдите в <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer">Supabase Dashboard <ExternalLink size={10} /></a></li>
              <li>Выберите проект (или создайте новый)</li>
              <li>Откройте <strong>Settings → API</strong></li>
              <li>Скопируйте <strong>Project URL</strong> → это <code>SUPABASE_URL</code> и <code>VITE_SUPABASE_URL</code></li>
              <li>Скопируйте <strong>Project ID</strong> из URL → это <code>VITE_SUPABASE_PROJECT_ID</code></li>
              <li>Скопируйте <strong>anon/public</strong> ключ → это <code>SUPABASE_PUBLISHABLE_KEY</code> и <code>VITE_SUPABASE_PUBLISHABLE_KEY</code></li>
              <li>Скопируйте <strong>service_role</strong> ключ → это <code>SUPABASE_SERVICE_ROLE_KEY</code> <span className="admin-warn">⚠️ Никогда не показывайте публично!</span></li>
            </ol>
            <div className="admin-guide-note">
              <strong>Что делают эти ключи:</strong>
              <ul>
                <li><code>SUPABASE_URL</code> — базовый URL вашего проекта Supabase, используется сервером для подключения</li>
                <li><code>SUPABASE_PUBLISHABLE_KEY</code> (anon key) — публичный ключ для клиентских запросов, ограничен RLS-политиками</li>
                <li><code>SUPABASE_SERVICE_ROLE_KEY</code> — полный доступ к БД, обходит RLS. Используется сервером для административных операций</li>
                <li><code>VITE_*</code> — переменные, доступные на клиенте. URL и anon key нужны фронтенду для инициализации Supabase клиента</li>
              </ul>
            </div>
          </GuideSection>

          <GuideSection title="YooKassa" icon={<Key size={16} />}>
            <ol className="admin-guide-steps">
              <li>Зарегистрируйтесь на <a href="https://yookassa.ru" target="_blank" rel="noopener noreferrer">yookassa.ru <ExternalLink size={10} /></a></li>
              <li>В личном кабинете откройте <strong>Настройки → API-ключи</strong></li>
              <li>Скопируйте <strong>shopId</strong> → это <code>YOOKASSA_SHOP_ID</code></li>
              <li>Создайте API-ключ → <code>YOOKASSA_SECRET_KEY</code></li>
              <li>Настройте вебхук на URL вашего сервера: <code>/api/public/yookassa-webhook</code></li>
            </ol>
            <div className="admin-guide-note">
              <strong>Что делают:</strong> YooKassa обрабатывает платежи (подписки, пополнение баланса). Shop ID идентифицирует ваш магазин, Secret Key используется для подписи запросов.
            </div>
          </GuideSection>

          <GuideSection title="Slack" icon={<Key size={16} />}>
            <ol className="admin-guide-steps">
              <li>Перейдите в <a href="https://api.slack.com/apps" target="_blank" rel="noopener noreferrer">Slack API Applications <ExternalLink size={10} /></a></li>
              <li>Нажмите <strong>Create New App → From scratch</strong></li>
              <li>В <strong>Basic Information</strong> скопируйте <strong>Client ID</strong> и <strong>Client Secret</strong></li>
              <li>В <strong>Signing Secret</strong> скопируйте верификационный токен</li>
              <li>В <strong>OAuth & Permissions</strong> добавьте redirect URL: <code>{`YOUR_URL/api/public/slack-callback`}</code></li>
              <li>Добавьте нужные scopes: <code>chat:write</code>, <code>channels:read</code>, <code>groups:read</code></li>
              <li>Включите <strong>Event Subscriptions</strong>, укажите URL: <code>{`YOUR_URL/api/public/slack-events`}</code></li>
            </ol>
            <div className="admin-guide-note">
              <strong>Что делают:</strong> Slack интеграция позволяет агентам отправлять уведомления в каналы, читать сообщения и отвечать на них.
            </div>
          </GuideSection>

          <GuideSection title="Twilio" icon={<Key size={16} />}>
            <ol className="admin-guide-steps">
              <li>Зарегистрируйтесь на <a href="https://www.twilio.com/try-twilio" target="_blank" rel="noopener noreferrer">twilio.com <ExternalLink size={10} /></a></li>
              <li>На Dashboard скопируйте <strong>Account SID</strong> → <code>TWILIO_ACCOUNT_SID</code></li>
              <li>Скопируйте <strong>Auth Token</strong> → <code>TWILIO_AUTH_TOKEN</code></li>
              <li>Купите номер телефона или используйте пробный</li>
            </ol>
            <div className="admin-guide-note">
              <strong>Что делают:</strong> Twilio используется для отправки SMS-уведомлений клиентам и OTP-кодов для двухфакторной аутентификации.
            </div>
          </GuideSection>

          <GuideSection title="Resend" icon={<Key size={16} />}>
            <ol className="admin-guide-steps">
              <li>Зарегистрируйтесь на <a href="https://resend.com" target="_blank" rel="noopener noreferrer">resend.com <ExternalLink size={10} /></a></li>
              <li>В Dashboard создайте API-ключ → <code>RESEND_API_KEY</code></li>
              <li>Верифицируйте домен отправителя в <strong>Domains</strong></li>
            </ol>
            <div className="admin-guide-note">
              <strong>Что делают:</strong> Resend отправляет транзакционные email (приглашения, уведомления, отчёты). Ключ даёт доступ к API отправки.
            </div>
          </GuideSection>

          <GuideSection title="OpenAI / Anthropic" icon={<Key size={16} />}>
            <ol className="admin-guide-steps">
              <li><strong>OpenAI:</strong> Перейдите в <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">OpenAI API Keys <ExternalLink size={10} /></a>, создайте ключ → <code>OPENAI_API_KEY</code></li>
              <li><strong>Anthropic:</strong> Перейдите в <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer">Anthropic Console <ExternalLink size={10} /></a>, создайте ключ → <code>ANTHROPIC_API_KEY</code></li>
              <li>Пополните баланс на каждом аккаунте</li>
            </ol>
            <div className="admin-guide-note">
              <strong>Что делают:</strong> API ключи используются Worker-сервисом для выполнения агентных задач — генерации ответов, анализа данных, обработки лидов.
              <code>LOVABLE_AI_GATEWAY_KEY</code> — ключ для AI Gateway, альтернативный способ доступа к моделям.
            </div>
          </GuideSection>

          <GuideSection title="AGENTCORE_ENCRYPTION_KEY" icon={<Shield size={16} />}>
            <ol className="admin-guide-steps">
              <li>Сгенерируйте 32-байтный ключ: <code>openssl rand -hex 32</code></li>
              <li>Вставьте результат в поле <code>AGENTCORE_ENCRYPTION_KEY</code></li>
              <li><span className="admin-warn">⚠️ Не меняйте ключ после того, как секреты уже зашифрованы — они станут нечитаемыми!</span></li>
            </ol>
            <div className="admin-guide-note">
              <strong>Что делает:</strong> Этот ключ используется для AES-256-GCM шифрования всех секретов (API ключи провайдеров, токены интеграций) перед сохранением в базу данных.
              Без него сервер не сможет расшифровать сохранённые ключи.
            </div>
          </GuideSection>
        </div>
      </div>
    </div>
  );
}

function GuideSection({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="admin-guide-section">
      <button className="admin-guide-toggle" onClick={() => setOpen(!open)}>
        {icon}
        <span>{title}</span>
        {open ? <ChevronDown size={14} style={{ marginLeft: "auto" }} /> : <ChevronRight size={14} style={{ marginLeft: "auto" }} />}
      </button>
      {open && <div className="admin-guide-content">{children}</div>}
    </div>
  );
}
