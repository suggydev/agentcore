'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  Save,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Lock,
  Smartphone,
  Globe,
  Clock,
  Trash2,
  Key,
  Eye,
  EyeOff,
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

function TwoFAEmailSection() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'idle' | 'sent' | 'verified'>('idle');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchStatus = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      try {
        const res = await fetch(`${API_BASE}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          setEnabled(data.settings?.twoFactorEnabled || false);
        }
      } catch (err) {
        console.error('[2FA] status fetch:', err);
      }
    };
    fetchStatus();
  }, []);

  const sendCode = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await fetch(`${API_BASE}/api/auth/2fa/send-code`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setStep('sent');
        setMessage('Код отправлен на ваш email. Проверьте папку "Входящие" и "Спам".');
        // Dev helper: show code in console
        if (data._devCode) {
          console.log('[2FA] Dev code:', data._devCode);
        }
      } else {
        setError(data.error || 'Не удалось отправить код');
      }
    } catch (err) {
      setError('Ошибка соединения');
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    const token = localStorage.getItem('token');
    if (!token || code.length !== 6) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/auth/2fa/verify`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (res.ok) {
        setStep('verified');
        setEnabled(true);
        setMessage('2FA успешно включена! При следующем входе потребуется код из email.');
        setCode('');
      } else {
        setError(data.error || 'Неверный код');
      }
    } catch (err) {
      setError('Ошибка соединения');
    } finally {
      setLoading(false);
    }
  };

  const disable2FA = async () => {
    const token = localStorage.getItem('token');
    if (!token || code.length !== 6) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/auth/2fa/disable`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (res.ok) {
        setEnabled(false);
        setStep('idle');
        setMessage('2FA отключена.');
        setCode('');
      } else {
        setError(data.error || 'Не удалось отключить 2FA');
      }
    } catch (err) {
      setError('Ошибка соединения');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {enabled ? (
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-success" />
            <p className="text-sm font-medium text-text">2FA включена (Email)</p>
          </div>
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="w-24 px-3 py-2 bg-surface rounded-xl border border-border text-sm text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-brand/30"
              />
              <button
                onClick={disable2FA}
                disabled={loading || code.length !== 6}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-danger/15 text-danger hover:bg-danger/25 transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : 'Отключить'}
              </button>
            </div>
            <p className="text-[10px] text-text-muted">Введите код из email для отключения</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-text-muted">При включении 2FA вы будете получать код подтверждения на email при каждом входе.</p>
          {step === 'idle' && (
            <button
              onClick={sendCode}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand text-white text-sm font-medium hover:bg-brand-hover transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Shield size={14} />}
              Включить 2FA
            </button>
          )}
          {step === 'sent' && (
            <div className="space-y-3">
              <p className="text-sm text-text">Введите 6-значный код из email:</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="w-32 px-3 py-2.5 bg-surface rounded-xl border border-border text-sm text-center tracking-[0.3em] focus:outline-none focus:ring-2 focus:ring-brand/30"
                  autoFocus
                />
                <button
                  onClick={verifyCode}
                  disabled={loading || code.length !== 6}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium bg-brand text-white hover:bg-brand-hover transition-colors disabled:opacity-50"
                >
                  {loading ? <Loader2 size={14} className="animate-spin" /> : 'Подтвердить'}
                </button>
              </div>
              <button onClick={sendCode} disabled={loading} className="text-xs text-brand hover:underline">
                Отправить код повторно
              </button>
            </div>
          )}
          {step === 'verified' && (
            <div className="flex items-center gap-2 text-sm text-success">
              <CheckCircle2 size={16} />
              <span>2FA включена</span>
            </div>
          )}
        </div>
      )}
      {message && <p className="text-sm text-success bg-success/10 px-3 py-2 rounded-lg">{message}</p>}
      {error && <p className="text-sm text-danger bg-danger/10 px-3 py-2 rounded-lg">{error}</p>}
    </div>
  );
}

interface Session {
  id: string;
  ip: string;
  userAgent: string;
  country?: string;
  city?: string;
  device?: string;
  success: boolean;
  createdAt: string;
}

interface SecurityTabProps {
  oldPassword: string;
  setOldPassword: (v: string) => void;
  newPassword: string;
  setNewPassword: (v: string) => void;
  confirmPassword: string;
  setConfirmPassword: (v: string) => void;
  passwordSaving: boolean;
  passwordSaved: boolean;
  passwordError: string;
  changePassword: () => void;
  container: any;
  item: any;
}

export default function SecurityTab({
  oldPassword, setOldPassword,
  newPassword, setNewPassword,
  confirmPassword, setConfirmPassword,
  passwordSaving, passwordSaved, passwordError,
  changePassword,
  container, item,
}: SecurityTabProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [apiKeys, setApiKeys] = useState<string[]>([]);
  const [apiKeyError, setApiKeyError] = useState('');
  const [apiKeySuccess, setApiKeySuccess] = useState('');

  const fetchSessions = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/auth/sessions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSessions(Array.isArray(data.sessions) ? data.sessions : []);
      }
    } catch (err) {
      console.error('[SecurityTab] fetchSessions:', err);
    } finally {
      setSessionsLoading(false);
    }
  }, []);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const generateApiKey = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setApiKeyError('');
    setApiKeySuccess('');
    try {
      const res = await fetch(`${API_BASE}/api/auth/api-keys`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'API Key ' + new Date().toLocaleDateString('ru-RU') }),
      });
      const data = await res.json();
      if (res.ok) {
        setApiKeys((prev) => [...prev, data.key]);
        setApiKeySuccess('API ключ создан. Скопируйте его сейчас — он больше не будет показан.');
      } else {
        setApiKeyError(data.error || 'Не удалось создать ключ');
      }
    } catch {
      setApiKeyError('Ошибка соединения');
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ru-RU', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
    });
  };

  const getDeviceIcon = (userAgent?: string) => {
    if (!userAgent) return Globe;
    const ua = userAgent.toLowerCase();
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) return Smartphone;
    return Globe;
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Password Change */}
      <motion.div variants={item} className="bg-surface rounded-2xl border border-[var(--border)] shadow-sm p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-[var(--accent-soft)] flex items-center justify-center ring-1 ring-[var(--border)]/60">
            <Lock className="w-5 h-5 text-[var(--brand)]" />
          </div>
          <div>
            <h3 className="font-semibold text-[var(--text)]">Смена пароля</h3>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">Обновите пароль для безопасности</p>
          </div>
        </div>
        <div className="max-w-md space-y-3">
          <div>
            <label className="block text-xs font-semibold text-[var(--text)] mb-1.5">Текущий пароль</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={oldPassword}
                onChange={(e) => { setOldPassword(e.target.value); }}
                placeholder="Введите текущий пароль"
                className="w-full px-3.5 py-2.5 pr-10 bg-surface rounded-xl border border-[var(--border)] text-sm text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus-visible:ring-[var(--brand)] focus-visible:border-[var(--brand)] transition-all duration-200"
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text)]"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--text)] mb-1.5">Новый пароль</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => { setNewPassword(e.target.value); }}
              placeholder="Минимум 6 символов"
              className="w-full px-3.5 py-2.5 bg-surface rounded-xl border border-[var(--border)] text-sm text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus-visible:ring-[var(--brand)] focus-visible:border-[var(--brand)] transition-all duration-200"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--text)] mb-1.5">Подтвердите новый пароль</label>
            <div className="flex gap-3">
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); }}
                placeholder="Повторите новый пароль"
                className="flex-1 px-3.5 py-2.5 bg-surface rounded-xl border border-[var(--border)] text-sm text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus-visible:ring-[var(--brand)] focus-visible:border-[var(--brand)] transition-all duration-200"
              />
              <button
                onClick={changePassword}
                disabled={passwordSaving || passwordSaved}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex-shrink-0 focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-1 ${
                  passwordSaved
                    ? 'bg-[var(--success-soft)] text-[var(--success)] border border-[var(--success-soft)]'
                    : 'bg-[var(--accent)] text-white hover:bg-[var(--accent)]'
                }`}
              >
                {passwordSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : passwordSaved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                {passwordSaved ? 'Сохранено' : 'Сменить'}
              </button>
            </div>
            {passwordError && <p className="mt-1.5 text-xs text-danger flex items-center gap-1"><AlertCircle size={12} />{passwordError}</p>}
          </div>
        </div>
      </motion.div>

      {/* 2FA Email */}
      <motion.div variants={item} className="bg-surface rounded-2xl border border-[var(--border)] shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[var(--accent-soft)] flex items-center justify-center ring-1 ring-[var(--border)]/60">
            <Shield className="w-5 h-5 text-[var(--brand)]" />
          </div>
          <div>
            <h3 className="font-semibold text-[var(--text)]">Двухфакторная аутентификация</h3>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">Email-подтверждение при входе</p>
          </div>
        </div>
        <TwoFAEmailSection />
      </motion.div>

      {/* Active Sessions */}
      <motion.div variants={item} className="bg-surface rounded-2xl border border-[var(--border)] shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[var(--accent-soft)] flex items-center justify-center ring-1 ring-[var(--border)]/60">
            <Globe className="w-5 h-5 text-[var(--brand)]" />
          </div>
          <div>
            <h3 className="font-semibold text-[var(--text)]">Активные сессии</h3>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">Устройства с доступом к аккаунту</p>
          </div>
        </div>
        {sessionsLoading ? (
          <div className="flex items-center gap-2 py-4">
            <Loader2 className="w-4 h-4 animate-spin text-[var(--brand)]" />
            <span className="text-sm text-[var(--text-muted)]">Загрузка сессий...</span>
          </div>
        ) : sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Clock className="w-8 h-8 text-[var(--text-muted)] mb-2" />
            <p className="text-sm text-[var(--text-muted)]">Нет записей о сессиях</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sessions.map((session) => {
              const DeviceIcon = getDeviceIcon(session.userAgent);
              return (
                <div key={session.id} className="flex items-center gap-3 p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
                  <div className="w-9 h-9 rounded-lg bg-[var(--accent-soft)] flex items-center justify-center flex-shrink-0">
                    <DeviceIcon size={16} className="text-[var(--brand)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text)] truncate">
                      {session.device || session.userAgent?.split(')')[0]?.split('(')[1] || 'Неизвестное устройство'}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {session.ip} · {session.city || ''} {session.country || ''} · {formatDate(session.createdAt)}
                    </p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${session.success ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger'}`}>
                    {session.success ? 'Успешно' : 'Ошибка'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* API Keys */}
      <motion.div variants={item} className="bg-surface rounded-2xl border border-[var(--border)] shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[var(--accent-soft)] flex items-center justify-center ring-1 ring-[var(--border)]/60">
            <Key className="w-5 h-5 text-[var(--brand)]" />
          </div>
          <div>
            <h3 className="font-semibold text-[var(--text)]">API Keys</h3>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">Доступ к API для интеграций</p>
          </div>
        </div>
        {apiKeySuccess && (
          <div className="p-3 rounded-xl bg-success-soft border border-[var(--success-soft)] text-success text-sm mb-3 flex items-start gap-2">
            <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">{apiKeySuccess}</p>
              {apiKeys.length > 0 && (
                <code className="mt-1 block bg-[var(--surface)] p-2 rounded-lg text-xs font-mono break-all">{apiKeys[apiKeys.length - 1]}</code>
              )}
            </div>
          </div>
        )}
        {apiKeyError && <p className="text-sm text-danger mb-3">{apiKeyError}</p>}
        <button
          onClick={generateApiKey}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--accent)] text-white text-sm font-semibold hover:bg-[var(--accent)] transition-all"
        >
          <Key size={16} />
          Создать API ключ
        </button>
      </motion.div>
    </motion.div>
  );
}
