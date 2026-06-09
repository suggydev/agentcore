'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, User, CreditCard, MessageSquare, AlertTriangle, Server } from 'lucide-react';

export interface ActivityEvent {
  id: string;
  type: 'user' | 'payment' | 'message' | 'error' | 'system';
  message: string;
  timestamp: string;
}

const iconMap: Record<ActivityEvent['type'], typeof Activity> = {
  user: User,
  payment: CreditCard,
  message: MessageSquare,
  error: AlertTriangle,
  system: Server,
};

const colorMap: Record<ActivityEvent['type'], string> = {
  user: 'bg-brand-light text-brand',
  payment: 'bg-success-soft text-success',
  message: 'bg-accent-soft text-accent',
  error: 'bg-danger-soft text-danger',
  system: 'bg-warning-soft text-warning',
};

interface ActivityFeedProps {
  events?: ActivityEvent[];
  maxHeight?: string;
}

export default function ActivityFeed({ events: initialEvents = [], maxHeight = '320px' }: ActivityFeedProps) {
  const [events, setEvents] = useState<ActivityEvent[]>(initialEvents);
  const listRef = useRef<HTMLDivElement>(null);
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('token');
    if (!token) return;

    const es = new EventSource(`${API_BASE}/api/admin/metrics/realtime?token=${token}`);

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data) as { newUsers?: number; newPayments?: number; newMessages?: number; newErrors?: number; timestamp?: string };
        const now = data.timestamp || new Date().toISOString();
        const incoming: ActivityEvent[] = [];
        if (data.newUsers && data.newUsers > 0) {
          incoming.push({ id: `u-${now}`, type: 'user', message: `${data.newUsers} новых пользователей`, timestamp: now });
        }
        if (data.newPayments && data.newPayments > 0) {
          incoming.push({ id: `p-${now}`, type: 'payment', message: `${data.newPayments} новых платежей`, timestamp: now });
        }
        if (data.newMessages && data.newMessages > 0) {
          incoming.push({ id: `m-${now}`, type: 'message', message: `${data.newMessages} новых сообщений`, timestamp: now });
        }
        if (data.newErrors && data.newErrors > 0) {
          incoming.push({ id: `e-${now}`, type: 'error', message: `${data.newErrors} новых ошибок`, timestamp: now });
        }
        if (incoming.length > 0) {
          setEvents((prev) => {
            const merged = [...incoming, ...prev].slice(0, 50);
            return merged;
          });
        }
      } catch {
        /* ignore malformed SSE */
      }
    };

    return () => { es.close(); };
  }, []);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = 0;
    }
  }, [events.length]);

  const formatTime = (ts: string) => {
    try {
      return new Date(ts).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return ts;
    }
  };

  return (
    <div ref={listRef} className="overflow-y-auto" style={{ maxHeight }}>
      <div className="space-y-1">
        <AnimatePresence initial={false}>
          {events.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-text-muted">Нет недавней активности</div>
          ) : (
            events.map((event) => {
              const Icon = iconMap[event.type];
              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -8, height: 0 }}
                  animate={{ opacity: 1, x: 0, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-surface-2 transition-colors"
                >
                  <div className={`p-1.5 rounded-md ${colorMap[event.type]}`}>
                    <Icon size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-secondary truncate">{event.message}</p>
                  </div>
                  <span className="text-[11px] text-text-muted tabular-nums whitespace-nowrap">{formatTime(event.timestamp)}</span>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
