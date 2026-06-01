'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function DeliveryPage() {
  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      <div className="max-w-3xl mx-auto px-5 py-16">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-mauve-600 hover:text-mauve-500 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> На главную
        </Link>
        <h1 className="heading-2 text-ink-900 mb-3">Доставка и оплата</h1>
        <p className="text-sm text-ink-400 mb-10">Как получить доступ к сервису и оплатить подписку. Last updated: 2026-06-01 (update via Settings → Company Data → lastUpdatedDate)</p>

        <div className="prose prose-sm max-w-none text-ink-600 space-y-6">
          <h2 className="text-lg font-semibold text-ink-900 mt-10 mb-3">1. Тип услуги</h2>
          <p>AgentCore — это облачная SaaS-платформа. Доступ к сервису предоставляется мгновенно после регистрации через личный кабинет на сайте agentcore.work. Физическая доставка не требуется.</p>

          <h2 className="text-lg font-semibold text-ink-900 mt-10 mb-3">2. Как получить доступ</h2>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Зарегистрируйтесь на сайте agentcore.work</li>
            <li>Пройдите короткий онбординг (1 минута)</li>
            <li>Создайте первого AI-агента или выберите готовый шаблон</li>
            <li>Платформа готова к работе — начинайте использовать сразу</li>
          </ol>
          <p>Первые 7 дней — бесплатно, без ограничений и без привязки карты.</p>

          <h2 className="text-lg font-semibold text-ink-900 mt-10 mb-3">3. Тарифы</h2>
          <div className="bg-gradient-to-br from-mauve-50 to-white rounded-xl border border-mauve-200 p-6 shadow-sm">
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-3xl font-bold text-mauve-700">$29</span>
              <span className="text-mauve-500 text-sm font-medium">/ месяц</span>
            </div>
            <ul className="space-y-2 text-sm text-ink-700">
              <li className="flex items-start gap-2">
                <span className="text-mauve-500 mt-0.5 flex-shrink-0">&#10003;</span>
                <span>1 AI-сотрудник (работает 24/7)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-mauve-500 mt-0.5 flex-shrink-0">&#10003;</span>
                <span>Все каналы: WhatsApp, Telegram, Instagram, Web</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-mauve-500 mt-0.5 flex-shrink-0">&#10003;</span>
                <span>Все интеграции: CRM, календарь, платежи</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-mauve-500 mt-0.5 flex-shrink-0">&#10003;</span>
                <span>История диалогов и аналитика</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-mauve-500 mt-0.5 flex-shrink-0">&#10003;</span>
                <span>Обучение на ваших документах</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-mauve-500 mt-0.5 flex-shrink-0">&#10003;</span>
                <span>Техническая поддержка в рабочее время</span>
              </li>
            </ul>
          </div>
          <p className="text-sm mt-2">Корпоративные тарифы обсуждаются индивидуально: <a href="mailto:enterprise@agentcore.work" className="text-mauve-600 underline">enterprise@agentcore.work</a></p>

          <h2 className="text-lg font-semibold text-ink-900 mt-10 mb-3">4. Способы оплаты</h2>
          <p>Мы принимаем следующие способы оплаты:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Банковские карты Visa, Mastercard, МИР</li>
            <li>Электронные кошельки (YooMoney)</li>
            <li>SberPay, T-Pay</li>
            <li>Система быстрых платежей (СБП)</li>
          </ul>
          <p>Платежи обрабатываются через сертифицированных платёжных партнёров: Stripe и ЮKassa. Все платёжные данные передаются по защищённому соединению (HTTPS/TLS) и не хранятся на наших серверах.</p>

          <h2 className="text-lg font-semibold text-ink-900 mt-10 mb-3">5. Подтверждение оплаты</h2>
          <p>После успешной оплаты вы получите электронный чек на указанный email. Чек содержит информацию о сумме, дате платежа и платёжной системе.</p>
          <p>Доступ к платному функционалу активируется мгновенно после подтверждения платежа.</p>

          <h2 className="text-lg font-semibold text-ink-900 mt-10 mb-3">6. Продление подписки</h2>
          <p>Подписка продлевается автоматически каждый месяц. Вы можете отменить автопродление в любой момент в разделе «Billing» личного кабинета. При отмене подписки доступ к платформе сохраняется до конца оплаченного периода.</p>

          <h2 className="text-lg font-semibold text-ink-900 mt-10 mb-3">7. Счета и закрывающие документы</h2>
          <p>Для юридических лиц и ИП предоставляются счета на оплату и закрывающие документы (акты выполненных работ). Для получения документов напишите на <a href="mailto:billing@agentcore.work" className="text-mauve-600 underline">billing@agentcore.work</a>.</p>

          <p className="text-xs text-ink-500 bg-mauve-50 border border-mauve-200 p-3 rounded-lg mt-6">
            Документ находится на стадии финального согласования
          </p>
        </div>
      </div>
    </div>
  );
}
