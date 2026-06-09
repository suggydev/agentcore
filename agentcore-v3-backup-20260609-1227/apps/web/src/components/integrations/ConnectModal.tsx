'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink } from 'lucide-react';
import type { Provider, AgentIntegration, ConfigField, Mode } from './types';

function getApiBase(): string {
  return process.env.NEXT_PUBLIC_API_URL || '';
}

const OAUTH_PROVIDERS = ['amocrm', 'bitrix24', 'google_drive', 'yandex360'];

const FALLBACK_MODES: Record<string, Mode[]> = {
  telegram: [
    {
      id: 'bot',
      label: 'Бот',
      fields: [{ key: 'token', label: 'Токен бота', type: 'password', required: true }],
    },
    {
      id: 'user',
      label: 'Пользователь',
      fields: [
        { key: 'apiId', label: 'API ID', type: 'number', required: true },
        { key: 'apiHash', label: 'API Hash', type: 'password', required: true },
        { key: 'phone', label: 'Телефон', type: 'text', required: true },
      ],
    },
  ],
  whatsapp: [
    {
      id: 'cloud_api',
      label: 'Cloud API',
      fields: [{ key: 'token', label: 'Токен Cloud API', type: 'password', required: true }],
    },
    {
      id: 'web',
      label: 'Web (QR)',
      fields: [],
    },
  ],
  vk: [
    {
      id: 'group',
      label: 'Группа',
      fields: [{ key: 'groupToken', label: 'Токен группы', type: 'password', required: true }],
    },
    {
      id: 'user',
      label: 'Пользователь',
      fields: [{ key: 'accessToken', label: 'Access Token', type: 'password', required: true }],
    },
  ],
};

interface ConnectModalProps {
  open: boolean;
  onClose: () => void;
  provider: Provider | null;
  integration?: AgentIntegration | null;
  agentId: string;
  onConnect: (providerId: string, mode: string | null, config: Record<string, unknown>) => Promise<void>;
  onUpdate: (integrationId: string, config: Record<string, unknown>) => Promise<void>;
  onDisconnect: (integrationId: string) => Promise<void>;
}

