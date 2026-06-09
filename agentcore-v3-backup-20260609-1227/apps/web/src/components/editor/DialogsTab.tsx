'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, Send, Loader2, Globe, MessageCircle, Phone, Instagram, Mail, Zap,
  CheckCircle, X, Search, Filter, TrendingUp, Clock, User, Bot, Headphones,
  ChevronDown, MoreVertical, Archive, ArrowLeft
} from 'lucide-react';
import { Card } from '@/design/components/Card';
import { Button } from '@/design/components/Button';
import { Input } from '@/design/components/Input';
import { StatusBadge } from '@/design/components/StatusBadge';
import { Skeleton } from '@/design/components/Skeleton';
import { useToast } from '@/design/components/Toast';
import { t } from '@/design/i18n';
import type { ConversationItem, ConversationMessage } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

interface DialogsTabProps {
  agentId: string;
  token: string;
}

const STATUS_VARIANTS: Record<ConversationItem['status'], 'active' | 'draft' | 'inactive'> = {
  new: 'active',
  in_progress: 'draft',
  closed: 'inactive',
};

const STATUS_LABELS: Record<ConversationItem['status'], string> = {
  new: t('dialogs.statusNew') || 'Новый',
  in_progress: t('dialogs.statusInProgress') || 'В работе',
  closed: t('dialogs.statusClosed') || 'Закрыт',
};

const STATUS_COLORS: Record<ConversationItem['status'], string> = {
  new: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  in_progress: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  closed: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
};

const channelIcons: Record<string, typeof MessageSquare> = {
  telegram: MessageCircle,
  whatsapp: Phone,
  instagram: Instagram,
  email: Mail,
  webchat: Globe,
  vk: MessageCircle,
  avito: MessageSquare,
  default: MessageSquare,
};

const channelColors: Record<string, string> = {
  telegram: 'text-blue-400',
  whatsapp: 'text-green-400',
  instagram: 'text-pink-400',
  email: 'text-yellow-400',
  webchat: 'text-purple-400',
  vk: 'text-blue-500',
  avito: 'text-orange-400',
  default: 'text-[var(--text-muted)]',
};

const quickReplies = [
  'Здравствуйте! Чем могу помочь?',
  'Уточните, пожалуйста, ваш вопрос',
  'Перевожу на оператора...',
  'Спасибо за обращение! До свидания',
];

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'только что';
  if (diffMins < 60) return `${diffMins} мин назад`;
  if (diffHours < 24) return `${diffHours} ч назад`;
  if (diffDays < 7) return `${diffDays} д назад`;
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

function formatMessageTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

