'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, Phone, MapPin, Clock } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

interface ContactsData {
  companyName?: string;
  email?: string;
  phone?: string;
  workingHours?: string;
  physicalAddress?: string;
  telegram?: string;
  whatsapp?: string;
  instagram?: string;
}

export default function ContactsPage() {
  const [data, setData] = useState<ContactsData | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch(`${API_BASE}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { if (data?.workspace?.settings) setData(data.workspace.settings); })
      .catch(() => {});
  }, []);

  const companyName = data?.companyName || 'AgentCore';
  const email = data?.email || 'hello@agentcore.work';
  const phone = data?.phone || '+7 (700) 000-00-00';
  const workingHours = data?.workingHours || 'Пн-Пт 10:00-19:00 (GMT+5)';
  const physicalAddress = data?.physicalAddress || 'г. Алматы, ул. Байзакова, 280, 2 этаж, офис Smart Point';
  const telegram = data?.telegram || '';
  const whatsapp = data?.whatsapp || '';
  const instagram = data?.instagram || '';

  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      <div className="max-w-3xl mx-auto px-5 py-16">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-mauve-600 hover:text-mauve-500 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> На главную
        </Link>
        <h1 className="heading-2 text-ink-900 mb-3">Контакты</h1>
        <p className="text-sm text-ink-400 mb-10">Свяжитесь с нами любым удобным способом</p>

        <div className="grid sm:grid-cols-2 gap-4 mb-10">
          <div className="bg-white rounded-2xl border border-ink-200 p-6 shadow-sm">
            <Mail className="w-6 h-6 text-mauve-600 mb-3" />
            <h3 className="font-semibold text-ink-900 mb-1">Email</h3>
            <a href={`mailto:${email}`} className="text-sm text-mauve-600 hover:text-mauve-500">{email}</a>
            <p className="text-xs text-ink-400 mt-1">Общие вопросы</p>
          </div>
          <div className="bg-white rounded-2xl border border-ink-200 p-6 shadow-sm">
            <Mail className="w-6 h-6 text-mauve-600 mb-3" />
            <h3 className="font-semibold text-ink-900 mb-1">Поддержка</h3>
            <a href={`mailto:${email}`} className="text-sm text-mauve-600 hover:text-mauve-500">{email}</a>
            <p className="text-xs text-ink-400 mt-1">Техническая поддержка</p>
          </div>
          <div className="bg-white rounded-2xl border border-ink-200 p-6 shadow-sm">
            <Phone className="w-6 h-6 text-mauve-600 mb-3" />
            <h3 className="font-semibold text-ink-900 mb-1">Телефон</h3>
            <a href={`tel:${phone}`} className="text-sm text-mauve-600 hover:text-mauve-500">{phone}</a>
            <p className="text-xs text-ink-400 mt-1">{workingHours}</p>
          </div>
          <div className="bg-white rounded-2xl border border-ink-200 p-6 shadow-sm">
            <Clock className="w-6 h-6 text-mauve-600 mb-3" />
            <h3 className="font-semibold text-ink-900 mb-1">Время работы</h3>
            <p className="text-sm text-ink-600">{workingHours}</p>
            <p className="text-xs text-ink-400 mt-1">AI-агенты работают 24/7</p>
          </div>
          {telegram && (
            <div className="bg-white rounded-2xl border border-ink-200 p-6 shadow-sm">
              <h3 className="font-semibold text-ink-900 mb-1">Telegram</h3>
              <a href={`https://t.me/${telegram}`} target="_blank" className="text-sm text-mauve-600 hover:text-mauve-500">@{telegram}</a>
            </div>
          )}
          {whatsapp && (
            <div className="bg-white rounded-2xl border border-ink-200 p-6 shadow-sm">
              <h3 className="font-semibold text-ink-900 mb-1">WhatsApp</h3>
              <a href={`https://wa.me/${whatsapp.replace(/[+]/g, '')}`} target="_blank" className="text-sm text-mauve-600 hover:text-mauve-500">{whatsapp}</a>
            </div>
          )}
          {instagram && (
            <div className="bg-white rounded-2xl border border-ink-200 p-6 shadow-sm">
              <h3 className="font-semibold text-ink-900 mb-1">Instagram</h3>
              <a href={`https://instagram.com/${instagram}`} target="_blank" className="text-sm text-mauve-600 hover:text-mauve-500">@{instagram}</a>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-ink-200 p-6 shadow-sm">
          <h2 className="font-semibold text-ink-900 mb-3 flex items-center gap-2"><MapPin className="w-5 h-5 text-mauve-600" /> Адрес</h2>
          <p className="text-sm text-ink-600">{physicalAddress}</p>
        </div>
      </div>
    </div>
  );
}
