'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/design/components/Input';
import { Button } from '@/design/components/Button';
import { Textarea } from '@/design/components/Input';
import { Card } from '@/design/components/Card';
import { useToast } from '@/design/components/Toast';
import { useAgentStore } from '@/store/agentStore';
import { useCallback } from 'react';

export default function AgentBuilderPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const auth = useAgentStore((s) => s.auth);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const token = auth.token;

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !systemPrompt) {
      addToast({ variant: 'error', message: 'Название и промпт обязательны' });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/agents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          description: description || systemPrompt.slice(0, 200),
          systemPrompt,
          temperature: 0.7,
          emoji: '🤖',
        }),
      });
      if (res.ok) {
        const agent = await res.json();
        addToast({ variant: 'success', message: 'Агент создан' });
        router.push(`/agents/${agent.id}`);
      } else {
        const err = await res.json().catch(() => ({}));
        addToast({ variant: 'error', message: err.error || 'Ошибка создания агента' });
      }
    } catch (err) {
      addToast({ variant: 'error', message: err instanceof Error ? err.message : 'Ошибка сети' });
    } finally {
      setLoading(false);
    }
  }, [name, description, systemPrompt, token, router, addToast]);

  return (
    <div className="max-w-2xl mx-auto px-6 py-10" data-testid="agent-builder-page">
      <h1 className="text-[28px] font-semibold text-text tracking-[-0.01em] mb-2">Конструктор агента</h1>
      <p className="text-[14px] text-text-muted mb-8">Создайте нового AI-агента</p>
      <form onSubmit={handleSubmit} data-testid="agent-builder-form">
        <Card className="space-y-6 p-6">
          <div>
            <label className="text-[14px] font-medium text-text mb-1.5 block">Название *</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например, AI Assistant"
              data-testid="agent-name-input"
              required
            />
          </div>
          <div>
            <label className="text-[14px] font-medium text-text mb-1.5 block">Описание</label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Краткое описание агента"
              data-testid="agent-description-input"
            />
          </div>
          <div>
            <label className="text-[14px] font-medium text-text mb-1.5 block">Системный промпт *</label>
            <Textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="Введите системный промпт..."
              data-testid="agent-prompt-input"
              rows={6}
              required
            />
          </div>
          <div className="flex items-center gap-3">
            <Button type="submit" variant="primary" loading={loading} data-testid="agent-builder-submit">
              Создать агента
            </Button>
            <Button type="button" variant="ghost" onClick={() => router.push('/agents')} data-testid="agent-builder-cancel">
              Отмена
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