export default function DialogsTab({ agentId, token }: DialogsTabProps) {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [operatorInput, setOperatorInput] = useState('');
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'in_progress' | 'closed'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { addToast } = useToast();

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/conversations?agentId=${agentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setConversations(Array.isArray(data) ? data : data.conversations ?? []);
      } else {
        addToast({ variant: 'error', message: t('toast.error') || 'Ошибка' });
      }
    } catch (err) {
      console.error('[DialogsTab]', err);
      addToast({ variant: 'error', message: t('toast.error') || 'Ошибка' });
    }
    setLoading(false);
  }, [agentId, token, addToast]);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  const fetchMessages = useCallback(async (convId: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/conversations/${convId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(Array.isArray(data) ? data : data.messages ?? []);
      } else {
        addToast({ variant: 'error', message: t('toast.error') || 'Ошибка' });
      }
    } catch (err) {
      console.error('[DialogsTab] fetchMessages:', err);
      addToast({ variant: 'error', message: t('toast.error') || 'Ошибка' });
    }
  }, [token, addToast]);

  useEffect(() => {
    if (selectedId) fetchMessages(selectedId);
  }, [selectedId, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleTakeover = useCallback(async () => {
    if (!selectedId || !operatorInput.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`${API_BASE}/api/conversations/${selectedId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ role: 'operator', content: operatorInput.trim() }),
      });
      if (res.ok) {
        const msg = await res.json();
        setMessages((prev) => [...prev, msg]);
        setOperatorInput('');
      } else {
        addToast({ variant: 'error', message: t('toast.error') || 'Ошибка' });
      }
    } catch (err) {
      console.error('[DialogsTab] handleTakeover:', err);
      addToast({ variant: 'error', message: t('toast.error') || 'Ошибка' });
    }
    setSending(false);
  }, [selectedId, operatorInput, token, addToast]);

  // Metrics
  const metrics = useMemo(() => {
    const total = conversations.length;
    const newCount = conversations.filter(c => c.status === 'new').length;
    const inProgress = conversations.filter(c => c.status === 'in_progress').length;
    const closed = conversations.filter(c => c.status === 'closed').length;
    const totalMessages = conversations.reduce((sum, c) => sum + (c.messageCount || 0), 0);
    return { total, newCount, inProgress, closed, totalMessages };
  }, [conversations]);

  // Filtered conversations
  const filteredConversations = useMemo(() => {
    return conversations.filter(conv => {
      const matchesSearch = !searchQuery ||
        conv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.channel?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || conv.status === statusFilter;
      return matchesSearch && matchesStatus;
    }).sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
  }, [conversations, searchQuery, statusFilter]);

  const selectedConversation = conversations.find(c => c.id === selectedId);

  if (loading) {
    return (
      <div className="p-5 space-y-3">
        <Skeleton variant="card" />
        <Skeleton variant="card" />
        <Skeleton variant="card" />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-[500px] bg-[var(--bg)]">
      {/* Left Sidebar — Conversations */}
      <div className="w-[320px] min-w-[320px] border-r border-[var(--border)] flex flex-col">
        {/* Header with Metrics */}
        <div className="p-4 border-b border-[var(--border)]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-[var(--text)]">{t('dialogs.title') || 'Диалоги'}</h3>
            <span className="text-xs text-[var(--text-muted)]">{metrics.total} шт</span>
          </div>

          {/* Metrics Cards */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-lg p-2 text-center">
              <p className="text-lg font-bold text-emerald-400">{metrics.newCount}</p>
              <p className="text-[10px] text-[var(--text-muted)]">Новые</p>
            </div>
            <div className="bg-amber-500/5 border border-amber-500/10 rounded-lg p-2 text-center">
              <p className="text-lg font-bold text-amber-400">{metrics.inProgress}</p>
              <p className="text-[10px] text-[var(--text-muted)]">В работе</p>
            </div>
            <div className="bg-slate-500/5 border border-slate-500/10 rounded-lg p-2 text-center">
              <p className="text-lg font-bold text-slate-400">{metrics.closed}</p>
              <p className="text-[10px] text-[var(--text-muted)]">Закрыты</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Поиск диалогов..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text)]"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex items-center gap-1 mt-2">
            {(['all', 'new', 'in_progress', 'closed'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                  statusFilter === status
                    ? 'bg-[var(--brand)]/10 text-[var(--brand)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]'
                }`}
              >
                {status === 'all' ? 'Все' : STATUS_LABELS[status]}
              </button>
            ))}
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 && (
            <div className="p-8 text-center">
              <MessageSquare className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-2" />
              <p className="text-sm text-[var(--text-muted)]">
                {searchQuery ? 'Ничего не найдено' : 'Нет диалогов'}
              </p>
            </div>
          )}
          <AnimatePresence>
            {filteredConversations.map((conv, index) => {
              const ChIcon = channelIcons[conv.channel?.toLowerCase() || 'default'] || MessageSquare;
              const chColor = channelColors[conv.channel?.toLowerCase() || 'default'] || 'text-[var(--text-muted)]';
              const isSelected = selectedId === conv.id;

              return (
                <motion.button
                  key={conv.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  onClick={() => setSelectedId(conv.id)}
                  className={`w-full text-left p-3 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] border-b border-[var(--border)]/50 ${
                    isSelected
                      ? 'bg-[var(--brand)]/5 border-l-2 border-l-[var(--brand)]'
                      : 'hover:bg-[var(--surface-2)] border-l-2 border-l-transparent'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Channel Icon */}
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-[var(--surface-2)] ${chColor}`}>
                      <ChIcon size={14} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[13px] font-medium text-[var(--text)] truncate">
                          {conv.title || 'Без названия'}
                        </span>
                        <span className="text-[10px] text-[var(--text-muted)] flex-shrink-0">
                          {formatTime(conv.lastMessageAt)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${STATUS_COLORS[conv.status]}`}>
                          {STATUS_LABELS[conv.status]}
                        </span>
                        <span className="text-[11px] text-[var(--text-muted)]">
                          {conv.channel || 'Chat'}
                        </span>
                        {conv.messageCount > 0 && (
                          <span className="text-[10px] text-[var(--text-muted)] bg-[var(--surface-2)] px-1.5 py-0.5 rounded-full">
                            {conv.messageCount} сообщ.
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Right Panel — Chat */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <AnimatePresence mode="wait">
          {!selectedId ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex items-center justify-center"
            >
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-[var(--surface-2)] flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-8 h-8 text-[var(--text-muted)]" />
                </div>
                <p className="text-sm font-medium text-[var(--text)] mb-1">Выберите диалог</p>
                <p className="text-xs text-[var(--text-muted)]">Чтобы просмотреть сообщения и ответить</p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col"
            >
              {/* Chat Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--card)]">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedId(null)}
                    className="lg:hidden p-1.5 rounded-lg hover:bg-[var(--surface-2)] text-[var(--text-muted)]"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div className="w-9 h-9 rounded-xl bg-[var(--surface-2)] flex items-center justify-center">
                    {(() => {
                      const ChIcon = channelIcons[selectedConversation?.channel?.toLowerCase() || 'default'] || MessageSquare;
                      const chColor = channelColors[selectedConversation?.channel?.toLowerCase() || 'default'] || 'text-[var(--text-muted)]';
                      return <ChIcon className={`w-4 h-4 ${chColor}`} />;
                    })()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--text)]">
                      {selectedConversation?.title || 'Диалог'}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${STATUS_COLORS[selectedConversation?.status || 'new']}`}>
                        {STATUS_LABELS[selectedConversation?.status || 'new']}
                      </span>
                      <span className="text-[11px] text-[var(--text-muted)]">
                        {selectedConversation?.channel || 'Chat'} • {messages.length} сообщ.
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button className="p-2 rounded-lg hover:bg-[var(--surface-2)] text-[var(--text-muted)] transition-colors">
                    <Archive className="w-4 h-4" />
                  </button>
                  <button className="p-2 rounded-lg hover:bg-[var(--surface-2)] text-[var(--text-muted)] transition-colors">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <AnimatePresence>
                  {messages.length === 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-12"
                    >
                      <p className="text-sm text-[var(--text-muted)]">Нет сообщений</p>
                    </motion.div>
                  )}
                  {messages.map((msg, idx) => {
                    const isUser = msg.role === 'user';
                    const isOperator = msg.role === 'operator';
                    const isAssistant = msg.role === 'assistant';
                    const showAvatar = idx === 0 || messages[idx - 1].role !== msg.role;

                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.2 }}
                        className={`flex ${isUser || isOperator ? 'justify-end' : 'justify-start'} gap-2`}
                      >
                        {/* Avatar for assistant */}
                        {isAssistant && showAvatar && (
                          <div className="w-7 h-7 rounded-full bg-[var(--brand)]/10 flex items-center justify-center flex-shrink-0 mt-1">
                            <Bot className="w-3.5 h-3.5 text-[var(--brand)]" />
                          </div>
                        )}
                        {isAssistant && !showAvatar && <div className="w-7 flex-shrink-0" />}

                        <div className={`max-w-[75%] ${isAssistant ? '' : ''}`}>
                          <div
                            className={`rounded-2xl px-4 py-2.5 ${
                              isUser
                                ? 'bg-[var(--brand)] text-white rounded-br-md'
                                : isOperator
                                  ? 'bg-amber-500/10 border border-amber-500/20 text-[var(--text)] rounded-br-md'
                                  : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] rounded-bl-md'
                            }`}
                          >
                            {isOperator && (
                              <div className="flex items-center gap-1 mb-1">
                                <Headphones className="w-3 h-3 text-amber-400" />
                                <span className="text-[10px] font-medium text-amber-400">Оператор</span>
                              </div>
                            )}
                            {isAssistant && showAvatar && (
                              <div className="flex items-center gap-1 mb-1">
                                <Bot className="w-3 h-3 text-[var(--brand)]" />
                                <span className="text-[10px] font-medium text-[var(--brand)]">AI Агент</span>
                              </div>
                            )}
                            <p className="text-[14px] whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                          </div>
                          <p className={`text-[10px] text-[var(--text-muted)] mt-1 ${isUser || isOperator ? 'text-right' : 'text-left'}`}>
                            {formatMessageTime(msg.createdAt)}
                          </p>
                        </div>

                        {/* Avatar for user/operator */}
                        {(isUser || isOperator) && showAvatar && (
                          <div className="w-7 h-7 rounded-full bg-[var(--surface-2)] flex items-center justify-center flex-shrink-0 mt-1">
                            <User className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                          </div>
                        )}
                        {(isUser || isOperator) && !showAvatar && <div className="w-7 flex-shrink-0" />}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-3 border-t border-[var(--border)] bg-[var(--card)]">
                {/* Quick Replies */}
                <div className="flex gap-2 mb-2 overflow-x-auto pb-1 scrollbar-hide">
                  {quickReplies.map((reply) => (
                    <button
                      key={reply}
                      onClick={() => setOperatorInput(reply)}
                      className="px-3 py-1.5 rounded-full bg-[var(--surface-2)] border border-[var(--border)] text-[11px] text-[var(--text-muted)] hover:bg-[var(--accent-soft)] hover:text-[var(--brand)] hover:border-[var(--brand)]/20 transition-all whitespace-nowrap flex-shrink-0"
                    >
                      {reply.length > 25 ? reply.slice(0, 25) + '...' : reply}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      placeholder={t('dialogs.takeoverPlaceholder') || 'Напишите сообщение...'}
                      value={operatorInput}
                      onChange={(e) => setOperatorInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleTakeover(); } }}
                      className="w-full px-4 py-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30 focus:border-[var(--brand)]/30"
                    />
                  </div>
                  <button
                    onClick={handleTakeover}
                    disabled={sending || !operatorInput.trim()}
                    className="p-2.5 bg-[var(--brand)] hover:bg-[var(--brand-hover)] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-all flex-shrink-0"
                  >
                    {sending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
