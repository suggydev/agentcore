'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  MessageSquare,
  Loader2,
  Bot,
  Clock,
  MessageCircle,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Filter,
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

interface Conversation {
  id: string;
  title: string;
  agentId: string;
  createdAt: string;
  updatedAt: string;
  agent?: { name: string };
  _count?: { messages: number };
  status?: string;
}

interface ConversationsResponse {
  data: Conversation[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

type StatusFilter = 'all' | 'new' | 'in-progress' | 'closed';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
};

function getStatusIcon(status?: string) {
  switch (status) {
    case 'new':
      return <MessageCircle className="w-4 h-4" />;
    case 'in-progress':
      return <AlertCircle className="w-4 h-4" />;
    case 'closed':
      return <CheckCircle2 className="w-4 h-4" />;
    default:
      return <MessageSquare className="w-4 h-4" />;
  }
}

function getStatusColor(status?: string) {
  switch (status) {
    case 'new':
      return 'bg-sky-blue/10 text-sky-blue border-sky-blue/20';
    case 'in-progress':
      return 'bg-warning-soft text-warning border-warning/20';
    case 'closed':
      return 'bg-success-soft text-success border-success/20';
    default:
      return 'bg-accent-soft text-text-muted border-border';
  }
}

function getStatusLabel(status?: string) {
  switch (status) {
    case 'new':
      return 'Новый';
    case 'in-progress':
      return 'В работе';
    case 'closed':
      return 'Закрыт';
    default:
      return 'Активен';
  }
}

export default function ConversationsPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [error, setError] = useState('');

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const loadConversations = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json: ConversationsResponse = await res.json();
        const data = Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : [];
        // Normalize status if not provided
        const normalized = data.map((c: Conversation) => ({
          ...c,
          status: c.status || 'new',
        }));
        setConversations(normalized);
      } else {
        setError('Не удалось загрузить диалоги');
      }
    } catch (err) {
      console.error('[ConversationsPage]', err);
      setError('Ошибка соединения');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      window.location.href = '/login';
      return;
    }
    loadConversations();
  }, [token, loadConversations]);

  const filtered = conversations.filter((c) => {
    if (filter === 'all') return true;
    return (c.status || 'new') === filter;
  });

  const navigateToChat = (id: string) => {
    router.push(`/chat?id=${id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]" role="status">
        <Loader2 className="w-8 h-8 text-brand animate-spin" aria-hidden="true" />
        <span className="sr-only">Загрузка диалогов...</span>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto" data-testid="conversations-page">
      <motion.div variants={container} initial="hidden" animate="show" className="mb-8">
        <motion.div variants={item}>
          <p className="text-[11px] font-semibold uppercase tracking-label text-brand mb-2">Диалоги</p>
          <h1 className="font-display font-bold text-3xl text-text tracking-tight">Диалоги</h1>
          <p className="text-text-muted mt-1 text-sm">Управление активными и завершёнными диалогами.</p>
        </motion.div>
      </motion.div>

      {/* Filters */}
      <motion.div variants={item} initial="hidden" animate="show" className="flex items-center gap-2 mb-6 flex-wrap">
        <div className="flex items-center gap-1.5 mr-2">
          <Filter className="w-4 h-4 text-text-muted" />
          <span className="text-xs font-medium text-text-muted">Фильтр:</span>
        </div>
        {([
          { id: 'all', label: 'Все' },
          { id: 'new', label: 'Новые' },
          { id: 'in-progress', label: 'В работе' },
          { id: 'closed', label: 'Закрыты' },
        ] as { id: StatusFilter; label: string }[]).map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            data-testid={f.id === 'new' ? 'filter-new' : f.id === 'in-progress' ? 'filter-in-progress' : f.id === 'closed' ? 'filter-closed' : undefined}
            className={`px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-200 border focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1 ${
              filter === f.id
                ? 'bg-accent text-white border-accent shadow-sm'
                : 'bg-surface text-text-muted border-border hover:text-text hover:border-brand/30'
            }`}
          >
            {f.label}
          </button>
        ))}
      </motion.div>

      {error && (
        <motion.div variants={item} className="mb-6 p-4 rounded-2xl bg-danger-soft border border-danger-soft text-danger text-sm">
          {error}
        </motion.div>
      )}

      {/* Conversations List */}
      <motion.div variants={container} initial="hidden" animate="show" data-testid="conversations-list">
        {filtered.length === 0 ? (
          <motion.div variants={item} className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-accent-soft flex items-center justify-center mb-4 ring-1 ring-border/60">
              <MessageSquare className="w-7 h-7 text-text-muted" />
            </div>
            <p className="text-text-muted font-medium mb-1">
              {filter === 'all' ? 'Нет диалогов' : 'Нет диалогов с этим статусом'}
            </p>
            <p className="text-text-muted text-sm max-w-xs">
              {filter === 'all'
                ? 'Здесь будут отображаться все диалоги с клиентами'
                : 'Попробуйте выбрать другой фильтр'}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {filtered.map((conv) => (
              <motion.div
                key={conv.id}
                variants={item}
                data-testid="conversation-item"
                onClick={() => navigateToChat(conv.id)}
                className="bg-surface rounded-2xl border border-border shadow-sm p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:shadow-md hover:border-brand/20 cursor-pointer transition-all duration-200"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigateToChat(conv.id);
                  }
                }}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-accent-soft flex items-center justify-center flex-shrink-0 ring-1 ring-border/60">
                    <MessageSquare className="w-5 h-5 text-brand" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-semibold text-text truncate">{conv.title || 'Без названия'}</p>
                      <span
                        data-testid="conversation-status"
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusColor(conv.status)}`}
                      >
                        {getStatusIcon(conv.status)}
                        {getStatusLabel(conv.status)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      {conv.agent && (
                        <span className="flex items-center gap-1 text-xs text-text-muted">
                          <Bot className="w-3 h-3" />
                          {conv.agent.name}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-xs text-text-muted">
                        <Clock className="w-3 h-3" />
                        {new Date(conv.updatedAt).toLocaleDateString('ru-RU')}
                      </span>
                      {typeof conv._count?.messages === 'number' && (
                        <span className="flex items-center gap-1 text-xs text-text-muted">
                          <MessageCircle className="w-3 h-3" />
                          {conv._count.messages} сообщений
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      <div className="h-8" />
    </div>
  );
}
