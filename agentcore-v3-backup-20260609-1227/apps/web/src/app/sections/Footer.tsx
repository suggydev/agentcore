'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Logo from '../../components/Logo';
import { Shield, FileText, CreditCard, RotateCcw, Mail, Phone, MapPin, Building2 } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';
const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || 'v3.0.0';

export default function Footer() {
  const [companyData, setCompanyData] = useState({
    companyName: 'ООО «АгентКор»',
    inn: '1234567890',
    ogrn: '1234567890123',
    kpp: '123456789',
    legalAddress: '123456, Россия, г. Москва, ул. Примерная, д. 1, офис 101',
    email: 'hello@agentcore.work',
    supportEmail: 'support@agentcore.work',
    phone: '+7 (999) 123-45-67',
    supportPhone: '+7 (999) 123-45-67',
  });

  useEffect(() => {
    const base = typeof window !== 'undefined' ? window.location.origin : (API_BASE || '');
    fetch(`${base}/api/legal/legal`, { cache: 'no-store', credentials: 'same-origin' })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) setCompanyData(prev => ({ ...prev, ...data }));
      })
      .catch((err) => {
        console.error('Footer fetch error:', err);
      });
  }, []);

  return (
    <footer className="bg-[var(--surface)] border-t border-[var(--border)] py-12 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 sm:gap-10 mb-10">
          <div className="md:col-span-2">
            <Logo className="mb-3" />
            <p className="text-[var(--text-muted)] max-w-xs text-sm leading-relaxed">
              Цифровые сотрудники для вашего бизнеса. Отвечают клиентам 24/7, собирают заявки, помогают продавать. Без программистов.
            </p>
            <div className="mt-5 flex items-center gap-3 text-[11px] text-[var(--text-muted)]">
              <span className="font-mono">{APP_VERSION}</span>
              <span className="w-1 h-1 rounded-full bg-[var(--border)]" />
              <span>{companyData.companyName}</span>
            </div>
            <div className="mt-3 flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
              <Shield className="w-3 h-3 text-[var(--brand)]" />
              <span>Безопасные платежи через ЮKassa</span>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-[var(--text)] mb-4 text-xs uppercase tracking-wider">Продукт</h4>
            <ul className="space-y-3 text-sm text-[var(--text-muted)]">
              <li><a href="#capabilities" className="hover:text-[var(--text)] transition-colors">Возможности</a></li>
              <li><a href="#pricing" className="hover:text-[var(--text)] transition-colors">Тарифы</a></li>
              <li><a href="/agents" className="hover:text-[var(--text)] transition-colors">Дашборд</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-[var(--text)] mb-4 text-xs uppercase tracking-wider">Компания и документы</h4>
            <ul className="space-y-3 text-sm text-[var(--text-muted)]">
              <li><Link href="/offer" className="hover:text-[var(--text)] transition-colors flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> Публичная оферта</Link></li>
              <li><Link href="/privacy" className="hover:text-[var(--text)] transition-colors flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> Политика конфиденциальности</Link></li>
              <li><Link href="/payment" className="hover:text-[var(--text)] transition-colors flex items-center gap-1.5"><CreditCard className="w-3.5 h-3.5" /> Оплата и безопасность</Link></li>
              <li><Link href="/refund" className="hover:text-[var(--text)] transition-colors flex items-center gap-1.5"><RotateCcw className="w-3.5 h-3.5" /> Правила возврата</Link></li>
              <li><Link href="/terms" className="hover:text-[var(--text)] transition-colors flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> Пользовательское соглашение</Link></li>
              <li><Link href="/contacts" className="hover:text-[var(--text)] transition-colors flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> Контакты</Link></li>
            </ul>
          </div>
        </div>

        <div className="arch-line mb-6" />

        {/* Requisites */}
        <div className="grid md:grid-cols-3 gap-6 mb-6 text-xs text-[var(--text-muted)]">
          <div className="space-y-1">
            <div className="font-semibold text-[var(--text)] mb-2">Реквизиты</div>
            <div className="flex items-start gap-1.5"><Building2 className="w-3 h-3 mt-0.5 shrink-0" /> {companyData.companyName}</div>
            <div>ИНН: {companyData.inn}</div>
            <div>ОГРН: {companyData.ogrn}</div>
            <div>КПП: {companyData.kpp}</div>
          </div>
          <div className="space-y-1">
            <div className="font-semibold text-[var(--text)] mb-2">Адрес</div>
            <div className="flex items-start gap-1.5"><MapPin className="w-3 h-3 mt-0.5 shrink-0" /> {companyData.legalAddress}</div>
          </div>
          <div className="space-y-1">
            <div className="font-semibold text-[var(--text)] mb-2">Контакты</div>
            <div className="flex items-start gap-1.5"><Mail className="w-3 h-3 mt-0.5 shrink-0" /> {companyData.email}</div>
            <div className="flex items-start gap-1.5"><Phone className="w-3 h-3 mt-0.5 shrink-0" /> {companyData.phone}</div>
          </div>
        </div>

        <div className="arch-line mb-6" />

        <div className="flex flex-col md:flex-row justify-between items-center gap-3">
          <p className="text-[var(--text-muted)] text-xs">© 2026 {companyData.companyName}. Все права защищены.</p>
          <div className="flex gap-5 text-[var(--text-muted)] text-xs">
            <Link href="/privacy" className="hover:text-[var(--text)] transition-colors">Конфиденциальность</Link>
            <Link href="/offer" className="hover:text-[var(--text)] transition-colors">Оферта</Link>
            <Link href="/contacts" className="hover:text-[var(--text)] transition-colors">Контакты</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
