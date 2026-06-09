'use client';

import { motion } from 'framer-motion';
import { CreditCard, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface Transaction {
  id: string;
  amount: number;
  description: string;
  createdAt: string;
}

interface BillingTabProps {
  billingData: { balance: number; transactions: Transaction[] };
  billingLoading: boolean;
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
};

export default function BillingTab({ billingData, billingLoading }: BillingTabProps) {
  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item} className="bg-surface rounded-2xl border border-border shadow-sm p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center">
            <CreditCard size={20} className="text-brand" />
          </div>
          <div>
            <h3 className="font-semibold text-text">Баланс и платежи</h3>
            <p className="text-xs text-text-muted">Управление оплатой и историей транзакций</p>
          </div>
        </div>

        {billingLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-brand animate-spin" />
          </div>
        ) : (
          <>
            <div className="p-4 rounded-xl bg-gradient-to-br from-brand/10 to-brand/5 border border-brand/20 mb-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-muted">Текущий баланс</span>
                <span className="text-2xl font-bold text-brand">{(billingData.balance ?? 0).toFixed(2).replace('.', ',')} ₽</span>
              </div>
            </div>

            <div className="mb-5">
              <h4 className="text-sm font-semibold text-text mb-3">История транзакций</h4>
              {billingData.transactions.length === 0 ? (
                <p className="text-sm text-text-muted py-3">Нет транзакций</p>
              ) : (
                <div className="space-y-2">
                  {billingData.transactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-surface-2 border border-border">
                      <div>
                        <div className="text-sm text-text">{tx.description}</div>
                        <div className="text-xs text-text-muted">{new Date(tx.createdAt).toLocaleDateString('ru-RU')}</div>
                      </div>
                      <div className={`text-sm font-semibold ${tx.amount > 0 ? 'text-success' : 'text-text'}`}>
                        {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(2).replace('.', ',')} ₽
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Link
              href="/settings/upgrade"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand text-white text-sm font-semibold hover:bg-brand-hover transition-all shadow-lg shadow-brand/20"
            >
              Пополнить баланс
            </Link>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