export default function ConnectModal({
  open,
  onClose,
  provider,
  integration,
  agentId,
  onConnect,
  onUpdate,
  onDisconnect,
}: ConnectModalProps) {
  const [mode, setMode] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const modes = useMemo<Mode[]>(() => {
    if (!provider) return [];
    return provider.modes?.length ? provider.modes : FALLBACK_MODES[provider.id] || [];
  }, [provider]);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setLoading(false);
    if (integration) {
      setMode(integration.mode || null);
      const initial: Record<string, string> = {};
      for (const [k, v] of Object.entries(integration.config)) {
        if (v !== undefined && v !== null) initial[k] = String(v);
      }
      setFormValues(initial);
    } else if (provider) {
      const defaultMode = modes[0]?.id ?? null;
      setMode(defaultMode);
      setFormValues({});
    } else {
      setMode(null);
      setFormValues({});
    }
  }, [open, provider, integration, modes]);

  const fields = useMemo<ConfigField[]>(() => {
    if (!provider) return [];
    const base = [...(provider.configFields || [])];
    const modeFields = modes.find((m) => m.id === mode)?.fields || [];
    const map = new Map(base.map((f) => [f.key, f]));
    for (const f of modeFields) {
      map.set(f.key, f);
    }
    return Array.from(map.values());
  }, [provider, modes, mode]);

  const isOAuthProvider = provider
    ? OAUTH_PROVIDERS.includes(provider.id) || !!provider.oauthUrl
    : false;

  const showQrPlaceholder = provider?.id === 'whatsapp' && mode === 'web';

  function handleFieldChange(key: string, value: string) {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  }

  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  function handleOAuth() {
    if (!provider) return;
    const url =
      provider.oauthUrl ||
      `${getApiBase()}/api/integrations/oauth/${provider.id}?agentId=${encodeURIComponent(agentId)}`;
    const popup = window.open(url, 'OAuth', 'width=600,height=700,scrollbars=yes,resizable=yes');
    if (!popup) {
      setError('Не удалось открыть окно авторизации. Разрешите всплывающие окна.');
      return;
    }
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    pollIntervalRef.current = setInterval(() => {
      if (popup.closed) {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
        onClose();
      }
    }, 500);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!provider) return;
    setError(null);
    setLoading(true);
    try {
      const config: Record<string, unknown> = {};
      for (const field of fields) {
        const val = formValues[field.key];
        if (field.required && (!val || val.trim() === '')) {
          throw new Error(`Поле "${field.label}" обязательно для заполнения`);
        }
        if (field.type === 'number') {
          config[field.key] = val ? Number(val) : undefined;
        } else {
          config[field.key] = val;
        }
      }
      if (integration) {
        await onUpdate(integration.id, config);
      } else {
        await onConnect(provider.id, mode, config);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
    } finally {
      setLoading(false);
    }
  }

  async function handleDisconnectClick() {
    if (!integration) return;
    setLoading(true);
    try {
      await onDisconnect(integration.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка отключения');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      {open && provider && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-lg overflow-hidden rounded-card bg-surface shadow-lg dark:bg-slate-800"
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border px-6 py-4 dark:border-slate-700">
              <h2 className="heading-4 text-text dark:text-white">
                {integration ? 'Настроить' : 'Подключить'} {provider.name}
              </h2>
              <button
                onClick={onClose}
                className="rounded-button p-1 text-text-muted transition-colors hover:bg-surface-2 dark:text-slate-400 dark:hover:bg-slate-700"
                type="button"
                aria-label="Закрыть"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 py-4">
              {isOAuthProvider && (
                <button type="button" onClick={handleOAuth} className="btn-primary mb-4 w-full">
                  <ExternalLink className="h-4 w-4" />
                  Подключить через OAuth
                </button>
              )}

              {modes.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-2">
                  {modes.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMode(m.id)}
                      className={`rounded-button px-3 py-1.5 text-sm font-medium transition-colors ${
                        mode === m.id
                          ? 'bg-brand text-white'
                          : 'bg-surface-2 text-text-secondary hover:bg-surface-3 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              )}

              {showQrPlaceholder && (
                <div className="mb-4 flex flex-col items-center justify-center rounded-card border-2 border-dashed border-border p-8 dark:border-slate-600">
                  <div className="mb-3 h-32 w-32 animate-pulse rounded-lg bg-surface-2 dark:bg-slate-700" />
                  <p className="body-small text-text-muted">QR-код появится здесь</p>
                  <p className="caption mt-1 text-text-muted">После подключения через Web (QR)</p>
                </div>
              )}

              {error && (
                <div className="mb-4 rounded-button bg-danger-soft p-3 text-sm text-danger">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {fields.map((field) => (
                  <div key={field.key} className="flex flex-col gap-1.5">
                    <label className="label text-text-secondary">
                      {field.label}
                      {field.required && <span className="ml-1 text-danger">*</span>}
                    </label>
                    {field.type === 'select' ? (
                      <select
                        className="rounded-button border border-border bg-surface px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-brand dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                        value={formValues[field.key] || ''}
                        onChange={(e) => handleFieldChange(field.key, e.target.value)}
                        required={field.required}
                      >
                        <option value="">Выберите...</option>
                        {field.options?.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : field.type === 'textarea' ? (
                      <textarea
                        className="rounded-button border border-border bg-surface px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-brand dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                        rows={3}
                        value={formValues[field.key] || ''}
                        onChange={(e) => handleFieldChange(field.key, e.target.value)}
                        required={field.required}
                      />
                    ) : (
                      <input
                        type={
                          field.type === 'password'
                            ? 'password'
                            : field.type === 'number'
                              ? 'number'
                              : 'text'
                        }
                        className="rounded-button border border-border bg-surface px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-brand dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                        value={formValues[field.key] || ''}
                        onChange={(e) => handleFieldChange(field.key, e.target.value)}
                        required={field.required}
                      />
                    )}
                  </div>
                ))}

                <div className="mt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="btn-secondary flex-1"
                    disabled={loading}
                  >
                    Отмена
                  </button>
                  {integration && (
                    <button
                      type="button"
                      onClick={handleDisconnectClick}
                      className="btn-secondary flex-1 text-danger"
                      disabled={loading}
                    >
                      Отключить
                    </button>
                  )}
                  <button type="submit" className="btn-primary flex-1" disabled={loading}>
                    {loading ? 'Сохранение...' : integration ? 'Сохранить' : 'Подключить'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
