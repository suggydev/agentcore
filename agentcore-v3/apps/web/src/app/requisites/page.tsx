'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, AlertTriangle, CheckCircle2 } from 'lucide-react';

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
 .catch(() => {})
 .finally(() => setLoading(false));
 }, []);

 const companyName = data?.legalName || data?.companyName || workspaceName || 'ТОО «AgentCore»';
 const bin = data?.bin || '';
 const ogrn = data?.ogrn || '';
 const legalAddress = data?.legalAddress || '';
 const physicalAddress = data?.physicalAddress || 'г. Алматы, ул. Байзакова, 280, 2 этаж, офис Smart Point';
 const email = data?.email || 'hello@agentcore.work';
 const phone = data?.phone || '';
 const hasBin = bin.length > 0;

 return (
 <div className="min-h-screen bg-[var(--bg)]">
 <div className="max-w-3xl mx-auto px-5 py-16">
 <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-[var(--brand)] hover:text-[var(--brand)] mb-8 transition-colors">
 <ArrowLeft className="w-4 h-4" /> На главную
 </Link>
 <h1 className="heading-2 text-[var(--text)] mb-3">Реквизиты компании</h1>
 <p className="text-sm text-[var(--text-muted)] mb-10">Юридическая информация</p>

 {!loading && !hasBin && (
 <div className="bg-amber-50 border-l-4 border-amber-500 rounded-r-2xl p-6 mb-8 flex items-start gap-4 shadow-md">
 <AlertTriangle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
 <div>
 <p className="text-base font-bold text-amber-800 mb-1">Внимание: данные не заполнены</p>
 <p className="text-sm text-amber-700">
 Нижеуказанные реквизиты являются шаблонными. Заполните реальные данные в разделе <strong>Настройки → Данные компании</strong> вашего дашборда.
 </p>
 </div>
 </div>
 )}

 {!loading && hasBin && (
 <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mb-8 flex items-start gap-3">
 <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
 <div>
 <p className="text-sm font-semibold text-emerald-700">Реквизиты заполнены</p>
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
 <td className="py-3 text-[var(--text)]">Товарищество с ограниченной ответственностью</td>
 </tr>
 <tr>
 <td className="py-3 pr-4 text-[var(--text-muted)] font-medium w-48">БИН</td>
 <td className={`py-3 ${hasBin ? 'text-[var(--text)] font-mono' : 'text-amber-600 italic'}`}>
 {hasBin ? bin : <>⚠️ [УКАЖИТЕ РЕАЛЬНЫЙ БИН]</>}
 </td>
 </tr>
 <tr>
 <td className="py-3 pr-4 text-[var(--text-muted)] font-medium">ИИН (для ИП)</td>
 <td className="py-3 text-amber-600 italic">
 ⚠️ [УКАЖИТЕ РЕАЛЬНЫЙ ИИН]
 </td>
 </tr>
 <tr>
 <td className="py-3 pr-4 text-[var(--text-muted)] font-medium">ОГРН/ОГРНИП (для РФ)</td>
 <td className={`py-3 ${ogrn ? 'text-[var(--text)] font-mono' : 'text-amber-600 italic'}`}>
 {ogrn ? ogrn : '⚠️ [УКАЖИТЕ РЕАЛЬНЫЙ ОГРН]'}
 </td>
 </tr>
 <tr>
 <td className="py-3 pr-4 text-[var(--text-muted)] font-medium">КПП (для РФ)</td>
 <td className="py-3 text-amber-600 italic">
 ⚠️ [УКАЖИТЕ]
 </td>
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
 <td className="py-3 text-amber-600 italic">
 ⚠️ [УКАЖИТЕ РЕАЛЬНЫЙ СЧЁТ]
 </td>
 </tr>
 <tr>
 <td className="py-3 pr-4 text-[var(--text-muted)] font-medium">Банк</td>
 <td className="py-3 text-amber-600 italic">
 ⚠️ [УКАЖИТЕ НАЗВАНИЕ БАНКА]
 </td>
 </tr>
 <tr>
 <td className="py-3 pr-4 text-[var(--text-muted)] font-medium">БИК</td>
 <td className="py-3 text-amber-600 italic">
 ⚠️ [УКАЖИТЕ БИК]
 </td>
 </tr>
 <tr>
 <td className="py-3 pr-4 text-[var(--text-muted)] font-medium">Корреспондентский счёт</td>
 <td className="py-3 text-amber-600 italic">
 ⚠️ [УКАЖИТЕ]
 </td>
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
 <td className={`py-3 ${legalAddress ? 'text-[var(--text)]' : 'text-amber-600 italic'}`}>
 {legalAddress || '⚠️ [УКАЖИТЕ ЮРИДИЧЕСКИЙ АДРЕС]'}
 </td>
 </tr>
 <tr>
 <td className="py-3 pr-4 text-[var(--text-muted)] font-medium">Фактический адрес</td>
 <td className="py-3 text-[var(--text)]">{physicalAddress}</td>
 </tr>
 <tr>
 <td className="py-3 pr-4 text-[var(--text-muted)] font-medium">Email</td>
 <td className="py-3 text-[var(--text)]">{email}</td>
 </tr>
 <tr>
 <td className="py-3 pr-4 text-[var(--text-muted)] font-medium">Телефон</td>
 <td className={`py-3 ${phone ? 'text-[var(--text)]' : 'text-amber-600 italic'}`}>
 {phone || '⚠️ [УКАЖИТЕ РЕАЛЬНЫЙ ТЕЛЕФОН]'}
 </td>
 </tr>
 <tr>
 <td className="py-3 pr-4 text-[var(--text-muted)] font-medium">Руководитель</td>
 <td className="py-3 text-amber-600 italic">
 ⚠️ [УКАЖИТЕ ФИО ДИРЕКТОРА]
 </td>
 </tr>
 </tbody>
 </table>
 </div>
 </div>

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
 </div>
 </div>
 );
}
