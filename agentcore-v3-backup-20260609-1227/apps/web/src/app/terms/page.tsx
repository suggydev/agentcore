'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, FileText, AlertTriangle } from 'lucide-react';
import Footer from '../../components/Footer';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export default function TermsPage() {
  const [lastUpdated, setLastUpdated] = useState('06.06.2026');
  const [fetchError, setFetchError] = useState('');
  const [companyData, setCompanyData] = useState({
    companyName: '',
    email: '',
    supportEmail: '',
  });

  useEffect(() => {
    fetch(`${API_BASE}/api/legal/legal`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) setCompanyData(prev => ({ ...prev, ...data }));
      })
      .catch(() => {});

    const token = localStorage.getItem('token');
    if (!token) return;
    fetch(`${API_BASE}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(res => {
        if (res?.workspace?.settings?.lastUpdatedDate) {
          setLastUpdated(res.workspace.settings.lastUpdatedDate);
        }
      })
      .catch(err => { if (process.env.NODE_ENV === 'development') console.error('[TermsPage] Failed to load settings:', err); setFetchError('Не удалось загрузить данные. Проверьте подключение.'); });
  }, []);

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {fetchError && (
        <div className="mb-6 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm text-center">{fetchError}</div>
      )}
      <div className="max-w-3xl mx-auto px-5 py-16">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-[var(--brand)] hover:text-[var(--brand)] mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> На главную
        </Link>
        <h1 className="heading-2 text-[var(--text)] mb-3">Пользовательское соглашение</h1>
        <p className="text-sm text-[var(--text-muted)] mb-10">Пользовательское соглашение. Последнее обновление: {lastUpdated}</p>

        <div className="p-4 rounded-xl bg-[var(--accent-soft)] border border-[var(--border)] text-sm text-[var(--text-muted)] mb-8">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-[var(--brand)]" />
            <span className="font-semibold text-[var(--text)]">Важно</span>
          </div>
          <p>Полная редакция Договора публичной оферты размещена на отдельной странице. Настоящий документ является краткой версией. Рекомендуем ознакомиться с полной версией для детального понимания условий.</p>
          <div className="mt-3">
            <Link href="/offer" className="inline-flex items-center gap-1.5 text-[var(--brand)] underline text-sm">
              <FileText className="w-4 h-4" /> Полная версия оферты
            </Link>
          </div>
        </div>

        <div className="prose prose-sm max-w-none text-[var(--text)] space-y-6">
          <h2 className="text-lg font-semibold text-[var(--text)] mt-10 mb-3">1. Общие положения</h2>
          <p>1.1. Настоящее Пользовательское соглашение (далее — «Соглашение») является публичной офертой в соответствии со ст. 437 ГК РФ и регулирует отношения между {companyData.companyName || '—'} («Исполнитель») и пользователем («Заказчик») при использовании платформы agentcore.work.</p>
          <p>1.2. Регистрация на платформе означает полное и безоговорочное принятие условий настоящего Соглашения (акцепт оферты).</p>
          <p>1.3. Исполнитель оставляет за собой право вносить изменения в Соглашение. Новая редакция вступает в силу с момента публикации на сайте.</p>

          <h2 className="text-lg font-semibold text-[var(--text)] mt-10 mb-3">2. Предмет соглашения</h2>
          <p>2.1. Исполнитель предоставляет Заказчику доступ к платформе AgentCore — сервису для создания и управления AI-агентами (цифровыми сотрудниками), включая инструменты для настройки, обучения и интеграции AI-агентов с каналами коммуникации.</p>
          <p>2.2. Платформа предоставляется по модели SaaS (Software as a Service) на условиях подписки.</p>

          <h2 className="text-lg font-semibold text-[var(--text)] mt-10 mb-3">3. Тарифы и оплата</h2>
          <p>3.1. Актуальные тарифы публикуются на странице <Link href="/pricing" className="text-[var(--brand)] underline">Тарифы</Link>. Исполнитель оставляет за собой право изменять стоимость тарифов с предварительным уведомлением Заказчика за 30 дней.</p>
          <p>3.2. Оплата производится через защищённый платёжный шлюз ЮKassa (ООО «ЮMoney», НКО АО «Тинькофф Банк»). Данные банковских карт не обрабатываются и не хранятся на серверах Исполнителя.</p>
          <p>3.3. Все цены указаны в рублях РФ и включают НДС 20%.</p>

          <h2 className="text-lg font-semibold text-[var(--text)] mt-10 mb-3">4. Права и обязанности сторон</h2>
          <p>4.1. Заказчик обязуется:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Предоставлять достоверную информацию при регистрации</li>
            <li>Не использовать платформу для противоправных действий</li>
            <li>Не передавать доступ к аккаунту третьим лицам</li>
            <li>Соблюдать законодательство о защите персональных данных при загрузке информации в платформу</li>
          </ul>
          <p>4.2. Исполнитель обязуется:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Обеспечивать доступность платформы на уровне не ниже 99% в месяц</li>
            <li>Обеспечивать конфиденциальность данных Заказчика</li>
            <li>Предоставлять техническую поддержку в рабочее время</li>
          </ul>

          <h2 className="text-lg font-semibold text-[var(--text)] mt-10 mb-3">5. Возврат средств</h2>
          <p>5.1. Заказчик вправе отказаться от платной подписки в любой момент. При отказе в течение 7 (семи) календарных дней с момента первой оплаты при условии использования менее 10% AI-токенов — производится полный возврат средств.</p>
          <p>5.2. По истечении 7 дней или при использовании более 50% AI-токенов возврат средств не производится, за исключением случаев, предусмотренных законодательством. Подробные условия на странице <Link href="/refund" className="text-[var(--brand)] underline">Правила возврата</Link>.</p>
          <p>5.3. Для запроса возврата необходимо написать на <a href={`mailto:${companyData.supportEmail || companyData.email}`} className="text-[var(--brand)] underline">{companyData.supportEmail || companyData.email}</a>.</p>

          <h2 className="text-lg font-semibold text-[var(--text)] mt-10 mb-3">6. Интеллектуальная собственность</h2>
          <p>6.1. Платформа AgentCore, её исходный код, дизайн, логотип и документация являются интеллектуальной собственностью Исполнителя.</p>
          <p>6.2. Данные и контент, загруженные Заказчиком (документы, FAQ, настройки агентов), остаются собственностью Заказчика.</p>

          <h2 className="text-lg font-semibold text-[var(--text)] mt-10 mb-3">7. Ответственность сторон</h2>
          <p>7.1. Исполнитель не несёт ответственности за содержание ответов, генерируемых AI-агентами. Заказчик самостоятельно проверяет и контролирует работу своих агентов.</p>
          <p>7.2. Исполнитель не несёт ответственности за косвенные убытки, упущенную выгоду или потерю данных.</p>
          <p>7.3. Совокупная ответственность Исполнителя ограничена суммой, уплаченной Заказчиком за последний оплаченный месяц.</p>

          <h2 className="text-lg font-semibold text-[var(--text)] mt-10 mb-3">8. Срок действия и расторжение</h2>
          <p>8.1. Соглашение вступает в силу с момента акцепта и действует до момента удаления аккаунта.</p>
          <p>8.2. Любая из сторон вправе расторгнуть Соглашение, уведомив другую сторону. При расторжении Заказчиком — доступ прекращается по окончании оплаченного периода. При расторжении Исполнителем — производится пропорциональный возврат средств.</p>

          <h2 className="text-lg font-semibold text-[var(--text)] mt-10 mb-3">9. Заключительные положения</h2>
          <p>9.1. Все споры решаются путём переговоров. При недостижении согласия спор передаётся в суд по месту нахождения Исполнителя.</p>
          <p>9.2. Признание недействительным любого положения Соглашения не влечёт недействительности остальных положений.</p>

          <h2 className="text-lg font-semibold text-[var(--text)] mt-10 mb-3">10. Реквизиты</h2>
          <p>Исполнитель: ООО «АгентКор» (в процессе регистрации)</p>
          <p>Email: <a href="mailto:hello@agentcore.work" className="text-[var(--brand)] underline">hello@agentcore.work</a></p>
          <p>Сайт: agentcore.work</p>

          <p className="text-xs text-[var(--text-muted)] bg-[var(--accent-soft)] border border-[var(--border)] p-3 rounded-lg mt-6">
            Документ находится на стадии финального согласования. Полная версия доступна на странице <Link href="/offer" className="text-[var(--brand)] underline">Договор публичной оферты</Link>.
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
