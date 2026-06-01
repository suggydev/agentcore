'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Clock,
  ChevronDown,
  X,
  RefreshCcw,
  AlertCircle,
  Loader2,
  ShoppingCart,
  CheckCircle2,
  Undo2,
  ShieldAlert,
} from 'lucide-react';
const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  planName: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  paymentId: string;
  status: 'pending' | 'paid' | 'failed' | 'refunded' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  timeline: Array<{ status: string; timestamp: string; note: string }>;
  internalNotes: string;
}

const PAGE_SIZE = 15;

const FILTER_LABELS: Record<string, string> = {
  all: 'все',
  pending: 'ожидает',
  paid: 'оплачен',
  failed: 'ошибка',
  refunded: 'возврат',
  cancelled: 'отменён',
};

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  pending: {
    label: 'Ожидает',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    dot: 'bg-amber-400',
  },
  paid: {
    label: 'Оплачен',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    dot: 'bg-emerald-400',
  },
  failed: {
    label: 'Ошибка',
    bg: 'bg-red-50',
    text: 'text-red-700',
    dot: 'bg-red-400',
  },
  refunded: {
    label: 'Возврат',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    dot: 'bg-blue-400',
  },
  cancelled: {
    label: 'Отменён',
    bg: 'bg-ink-100',
    text: 'text-ink-500',
    dot: 'bg-ink-400',
  },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
      return;
    }
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/billing/orders`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : (data.data || []);
          setOrders(list);
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

  const filteredOrders = useMemo(() => {
    let result = orders;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (o) =>
          o.id.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.customerEmail.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'all') {
      result = result.filter((o) => o.status === statusFilter);
    }
    return result;
  }, [orders, search, statusFilter]);

  const paginatedOrders = useMemo(() => filteredOrders.slice(0, page * PAGE_SIZE), [filteredOrders, page]);
  const hasMore = paginatedOrders.length < filteredOrders.length;

  const handleRefund = async (order: Order) => {
    if (!confirm(`Оформить возврат для ${order.id} (${order.amount} ${order.currency})?`)) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_BASE}/api/billing/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ paymentId: order.paymentId, amount: order.amount, currency: order.currency }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.message || `Ошибка возврата (${res.status})`);
        return;
      }
      setOrders((prev) =>
        prev.map((o) =>
          o.id === order.id
            ? {
                ...o,
                status: 'refunded' as const,
                updatedAt: new Date().toISOString(),
                timeline: [
                  ...o.timeline,
                  { status: 'Оформлен возврат', timestamp: new Date().toISOString(), note: 'Полный возврат обработан' },
                ],
                internalNotes: o.internalNotes ? `${o.internalNotes}\n[Авто] Оформлен возврат.` : '[Авто] Оформлен возврат.',
              }
            : o
        )
      );
    } catch {
      alert('Сетевая ошибка при попытке возврата.');
    }
  };

  const handleAddNote = async (orderId: string, note: string) => {
    const previousNotes = orders.find((o) => o.id === orderId)?.internalNotes ?? '';
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, internalNotes: note } : o))
    );
    const token = localStorage.getItem('token');
    try {
      await fetch(`${API_BASE}/api/orders/${orderId}/notes`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ notes: note }),
      });
    } catch (err) {
      console.error('Failed to save note:', err);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, internalNotes: previousNotes } : o))
      );
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
        <div className="flex items-center justify-center min-h-[80vh]">
          <Loader2 className="w-8 h-8 text-mauve-500 animate-spin" />
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
              <p className="text-[11px] font-semibold uppercase tracking-label text-mauve-500 mb-2">Заказы</p>
              <h1 className="font-display font-bold text-3xl text-ink-900 tracking-tight">Управление заказами</h1>
              <p className="text-ink-500 mt-1 text-sm">Просмотр и управление заказами и платежами.</p>
            </div>
          </motion.div>
        </motion.div>

        {/* Filters */}
        <motion.div variants={container} initial="hidden" animate="show" className="mb-6">
          <motion.div variants={item} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
              <input
                type="text"
                placeholder="Поиск по ID заказа, клиенту..."
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
            <div className="flex gap-1.5 bg-white rounded-xl border border-mauve-100 p-1.5 shadow-sm">
              {(['all', 'pending', 'paid', 'failed', 'refunded', 'cancelled'] as const).map((s) => {
                const dotColor: Record<string, string> = {
                  all: '',
                  pending: 'bg-amber-400',
                  paid: 'bg-emerald-400',
                  failed: 'bg-red-400',
                  refunded: 'bg-blue-400',
                  cancelled: 'bg-ink-400',
                };
                return (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-3.5 py-2 rounded-lg text-xs font-semibold capitalize transition-all duration-200 flex items-center gap-1.5 ${
                      statusFilter === s
                        ? 'bg-mauve-600 text-white shadow-sm'
                        : 'text-ink-500 hover:text-ink-700 hover:bg-mauve-50'
                    }`}
                  >
                    {s !== 'all' && (
                      <span className={`w-1.5 h-1.5 rounded-full ${dotColor[s]} ${statusFilter === s ? 'bg-white' : ''}`} />
                    )}
                    {FILTER_LABELS[s]}
                    {statusFilter === s && s !== 'all' && (
                      <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[9px] font-mono ml-0.5">
                        {orders.filter((o) => o.status === s).length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </motion.div>

        {/* Summary Cards */}
        <motion.div variants={container} initial="hidden" animate="show" className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          {[
            { label: 'Всего заказов', value: orders.length, icon: ShoppingCart, color: 'mauve', gradient: 'from-mauve-500 to-mauve-600' },
            { label: 'Оплачено', value: orders.filter((o) => o.status === 'paid').length, icon: CheckCircle2, color: 'emerald', gradient: 'from-emerald-500 to-emerald-600' },
            { label: 'Ожидает', value: orders.filter((o) => o.status === 'pending').length, icon: Clock, color: 'amber', gradient: 'from-amber-400 to-amber-500' },
            { label: 'Возврат', value: orders.filter((o) => o.status === 'refunded').length, icon: Undo2, color: 'blue', gradient: 'from-blue-500 to-blue-600' },
            { label: 'Ошибка', value: orders.filter((o) => o.status === 'failed').length, icon: ShieldAlert, color: 'red', gradient: 'from-red-500 to-red-600' },
          ].map((stat) => {
            const Icon = stat.icon;
            const colorMap: Record<string, string> = {
              mauve: 'bg-mauve-50 text-mauve-600',
              emerald: 'bg-emerald-50 text-emerald-600',
              amber: 'bg-amber-50 text-amber-600',
              blue: 'bg-blue-50 text-blue-600',
              red: 'bg-red-50 text-red-600',
            };
            return (
              <motion.div
                key={stat.label}
                variants={item}
                whileHover={{ y: -2, transition: { duration: 0.2 } }}
                className="bg-white rounded-2xl border border-mauve-100 shadow-sm p-4 group relative overflow-hidden"
              >
                <div className={`absolute top-0 right-0 w-16 h-16 rounded-bl-3xl bg-gradient-to-bl ${stat.gradient} opacity-[0.07] group-hover:opacity-[0.12] transition-opacity duration-300`} />
                <div className="flex items-center gap-3 relative">
                  <div className={`w-10 h-10 rounded-xl ${colorMap[stat.color]} flex items-center justify-center ring-1 ring-mauve-100/60 shadow-sm`}>
                    <Icon className="w-[18px] h-[18px]" />
                  </div>
                  <div>
                    <div className="font-mono font-semibold text-xl text-ink-900">{stat.value}</div>
                    <p className="text-[11px] text-ink-500 font-medium">{stat.label}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Orders Table */}
        <motion.div variants={container} initial="hidden" animate="show" className="bg-white rounded-2xl border border-mauve-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-100 bg-mauve-50/30">
                  <th className="text-left py-3.5 px-5 text-xs font-semibold text-ink-500 uppercase tracking-wide">ID заказа</th>
                  <th className="text-left py-3.5 px-5 text-xs font-semibold text-ink-500 uppercase tracking-wide">Дата</th>
                  <th className="text-left py-3.5 px-5 text-xs font-semibold text-ink-500 uppercase tracking-wide">Клиент</th>
                  <th className="text-left py-3.5 px-5 text-xs font-semibold text-ink-500 uppercase tracking-wide">План</th>
                  <th className="text-right py-3.5 px-5 text-xs font-semibold text-ink-500 uppercase tracking-wide">Сумма</th>
                  <th className="text-left py-3.5 px-5 text-xs font-semibold text-ink-500 uppercase tracking-wide">Метод</th>
                  <th className="text-center py-3.5 px-5 text-xs font-semibold text-ink-500 uppercase tracking-wide">Статус</th>
                  <th className="text-center py-3.5 px-5 text-xs font-semibold text-ink-500 uppercase tracking-wide">Действия</th>
                </tr>
              </thead>
              <tbody>
                {paginatedOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-ink-400 text-sm">
                      Заказы не найдены
                    </td>
                  </tr>
                ) : (
                  paginatedOrders.map((order, i) => {
                    const cfg = STATUS_CONFIG[order.status];
                    const isExpanded = expandedId === order.id;
                    return (
                      <motion.tr key={order.id} variants={item} layout className="border-b border-ink-50 hover:bg-mauve-50/30 transition-colors">
                        <td className="py-3.5 px-5">
                          <span className="font-mono text-xs font-semibold text-mauve-600">{order.id}</span>
                        </td>
                        <td className="py-3.5 px-5 text-ink-500 whitespace-nowrap text-xs">{formatDate(order.createdAt)}</td>
                        <td className="py-3.5 px-5">
                          <div className="text-ink-900 font-medium text-sm">{order.customerName}</div>
                          <div className="text-ink-400 text-xs">{order.customerEmail}</div>
                        </td>
                        <td className="py-3.5 px-5 text-ink-700 text-xs font-medium">{order.planName}</td>
                        <td className="py-3.5 px-5 text-right font-mono text-xs font-semibold text-ink-900 whitespace-nowrap">
                          {order.currency} {order.amount.toFixed(2)}
                        </td>
                        <td className="py-3.5 px-5">
                          <span className="text-xs text-ink-600 capitalize bg-ink-50 px-2 py-0.5 rounded-md font-medium">
                            {order.paymentMethod}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${cfg.bg} ${cfg.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                            {cfg.label}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => setExpandedId(isExpanded ? null : order.id)}
                              className={`p-1.5 rounded-lg transition-all duration-200 ${
                                isExpanded ? 'bg-mauve-100 text-mauve-600' : 'text-ink-400 hover:text-ink-600 hover:bg-ink-50'
                              }`}
                              title="Подробнее"
                            >
                              <ChevronDown size={16} className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                            </button>
                            {(order.status === 'paid' || order.status === 'pending') && (
                              <button
                                onClick={() => handleRefund(order)}
                                className="p-1.5 rounded-lg text-ink-400 hover:text-red-500 hover:bg-red-50 transition-all duration-200"
                                title="Оформить возврат"
                              >
                                <RefreshCcw size={16} />
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Expanded detail row */}
                        <AnimatePresence initial={false}>
                          {isExpanded && (
                          <td colSpan={8} className="bg-mauve-50/20 border-t border-mauve-100/50">
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                                className="overflow-hidden"
                              >
                                <div className="grid lg:grid-cols-2 gap-6 p-6">
                                  {/* Customer Info */}
                                  <div>
                                    <h3 className="text-xs font-semibold uppercase tracking-wide text-mauve-500 mb-3">Информация о клиенте</h3>
                                    <div className="bg-white rounded-xl border border-mauve-100 p-4 space-y-2">
                                      <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-mauve-200 to-mauve-300 flex items-center justify-center text-sm font-semibold text-mauve-700">
                                          {order.customerName.charAt(0)}
                                        </div>
                                        <div>
                                          <p className="text-sm font-semibold text-ink-900">{order.customerName}</p>
                                          <p className="text-xs text-ink-500">{order.customerEmail}</p>
                                        </div>
                                      </div>
                                      <div className="pt-2 border-t border-mauve-50/50">
                                        <p className="text-xs text-ink-400">План: <span className="text-ink-700 font-medium">{order.planName}</span></p>
                                        <p className="text-xs text-ink-400 mt-1">Оплата: <span className="text-ink-700 font-medium capitalize">{order.paymentMethod}</span></p>
                                        <p className="text-xs text-ink-400 mt-1">ID платежа: <span className="font-mono text-ink-600 text-[11px]">{order.paymentId}</span></p>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Timeline */}
                                  <div>
                                    <h3 className="text-xs font-semibold uppercase tracking-wide text-mauve-500 mb-3">Хронология заказа</h3>
                                    <div className="bg-white rounded-xl border border-mauve-100 p-4">
                                      <div className="relative pl-5 space-y-0">
                                        {order.timeline.map((t, idx) => (
                                          <div key={idx} className={`relative pb-4 ${idx === order.timeline.length - 1 ? '' : 'border-l-2 border-mauve-100'}`}>
                                            <div className="absolute -left-[21px] w-3 h-3 rounded-full bg-mauve-200 border-2 border-white" />
                                            <p className="text-xs font-semibold text-ink-800">{t.status}</p>
                                            <p className="text-[11px] text-ink-500">{formatDateTime(t.timestamp)}</p>
                                            <p className="text-[11px] text-ink-400 mt-0.5">{t.note}</p>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Internal Notes */}
                                  <div className="lg:col-span-2">
                                    <h3 className="text-xs font-semibold uppercase tracking-wide text-mauve-500 mb-3">Внутренние заметки</h3>
                                    <textarea
                                      value={order.internalNotes}
                                      onChange={(e) => handleAddNote(order.id, e.target.value)}
                                      placeholder="Добавить заметку..."
                                      rows={3}
                                      className="w-full px-4 py-3 rounded-xl bg-white border border-mauve-100 text-sm text-ink-900 placeholder-ink-400 focus:outline-none focus:ring-2 focus:ring-mauve-200 focus:border-mauve-300 transition-all resize-none"
                                    />
                                  </div>
                                </div>
                              </motion.div>
                          </td>
                          )}
                        </AnimatePresence>
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
