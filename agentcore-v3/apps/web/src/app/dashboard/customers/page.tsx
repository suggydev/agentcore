'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  ChevronDown,
  X,
  User,
  Mail,
  Calendar,
  DollarSign,
  Bot,
  AlertCircle,
  Loader2,
  ShoppingBag,
  PackageOpen,
} from 'lucide-react';
const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

interface CustomerAgent {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'draft';
  conversationsCount: number;
  createdAt: string;
}

interface CustomerOrder {
  id: string;
  planName: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
}

interface CustomerPayment {
  id: string;
  method: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  company: string;
  registrationDate: string;
  totalOrders: number;
  totalSpent: number;
  currency: string;
  activeAgents: CustomerAgent[];
  orders: CustomerOrder[];
  payments: CustomerPayment[];
}

const AVATAR_GRADIENTS = [
  'from-rose-300 to-rose-400',
  'from-sky-300 to-indigo-400',
  'from-emerald-300 to-teal-400',
  'from-amber-300 to-orange-400',
  'from-violet-300 to-purple-400',
  'from-cyan-300 to-blue-400',
  'from-pink-300 to-fuchsia-400',
  'from-lime-300 to-green-400',
];

const AVATAR_TEXT_COLORS = [
  'text-rose-700', 'text-sky-700', 'text-emerald-700', 'text-amber-700',
  'text-violet-700', 'text-cyan-700', 'text-pink-700', 'text-lime-700',
];

const AVATAR_RINGS = [
  'ring-rose-100/60', 'ring-sky-100/60', 'ring-emerald-100/60', 'ring-amber-100/60',
  'ring-violet-100/60', 'ring-cyan-100/60', 'ring-pink-100/60', 'ring-lime-100/60',
];

function avatarStyles(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % AVATAR_GRADIENTS.length;
  return {
    gradient: AVATAR_GRADIENTS[idx],
    textColor: AVATAR_TEXT_COLORS[idx],
    ring: AVATAR_RINGS[idx],
  };
}

