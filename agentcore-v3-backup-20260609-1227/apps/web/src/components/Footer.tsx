'use client';

import Link from 'next/link';
import { Shield, FileText, CreditCard, RotateCcw, Mail, Phone, MapPin, Building2 } from 'lucide-react';
import { useState, useEffect } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export default function Footer() {
  const [companyData, setCompanyData] = useState({
    companyName: '',
    inn: '',
    ogrn: '',
    kpp: '',
    legalAddress: '',
    email: '',
    supportEmail: '',
    phone: '',
    supportPhone: '',
  });

  useEffect(() => {
    fetch(`${API_BASE}/api/legal/legal`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) setCompanyData(prev => ({ ...prev, ...data }));
      })
      .catch(() => {});
  }, []);

  return (
    <footer className="border-t border-[var(--border)] bg-[var(--surface)]">
      <div className="max-w-7xl mx-auto px-5 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand & Description */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[var(--brand)] flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <span className="font-bold text-[var(--text)]">{companyData.companyName || '—'}</span>
            </div>
            <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-4">
              Платформа для создания и управления AI-агентами. Автоматизация клиентской поддержки, продаж и коммуникаций.
            </p>
            <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
              <Shield className="w-4 h-4 text-[var(--brand)]" />
              <span>Безопасные платежи через ЮKassa</span>
            </div>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="font-semibold text-[var(--text)] mb-4 text-sm uppercase tracking-wider">Правовые документы</h3>
            <ul className="space-y-2.5">
              <li>
                <Link href="/offer" className="flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--brand)] transition-colors">
                  <FileText className="w-4 h-4" />
                  Публичная оферта
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--brand)] transition-colors">
                  <Shield className="w-4 h-4" />
                  Политика конфиденциальности
                </Link>
              </li>
              <li>
                <Link href="/payment" className="flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--brand)] transition-colors">
                  <CreditCard className="w-4 h-4" />
                  Оплата и безопасность
                </Link>
              </li>
              <li>
                <Link href="/refund" className="flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--brand)] transition-colors">
                  <RotateCcw className="w-4 h-4" />
                  Правила возврата средств
                </Link>
              </li>
              <li>
                <Link href="/terms" className="flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--brand)] transition-colors">
                  <FileText className="w-4 h-4" />
                  Пользовательское соглашение
                </Link>
              </li>
            </ul>
          </div>

          {/* Contacts */}
          <div>
            <h3 className="font-semibold text-[var(--text)] mb-4 text-sm uppercase tracking-wider">Контакты</h3>
            <ul className="space-y-2.5">
              {(() => {
                const emails = [
                  { value: companyData.email, label: 'Основная почта' },
                  { value: companyData.supportEmail, label: 'Поддержка' },
                ];
                const uniqueEmails = emails.filter((e, i, arr) =>
                  e.value && arr.findIndex(a => a.value === e.value) === i
                );
                if (uniqueEmails.length === 0) {
                  uniqueEmails.push({ value: '', label: '' });
                }
                const phones = [
                  { value: companyData.phone },
                  { value: companyData.supportPhone },
                ];
                const uniquePhones = phones.filter((p, i, arr) =>
                  p.value && arr.findIndex(a => a.value === p.value) === i
                );
                if (uniquePhones.length === 0) {
                  uniquePhones.push({ value: '' });
                }
                return (
                  <>
                    {uniqueEmails.map((e, i) => (
                      <li key={`email-${i}`}>
                        <a href={`mailto:${e.value}`} className="flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--brand)] transition-colors">
                          <Mail className="w-4 h-4" />
                          {e.value || '—'}
                        </a>
                      </li>
                    ))}
                    {uniquePhones.map((p, i) => (
                      <li key={`phone-${i}`}>
                        <a href={p.value ? `tel:${p.value}` : '#'} className="flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--brand)] transition-colors">
                          <Phone className="w-4 h-4" />
                          {p.value || '—'}
                        </a>
                      </li>
                    ))}
                  </>
                );
              })()}
            </ul>
          </div>

          {/* Legal Requisites */}
          <div>
            <h3 className="font-semibold text-[var(--text)] mb-4 text-sm uppercase tracking-wider">Реквизиты</h3>
            <div className="space-y-2 text-sm text-[var(--text-muted)]">
              <div className="flex items-start gap-2">
                <Building2 className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{companyData.companyName || '—'}</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{companyData.legalAddress || '—'}</span>
              </div>
              <div className="pt-2 border-t border-[var(--border)] space-y-1">
                <div>ИНН: {companyData.inn || '—'}</div>
                <div>ОГРН: {companyData.ogrn || '—'}</div>
                <div>КПП: {companyData.kpp || '—'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-[var(--text-muted)]">
            © {new Date().getFullYear()} {companyData.companyName || '—'}. Все права защищены.
          </div>
          <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
            <span>Платёжный шлюз:</span>
            <span className="font-medium text-[var(--text)]">ЮKassa</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
