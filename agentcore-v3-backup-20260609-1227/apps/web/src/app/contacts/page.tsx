'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, Phone, MapPin, Building2, Clock, MessageSquare, ExternalLink } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export default function ContactsPage() {
  const [companyData, setCompanyData] = useState({
    companyName: 'ООО «АгентКор»',
    companyFullName: 'Общество с ограниченной ответственностью «АгентКор»',
    inn: '1234567890',
    ogrn: '1234567890123',
    kpp: '123456789',
    legalAddress: '123456, Россия, г. Москва, ул. Примерная, д. 1, офис 101',
    actualAddress: '123456, Россия, г. Москва, ул. Примерная, д. 1, офис 101',
    director: 'Иванов Иван Иванович',
    email: 'hello@agentcore.work',
    supportEmail: 'support@agentcore.work',
    phone: '+7 (999) 123-45-67',
    supportPhone: '+7 (999) 123-45-67',
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
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="max-w-4xl mx-auto px-5 py-16">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-[var(--brand)] hover:text-[var(--brand)] mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> На главную
        </Link>

        <div className="mb-10">
          <h1 className="text-2xl font-bold text-[var(--text)] mb-2">Контакты</h1>
          <p className="text-sm text-[var(--text-muted)]">Свяжитесь с нами по любым вопросам</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-10">
          <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[var(--accent-soft)] flex items-center justify-center">
                <Mail className="w-5 h-5 text-[var(--brand)]" />
              </div>
              <div>
                <div className="font-semibold text-[var(--text)]">Email</div>
                <div className="text-xs text-[var(--text-muted)]">Основная почта</div>
              </div>
            </div>
            <a href={`mailto:${companyData.email}`} className="text-sm text-[var(--brand)] underline flex items-center gap-1">
              {companyData.email} <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[var(--accent-soft)] flex items-center justify-center">
                <Mail className="w-5 h-5 text-[var(--brand)]" />
              </div>
              <div>
                <div className="font-semibold text-[var(--text)]">Поддержка</div>
                <div className="text-xs text-[var(--text-muted)]">Техническая помощь</div>
              </div>
            </div>
            <a href={`mailto:${companyData.supportEmail}`} className="text-sm text-[var(--brand)] underline flex items-center gap-1">
              {companyData.supportEmail} <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[var(--accent-soft)] flex items-center justify-center">
                <Phone className="w-5 h-5 text-[var(--brand)]" />
              </div>
              <div>
                <div className="font-semibold text-[var(--text)]">Телефон</div>
                <div className="text-xs text-[var(--text-muted)]">Рабочее время</div>
              </div>
            </div>
            <a href={`tel:${companyData.phone}`} className="text-sm text-[var(--brand)] underline flex items-center gap-1">
              {companyData.phone} <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[var(--accent-soft)] flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-[var(--brand)]" />
              </div>
              <div>
                <div className="font-semibold text-[var(--text)]">Telegram</div>
                <div className="text-xs text-[var(--text-muted)]">Быстрые ответы</div>
              </div>
            </div>
            <span className="text-sm text-[var(--text-muted)]">Скоро</span>
          </div>
        </div>

        <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--surface)] mb-6">
          <h2 className="font-semibold text-[var(--text)] mb-4 flex items-center gap-2">
            <Building2 className="w-4 h-4" /> Юридические реквизиты
          </h2>
          <div className="grid sm:grid-cols-2 gap-4 text-sm text-[var(--text-muted)]">
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-[var(--text)] font-medium w-24 shrink-0">Название:</span>
                <span>{companyData.companyFullName}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[var(--text)] font-medium w-24 shrink-0">ИНН:</span>
                <span>{companyData.inn}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[var(--text)] font-medium w-24 shrink-0">ОГРН:</span>
                <span>{companyData.ogrn}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[var(--text)] font-medium w-24 shrink-0">КПП:</span>
                <span>{companyData.kpp}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[var(--text)] font-medium w-24 shrink-0">Директор:</span>
                <span>{companyData.director}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-[var(--text)]" />
                <span>{companyData.legalAddress}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[var(--text)] font-medium w-24 shrink-0">Факт. адрес:</span>
                <span>{companyData.actualAddress}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[var(--accent-soft)] border border-[var(--border)] text-sm text-[var(--text-muted)]">
          <div className="flex items-start gap-2">
            <Clock className="w-4 h-4 text-[var(--brand)] shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-[var(--text)] mb-1">Режим работы поддержки</p>
              <p>Понедельник — Пятница: 10:00 — 19:00 (МСК)</p>
              <p>Время ответа на обращения: до 24 часов в рабочие дни.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
