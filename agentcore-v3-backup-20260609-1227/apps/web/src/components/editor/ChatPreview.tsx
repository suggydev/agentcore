'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Send, Loader2, MessageSquare, Bot, ChevronDown, ChevronUp, Zap, Sparkles } from 'lucide-react';
import { Button } from '@/design/components/Button';
import { t } from '@/design/i18n';
import type { ChatMessage, AgentData } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

interface ChatPreviewProps {
  agent: AgentData;
  token: string;
  livePrompt: string;
}

const MAX_VISIBLE_MESSAGES = 50;
const MAX_MSG_LINES = 6; // lines before truncation
const LINE_HEIGHT = 20; // approximate px per line

function ExpandableMessage({ content, role }: { content: string; role: string }) {
  const [expanded, setExpanded] = useState(false);
  const [needsExpand, setNeedsExpand] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (textRef.current) {
      setNeedsExpand(textRef.current.scrollHeight > MAX_MSG_LINES * LINE_HEIGHT + 4);
    }
  }, [content]);

  return (
    <div>
      <p
        ref={textRef}
        className={`text-[13px] whitespace-pre-wrap leading-[20px] transition-all duration-200 ${
          expanded ? '' : 'overflow-hidden'
        }`}
        style={expanded ? {} : { maxHeight: `${MAX_MSG_LINES * LINE_HEIGHT}px` }}
      >
        {content}
      </p>
      {needsExpand && (
        <button
          onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
          className={`mt-1 text-[11px] font-medium flex items-center gap-0.5 transition-colors ${
            role === 'user' ? 'text-white/80 hover:text-white' : 'text-brand hover:text-brand-hover'
          }`}
        >
          {expanded ? (
            <>Свернуть <ChevronUp size={12} /></>
          ) : (
            <>Показать полностью <ChevronDown size={12} /></>
          )}
        </button>
      )}
    </div>
  );
}

const FREE_MESSAGES_LIMIT = 100;
const LOW_THRESHOLD = 20;