function SummarySkeleton() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white rounded-2xl border border-mauve-100 shadow-sm p-4 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-mauve-100" />
            <div className="space-y-2 flex-1">
              <div className="h-6 w-16 bg-mauve-100 rounded" />
              <div className="h-3 w-24 bg-mauve-50 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const loadMoreRef = useRef(false);

  const PAGE_SIZE = 12;

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
      return;
    }
    const load = async () => {
      setError('');
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/customers`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : (data.data || []);
          setCustomers(list);
        } else {
          setError('Не удалось загрузить список клиентов. Попробуйте позже.');
        }
      } catch {
        setError('Ошибка соединения. Проверьте подключение и попробуйте снова.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredCustomers = useMemo(() => {
    if (!debouncedSearch.trim()) return customers;
    const q = debouncedSearch.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.company.toLowerCase().includes(q)
    );
  }, [customers, debouncedSearch]);

  const paginatedCustomers = useMemo(
    () => filteredCustomers.slice(0, page * PAGE_SIZE),
    [filteredCustomers, page]
  );
  const hasMore = paginatedCustomers.length < filteredCustomers.length;

  const loadMore = useCallback(() => {
    if (!hasMore || loadMoreRef.current) return;
    loadMoreRef.current = true;
    setPage((p) => p + 1);
  }, [hasMore]);

  useEffect(() => {
    loadMoreRef.current = false;
  }, [paginatedCustomers]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: '200px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('ru-RU', { month: 'short', day: 'numeric', year: 'numeric' });

  const STATUS_MAP: Record<string, string> = {
    paid: 'text-emerald-700 bg-emerald-100',
    refunded: 'text-blue-700 bg-blue-100',
    failed: 'text-red-700 bg-red-100',
    cancelled: 'text-ink-600 bg-ink-200',
    pending: 'text-amber-700 bg-amber-100',
    succeeded: 'text-emerald-700 bg-emerald-100',
    active: 'text-emerald-700 bg-emerald-100',
    draft: 'text-ink-600 bg-ink-200',
    inactive: 'text-ink-500 bg-ink-200',
  };

  const STATUS_LABELS: Record<string, string> = {
    paid: 'Оплачен',
    refunded: 'Возврат',
    failed: 'Ошибка',
    cancelled: 'Отменён',
    pending: 'Ожидает',
    succeeded: 'Успешно',
    active: 'Активен',
    draft: 'Черновик',
    inactive: 'Неактивен',
  };

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
          <div className="mb-8">
            <div className="h-3 w-20 bg-mauve-100 rounded mb-2 animate-pulse" />
            <div className="h-8 w-64 bg-mauve-100 rounded mb-1 animate-pulse" />
            <div className="h-4 w-96 bg-mauve-50 rounded animate-pulse" />
          </div>
          <SummarySkeleton />
          <div className="bg-white rounded-2xl border border-mauve-100 shadow-sm overflow-hidden animate-pulse">
            <div className="h-[400px] bg-mauve-50/30" />
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <div className="flex flex-col items-center justify-center min-h-[80vh] gap-4 px-4">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-2">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-lg font-semibold text-ink-900">Ошибка загрузки</h2>
          <p className="text-sm text-ink-500 text-center max-w-sm">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary text-sm px-6 py-2.5 rounded-xl"
          >
            Повторить попытку
          </button>
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
              <p className="text-[11px] font-semibold uppercase tracking-label text-mauve-500 mb-2">Клиенты</p>
              <h1 className="font-display font-bold text-3xl text-ink-900 tracking-tight">Справочник клиентов</h1>
              <p className="text-ink-500 mt-1 text-sm">Управление клиентами и просмотр их активности.</p>
            </div>
          </motion.div>
        </motion.div>

        {/* Search */}
        <motion.div variants={container} initial="hidden" animate="show" className="mb-6">
          <motion.div variants={item}>
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
              <input
                type="text"
                placeholder="Поиск по имени, email или компании..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-mauve-100 text-sm text-ink-900 placeholder-ink-400 focus:outline-none focus:ring-2 focus:ring-mauve-200 focus:border-mauve-300 transition-all duration-200 shadow-sm"
              />
              {search && (
                <button
                  onClick={() => { setSearch(''); setDebouncedSearch(''); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>

        {/* Summary Cards */}
        <motion.div variants={container} initial="hidden" animate="show" className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Всего клиентов', value: customers.length, icon: User, color: 'mauve' as const },
            { label: 'Всего заказов', value: customers.reduce((s, c) => s + c.totalOrders, 0), icon: ShoppingBag, color: 'emerald' as const },
            { label: 'Общая выручка', value: `$ ${customers.reduce((s, c) => s + c.totalSpent, 0).toLocaleString()}`, icon: DollarSign, color: 'mauve' as const },
            { label: 'Активных агентов', value: customers.reduce((s, c) => s + c.activeAgents.filter((a) => a.status === 'active').length, 0), icon: Bot, color: 'amber' as const },
          ].map((stat) => {
            const colorMap: Record<string, string> = {
              mauve: 'bg-mauve-50 text-mauve-600',
              emerald: 'bg-emerald-50 text-emerald-600',
              amber: 'bg-amber-50 text-amber-600',
            };
            const Icon = stat.icon;
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

        {/* Customers Table */}
        <motion.div variants={container} initial="hidden" animate="show" className="bg-white rounded-2xl border border-mauve-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-100 bg-mauve-50/30">
                  <th className="text-left py-3.5 px-5 text-xs font-semibold text-ink-500 uppercase tracking-wide">Клиент</th>
                  <th className="text-left py-3.5 px-5 text-xs font-semibold text-ink-500 uppercase tracking-wide">Email</th>
                  <th className="text-left py-3.5 px-5 text-xs font-semibold text-ink-500 uppercase tracking-wide hidden md:table-cell">Дата регистрации</th>
                  <th className="text-center py-3.5 px-5 text-xs font-semibold text-ink-500 uppercase tracking-wide hidden lg:table-cell">Заказы</th>
                  <th className="text-right py-3.5 px-5 text-xs font-semibold text-ink-500 uppercase tracking-wide hidden lg:table-cell">Потрачено</th>
                  <th className="text-center py-3.5 px-5 text-xs font-semibold text-ink-500 uppercase tracking-wide">Агенты</th>
                  <th className="text-center py-3.5 px-5 text-xs font-semibold text-ink-500 uppercase tracking-wide">Детали</th>
                </tr>
              </thead>
              <AnimatePresence mode="wait">
                <tbody key="rows">
                  {paginatedCustomers.length === 0 ? (
                    <motion.tr
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <td colSpan={7} className="py-20 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-16 h-16 rounded-2xl bg-mauve-50 flex items-center justify-center ring-1 ring-mauve-100/60">
                            <PackageOpen className="w-8 h-8 text-mauve-400" />
                          </div>
                          <h3 className="text-sm font-semibold text-ink-700">Клиенты не найдены</h3>
                          <p className="text-xs text-ink-400 max-w-xs">
                            {debouncedSearch
                              ? 'По вашему запросу ничего не найдено. Попробуйте изменить параметры поиска.'
                              : 'Список клиентов пока пуст. Новые клиенты будут отображаться здесь.'}
                          </p>
                        </div>
                      </td>
                    </motion.tr>
                  ) : (
                     paginatedCustomers.map((customer) => {
                       const isExpanded = expandedId === customer.id;
                       const activeAgentCount = customer.activeAgents.filter((a) => a.status === 'active').length;
                       const { gradient, textColor: textClr, ring: ringClr } = avatarStyles(customer.name);

                      return (
                        <motion.tr
                          key={customer.id}
                          variants={item}
                          whileHover={{ scale: 1.001, backgroundColor: 'rgba(250,248,252,0.6)' }}
                          className="border-b border-ink-50 transition-colors"
                        >
                          <td className="py-3.5 px-5">
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-xs font-semibold ${textClr} ring-2 ${ringClr} flex-shrink-0`}>
                                {customer.name.charAt(0)}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-ink-900">{customer.name}</p>
                                <p className="text-[11px] text-ink-400 hidden sm:block">{customer.company}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-5 text-ink-600 text-xs">{customer.email}</td>
                          <td className="py-3.5 px-5 text-ink-500 text-xs whitespace-nowrap hidden md:table-cell">
                            <div className="flex items-center gap-1.5">
                              <Calendar size={12} className="text-ink-400" />
                              {formatDate(customer.registrationDate)}
                            </div>
                          </td>
                          <td className="py-3.5 px-5 text-center font-mono text-xs font-semibold text-ink-700 hidden lg:table-cell">
                            {customer.totalOrders}
                          </td>
                          <td className="py-3.5 px-5 text-right font-mono text-xs font-semibold text-ink-900 hidden lg:table-cell">
                            {customer.currency} {customer.totalSpent.toFixed(2)}
                          </td>
                          <td className="py-3.5 px-5 text-center">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                              activeAgentCount > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-ink-100 text-ink-500'
                            }`}>
                              <Bot size={12} />
                              {activeAgentCount}
                            </span>
                          </td>
                          <td className="py-3.5 px-5 text-center">
                            <button
                              onClick={() => setExpandedId(isExpanded ? null : customer.id)}
                              className={`p-1.5 rounded-lg transition-all duration-200 ${
                                isExpanded ? 'bg-mauve-100 text-mauve-600' : 'text-ink-400 hover:text-ink-600 hover:bg-ink-50'
                              }`}
                              title="Подробнее"
                            >
                              <ChevronDown size={16} className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                            </button>
                          </td>

                          {isExpanded && (
                            <motion.td
                              colSpan={7}
                              key={`${customer.id}-expanded`}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.25 }}
                              className="bg-mauve-50/20 border-t border-mauve-100/50 p-0"
                            >
                              <div className="grid lg:grid-cols-2 gap-6 p-6">
                                {/* Contact Info */}
                                <div>
                                  <h3 className="text-xs font-semibold uppercase tracking-wide text-mauve-500 mb-3">Контактная информация</h3>
                                  <div className="bg-white rounded-xl border border-mauve-100 p-4 space-y-3">
                                    <div className="flex items-center gap-3">
                                      <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-lg font-semibold ${textClr} ring-2 ${ringClr}`}>
                                        {customer.name.charAt(0)}
                                      </div>
                                      <div>
                                        <p className="text-sm font-semibold text-ink-900">{customer.name}</p>
                                        <p className="text-xs text-ink-500">{customer.company}</p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-ink-500">
                                      <Mail size={12} className="text-ink-400" />
                                      {customer.email}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-ink-500">
                                      <Calendar size={12} className="text-ink-400" />
                                      Зарегистрирован {formatDate(customer.registrationDate)}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-ink-500">
                                      <DollarSign size={12} className="text-ink-400" />
                                      Всего потрачено: {customer.currency} {customer.totalSpent.toFixed(2)} за {customer.totalOrders} заказов
                                    </div>
                                  </div>
                                </div>

                                {/* Active Agents */}
                                <div>
                                  <h3 className="text-xs font-semibold uppercase tracking-wide text-mauve-500 mb-3">Активных агентов ({customer.activeAgents.length})</h3>
                                  <div className="bg-white rounded-xl border border-mauve-100 p-4 max-h-64 overflow-y-auto">
                                    {customer.activeAgents.length === 0 ? (
                                      <p className="text-xs text-ink-400">Нет агентов</p>
                                    ) : (
                                      <div className="space-y-3">
                                        {customer.activeAgents.map((agent) => (
                                          <div key={agent.id} className="flex items-center justify-between pb-3 border-b border-mauve-50 last:border-0 last:pb-0">
                                            <div className="flex items-center gap-2.5">
                                              <div className="w-8 h-8 rounded-lg bg-mauve-50 flex items-center justify-center ring-1 ring-mauve-100/60">
                                                <Bot size={14} className="text-mauve-500" />
                                              </div>
                                              <div>
                                                <p className="text-xs font-semibold text-ink-800">{agent.name}</p>
                                                <p className="text-[10px] text-ink-400">{agent.conversationsCount} диалогов</p>
                                              </div>
                                            </div>
                                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_MAP[agent.status] || 'text-ink-500 bg-ink-200'}`}>
                                              {STATUS_LABELS[agent.status] || agent.status}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Order History */}
                                <div>
                                  <h3 className="text-xs font-semibold uppercase tracking-wide text-mauve-500 mb-3">История заказов</h3>
                                  <div className="bg-white rounded-xl border border-mauve-100 max-h-64 overflow-y-auto">
                                    {customer.orders.length === 0 ? (
                                      <div className="p-4 text-xs text-ink-400">Пока нет заказов</div>
                                    ) : (
                                      <table className="w-full text-xs">
                                        <thead>
                                          <tr className="border-b border-ink-50 bg-mauve-50/20">
                                            <th className="text-left py-2 px-3 font-semibold text-ink-500">Заказ</th>
                                            <th className="text-left py-2 px-3 font-semibold text-ink-500">План</th>
                                            <th className="text-right py-2 px-3 font-semibold text-ink-500">Сумма</th>
                                            <th className="text-center py-2 px-3 font-semibold text-ink-500">Статус</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {customer.orders.map((order) => (
                                            <tr key={order.id} className="border-b border-ink-50/50 last:border-0">
                                              <td className="py-2 px-3 font-mono text-[11px] text-mauve-600">{order.id}</td>
                                              <td className="py-2 px-3 text-ink-700">{order.planName}</td>
                                              <td className="py-2 px-3 text-right font-mono text-ink-900">{order.currency} {order.amount.toFixed(2)}</td>
                                              <td className="py-2 px-3 text-center">
                                                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${STATUS_MAP[order.status] || STATUS_MAP.paid}`}>
                                                  {STATUS_LABELS[order.status] || order.status}
                                                </span>
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    )}
                                  </div>
                                </div>

                                {/* Payment History */}
                                <div>
                                  <h3 className="text-xs font-semibold uppercase tracking-wide text-mauve-500 mb-3">История платежей</h3>
                                  <div className="bg-white rounded-xl border border-mauve-100 max-h-64 overflow-y-auto">
                                    {customer.payments.length === 0 ? (
                                      <div className="p-4 text-xs text-ink-400">Пока нет платежей</div>
                                    ) : (
                                      <table className="w-full text-xs">
                                        <thead>
                                          <tr className="border-b border-ink-50 bg-mauve-50/20">
                                            <th className="text-left py-2 px-3 font-semibold text-ink-500">Платёж</th>
                                            <th className="text-left py-2 px-3 font-semibold text-ink-500">Метод</th>
                                            <th className="text-right py-2 px-3 font-semibold text-ink-500">Сумма</th>
                                            <th className="text-center py-2 px-3 font-semibold text-ink-500">Статус</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {customer.payments.map((payment) => (
                                            <tr key={payment.id} className="border-b border-ink-50/50 last:border-0">
                                              <td className="py-2 px-3 font-mono text-[10px] text-mauve-600 truncate max-w-[100px]">{payment.id.slice(0, 16)}...</td>
                                              <td className="py-2 px-3 text-ink-600 capitalize">{payment.method}</td>
                                              <td className="py-2 px-3 text-right font-mono text-ink-900">{payment.currency} {payment.amount.toFixed(2)}</td>
                                              <td className="py-2 px-3 text-center">
                                                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${STATUS_MAP[payment.status] || STATUS_MAP.paid}`}>
                                                  {STATUS_LABELS[payment.status] || payment.status}
                                                </span>
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </motion.td>
                          )}
                        </motion.tr>
                      );
                    })
                  )}
                </tbody>
              </AnimatePresence>

              {hasMore && (
                <tfoot>
                  <tr>
                    <td colSpan={7} className="p-0">
                      <div ref={sentinelRef} className="flex justify-center py-4 border-t border-ink-50">
                        <Loader2 className="w-5 h-5 text-mauve-400 animate-spin" />
                      </div>
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </motion.div>

        <div className="h-8" />
      </div>
    </>
  );
}
