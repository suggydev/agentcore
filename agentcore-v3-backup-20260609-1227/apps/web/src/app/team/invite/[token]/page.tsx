'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Loader2, Users } from 'lucide-react';
import { Button } from '@/design/components/Button';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export default function InviteAcceptPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [status, setStatus] = useState<'loading' | 'idle' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) return;
    // Check if user is logged in
    const authToken = localStorage.getItem('token');
    if (!authToken) {
      setStatus('idle');
      setMessage('Для приёма приглашения нужно войти в аккаунт. Войдите и вернитесь по ссылке.');
      return;
    }

    fetch(`${API_BASE}/api/workspace/invite/${token}/accept`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` }
    })
      .then(async (res) => {
        if (res.ok) {
          setStatus('success');
          setMessage('Вы успешно присоединились к команде!');
          setTimeout(() => router.push('/agents'), 2000);
        } else {
          const data = await res.json().catch(() => ({}));
          setStatus('error');
          setMessage(data.error || 'Не удалось принять приглашение');
        }
      })
      .catch(() => {
        setStatus('error');
        setMessage('Ошибка соединения');
      });
  }, [token, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] p-4">
      <div className="max-w-md w-full bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-[var(--accent-soft)] flex items-center justify-center mx-auto mb-4">
          <Users size={28} className="text-[var(--brand)]" />
        </div>
        <h1 className="text-xl font-bold text-[var(--text)] mb-2">Приглашение в команду</h1>

        {status === 'loading' && (
          <div className="flex items-center justify-center gap-2 py-4">
            <Loader2 className="animate-spin text-[var(--brand)]" size={20} />
            <span className="text-[var(--text-muted)]">Проверяем приглашение...</span>
          </div>
        )}

        {status === 'idle' && (
          <div className="py-4">
            <p className="text-[var(--text-muted)] mb-4">{message}</p>
            <Button variant="primary" onClick={() => router.push('/login')}>
              Войти в аккаунт
            </Button>
          </div>
        )}

        {status === 'success' && (
          <div className="py-4">
            <CheckCircle size={40} className="text-[var(--success)] mx-auto mb-2" />
            <p className="text-[var(--success)] font-medium">{message}</p>
            <p className="text-sm text-[var(--text-muted)] mt-2">Перенаправляем...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="py-4">
            <XCircle size={40} className="text-[var(--danger)] mx-auto mb-2" />
            <p className="text-[var(--danger)] font-medium">{message}</p>
            <Button variant="ghost" onClick={() => router.push('/')} className="mt-4">
              На главную
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
