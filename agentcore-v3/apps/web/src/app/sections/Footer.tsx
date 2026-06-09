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
      } catch (err) { console.error('[Footer] Failed to parse cached workspaceSettings:', err); }
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
        try { localStorage.setItem('workspaceSettings', JSON.stringify(s)); } catch (err) { console.error('[Footer] Failed to cache workspaceSettings:', err); }
      })
      .catch((err) => { console.error('[Footer] Failed to fetch workspace settings:', err); });
  }, []);

  return (
    <footer className="py-12 px-6" style={{ background: 'var(--bg)', boxShadow: 'rgba(0,0,0,0.04) 0px 0px 0px 1px inset' }}>
      <div className="max-w-[1200px] mx-auto">
        <div className="grid md:grid-cols-4 gap-10 mb-10">
          <div className="md:col-span-2">
            <Logo className="mb-3" />
            <p className="text-[#848281] max-w-xs text-sm leading-relaxed">
              Цифровые сотрудники для вашего бизнеса. Отвечают клиентам 24/7, собирают заявки, помогают продавать. Без программистов.
            </p>
            <div className="mt-5 flex items-center gap-3 text-[11px] text-[#848281]">
              <span className="font-mono">{APP_VERSION}</span>
              <span className="w-1 h-1 rounded-full" style={{ background: 'var(--border)' }} />
              <span>{companyName}</span>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-[#343433] mb-4 text-xs uppercase tracking-wider">Продукт</h4>
            <ul className="space-y-3 text-sm text-[#848281]">
              <li><a href="#capabilities" className="hover:text-[#343433] transition-colors">Возможности</a></li>
              <li><a href="#pricing" className="hover:text-[#343433] transition-colors">Тарифы</a></li>
              <li><a href="/agents" className="hover:text-[#343433] transition-colors">Дашборд</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-[#343433] mb-4 text-xs uppercase tracking-wider">Компания</h4>
            <ul className="space-y-3 text-sm text-[#848281]">
              <li><Link href="/contacts" className="hover:text-[#343433] transition-colors">Контакты</Link></li>
              <li><Link href="/requisites" className="hover:text-[#343433] transition-colors">Реквизиты</Link></li>
              <li><Link href="/delivery" className="hover:text-[#343433] transition-colors">Доставка и оплата</Link></li>
              <li><Link href="/refund" className="hover:text-[#343433] transition-colors">Возврат</Link></li>
            </ul>
          </div>
        </div>

        <div className="arch-line mb-6" />

        <div className="flex flex-col md:flex-row justify-between items-center gap-3">
          <p className="text-[#848281] text-xs">© 2026 {companyName}. Все права защищены.</p>
          <div className="flex gap-5 text-[#848281] text-xs">
            <Link href="/privacy" className="hover:text-[#343433] transition-colors">Конфиденциальность</Link>
            <Link href="/terms" className="hover:text-[#343433] transition-colors">Оферта</Link>
            <Link href="/contacts" className="hover:text-[#343433] transition-colors">Контакты</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