export default function ChatPreview({ agent, token, livePrompt }: ChatPreviewProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [freeMessagesLeft, setFreeMessagesLeft] = useState(FREE_MESSAGES_LIMIT);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch real free messages count on mount
  useEffect(() => {
    if (!agent?.id || !token) return;
    fetch(`${API_BASE}/api/agents/${agent.id}/free-messages`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data && typeof data.remaining === 'number') {
          setFreeMessagesLeft(data.remaining === Infinity ? FREE_MESSAGES_LIMIT : data.remaining);
        }
      })
      .catch(() => {});
  }, [agent?.id, token]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || sending) return;
    if (freeMessagesLeft <= 0) {
      setMessages((prev) => [...prev, {
        id: `limit-${Date.now()}`,
        role: 'assistant',
        content: '⚠️ Лимит тестовых сообщений исчерпан (0 из 100). \n\nАктивируйте агента для продолжения работы без ограничений. Или обновите страницу для сброса демо-счётчика.',
        createdAt: new Date().toISOString(),
      }]);
      return;
    }
    const userContent = input.trim();
    setInput('');
    setSending(true);
    setFreeMessagesLeft(prev => prev - 1);

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userContent,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    const tempId = `temp-${Date.now()}`;
    setMessages((prev) => [...prev, {
      id: tempId,
      role: 'assistant',
      content: '',
      createdAt: new Date().toISOString(),
    }]);

    try {
      const chatMessages = [
        { role: 'system' as const, content: livePrompt },
        ...messages.filter((m) => m.role !== 'system').map((m) => ({ role: m.role, content: m.content })),
        { role: 'user' as const, content: userContent },
      ];

      const res = await fetch(`${API_BASE}/api/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          model: agent.model,
          messages: chatMessages,
          temperature: agent.temperature,
          stream: false,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const aiContent = data.choices?.[0]?.message?.content || 'Ответ не получен';
        setMessages((prev) =>
          prev.filter((m) => m.id !== tempId).concat({
            id: `asst-${Date.now()}`,
            role: 'assistant',
            content: aiContent,
            createdAt: new Date().toISOString(),
          })
        );
      } else if (res.status === 402) {
        const errData = await res.json().catch(() => ({}));
        setMessages((prev) =>
          prev.filter((m) => m.id !== tempId).concat({
            id: `limit-${Date.now()}`,
            role: 'assistant',
            content: errData.message || 'Лимит тестовых сообщений исчерпан. Активируйте агента для продолжения.',
            createdAt: new Date().toISOString(),
          })
        );
        setFreeMessagesLeft(0);
      } else {
        setMessages((prev) =>
          prev.filter((m) => m.id !== tempId).concat({
            id: `err-${Date.now()}`,
            role: 'assistant',
            content: 'Ошибка: не удалось получить ответ',
            createdAt: new Date().toISOString(),
          })
        );
      }
    } catch {
      setMessages((prev) =>
        prev.filter((m) => m.id !== tempId).concat({
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: 'Ошибка сети',
          createdAt: new Date().toISOString(),
        })
      );
    }
    setSending(false);
  }, [input, sending, messages, livePrompt, agent.model, agent.temperature, token]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const suggestedPrompts = [
    t('chat.suggestedPrompts.greet'),
    t('chat.suggestedPrompts.services'),
    t('chat.suggestedPrompts.order'),
  ];

  const visibleMessages = showAll ? messages : messages.slice(-MAX_VISIBLE_MESSAGES);
  const hasMore = messages.length > MAX_VISIBLE_MESSAGES && !showAll;

  return (
    <div className="flex flex-col h-full bg-[var(--surface)]">
      <div className="px-4 py-3 border-b border-[var(--border)] flex items-center gap-2 flex-shrink-0">
        <div className="w-8 h-8 rounded-lg bg-brand/15 flex items-center justify-center">
          <Sparkles size={16} className="text-brand" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-[13px] font-medium text-[var(--text)] block">{agent.name}</span>
          <span className="text-[11px] text-[var(--text-muted)]">Живой чат</span>
        </div>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${
          freeMessagesLeft > LOW_THRESHOLD ? 'bg-success/15 text-success' : freeMessagesLeft > 0 ? 'bg-warning/15 text-warning' : 'bg-danger/15 text-danger'
        }`}>
          <Zap size={12} />
          {freeMessagesLeft === Infinity ? '∞' : freeMessagesLeft} / {FREE_MESSAGES_LIMIT} осталось
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" aria-live="polite" role="log">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-14 h-14 rounded-[var(--radius-card)] bg-[var(--accent-soft)] flex items-center justify-center mb-3">
              <MessageSquare size={24} className="text-[var(--brand)]" />
            </div>
            <p className="text-[14px] font-medium text-[var(--text)] mb-1">{t('chat.emptyTitle')}</p>
            <p className="text-[12px] text-[var(--text-muted)] mb-4">{t('chat.emptyDesc')}</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {suggestedPrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => setInput(prompt)}
                  className="text-[12px] px-3 py-1.5 rounded-[var(--radius-pill)] bg-[var(--accent-soft)] text-[var(--brand)] hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]"
                  aria-label={prompt}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {hasMore && (
          <button
            onClick={() => setShowAll(true)}
            className="text-[12px] text-[var(--brand)] hover:underline mx-auto block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] rounded"
            aria-label="Load more"
          >
            Загрузить ещё ({messages.length - MAX_VISIBLE_MESSAGES})
          </button>
        )}

        {visibleMessages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-[var(--radius-card)] px-3.5 py-2.5 ${
                msg.role === 'user'
                  ? 'bg-[var(--accent)] text-white'
                  : 'bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)]'
              }`}
            >
              {msg.content === '' && sending ? (
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)] animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)] animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)] animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              ) : (
                <ExpandableMessage content={msg.content} role={msg.role} />
              )}
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      <div className="p-3 border-t border-[var(--border)] flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={freeMessagesLeft > 0 ? t('chat.inputPlaceholder') : 'Лимит исчерпан. Активируйте агента.'}
              disabled={sending || freeMessagesLeft <= 0}
              className="w-full h-11 pl-4 pr-12 rounded-xl border border-border bg-surface-2 text-text text-[13px] placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand/40 transition-all disabled:opacity-50"
              aria-label={t('chat.inputPlaceholder')}
            />
            <button
              onClick={handleSend}
              disabled={sending || !input.trim() || freeMessagesLeft <= 0}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg bg-brand text-white flex items-center justify-center hover:bg-brand-hover transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-brand/20 hover:scale-105 active:scale-95"
              aria-label={t('chat.send')}
            >
              {sending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Send size={16} className="ml-0.5" />
              )}
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between mt-2">
          <p className="text-[11px] text-text-muted">
            {freeMessagesLeft > 0 ? (
              <span className="flex items-center gap-1">
                <Sparkles size={10} className="text-brand" />
                {freeMessagesLeft} из {FREE_MESSAGES_LIMIT} тестовых сообщений
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <span className="text-danger">Лимит исчерпан</span>
                <button
                  onClick={() => setFreeMessagesLeft(FREE_MESSAGES_LIMIT)}
                  className="text-[var(--brand)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] rounded"
                >
                  Сбросить счётчик
                </button>
              </span>
            )}
          </p>
          <p className="text-[11px] text-text-muted">Ctrl+Enter для отправки</p>
        </div>
      </div>
    </div>
  );
}
