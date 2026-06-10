'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/design/components/Input';
import { Button } from '@/design/components/Button';
import { Card } from '@/design/components/Card';
import { useToast } from '@/design/components/Toast';

export default function BrainMapTestPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) return;
    setLoading(true);
    setMessages(prev => [...prev, { role: 'user', content: message }]);
    setMessage('');
    
    // Simulate AI response
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Test response from brain map' }]);
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-10" data-testid="brain-map-test-page">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[28px] font-semibold text-text tracking-[-0.01em]">Тест Brain Map</h1>
          <p className="text-[14px] text-text-muted">Тестовый чат для проверки связей</p>
        </div>
        <Button variant="ghost" onClick={() => router.push('/dashboard/brain-map')}>
          Назад
        </Button>
      </div>
      
      <Card className="p-6 mb-6">
        <div className="space-y-4 mb-4 max-h-[400px] overflow-y-auto">
          {messages.map((msg, i) => (
            <div key={i} className={`p-3 rounded-lg ${msg.role === 'user' ? 'bg-accent-soft text-brand' : 'bg-surface-2 text-text'}`}>
              <p className="text-sm font-medium">{msg.role === 'user' ? 'Вы' : 'AI'}:</p>
              <p className="text-sm">{msg.content}</p>
            </div>
          ))}
          {messages.length === 0 && (
            <p className="text-text-muted text-sm text-center py-8">Начните диалог...</p>
          )}
        </div>
        
        <div className="flex gap-3">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Введите сообщение..."
            data-testid="brain-map-message-input"
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <Button onClick={handleSend} loading={loading} data-testid="brain-map-send-button">
            Отправить
          </Button>
        </div>
      </Card>
    </div>
  );
}
