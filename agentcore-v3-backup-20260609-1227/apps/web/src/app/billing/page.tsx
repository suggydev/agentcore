'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  CreditCard,
  History,
  TrendingUp,
  AlertCircle,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { useToast } from '@/design/components/Toast';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

const PRESET_AMOUNTS = [500, 1000, 2500, 5000, 10000];

interface Transaction {
  id: string;
  type: 'topup' | 'ai_usage' | 'agent_activation' | 'refund';
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  description?: string;
  createdAt: string;
  metadata?: string;
}

const typeLabels: Record<string, string> = {
  topup: 'Пополнение',
  ai_usage: 'Использование AI',
  agent_activation: 'Активация агента',
  refund: 'Возврат',
};

const statusConfig = {
  pending: { color: 'text-yellow-400', bg: 'bg-yellow-400/10', icon: Clock },
  completed: { color: 'text-emerald-400', bg: 'bg-emerald-400/10', icon: CheckCircle2 },
  failed: { color: 'text-red-400', bg: 'bg-red-400/10', icon: XCircle },
  cancelled: { color: 'text-slate-400', bg: 'bg-slate-400/10', icon: XCircle },
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function BillingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToast } = useToast();
  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [topUpAmount, setTopUpAmount] = useState(1000);
  const [topUpLoading, setTopUpLoading] = useState(false);
  const [topUpError, setTopUpError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'topup' | 'usage'>('all');

  const fetchData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) { router.push('/login'); return; }

      const [balanceRes, txRes] = await Promise.all([
        fetch(`${API_BASE}/api/billing/balance`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE}/api/billing/transactions`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (balanceRes.ok) {
        const balanceData = await balanceRes.json();
        setBalance(balanceData.balance || 0);
      }

      if (txRes.ok) {
        const txData = await txRes.json();
        setTransactions(txData.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch billing data:', err);
      addToast({ variant: 'error', message: 'Не удалось загрузить данные биллинга' });
    } finally {
      setLoading(false);
    }
  }, [addToast, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const paidd = searchParams.get('paid');
    if (paidd === '1') {
      addToast({ variant: 'success', message: 'Платёж успешно обработан. Баланс обновится через несколько секунд.' });
      const timer = setTimeout(() => fetchData(), 3000);
      return () => clearTimeout(timer);
    }
  }, [searchParams, fetchData, addToast]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
    addToast({ variant: 'success', message: 'Данные обновлены' });
  };

  const handleTopUp = async () => {
    if (topUpAmount < 100) {
      setTopUpError('Минимальная сумма пополнения — 100 ₽');
      return;
    }

    setTopUpError(null);
    setTopUpLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/billing/top-up`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: topUpAmount,
          returnUrl: `${window.location.origin}/billing?paid=1`,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.paymentUrl) {
          window.location.href = data.paymentUrl;
        } else {
          addToast({ variant: 'success', message: 'Платёж создан. Перейдите по ссылке для оплаты.' });
        }
      } else {
        const error = await res.json().catch(() => ({}));
        const msg = error.error || 'Не удалось создать платёж';
        setTopUpError(msg);
        addToast({ variant: 'error', message: msg });
      }
    } catch (err) {
      console.error('Top-up failed:', err);
      const msg = 'Не удалось создать платёж. Проверьте подключение.';
      setTopUpError(msg);
      addToast({ variant: 'error', message: msg });
    } finally {
      setTopUpLoading(false);
    }
  };

  const filteredTransactions = transactions.filter((tx) => {
    if (filter === 'all') return true;
    if (filter === 'topup') return tx.type === 'topup' || tx.type === 'refund';
    if (filter === 'usage') return tx.type === 'ai_usage' || tx.type === 'agent_activation';
    return true;
  });

  const totalTopUp = transactions
    .filter((tx) => tx.type === 'topup' && tx.status === 'completed')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalUsage = transactions
    .filter((tx) => (tx.type === 'ai_usage' || tx.type === 'agent_activation') && tx.status === 'completed')
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--brand)]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold tracking-tight mb-2">Биллинг</h1>
          <p className="text-[var(--text-muted)]">Управление балансом и история платежей</p>
        </motion.div>

        {/* Balance Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-[var(--card)] to-[var(--card)] border border-[var(--border)] rounded-2xl p-6 mb-6 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--brand)]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[var(--brand)]/10 flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-[var(--brand)]" />
                </div>
                <div>
                  <p className="text-sm text-[var(--text-muted)]">Текущий баланс</p>
                  <div className="flex items-center gap-3">
                    <p className="text-3xl font-bold font-mono">
                      {balance !== null ? formatCurrency(balance) : '—'}
                    </p>
                    <button
                      onClick={handleRefresh}
                      disabled={refreshing}
                      className="p-1.5 rounded-lg hover:bg-[var(--bg)] text-[var(--text-muted)] hover:text-[var(--text)] transition-all"
                      title="Обновить баланс"
                    >
                      <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <p className="text-xs text-[var(--text-muted)]">Пополнено</p>
                  <p className="text-sm font-medium text-emerald-400">+{formatCurrency(totalTopUp)}</p>
                </div>
                <div className="text-right ml-4">
                  <p className="text-xs text-[var(--text-muted)]">Расходы</p>
                  <p className="text-sm font-medium text-red-400">-{formatCurrency(totalUsage)}</p>
                </div>
              </div>
            </div>

            {/* Top Up Section */}
            <div className="space-y-4">
              {/* Preset amounts */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-[var(--text-muted)] mr-1">Быстрый выбор:</span>
                {PRESET_AMOUNTS.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => { setTopUpAmount(amount); setTopUpError(null); }}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all border ${
                      topUpAmount === amount
                        ? 'bg-[var(--brand)] text-white border-[var(--brand)]'
                        : 'bg-[var(--bg)] text-[var(--text-muted)] hover:text-[var(--text)] border-[var(--border)]'
                    }`}
                  >
                    {amount.toLocaleString('ru-RU')} ₽
                  </button>
                ))}
              </div>

              {/* Manual input + button */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-[var(--text-muted)]">Своя сумма:</span>
                  <div className="relative">
                    <input
                      type="number"
                      min={100}
                      step={100}
                      value={topUpAmount || ''}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setTopUpAmount(val);
                        if (val > 0 && val < 100) {
                          setTopUpError('Минимум 100 ₽');
                        } else {
                          setTopUpError(null);
                        }
                      }}
                      placeholder="1000"
                      className="w-36 pl-3 pr-10 py-2.5 bg-[var(--bg)] border border-[var(--border)] rounded-xl text-base font-mono focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/50 focus:border-[var(--brand)]"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[var(--text-muted)] pointer-events-none">₽</span>
                  </div>
                </div>
                <button
                  onClick={handleTopUp}
                  disabled={topUpLoading || topUpAmount < 100 || !topUpAmount}
                  className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {topUpLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Создание платежа...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Пополнить на {formatCurrency(topUpAmount)}
                    </>
                  )}
                </button>
              </div>

              {/* Error message */}
              {topUpError && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 text-sm text-red-400 bg-red-400/10 rounded-lg px-3 py-2"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {topUpError}
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-[var(--text-muted)]">Всего пополнено</span>
            </div>
            <p className="text-xl font-bold font-mono text-emerald-400">+{formatCurrency(totalTopUp)}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="w-4 h-4 text-red-400" />
              <span className="text-sm text-[var(--text-muted)]">Всего потрачено</span>
            </div>
            <p className="text-xl font-bold font-mono text-red-400">-{formatCurrency(totalUsage)}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <History className="w-4 h-4 text-[var(--brand)]" />
              <span className="text-sm text-[var(--text-muted)]">Транзакций</span>
            </div>
            <p className="text-xl font-bold font-mono">{transactions.length}</p>
          </motion.div>
        </div>

        {/* Transactions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden"
        >
          <div className="p-6 border-b border-[var(--border)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-[var(--brand)]" />
                <h2 className="text-lg font-semibold">История транзакций</h2>
              </div>
              <div className="flex items-center gap-2">
                {(['all', 'topup', 'usage'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                      filter === f
                        ? 'bg-[var(--brand)]/10 text-[var(--brand)] font-medium'
                        : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                    }`}
                  >
                    {f === 'all' ? 'Все' : f === 'topup' ? 'Пополнения' : 'Расходы'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="divide-y divide-[var(--border)]">
            <AnimatePresence>
              {filteredTransactions.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-8 text-center"
                >
                  <AlertCircle className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-2" />
                  <p className="text-[var(--text-muted)]">Нет транзакций</p>
                </motion.div>
              ) : (
                filteredTransactions.map((tx, index) => {
                  const status = statusConfig[tx.status] || statusConfig.pending;
                  const StatusIcon = status.icon;
                  const isPositive = tx.type === 'topup' || tx.type === 'refund';

                  return (
                    <motion.div
                      key={tx.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="p-4 flex items-center gap-4 hover:bg-[var(--bg)]/50 transition-colors"
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${status.bg}`}>
                        <StatusIcon className={`w-5 h-5 ${status.color}`} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {typeLabels[tx.type] || tx.type}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${status.bg} ${status.color}`}>
                            {tx.status === 'pending' ? 'В обработке' : tx.status === 'completed' ? 'Завершено' : tx.status === 'failed' ? 'Ошибка' : 'Отменено'}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5">
                          {tx.description || '—'}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className={`font-mono font-medium ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                          {isPositive ? '+' : '-'}{formatCurrency(Math.abs(tx.amount))}
                        </p>
                        <p className="text-xs text-[var(--text-muted)]">{formatDate(tx.createdAt)}</p>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function BillingFallback() {
  return (
    <div className="flex items-center justify-center h-screen">
      <Loader2 className="w-8 h-8 animate-spin text-[var(--brand)]" />
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense fallback={<BillingFallback />}>
      <BillingContent />
    </Suspense>
  );
}
