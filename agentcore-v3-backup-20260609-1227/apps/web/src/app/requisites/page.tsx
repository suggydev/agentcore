'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, AlertTriangle, CheckCircle2 } from 'lucide-react';
import Footer from '../../components/Footer';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

interface RequisitesData {
 legalName?: string;
 companyName?: string;
 bin?: string;
 ogrn?: string;
 legalAddress?: string;
 physicalAddress?: string;
 email?: string;
 phone?: string;
}

export default function RequisitesPage() {
 const [data, setData] = useState<RequisitesData | null>(null);
 const [workspaceName, setWorkspaceName] = useState<string>('');
 const [fetchError, setFetchError] = useState('');
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 const token = localStorage.getItem('token');
 if (!token) { setLoading(false); return; }
 fetch(`${API_BASE}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
 .then(r => r.json())
 .then(res => {
 if (res?.workspace?.settings) setData(res.workspace.settings);
 if (res?.workspace?.name) setWorkspaceName(res.workspace.name);
 })
 .catch(err => { if (process.env.NODE_ENV === 'development') console.error('[RequisitesPage] Failed to load workspace settings:', err); setFetchError('Не удалось загрузить данные компании. Проверьте подключение.'); })
 .finally(() => setLoading(false));
 }, []);

  const companyName = data?.legalName || data?.companyName || workspaceName || 'AgentCore';
  const bin = data?.bin || '';
  const ogrn = data?.ogrn || '';
  const legalAddress = data?.legalAddress || '';
  const physicalAddress = data?.physicalAddress || '';
  const email = data?.email || 'hello@agentcore.work';
  const phone = data?.phone || '';
  const hasRealData = bin.length > 0 || ogrn.length > 0 || legalAddress.length > 0;

 return (
 <div className="min-h-screen bg-[var(--bg)]">
 {fetchError && (
  <div className="mb-6 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm text-center">{fetchError}</div>
  )}
<div className="max-w-3xl mx-auto px-5 py-16">
 <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-[var(--brand)] hover:text-[var(--brand)] mb-8 transition-colors">
 <ArrowLeft className="w-4 h-4" /> На главную
 </Link>
 <h1 className="heading-2 text-[var(--text)] mb-3">Реквизиты компании</h1>
 <p className="text-sm text-[var(--text-muted)] mb-10">Юридическая информация</p>

  {!loading && !hasRealData && (
  <div className="bg-[var(--warning-soft)] border-l-4 border-[var(--warning)] rounded-r-2xl p-6 mb-8 flex items-start gap-4 shadow-md">
  <AlertTriangle className="w-6 h-6 text-[var(--warning)] flex-shrink-0 mt-0.5" />
  <div>
  <p className="text-base font-bold text-[var(--warning)] mb-1">Внимание: данные не заполнены</p>
  <p className="text-sm text-[var(--warning)]">
  Нижеуказанные реквизиты являются шаблонными. Заполните реальные данные в разделе <strong>Настройки → Данные компании</strong> вашего дашборда.
  </p>
  </div>
  </div>
  )}

  {!loading && hasRealData && (
  <div className="bg-[var(--success-soft)] border border-[var(--success-soft)] rounded-2xl p-4 mb-8 flex items-start gap-3">
  <CheckCircle2 className="w-5 h-5 text-[var(--success)] flex-shrink-0 mt-0.5" />
  <div>
  <p className="text-sm font-semibold text-[var(--success)]">Реквизиты заполнены</p>
  </div>
  </div>
  )}

 <div className="bg-surface rounded-2xl border border-[var(--border)] shadow-sm p-6 space-y-6">
 <div>
 <h2 className="font-semibold text-[var(--text)] mb-4">Основные реквизиты</h2>
 <table className="w-full text-sm">
 <tbody className="divide-y divide-[var(--border)]">
 <tr>
 <td className="py-3 pr-4 text-[var(--text-muted)] font-medium w-48">Наименование</td>
 <td className="py-3 text-[var(--text)] font-semibold">{companyName}</td>
 </tr>
  <tr>
  <td className="py-3 pr-4 text-[var(--text-muted)] font-medium">Юридическая форма</td>
  <td className={`py-3 ${hasRealData ? 'text-[var(--text)]' : 'text-[var(--text-muted)]'}`}>Общество с ограниченной ответственностью</td>
  </tr>
  <tr>
  <td className="py-3 pr-4 text-[var(--text-muted)] font-medium w-48">ОГРН/ОГРНИП</td>
  <td className={`py-3 ${ogrn ? 'text-[var(--text)] font-mono' : 'text-[var(--text-muted)]'}`}>
  {ogrn || 'Не указано'}
  </td>
  </tr>
  <tr>
  <td className="py-3 pr-4 text-[var(--text-muted)] font-medium">ИНН</td>
  <td className="py-3 text-[var(--text-muted)]">Не указано</td>
  </tr>
  <tr>
  <td className="py-3 pr-4 text-[var(--text-muted)] font-medium">КПП</td>
  <td className="py-3 text-[var(--text-muted)]">Не указано</td>
  </tr>
  <tr>
  <td className="py-3 pr-4 text-[var(--text-muted)] font-medium">НДС</td>
  <td className="py-3 text-[var(--text)]">Без НДС (упрощённая система)</td>
  </tr>
 </tbody>
 </table>
 </div>

 <div className="border-t border-[var(--border)] pt-6">
 <h2 className="font-semibold text-[var(--text)] mb-4">Банковские реквизиты</h2>
 <table className="w-full text-sm">
 <tbody className="divide-y divide-[var(--border)]">
  <tr>
  <td className="py-3 pr-4 text-[var(--text-muted)] font-medium w-48">Расчётный счёт</td>
  <td className="py-3 text-[var(--text-muted)]">Не указано</td>
  </tr>
  <tr>
  <td className="py-3 pr-4 text-[var(--text-muted)] font-medium">Банк</td>
  <td className="py-3 text-[var(--text-muted)]">Не указано</td>
  </tr>
  <tr>
  <td className="py-3 pr-4 text-[var(--text-muted)] font-medium">БИК</td>
  <td className="py-3 text-[var(--text-muted)]">Не указано</td>
  </tr>
  <tr>
  <td className="py-3 pr-4 text-[var(--text-muted)] font-medium">Корреспондентский счёт</td>
  <td className="py-3 text-[var(--text-muted)]">Не указано</td>
  </tr>
 </tbody>
 </table>
 </div>

 <div className="border-t border-[var(--border)] pt-6">
 <h2 className="font-semibold text-[var(--text)] mb-4">Адреса и контакты</h2>
 <table className="w-full text-sm">
 <tbody className="divide-y divide-[var(--border)]">
  <tr>
  <td className="py-3 pr-4 text-[var(--text-muted)] font-medium w-48">Юридический адрес</td>
  <td className={`py-3 ${legalAddress ? 'text-[var(--text)]' : 'text-[var(--text-muted)]'}`}>
  {legalAddress || 'Не указано'}
  </td>
  </tr>
  <tr>
  <td className="py-3 pr-4 text-[var(--text-muted)] font-medium">Фактический адрес</td>
  <td className={`py-3 ${physicalAddress ? 'text-[var(--text)]' : 'text-[var(--text-muted)]'}`}>{physicalAddress || 'Не указано'}</td>
  </tr>
  <tr>
  <td className="py-3 pr-4 text-[var(--text-muted)] font-medium">Email</td>
  <td className="py-3 text-[var(--text)]">{email}</td>
  </tr>
  <tr>
  <td className="py-3 pr-4 text-[var(--text-muted)] font-medium">Телефон</td>
  <td className={`py-3 ${phone ? 'text-[var(--text)]' : 'text-[var(--text-muted)]'}`}>
  {phone || 'Не указано'}
  </td>
  </tr>
  <tr>
  <td className="py-3 pr-4 text-[var(--text-muted)] font-medium">Руководитель</td>
  <td className="py-3 text-[var(--text-muted)]">Не указано</td>
  </tr>
 </tbody>
 </table>
 </div>
 </div>

  {hasRealData && (
  <>
  <h2 className="text-lg font-semibold text-[var(--text)] mt-10 mb-3">Для подключения ЮKassa потребуется</h2>
  <div className="bg-[var(--accent-soft)] rounded-2xl border border-[var(--border)] p-5 space-y-2">
  <ul className="list-disc pl-5 space-y-1 text-sm text-[var(--text)]">
  <li>Заполнить все реквизиты реальными данными</li>
  <li>Загрузить скан свидетельства о регистрации (для ИП) или устава (для ООО)</li>
  <li>Подтвердить право собственности на сайт через мета-тег или DNS</li>
  <li>Настроить приём электронных чеков (54-ФЗ)</li>
  <li>Подписать договор с ЮKassa через личный кабинет</li>
  </ul>
  </div>
  </>
  )}
  </div>
  <Footer />
  </div>
  );
}
