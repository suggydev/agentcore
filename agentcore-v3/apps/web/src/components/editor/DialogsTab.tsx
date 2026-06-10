'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { MessageSquare, Send, Loader2 } from 'lucide-react';
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
  new: t('dialogs.statusNew'),
  in_progress: t('dialogs.statusInProgress'),
  closed: t('dialogs.statusClosed'),
};

export default function DialogsTab({ agentId, token }: DialogsTabProps) {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [operatorInput, setOperatorInput] = useState('');
  const [sending, setSending] = useState(false);
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
        addToast({ variant: 'error', message: t('toast.error') });
      }
    } catch (err) {
      console.error('[DialogsTab]', err);
      addToast({ variant: 'error', message: t('toast.error') });
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
        addToast({ variant: 'error', message: t('toast.error') });
      }
    } catch (err) {
      console.error('[DialogsTab] fetchMessages:', err);
      addToast({ variant: 'error', message: t('toast.error') });
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
        addToast({ variant: 'error', message: t('toast.error') });
      }
    } catch (err) {
      console.error('[DialogsTab] handleTakeover:', err);
      addToast({ variant: 'error', message: t('toast.error') });
    }
    setSending(false);
  }, [selectedId, operatorInput, token, addToast]);

  if (loading) {
    return <div className="p-5"><Skeleton variant="card" /><Skeleton variant="card" /></div>;
  }

  return (
    <div className="flex h-full min-h-[500px]" data-testid="conversations-list">
      <div className="w-[30%] min-w-[180px] border-r border-[var(--border)] overflow-y-auto">
        <div className="p-3">
          <h3 className="text-[14px] font-medium text-[var(--text)] mb-3">{t('dialogs.title')}</h3>
          {conversations.length === 0 && (
            <p className="text-[12px] text-[var(--text-muted)]">{t('dialogs.noConversations')}</p>
          )}
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => setSelectedId(conv.id)}
              data-testid="conversation-item"
              className={`w-full text-left p-3 rounded-[var(--radius-button)] mb-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] ${selectedId === conv.id ? 'bg-[var(--accent-soft)]' : 'hover:bg-[var(--surface-2)]'}`}
              aria-label={conv.title}
            >
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-medium text-[var(--text)] truncate">{conv.title}</span>
                <span data-testid="conversation-status">
                  <StatusBadge variant={STATUS_VARIANTS[conv.status]} label={STATUS_LABELS[conv.status]} />
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[11px] text-[var(--text-muted)]">{conv.channel}</span>
                <span className="text-[11px] text-[var(--text-muted)]">
                  {new Date(conv.lastMessageAt).toLocaleDateString('ru-RU')}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {!selectedId ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare size={32} className="mx-auto text-[var(--text-muted)] mb-2" />
              <p className="text-[14px] text-[var(--text-muted)]">{t('dialogs.noConversations')}</p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.slice(-50).map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : msg.role === 'operator' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] rounded-[var(--radius-card)] px-4 py-2.5 ${
                      msg.role === 'user'
                        ? 'bg-[var(--accent)] text-white'
                        : msg.role === 'operator'
                          ? 'bg-[var(--warning)]/20 border border-[var(--warning)]/30 text-[var(--text)]'
                          : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text)]'
                    }`}
                  >
                    {msg.role === 'operator' && (
                      <p className="text-[11px] font-medium text-[var(--warning)] mb-0.5">Оператор</p>
                    )}
                    <p className="text-[14px] whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-3 border-t border-[var(--border)]">
              <div className="flex items-center gap-2">
                <Input
                  placeholder={t('dialogs.takeoverPlaceholder')}
                  value={operatorInput}
                  onChange={(e) => setOperatorInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleTakeover(); } }}
                  aria-label={t('dialogs.takeover')}
                  data-testid="operator-input"
                  className="flex-1"
                />
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleTakeover}
                  loading={sending}
                  disabled={!operatorInput.trim()}
                  aria-label={t('dialogs.takeover')}
                  data-testid="operator-send"
                >
                  {t('dialogs.takeover')}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
