'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquare, Send, Loader2, CheckCircle, Clock, AlertCircle, PlusCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/design/components/Button';
import { Card } from '@/design/components/Card';
import { Input } from '@/design/components/Input';
import { useToast } from '@/design/components/Toast';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

interface Ticket {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  resolution: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function SupportContent() {
  const router = useRouter();
  const { addToast } = useToast();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [authChecked, setAuthChecked] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('general');
  const [priority, setPriority] = useState('medium');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    setAuthChecked(true);
  }, [router]);

  const fetchTickets = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      setFetchError('');
      const res = await fetch(`${API_BASE}/api/support/tickets`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Не удалось загрузить обращения');
      }
      const data = await res.json();
      setTickets(data.data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка соединения';
      setFetchError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authChecked) fetchTickets();
  }, [authChecked, fetchTickets]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/support/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: title.trim(), description: description.trim(), category, priority })
      });
      const data = await res.json();
      if (res.ok) {
        addToast({ variant: 'success', message: data.message || 'Обращение отправлено! Мы ответим в ближайшее время.' });
        setShowForm(false);
        setTitle('');
        setDescription('');
        setCategory('general');
        setPriority('medium');
        fetchTickets();
      } else {
        addToast({ variant: 'error', message: data.error || 'Не удалось отправить обращение' });
      }
    } catch {
      addToast({ variant: 'error', message: 'Не удалось отправить обращение' });
    }
    setSubmitting(false);
  };

  const statusColors: Record<string, string> = {
    open: 'bg-warning/10 text-warning',
    in_progress: 'bg-brand/10 text-brand',
    resolved: 'bg-success/10 text-success',
    closed: 'bg-muted/10 text-muted'
  };

  const statusLabels: Record<string, string> = {
    open: 'Открыт',
    in_progress: 'В работе',
    resolved: 'Решён',
    closed: 'Закрыт'
  };

  const priorityLabels: Record<string, string> = {
    low: 'Низкий',
    medium: 'Средний',
    high: 'Высокий',
    urgent: 'Срочный'
  };

  const categoryLabels: Record<string, string> = {
    general: 'Общий',
    technical: 'Технический',
    billing: 'Биллинг',
    integration: 'Интеграция'
  };

  if (!authChecked || (loading && !fetchError)) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-[var(--brand)]" size={28} />
      </div>
    );
  }

  return (
    <div className="p-5 sm:p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text)]">Поддержка</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Создайте обращение — наши администраторы ответят в ближайшее время.
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowForm(!showForm)}>
          <PlusCircle size={16} className="mr-1.5" />
          {showForm ? 'Отмена' : 'Новое обращение'}
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6 p-5">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-sm font-medium text-[var(--text)] mb-1 block">Тема</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Краткое описание проблемы"
                required
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-[var(--text)] mb-1 block">Категория</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-surface text-[14px] text-text focus:outline-none focus:ring-2 focus:ring-brand/30"
                >
                  <option value="general">Общий</option>
                  <option value="technical">Технический</option>
                  <option value="billing">Биллинг</option>
                  <option value="integration">Интеграция</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-[var(--text)] mb-1 block">Приоритет</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-surface text-[14px] text-text focus:outline-none focus:ring-2 focus:ring-brand/30"
                >
                  <option value="low">Низкий</option>
                  <option value="medium">Средний</option>
                  <option value="high">Высокий</option>
                  <option value="urgent">Срочный</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-[var(--text)] mb-1 block">Описание</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Подробно опишите проблему, шаги для воспроизведения, ожидаемый результат..."
                required
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-surface text-[14px] text-text focus:outline-none focus:ring-2 focus:ring-brand/30 min-h-[120px] resize-y"
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit" variant="primary" loading={submitting} disabled={!title.trim() || !description.trim()}>
                <Send size={16} className="mr-1.5" />
                Отправить обращение
              </Button>
            </div>
          </form>
        </Card>
      )}

      {fetchError ? (
        <Card className="p-8 text-center">
          <AlertTriangle size={32} className="mx-auto text-[var(--warning)] mb-3" />
          <p className="text-[var(--text-muted)] mb-2">{fetchError}</p>
          <Button variant="secondary" size="sm" onClick={fetchTickets}>
            Попробовать снова
          </Button>
        </Card>
      ) : tickets.length === 0 ? (
        <Card className="p-8 text-center">
          <MessageSquare size={32} className="mx-auto text-[var(--text-muted)] mb-3" />
          <p className="text-[var(--text-muted)]">У вас пока нет обращений в поддержку.</p>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            {showForm ? 'Заполните форму выше, чтобы создать первое обращение.' : 'Нажмите «Новое обращение», чтобы создать первое.'}
          </p>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {tickets.map((ticket) => (
            <Card key={ticket.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="text-[15px] font-medium text-[var(--text)]">{ticket.title}</h3>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${statusColors[ticket.status] || 'bg-muted/10 text-muted'}`}>
                      {statusLabels[ticket.status] || ticket.status}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-[var(--accent-soft)] text-[var(--text-muted)]">
                      {categoryLabels[ticket.category] || ticket.category}
                    </span>
                  </div>
                  <p className="text-[13px] text-[var(--text-muted)] line-clamp-2">{ticket.description}</p>
                  {ticket.resolution && (
                    <div className="mt-2 p-3 rounded-lg bg-success/5 border border-success/10">
                      <p className="text-[12px] font-medium text-success mb-1 flex items-center gap-1">
                        <CheckCircle size={12} />
                        Ответ поддержки:
                      </p>
                      <p className="text-[13px] text-[var(--text)]">{ticket.resolution}</p>
                    </div>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-[11px] text-[var(--text-muted)]">
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {new Date(ticket.createdAt).toLocaleDateString('ru-RU')}
                    </span>
                    <span className="flex items-center gap-1">
                      <AlertCircle size={12} />
                      {priorityLabels[ticket.priority] || ticket.priority}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
