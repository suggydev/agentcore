'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/design/components/Input';
import { Button } from '@/design/components/Button';
import { Textarea } from '@/design/components/Input';
import { Card } from '@/design/components/Card';
import { useToast } from '@/design/components/Toast';
import { useCallback } from 'react';

export default function AgentEditorPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !systemPrompt) {
      addToast({ variant: 'error', message: 'Название и промпт обязательны' });
      return;
    }
    setLoading(true);
    try {
      // Simulate saving
      await new Promise(resolve => setTimeout(resolve, 500));
      addToast({ variant: 'success', message: 'Агент сохранен' });
      router.push('/agents');
    } catch (err) {
      addToast({ variant: 'error', message: 'Ошибка сохранения' });
    } finally {
      setLoading(false);
    }
  }, [name, description, systemPrompt, router, addToast]);

  return (
    <div className="max-w-2xl mx-auto px-6 py-10" data-testid="agent-editor-page">
      <h1 className="text-[28px] font-semibold text-text tracking-[-0.01em] mb-2">Редактор агента</h1>
      <p className="text-[14px] text-text-muted mb-8">Редактируйте настройки агента</p>
      <form onSubmit={handleSubmit} data-testid="agent-editor-form">
        <Card className="space-y-6 p-6">
          <div>
            <label className="text-[14px] font-medium text-text mb-1.5 block">Название *</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Название агента"
              data-testid="editor-name-input"
              required
            />
          </div>
          <div>
            <label className="text-[14px] font-medium text-text mb-1.5 block">Описание</label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Описание агента"
              data-testid="editor-description-input"
            />
          </div>
          <div>
            <label className="text-[14px] font-medium text-text mb-1.5 block">Системный промпт *</label>
            <Textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="Введите системный промпт..."
              data-testid="editor-prompt-input"
              rows={6}
              required
            />
          </div>
          <div className="flex items-center gap-3">
            <Button type="submit" variant="primary" loading={loading} data-testid="editor-save-button">
              Сохранить
            </Button>
            <Button type="button" variant="ghost" onClick={() => router.push('/agents')} data-testid="editor-cancel-button">
              Отмена
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
