'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plug,
  Loader2,
  Send,
  CheckCircle2,
  XCircle,
  Wifi,
  WifiOff,
  Unlink,
  TestTube,
  X,
  Plus,
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

interface Channel {
  id: string;
  name: string;
  type: string;
  status: 'connected' | 'disconnected' | 'error';
  connectedAt: string;
}

interface IntegrationsResponse {
  channels: Channel[];
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
};

function getStatusBadge(status: string) {
  switch (status) {
    case 'connected':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-success-soft text-success border border-success/20">
          <CheckCircle2 className="w-3 h-3" />
          Подключён
        </span>
      );
    case 'error':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-danger-soft text-danger border border-danger/20">
          <XCircle className="w-3 h-3" />
          Ошибка
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-accent-soft text-text-muted border border-border">
          <WifiOff className="w-3 h-3" />
          Отключён
        </span>
      );
  }
}

export default function IntegrationsPage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [connectingType, setConnectingType] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  useEffect(() => {
    if (!token) {
      window.location.href = '/login';
      return;
    }

    const load = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/integrations`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const json: IntegrationsResponse = await res.json();
          setChannels(Array.isArray(json.channels) ? json.channels : []);
        } else {
          // Graceful fallback — show empty state if API not ready
          setChannels([]);
        }
      } catch (err) {
        console.error('[IntegrationsPage]', err);
        setChannels([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [token]);

  const handleConnect = async (type: string) => {
    if (!token) return;
    setConnectingType(type);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/integrations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ type }),
      });
      if (res.ok) {
        const newChannel = await res.json();
        setChannels((prev) => [newChannel, ...prev]);
        setShowConnectModal(false);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || data.message || 'Не удалось подключить канал');
      }
    } catch (err) {
      console.error('[IntegrationsPage] connect:', err);
      setError('Ошибка соединения');
    } finally {
      setConnectingType(null);
    }
  };

  const handleDisconnect = async (id: string) => {
    if (!token) return;
    setDisconnectingId(id);
    // Optimistic
    setChannels((prev) => prev.filter((c) => c.id !== id));
    try {
      const res = await fetch(`${API_BASE}/api/integrations/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        // Revert on error — reload channels
        const reload = await fetch(`${API_BASE}/api/integrations`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (reload.ok) {
          const json = await reload.json();
          setChannels(Array.isArray(json.channels) ? json.channels : []);
        }
      }
    } catch (err) {
      console.error('[IntegrationsPage] disconnect:', err);
    } finally {
      setDisconnectingId(null);
    }
  };

  const handleTest = async (id: string) => {
    if (!token) return;
    setTestingId(id);
    try {
      const res = await fetch(`${API_BASE}/api/integrations/${id}/test`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setChannels((prev) =>
          prev.map((c) => (c.id === id ? { ...c, status: 'connected' as const } : c))
        );
      } else {
        setChannels((prev) =>
          prev.map((c) => (c.id === id ? { ...c, status: 'error' as const } : c))
        );
      }
    } catch (err) {
      console.error('[IntegrationsPage] test:', err);
    } finally {
      setTestingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]" role="status">
        <Loader2 className="w-8 h-8 text-brand animate-spin" aria-hidden="true" />
        <span className="sr-only">Загрузка интеграций...</span>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto" data-testid="integrations-page">
      <motion.div variants={container} initial="hidden" animate="show" className="mb-8">
        <motion.div variants={item}>
          <p className="text-[11px] font-semibold uppercase tracking-label text-brand mb-2">Интеграции</p>
          <h1 className="font-display font-bold text-3xl text-text tracking-tight">Интеграции</h1>
          <p className="text-text-muted mt-1 text-sm">Подключение каналов коммуникации с клиентами.</p>
        </motion.div>
      </motion.div>

      {/* Connect Telegram */}
      <motion.div variants={item} initial="hidden" animate="show" className="mb-6">
        <button
          onClick={() => {
            setShowConnectModal(true);
            setError('');
          }}
          data-testid="connect-telegram"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-accent transition-all duration-200 shadow-sm focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1"
        >
          <Plus className="w-4 h-4" />
          Подключить Telegram
        </button>
      </motion.div>

      {/* Channels List */}
      <motion.div variants={container} initial="hidden" animate="show" data-testid="channels-list">
        {channels.length === 0 ? (
          <motion.div variants={item} className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-accent-soft flex items-center justify-center mb-4 ring-1 ring-border/60">
              <Plug className="w-7 h-7 text-text-muted" />
            </div>
            <p className="text-text-muted font-medium mb-1">Нет подключённых каналов</p>
            <p className="text-text-muted text-sm max-w-xs">
              Подключите Telegram или другие каналы, чтобы начать принимать сообщения от клиентов.
            </p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {channels.map((channel) => (
              <motion.div
                key={channel.id}
                variants={item}
                className="bg-surface rounded-2xl border border-border shadow-sm p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-accent-soft flex items-center justify-center flex-shrink-0 ring-1 ring-border/60">
                    <Send className="w-5 h-5 text-brand" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-semibold text-text">{channel.name}</p>
                      <span data-testid="channel-status">{getStatusBadge(channel.status)}</span>
                    </div>
                    <p className="text-xs text-text-muted">
                      {channel.type} ·{' '}
                      {channel.connectedAt
                        ? new Date(channel.connectedAt).toLocaleDateString('ru-RU')
                        : 'Не подключён'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:flex-shrink-0">
                  <button
                    onClick={() => handleTest(channel.id)}
                    disabled={testingId === channel.id}
                    data-testid="test-channel"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-soft border border-border text-xs font-medium text-text hover:bg-surface transition-all disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1"
                  >
                    {testingId === channel.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <TestTube className="w-3 h-3" />
                    )}
                    Тест
                  </button>
                  <button
                    onClick={() => handleDisconnect(channel.id)}
                    disabled={disconnectingId === channel.id}
                    data-testid="disconnect-channel"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-danger-soft border border-danger/20 text-xs font-medium text-danger hover:bg-danger/10 transition-all disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-danger focus-visible:ring-offset-1"
                  >
                    {disconnectingId === channel.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Unlink className="w-3 h-3" />
                    )}
                    Отключить
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Connect Modal */}
      <AnimatePresence>
        {showConnectModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-text/20 backdrop-blur-sm" onClick={() => setShowConnectModal(false)} />
            <motion.div
              data-testid="connect-modal"
              className="relative w-full max-w-sm bg-surface rounded-card shadow-lg p-6"
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-[20px] font-semibold text-text leading-[28px] tracking-[-0.01em]">
                    Подключить канал
                  </h2>
                  <p className="text-[14px] text-text-muted leading-[22px] mt-1">
                    Выберите канал для подключения
                  </p>
                </div>
                <button
                  onClick={() => setShowConnectModal(false)}
                  className="p-1 rounded-sm text-text-muted hover:text-text hover:bg-surface-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                >
                  <X size={18} />
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-xl bg-danger-soft border border-danger-soft text-danger text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <button
                  onClick={() => handleConnect('telegram')}
                  disabled={connectingType === 'telegram'}
                  className="w-full flex items-center gap-3 p-4 rounded-xl border border-border hover:border-brand/40 hover:bg-accent-soft/50 transition-all duration-200 text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-sky-blue/10 flex items-center justify-center flex-shrink-0">
                    <Send className="w-5 h-5 text-sky-blue" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text">Telegram</p>
                    <p className="text-xs text-text-muted">Бот через Telegram Bot API</p>
                  </div>
                  {connectingType === 'telegram' ? (
                    <Loader2 className="w-4 h-4 text-brand animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4 text-text-muted" />
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="h-8" />
    </div>
  );
}
