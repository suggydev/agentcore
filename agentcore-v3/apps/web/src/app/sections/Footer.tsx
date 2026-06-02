'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Logo from '../../components/Logo';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';
const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || 'v3.0.0';

export default function Footer() {
  const [companyName, setCompanyName] = useState('ТОО «AgentCore»');

  useEffect(() => {
    const cached = localStorage.getItem('workspaceSettings');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed.companyName) setCompanyName(parsed.companyName);
      } catch {}
    }
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch(`${API_BASE}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        if (!data?.workspace?.settings) return;
        const s = data.workspace.settings;
        if (s.legalName) setCompanyName(s.legalName);
        else if (s.companyName) setCompanyName(s.companyName);
        try { localStorage.setItem('workspaceSettings', JSON.stringify(s)); } catch {}
      })
      .catch(() => {});
  }, []);

  return (
    <footer className="bg-[var(--surface)] border-t border-[var(--border)] py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-10 mb-10">
          <div className="md:col-span-2">
            <Logo className="mb-3" />
            <p className="text-[var(--text-muted)] max-w-xs text-sm leading-relaxed">
              Цифровые сотрудники для вашего бизнеса. Отвечают клиентам 24/7, собирают заявки, помогают продавать. Без программистов.
            </p>
            <div className="mt-5 flex items-center gap-3 text-[11px] text-[var(--text-muted)]">
              <span className="font-mono">{APP_VERSION}</span>
              <span className="w-1 h-1 rounded-full bg-[var(--border)]" />
              <span>{companyName}</span>
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
            <h4 className="font-semibold text-[var(--text)] mb-4 text-xs uppercase tracking-wider">Компания</h4>
            <ul className="space-y-3 text-sm text-[var(--text-muted)]">
              <li><Link href="/contacts" className="hover:text-[var(--text)] transition-colors">Контакты</Link></li>
              <li><Link href="/requisites" className="hover:text-[var(--text)] transition-colors">Реквизиты</Link></li>
              <li><Link href="/delivery" className="hover:text-[var(--text)] transition-colors">Доставка и оплата</Link></li>
              <li><Link href="/refund" className="hover:text-[var(--text)] transition-colors">Возврат</Link></li>
            </ul>
          </div>
        </div>

        <div className="arch-line mb-6" />

        <div className="flex flex-col md:flex-row justify-between items-center gap-3">
          <p className="text-[var(--text-muted)] text-xs">© 2026 {companyName}. Все права защищены.</p>
          <div className="flex gap-5 text-[var(--text-muted)] text-xs">
            <Link href="/privacy" className="hover:text-[var(--text)] transition-colors">Конфиденциальность</Link>
            <Link href="/terms" className="hover:text-[var(--text)] transition-colors">Оферта</Link>
            <Link href="/contacts" className="hover:text-[var(--text)] transition-colors">Контакты</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
