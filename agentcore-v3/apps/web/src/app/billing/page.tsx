'use client';

import { CreditCard, Shield, Wallet } from 'lucide-react';

export default function BillingPage() {
  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto" data-testid="billing-page">
      <div className="mb-8">
        <p className="text-[11px] font-semibold uppercase tracking-label text-[var(--brand)] mb-2">Биллинг</p>
        <h1 className="font-display font-bold text-3xl text-[var(--text)] tracking-tight">Биллинг</h1>
        <p className="text-[var(--text-muted)] mt-1 text-sm">Управление подпиской и способами оплаты.</p>
      </div>

      <div className="space-y-6">
        <div className="bg-surface rounded-2xl border border-[var(--border)] shadow-sm p-6 subscription-section" data-testid="subscription-info">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-[var(--accent-soft)] flex items-center justify-center ring-1 ring-[var(--border)]/60">
              <CreditCard className="w-[18px] h-[18px] text-[var(--brand)]" />
            </div>
            <div>
              <h3 className="font-semibold text-[var(--text)]">Текущий план</h3>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">Информация о подписке</p>
            </div>
          </div>
          <div className="flex items-center gap-4 plan-card">
            <div className="w-12 h-12 rounded-xl bg-[var(--accent-soft)] flex items-center justify-center ring-1 ring-[var(--border)]/60">
              <Shield className="w-6 h-6 text-[var(--brand)]" />
            </div>
            <div>
              <h2 className="font-display font-semibold text-lg text-[var(--text)]" data-testid="current-plan">Starter План</h2>
              <p className="text-sm text-[var(--text-muted)]">Базовый функционал</p>
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-2xl border border-[var(--border)] shadow-sm p-6 payment-section" data-testid="payment-methods">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-[var(--accent-soft)] flex items-center justify-center ring-1 ring-[var(--border)]/60">
              <Wallet className="w-[18px] h-[18px] text-[var(--brand)]" />
            </div>
            <div>
              <h3 className="font-semibold text-[var(--text)]">Способы оплаты</h3>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">Привязанные карты</p>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[var(--accent-soft)] flex items-center justify-center mb-4 ring-1 ring-[var(--border)]/60">
              <CreditCard className="w-7 h-7 text-[var(--text-muted)]" />
            </div>
            <p className="text-[var(--text-muted)] font-medium mb-1">Нет привязанных карт</p>
            <p className="text-[var(--text-muted)] text-sm max-w-xs">Здесь будут отображаться ваши способы оплаты.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
