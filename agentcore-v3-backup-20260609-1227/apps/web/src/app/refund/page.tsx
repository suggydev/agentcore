'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, RotateCcw, CheckCircle, XCircle, AlertTriangle, Clock, Mail, ChevronDown, ChevronUp } from 'lucide-react';
import Footer from '../../components/Footer';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export default function RefundPage() {
  const [companyData, setCompanyData] = useState({
    companyName: '',
    email: '',
    phone: '',
  });
  const [openSection, setOpenSection] = useState<string | null>('conditions');

  useEffect(() => {
    fetch(`${API_BASE}/api/legal/legal`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) setCompanyData(prev => ({ ...prev, ...data }));
      })
      .catch(() => {});
  }, []);

  const toggleSection = (id: string) => {
    setOpenSection(openSection === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="max-w-4xl mx-auto px-5 py-16">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-[var(--brand)] hover:text-[var(--brand)] mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> На главную
        </Link>

        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[var(--accent-soft)] flex items-center justify-center">
              <RotateCcw className="w-5 h-5 text-[var(--brand)]" />
            </div>
            <h1 className="text-2xl font-bold text-[var(--text)]">Правила возврата средств</h1>
          </div>
          <p className="text-sm text-[var(--text-muted)]">Порядок и условия возврата средств за услуги платформы AgentCore</p>
        </div>

        <div className="space-y-6">
          {/* Conditions for refund */}
          <div className="border border-[var(--border)] rounded-xl bg-[var(--surface)] overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('conditions')}
              aria-expanded={openSection === 'conditions'}
              className="w-full flex items-center justify-between p-5 text-left"
            >
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <h2 className="font-semibold text-[var(--text)]">Когда возврат возможен</h2>
              </div>
              {openSection === 'conditions' ? <ChevronUp className="w-5 h-5 text-[var(--text-muted)]" /> : <ChevronDown className="w-5 h-5 text-[var(--text-muted)]" />}
            </button>
            {openSection === 'conditions' && (
              <div className="px-5 pb-5 space-y-4 text-sm text-[var(--text-muted)]">
                <div className="p-4 rounded-lg bg-[var(--accent-soft)] border border-[var(--border)]">
                  <div className="font-medium text-[var(--text)] mb-2">Возврат в течение 7 дней (тариф «Стартовый»)</div>
                  <p className="leading-relaxed">Вы можете запросить полный возврат средств в течение 7 (семи) календарных дней с момента первой оплаты активации AI-агента, при условии:</p>
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li>Использовано менее 10% выделенных AI-токенов</li>
                    <li>Не активированы интеграции с внешними каналами (Telegram, WhatsApp и т.д.)</li>
                    <li>Агент не введён в эксплуатацию (не получал сообщений от реальных пользователей)</li>
                  </ul>
                </div>
                <div className="p-4 rounded-lg bg-[var(--accent-soft)] border border-[var(--border)]">
                  <div className="font-medium text-[var(--text)] mb-2">Возврат в течение 14 дней (технические сбои)</div>
                  <p className="leading-relaxed">Вы можете запросить возврат в течение 14 (четырнадцати) календарных дней, если:</p>
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li>Платформа была недоступна более чем 5% времени в течение оплаченного периода (доступность менее 95%)</li>
                    <li>Технические сбои подтверждены службой поддержки</li>
                    <li>Сбои привели к невозможности использования оплаченных функций</li>
                  </ul>
                </div>
                <div className="p-4 rounded-lg bg-[var(--accent-soft)] border border-[var(--border)]">
                  <div className="font-medium text-[var(--text)] mb-2">Возврат при нарушении условий</div>
                  <p className="leading-relaxed">Полный возврат при предоставлении недостоверной информации о тарифах или при существенном нарушении Исполнителем условий Оферты.</p>
                </div>
              </div>
            )}
          </div>

          {/* No refund */}
          <div className="border border-[var(--border)] rounded-xl bg-[var(--surface)] overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('norefund')}
              aria-expanded={openSection === 'norefund'}
              className="w-full flex items-center justify-between p-5 text-left"
            >
              <div className="flex items-center gap-3">
                <XCircle className="w-5 h-5 text-red-500" />
                <h2 className="font-semibold text-[var(--text)]">Когда возврат невозможен</h2>
              </div>
              {openSection === 'norefund' ? <ChevronUp className="w-5 h-5 text-[var(--text-muted)]" /> : <ChevronDown className="w-5 h-5 text-[var(--text-muted)]" />}
            </button>
            {openSection === 'norefund' && (
              <div className="px-5 pb-5 space-y-3 text-sm text-[var(--text-muted)]">
                <ul className="list-disc pl-5 space-y-2">
                  <li>Истёк срок для возврата (7 или 14 дней соответственно).</li>
                  <li>Использовано более 50% AI-токенов или активированы интеграции с внешними каналами.</li>
                  <li>Услуги были полностью оказаны — доступ к платформе предоставлен, агент создан и функционирует.</li>
                  <li>Заказчик нарушил условия Оферты или законодательство РФ.</li>
                  <li>Возврат за использованные AI-токены или за период, в течение которого доступ был предоставлен.</li>
                  <li>Оплата произведена по безналичному расчёту для юридических лиц (возврат по отдельному договору).</li>
                </ul>
                <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-xs text-red-700 mt-2">
                  <strong>Важно:</strong> Возврат за использованные AI-токены или за период, в течение которого доступ к платформе был предоставлен, не производится в соответствии со ст. 32 ФЗ «О защите прав потребителей» с учётом специфики цифрового контента (п. 13 ст. 2 ФЗ-2300-1).
                </div>
              </div>
            )}
          </div>

          {/* How to request */}
          <div className="border border-[var(--border)] rounded-xl bg-[var(--surface)] overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('howto')}
              aria-expanded={openSection === 'howto'}
              className="w-full flex items-center justify-between p-5 text-left"
            >
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-[var(--brand)]" />
                <h2 className="font-semibold text-[var(--text)]">Как запросить возврат</h2>
              </div>
              {openSection === 'howto' ? <ChevronUp className="w-5 h-5 text-[var(--text-muted)]" /> : <ChevronDown className="w-5 h-5 text-[var(--text-muted)]" />}
            </button>
            {openSection === 'howto' && (
              <div className="px-5 pb-5 space-y-4 text-sm text-[var(--text-muted)]">
                <div className="space-y-3">
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-[var(--brand)] text-white flex items-center justify-center font-bold text-sm shrink-0">1</div>
                    <div>
                      <div className="font-medium text-[var(--text)]">Направьте запрос</div>
                      <p className="mt-1">Отправьте email на <a href={`mailto:${companyData.email}`} className="text-[var(--brand)] underline">{companyData.email || '—'}</a> с темой «Возврат средств».</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-[var(--brand)] text-white flex items-center justify-center font-bold text-sm shrink-0">2</div>
                    <div>
                      <div className="font-medium text-[var(--text)]">Укажите данные</div>
                      <p className="mt-1">В письме укажите: email аккаунта, дату оплаты, номер транзакции (из email от ЮKassa), причину возврата, реквизиты для возврата.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-[var(--brand)] text-white flex items-center justify-center font-bold text-sm shrink-0">3</div>
                    <div>
                      <div className="font-medium text-[var(--text)]">Ожидайте рассмотрения</div>
                      <p className="mt-1">Служба поддержки рассматривает заявку в течение 10 (десяти) рабочих дней и направляет ответ на ваш email.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-[var(--brand)] text-white flex items-center justify-center font-bold text-sm shrink-0">4</div>
                    <div>
                      <div className="font-medium text-[var(--text)]">Получение средств</div>
                      <p className="mt-1">При одобрении возврат производится на реквизиты, с которых была произведена оплата, в течение 5-30 рабочих дней (зависит от банка-эмитента).</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Timeline */}
          <div className="border border-[var(--border)] rounded-xl bg-[var(--surface)] overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('timeline')}
              aria-expanded={openSection === 'timeline'}
              className="w-full flex items-center justify-between p-5 text-left"
            >
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-[var(--brand)]" />
                <h2 className="font-semibold text-[var(--text)]">Сроки возврата</h2>
              </div>
              {openSection === 'timeline' ? <ChevronUp className="w-5 h-5 text-[var(--text-muted)]" /> : <ChevronDown className="w-5 h-5 text-[var(--text-muted)]" />}
            </button>
            {openSection === 'timeline' && (
              <div className="px-5 pb-5 space-y-3 text-sm text-[var(--text-muted)]">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--border)] text-center">
                    <div className="text-2xl font-bold text-[var(--brand)]">7</div>
                    <div className="text-xs mt-1">дней на запрос (тариф «Стартовый»)</div>
                  </div>
                  <div className="p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--border)] text-center">
                    <div className="text-2xl font-bold text-[var(--brand)]">14</div>
                    <div className="text-xs mt-1">дней на запрос (тех. сбои)</div>
                  </div>
                  <div className="p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--border)] text-center">
                    <div className="text-2xl font-bold text-[var(--brand)]">10</div>
                    <div className="text-xs mt-1">рабочих дней на рассмотрение</div>
                  </div>
                  <div className="p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--border)] text-center">
                    <div className="text-2xl font-bold text-[var(--brand)]">5-30</div>
                    <div className="text-xs mt-1">дней на зачисление средств</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Warning */}
          <div className="p-4 rounded-xl bg-[var(--accent-soft)] border border-[var(--border)] text-sm text-[var(--text-muted)]">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-[var(--brand)]" />
              <span className="font-semibold text-[var(--text)]">Юридическая информация</span>
            </div>
            <p>Настоящие правила разработаны в соответствии с Гражданским кодексом РФ, Федеральным законом от 07.02.1992 № 2300-1 «О защите прав потребителей», Федеральным законом от 27.06.2018 № 162-ФЗ «О национальной платёжной системе» и требованиями платёжной системы ЮKassa.</p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
