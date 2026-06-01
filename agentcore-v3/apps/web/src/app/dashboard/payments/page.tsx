'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Clock,
  ChevronDown,
  Filter,
  X,
  RefreshCcw,
  ExternalLink,
  AlertCircle,
  Copy,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

interface Payment {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  method: 'stripe' | 'yookassa';
  status: 'pending' | 'succeeded' | 'canceled' | 'refunded';
  receiptUrl: string;
  createdAt: string;
  updatedAt: string;
  payload: Record<string, unknown>;
  webhookEvents: Array<{ type: string; receivedAt: string; data: Record<string, unknown> }>;
}

const FILTER_LABELS: Record<string, string> = {
  all: 'все',
  pending: 'ожидает',
  succeeded: 'успешно',
  canceled: 'отменён',
  refunded: 'возврат',
};

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  pending: {
    label: 'Ожидает',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    dot: 'bg-amber-400',
  },
  succeeded: {
    label: 'Успешно',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    dot: 'bg-emerald-400',
  },
  canceled: {
    label: 'Отменён',
    bg: 'bg-ink-100',
    text: 'text-ink-500',
    dot: 'bg-ink-400',
  },
  refunded: {
    label: 'Возврат',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    dot: 'bg-blue-400',
  },
};

const METHOD_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  stripe: { label: 'Stripe', bg: 'bg-purple-50', text: 'text-purple-700' },
  yookassa: { label: 'YooKassa', bg: 'bg-blue-50', text: 'text-blue-700' },
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const PAGE_SIZE = 15;

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
      return;
    }
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/billing/payments`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : (data.data || []);
          setPayments(list);
        } else {
          const msg = res.status === 401 ? 'Сессия истекла' : `Ошибка сервера (${res.status})`;
          setError(msg);
        }
      } catch {
        setError('Не удалось загрузить данные. Проверьте подключение.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredPayments = useMemo(() => {
    let result = payments;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.id.toLowerCase().includes(q) ||
          p.orderId.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'all') {
      result = result.filter((p) => p.status === statusFilter);
    }
    if (methodFilter !== 'all') {
      result = result.filter((p) => p.method === methodFilter);
    }
    return result;
  }, [payments, search, statusFilter, methodFilter]);

  const paginatedPayments = useMemo(() => filteredPayments.slice(0, page * PAGE_SIZE), [filteredPayments, page]);
  const hasMore = paginatedPayments.length < filteredPayments.length;

  const handleRefund = async (payment: Payment) => {
    if (!confirm(`Оформить возврат для платежа ${payment.id}?`)) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_BASE}/api/billing/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ paymentId: payment.id, amount: payment.amount, currency: payment.currency }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.message || `Ошибка возврата (${res.status})`);
        return;
      }
      setPayments((prev) =>
        prev.map((p) =>
          p.id === payment.id
            ? {
                ...p,
                status: 'refunded' as const,
                updatedAt: new Date().toISOString(),
                webhookEvents: [
                  ...p.webhookEvents,
                  {
                    type: 'payment_intent.refunded',
                    receivedAt: new Date().toISOString(),
                    data: { status: 'refunded', refundId: `rf_${Math.random().toString(36).slice(2, 10)}` },
                  },
                ],
              }
            : p
        )
      );
    } catch {
      alert('Сетевая ошибка при попытке возврата.');
    }
  };

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // fallback
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('ru-RU', { month: 'short', day: 'numeric', year: 'numeric' });
  const formatDateTime = (iso: string) =>
    new Date(iso).toLocaleString('ru-RU', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.04, delayChildren: 0.05 } },
  };
  const item = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
  };

  if (loading) {
    return (
      <>
        <div className="p-6 lg:p-10 max-w-7xl mx-auto">
          <motion.div variants={container} initial="hidden" animate="show" className="mb-8">
            <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-label text-mauve-500 mb-2">Платежи</p>
                <h1 className="font-display font-bold text-3xl text-ink-900 tracking-tight">Управление платежами</h1>
              </div>
            </motion.div>
          </motion.div>
          <div className="bg-white rounded-2xl border border-mauve-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-ink-100 bg-mauve-50/30">
                    <th className="text-left py-3.5 px-5 text-xs font-semibold text-ink-500 uppercase tracking-wide">ID платежа</th>
                    <th className="text-left py-3.5 px-5 text-xs font-semibold text-ink-500 uppercase tracking-wide">Заказ</th>
                    <th className="text-right py-3.5 px-5 text-xs font-semibold text-ink-500 uppercase tracking-wide">Сумма</th>
                    <th className="text-left py-3.5 px-5 text-xs font-semibold text-ink-500 uppercase tracking-wide">Метод</th>
                    <th className="text-center py-3.5 px-5 text-xs font-semibold text-ink-500 uppercase tracking-wide">Статус</th>
                    <th className="text-left py-3.5 px-5 text-xs font-semibold text-ink-500 uppercase tracking-wide">Дата</th>
                    <th className="text-center py-3.5 px-5 text-xs font-semibold text-ink-500 uppercase tracking-wide">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 10 }).map((_, i) => (
                    <tr key={i} className="border-b border-ink-50">
                      <td className="py-3.5 px-5"><div className="h-4 w-28 bg-mauve-100 animate-pulse rounded-md" /></td>
                      <td className="py-3.5 px-5"><div className="h-4 w-20 bg-mauve-100 animate-pulse rounded-md" /></td>
                      <td className="py-3.5 px-5 flex justify-end"><div className="h-4 w-16 bg-mauve-100 animate-pulse rounded-md" /></td>
                      <td className="py-3.5 px-5"><div className="h-5 w-16 bg-mauve-100 animate-pulse rounded-md" /></td>
                      <td className="py-3.5 px-5 flex justify-center"><div className="h-5 w-20 bg-mauve-100 animate-pulse rounded-full" /></td>
                      <td className="py-3.5 px-5"><div className="h-4 w-16 bg-mauve-100 animate-pulse rounded-md" /></td>
                      <td className="py-3.5 px-5"><div className="h-8 w-16 bg-mauve-100 animate-pulse rounded-lg mx-auto" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <div className="flex flex-col items-center justify-center min-h-[80vh] gap-4">
          <AlertCircle className="w-10 h-10 text-red-400" />
          <p className="text-ink-500">{error}</p>
          <button onClick={() => window.location.reload()} className="btn-primary text-sm px-6 py-2.5">Повторить</button>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="p-6 lg:p-10 max-w-7xl mx-auto">
        <motion.div variants={container} initial="hidden" animate="show" className="mb-8">
          <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-label text-mauve-500 mb-2">Платежи</p>
              <h1 className="font-display font-bold text-3xl text-ink-900 tracking-tight">Управление платежами</h1>
              <p className="text-ink-500 mt-1 text-sm">Мониторинг платёжных транзакций.</p>
            </div>
          </motion.div>
        </motion.div>

        {/* Filters */}
        <motion.div variants={container} initial="hidden" animate="show" className="mb-6">
          <motion.div variants={item} className="flex flex-col sm:flex-row gap-3 flex-wrap">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
              <input
                type="text"
                placeholder="Поиск по ID платежа или заказа..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-mauve-100 text-sm text-ink-900 placeholder-ink-400 focus:outline-none focus:ring-2 focus:ring-mauve-200 focus:border-mauve-300 transition-all duration-200 shadow-sm"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <div className="flex gap-1 bg-white rounded-xl border border-mauve-100 p-1 shadow-sm">
              {(['all', 'pending', 'succeeded', 'canceled', 'refunded'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all duration-200 ${
                    statusFilter === s
                      ? 'bg-mauve-600 text-white shadow-sm'
                      : 'text-ink-500 hover:text-ink-700 hover:bg-mauve-50'
                  }`}
                >
                  {FILTER_LABELS[s]}
                </button>
              ))}
            </div>
            <div className="flex gap-1.5 bg-white rounded-xl border border-mauve-100 p-1.5 shadow-sm">
              {(['all', 'stripe', 'yookassa'] as const).map((m) => {
                const methodColor = m === 'stripe' ? 'bg-purple-400' : m === 'yookassa' ? 'bg-blue-400' : '';
                const methodLabel = m === 'all' ? 'Все методы' : m === 'yookassa' ? 'YooKassa' : 'Stripe';
                return (
                  <button
                    key={m}
                    onClick={() => setMethodFilter(m)}
                    className={`px-3.5 py-2 rounded-lg text-xs font-semibold capitalize transition-all duration-200 flex items-center gap-1.5 ${
                      methodFilter === m
                        ? 'bg-mauve-600 text-white shadow-sm'
                        : 'text-ink-500 hover:text-ink-700 hover:bg-mauve-50'
                    }`}
                  >
                    {m !== 'all' && (
                      <span className={`w-1.5 h-1.5 rounded-full ${methodColor} ${methodFilter === m ? 'bg-white' : ''}`} />
                    )}
                    {methodLabel}
                    {methodFilter === m && m !== 'all' && (
                      <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[9px] font-mono ml-0.5">
                        {payments.filter((p) => p.method === m).length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </motion.div>

        {/* Summary Cards */}
        <motion.div variants={container} initial="hidden" animate="show" className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Всего платежей', value: payments.length, color: 'mauve' as const },
            { label: 'Успешно', value: payments.filter((p) => p.status === 'succeeded').length, color: 'emerald' as const },
            { label: 'Возврат', value: payments.filter((p) => p.status === 'refunded').length, color: 'blue' as const },
            { label: 'Ожидает', value: payments.filter((p) => p.status === 'pending').length, color: 'amber' as const },
          ].map((stat) => {
            const colorMap: Record<string, string> = {
              mauve: 'bg-mauve-50 text-mauve-600',
              emerald: 'bg-emerald-50 text-emerald-600',
              blue: 'bg-blue-50 text-blue-600',
              amber: 'bg-amber-50 text-amber-600',
            };
            const Icon = stat.color === 'mauve' ? Filter : stat.color === 'emerald' ? CheckCircle2 : stat.color === 'blue' ? RefreshCcw : Clock;
            return (
              <motion.div
                key={stat.label}
                variants={item}
                whileHover={{ y: -2, transition: { duration: 0.2 } }}
                className="bg-white rounded-2xl border border-mauve-100 shadow-sm p-4 group"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl ${colorMap[stat.color]} flex items-center justify-center ring-1 ring-mauve-100/60`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-mono font-semibold text-xl text-ink-900">{stat.value}</div>
                    <p className="text-xs text-ink-500">{stat.label}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Payments Table */}
        <motion.div variants={container} initial="hidden" animate="show" className="bg-white rounded-2xl border border-mauve-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-100 bg-mauve-50/30">
                  <th className="text-left py-3.5 px-5 text-xs font-semibold text-ink-500 uppercase tracking-wide">ID платежа</th>
                  <th className="text-left py-3.5 px-5 text-xs font-semibold text-ink-500 uppercase tracking-wide">Заказ</th>
                  <th className="text-right py-3.5 px-5 text-xs font-semibold text-ink-500 uppercase tracking-wide">Сумма</th>
                  <th className="text-left py-3.5 px-5 text-xs font-semibold text-ink-500 uppercase tracking-wide">Метод</th>
                  <th className="text-center py-3.5 px-5 text-xs font-semibold text-ink-500 uppercase tracking-wide">Статус</th>
                  <th className="text-left py-3.5 px-5 text-xs font-semibold text-ink-500 uppercase tracking-wide">Дата</th>
                  <th className="text-center py-3.5 px-5 text-xs font-semibold text-ink-500 uppercase tracking-wide">Действия</th>
                </tr>
              </thead>
              <tbody>
                {paginatedPayments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-ink-400 text-sm">
                      Платежи не найдены
                    </td>
                  </tr>
                ) : (
                  paginatedPayments.map((payment, idx) => {
                    const cfg = STATUS_CONFIG[payment.status] || STATUS_CONFIG.pending;
                    const methodCfg = METHOD_CONFIG[payment.method] || METHOD_CONFIG.stripe;
                    const isExpanded = expandedId === payment.id;
                    return (
                      <motion.tr key={`${payment.id}-${idx}`} variants={item} className="border-b border-ink-50 hover:bg-mauve-50/30 transition-colors">
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[11px] font-semibold text-mauve-600">{payment.id}</span>
                            <button
                              onClick={() => handleCopy(payment.id, payment.id)}
                              className="text-ink-300 hover:text-mauve-500 transition-colors"
                              title="Копировать ID"
                            >
                              {copiedId === payment.id ? <CheckCircle2 size={12} className="text-emerald-500" /> : <Copy size={12} />}
                            </button>
                          </div>
                        </td>
                        <td className="py-3.5 px-5 font-mono text-xs text-ink-600">{payment.orderId}</td>
                        <td className="py-3.5 px-5 text-right font-mono text-xs font-semibold text-ink-900 whitespace-nowrap">
                          {payment.currency} {payment.amount.toFixed(2)}
                        </td>
                        <td className="py-3.5 px-5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold ${methodCfg.bg} ${methodCfg.text}`}>
                            {methodCfg.label}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${cfg.bg} ${cfg.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                            {cfg.label}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-ink-500 text-xs whitespace-nowrap">{formatDate(payment.createdAt)}</td>
                        <td className="py-3.5 px-5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => setExpandedId(isExpanded ? null : payment.id)}
                              className={`p-1.5 rounded-lg transition-all duration-200 ${
                                isExpanded ? 'bg-mauve-100 text-mauve-600' : 'text-ink-400 hover:text-ink-600 hover:bg-ink-50'
                              }`}
                              title="Подробнее"
                            >
                              <ChevronDown size={16} className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                            </button>
                            {payment.receiptUrl && (
                              <a
                                href={payment.receiptUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group p-1.5 rounded-lg text-ink-400 hover:text-mauve-600 hover:bg-mauve-50 transition-all duration-200 inline-flex items-center gap-1"
                                title={`Открыть чек: ${new URL(payment.receiptUrl).hostname}`}
                              >
                                <ExternalLink size={15} />
                                <ShieldCheck size={10} className="text-emerald-400 group-hover:text-emerald-500 transition-colors" />
                              </a>
                            )}
                            {(payment.status === 'succeeded' || payment.status === 'pending') && (
                              <button
                                onClick={() => handleRefund(payment)}
                                className="p-1.5 rounded-lg text-ink-400 hover:text-red-500 hover:bg-red-50 transition-all duration-200"
                                title="Оформить возврат"
                              >
                                <RefreshCcw size={16} />
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Expanded detail row */}
                        {isExpanded && (
                          <td colSpan={7} className="bg-mauve-50/20 border-t border-mauve-100/50">
                            <AnimatePresence>
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                                className="overflow-hidden"
                              >
                                <div className="grid lg:grid-cols-2 gap-6 p-6">
                                  {/* Payment Payload */}
                                  <div>
                                    <h3 className="text-xs font-semibold uppercase tracking-wide text-mauve-500 mb-3">
                                      Данные платежа
                                      <button
                                        onClick={() => handleCopy(JSON.stringify(payment.payload, null, 2), `${payment.id}-payload`)}
                                        className="ml-2 text-ink-400 hover:text-mauve-500 inline-flex items-center gap-1 normal-case"
                                      >
                                        <Copy size={10} />
                                        <span className="text-[10px]">{copiedId === `${payment.id}-payload` ? 'Скопировано' : 'Копировать'}</span>
                                      </button>
                                    </h3>
                                    <pre className="bg-ink-900 text-emerald-400 rounded-xl p-4 text-[11px] leading-relaxed overflow-x-auto max-h-64 overflow-y-auto font-mono">
                                      {JSON.stringify(payment.payload, null, 2)}
                                    </pre>
                                  </div>

                                  {/* Webhook Events */}
                                  <div>
                                    <h3 className="text-xs font-semibold uppercase tracking-wide text-mauve-500 mb-3">События webhook</h3>
                                    {payment.webhookEvents.length === 0 ? (
                                      <div className="bg-white rounded-xl border border-mauve-100 p-4 text-xs text-ink-400">
                                        Нет событий webhook
                                      </div>
                                    ) : (
                                      <div className="bg-white rounded-xl border border-mauve-100 p-4 space-y-3 max-h-64 overflow-y-auto">
                                        {payment.webhookEvents.map((event, ei) => (
                                          <div
                                            key={ei}
                                            className="relative pb-3 border-l-2 border-mauve-100 pl-4 last:pb-0"
                                          >
                                            <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-mauve-400" />
                                            <p className="text-xs font-semibold text-ink-800 font-mono">{event.type}</p>
                                            <p className="text-[10px] text-ink-500">{formatDateTime(event.receivedAt)}</p>
                                            <pre className="mt-1 text-[10px] text-ink-500 font-mono overflow-x-auto">
                                              {JSON.stringify(event.data, null, 2)}
                                            </pre>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>

                                  {/* Link to order */}
                                  <div className="lg:col-span-2 flex items-center gap-3 pt-2 border-t border-mauve-100/50">
                                    <span className="text-xs text-ink-500">Заказ:</span>
                                    <a
                                      href={`/dashboard/orders?search=${payment.orderId}`}
                                      className="text-xs font-mono font-semibold text-mauve-600 hover:text-mauve-700 hover:underline inline-flex items-center gap-1"
                                    >
                                      {payment.orderId}
                                      <ExternalLink size={12} />
                                    </a>
                                  </div>
                                </div>
                              </motion.div>
                            </AnimatePresence>
                          </td>
                        )}
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {hasMore && (
            <div className="flex justify-center py-4 border-t border-ink-50">
              <button
                onClick={() => setPage((p) => p + 1)}
                className="px-6 py-2 rounded-xl bg-white border border-mauve-100 text-sm font-medium text-mauve-600 hover:bg-mauve-50 transition-all duration-200 shadow-sm"
              >
                Загрузить ещё
              </button>
            </div>
          )}
        </motion.div>

        <div className="h-8" />
      </div>
    </>
  );
}
