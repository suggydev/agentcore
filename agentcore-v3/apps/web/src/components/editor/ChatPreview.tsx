'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Send, Loader2, MessageSquare, Bot } from 'lucide-react';
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

export default function ChatPreview({ agent, token, livePrompt }: ChatPreviewProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || sending) return;
    const userContent = input.trim();
    setInput('');
    setSending(true);

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
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-[var(--border)] flex items-center gap-2">
        <Bot size={16} className="text-[var(--brand)]" />
        <span className="text-[13px] font-medium text-[var(--text)]">{t('chat.title')}</span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
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
              className={`max-w-[80%] rounded-[var(--radius-card)] px-3.5 py-2.5 ${
                msg.role === 'user'
                  ? 'bg-[var(--accent)] text-white'
                  : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text)]'
              }`}
            >
              {msg.content === '' && sending ? (
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)] animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)] animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)] animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              ) : (
                <p className="text-[13px] whitespace-pre-wrap leading-[20px]">{msg.content}</p>
              )}
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      <div className="p-3 border-t border-[var(--border)]">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('chat.inputPlaceholder')}
            disabled={sending}
            className="flex-1 h-9 px-3 rounded-[var(--radius-button)] border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)] text-[13px] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:ring-offset-1 disabled:opacity-50"
            aria-label={t('chat.inputPlaceholder')}
          />
          <Button
            variant="primary"
            size="sm"
            onClick={handleSend}
            disabled={sending || !input.trim()}
            aria-label={t('chat.send')}
          >
            {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          </Button>
        </div>
      </div>
    </div>
  );
}
