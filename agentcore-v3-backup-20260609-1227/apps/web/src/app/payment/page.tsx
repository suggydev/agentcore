'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield, CreditCard, Lock, CheckCircle, Smartphone, Globe, Building2, Clock, AlertTriangle } from 'lucide-react';
import Footer from '../../components/Footer';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export default function PaymentPage() {
  const [companyData, setCompanyData] = useState({
    companyName: 'ООО «АгентКор»',
    email: 'hello@agentcore.work',
    phone: '+7 (999) 123-45-67',
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
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[var(--accent-soft)] flex items-center justify-center">
              <Shield className="w-5 h-5 text-[var(--brand)]" />
            </div>
            <h1 className="text-2xl font-bold text-[var(--text)]">Оплата и безопасность</h1>
          </div>
          <p className="text-sm text-[var(--text-muted)]">Информация о способах оплаты, защите данных и порядке активации услуг</p>
        </div>

        <div className="space-y-8">
          {/* Security Banner */}
          <div className="p-5 rounded-xl bg-[var(--accent-soft)] border border-[var(--border)]">
            <div className="flex items-center gap-3 mb-3">
              <Lock className="w-5 h-5 text-[var(--brand)]" />
              <h2 className="font-semibold text-[var(--text)]">Защищённое соединение TLS/SSL</h2>
            </div>
            <p className="text-sm text-[var(--text-muted)] leading-relaxed">
              Все платежи на платформе AgentCore проходят через защищённый шлюз платёжной системы <strong className="text-[var(--text)]">ЮKassa (ООО «ЮMoney», НКО АО «Тинькофф Банк»)</strong>. 
              Соединение защищено протоколом TLS 1.3 с шифрованием 256-bit. Данные банковских карт не передаются и не хранятся на наших серверах.
            </p>
          </div>

          {/* Payment Methods */}
          <section>
            <h2 className="text-lg font-semibold text-[var(--text)] mb-4">Доступные способы оплаты</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-[var(--accent-soft)] flex items-center justify-center shrink-0">
                  <CreditCard className="w-5 h-5 text-[var(--brand)]" />
                </div>
                <div>
                  <div className="font-medium text-[var(--text)]">Банковские карты</div>
                  <div className="text-sm text-[var(--text-muted)] mt-1">Visa, Mastercard, МИР, Maestro</div>
                  <div className="text-xs text-[var(--brand)] mt-1">3D Secure 2.0</div>
                </div>
              </div>
              <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-[var(--accent-soft)] flex items-center justify-center shrink-0">
                  <Smartphone className="w-5 h-5 text-[var(--brand)]" />
                </div>
                <div>
                  <div className="font-medium text-[var(--text)]">Система быстрых платежей (СБП)</div>
                  <div className="text-sm text-[var(--text-muted)] mt-1">Оплата через мобильное приложение банка</div>
                  <div className="text-xs text-[var(--brand)] mt-1">Комиссия 0%</div>
                </div>
              </div>
              <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-[var(--accent-soft)] flex items-center justify-center shrink-0">
                  <Globe className="w-5 h-5 text-[var(--brand)]" />
                </div>
                <div>
                  <div className="font-medium text-[var(--text)]">ЮMoney (Яндекс.Деньги)</div>
                  <div className="text-sm text-[var(--text-muted)] mt-1">Электронный кошелёк</div>
                </div>
              </div>
              <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-[var(--accent-soft)] flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5 text-[var(--brand)]" />
                </div>
                <div>
                  <div className="font-medium text-[var(--text)]">Безналичный расчёт</div>
                  <div className="text-sm text-[var(--text-muted)] mt-1">Для юридических лиц по запросу</div>
                </div>
              </div>
            </div>
          </section>

          {/* How to pay */}
          <section>
            <h2 className="text-lg font-semibold text-[var(--text)] mb-4">Пошаговая инструкция по оплате</h2>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-[var(--brand)] text-white flex items-center justify-center font-bold text-sm shrink-0">1</div>
                <div>
                  <div className="font-medium text-[var(--text)]">Выбор тарифа</div>
                  <p className="text-sm text-[var(--text-muted)] mt-1">Перейдите в раздел «Тарифы» или нажмите «Активировать агента» в личном кабинете. Выберите подходящий тариф.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-[var(--brand)] text-white flex items-center justify-center font-bold text-sm shrink-0">2</div>
                <div>
                  <div className="font-medium text-[var(--text)]">Принятие условий</div>
                  <p className="text-sm text-[var(--text-muted)] mt-1">Установите галочку «Я принимаю условия Публичной оферты и даю согласие на обработку персональных данных». Без этого оплата невозможна.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-[var(--brand)] text-white flex items-center justify-center font-bold text-sm shrink-0">3</div>
                <div>
                  <div className="font-medium text-[var(--text)]">Переход к оплате</div>
                  <p className="text-sm text-[var(--text-muted)] mt-1">Нажмите «Оплатить». Вы будете перенаправлены на защищённую страницу ЮKassa. Наши серверы не видят и не хранят данные вашей карты.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-[var(--brand)] text-white flex items-center justify-center font-bold text-sm shrink-0">4</div>
                <div>
                  <div className="font-medium text-[var(--text)]">Ввод данных карты</div>
                  <p className="text-sm text-[var(--text-muted)] mt-1">На странице ЮKassa введите данные карты. Для подтверждения платежа может потребоваться код 3D Secure (SMS от вашего банка).</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-[var(--brand)] text-white flex items-center justify-center font-bold text-sm shrink-0">5</div>
                <div>
                  <div className="font-medium text-[var(--text)]">Активация тарифа</div>
                  <p className="text-sm text-[var(--text-muted)] mt-1">После успешной оплаты вы вернётесь на Платформу. Тариф активируется автоматически в течение 1-2 минут. Уведомление придёт на email.</p>
                </div>
              </div>
            </div>
          </section>

          {/* After payment */}
          <section>
            <h2 className="text-lg font-semibold text-[var(--text)] mb-4">Что происходит после оплаты</h2>
            <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] space-y-3">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                <div className="text-sm text-[var(--text-muted)]">Мгновенная активация доступа к личному кабинету и выбранным функциям</div>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                <div className="text-sm text-[var(--text-muted)]">Email-уведомление с деталями транзакции и ссылкой на чек</div>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                <div className="text-sm text-[var(--text-muted)]">Чек формируется автоматически и отправляется на email (ФЗ-54)</div>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                <div className="text-sm text-[var(--text-muted)]">В личном кабинете появляется доступ к оплаченным функциям</div>
              </div>
            </div>
          </section>

          {/* Security details */}
          <section>
            <h2 className="text-lg font-semibold text-[var(--text)] mb-4">Гарантии безопасности</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
                <div className="font-medium text-[var(--text)] mb-2">PCI DSS Compliance</div>
                <p className="text-sm text-[var(--text-muted)]">Платёжный шлюз ЮKassa сертифицирован по стандарту PCI DSS — международному стандарту безопасности данных индустрии платёжных карт.</p>
              </div>
              <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
                <div className="font-medium text-[var(--text)] mb-2">3D Secure 2.0</div>
                <p className="text-sm text-[var(--text-muted)]">Все онлайн-платежи проходят двухфакторную аутентификацию через 3D Secure для защиты от мошенничества.</p>
              </div>
              <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
                <div className="font-medium text-[var(--text)] mb-2">TLS 1.3 Encryption</div>
                <p className="text-sm text-[var(--text-muted)]">Все данные между вашим браузером и платёжным шлюзом передаются в зашифрованном виде по протоколу TLS 1.3.</p>
              </div>
              <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
                <div className="font-medium text-[var(--text)] mb-2">Хранение данных в РФ</div>
                <p className="text-sm text-[var(--text-muted)]">Все данные пользователей и платежная информация хранятся на серверах, расположенных на территории РФ.</p>
              </div>
            </div>
          </section>

          {/* Support */}
          <div className="p-4 rounded-xl bg-[var(--accent-soft)] border border-[var(--border)] text-sm text-[var(--text-muted)]">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-[var(--brand)]" />
              <span className="font-semibold text-[var(--text)]">Проблемы с оплатой?</span>
            </div>
            <p>Если у вас возникли проблемы с оплатой или вопросы по платежам, обратитесь в службу поддержки:</p>
            <div className="mt-2 flex flex-col sm:flex-row gap-2 sm:gap-4">
              <a href={`mailto:${companyData.email}`} className="text-[var(--brand)] underline">{companyData.email}</a>
              <a href={`tel:${companyData.phone}`} className="text-[var(--brand)] underline">{companyData.phone}</a>
            </div>
            <p className="mt-2 text-xs">Рабочие дни: Пн-Пт, 10:00-19:00 МСК. Время ответа: до 24 часов.</p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
