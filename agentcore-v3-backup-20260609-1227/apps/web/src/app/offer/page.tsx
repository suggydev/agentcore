'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Building2, FileText, Shield, CreditCard, Clock, Ban, AlertTriangle } from 'lucide-react';
import Footer from '../../components/Footer';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export default function OfferPage() {
  const [lastUpdated, setLastUpdated] = useState('06.06.2026');
  const [companyData, setCompanyData] = useState({
    companyName: 'ООО «АгентКор»',
    companyFullName: 'Общество с ограниченной ответственностью «АгентКор»',
    inn: '1234567890',
    ogrn: '1234567890123',
    kpp: '123456789',
    legalAddress: '123456, Россия, г. Москва, ул. Примерная, д. 1, офис 101',
    director: 'Иванов Иван Иванович',
    email: 'hello@agentcore.work',
    supportEmail: 'support@agentcore.work',
    phone: '+7 (999) 123-45-67',
  });

  useEffect(() => {
    fetch(`${API_BASE}/api/legal/legal`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setCompanyData(prev => ({ ...prev, ...data }));
          if (data.lastUpdated) setLastUpdated(data.lastUpdated);
        }
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
              <FileText className="w-5 h-5 text-[var(--brand)]" />
            </div>
            <h1 className="text-2xl font-bold text-[var(--text)]">Договор публичной оферты</h1>
          </div>
          <p className="text-sm text-[var(--text-muted)]">Договор оказания услуг по предоставлению доступа к программному обеспечению AgentCore</p>
          <div className="mt-4 flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <Clock className="w-3.5 h-3.5" />
            <span>Последнее обновление: {lastUpdated}</span>
          </div>
        </div>

        <div className="prose prose-sm max-w-none text-[var(--text)] space-y-8">
          {/* 1. Общие положения */}
          <section>
            <h2 className="text-lg font-semibold text-[var(--text)] mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[var(--accent-soft)] text-[var(--brand)] text-xs font-bold flex items-center justify-center">1</span>
              Общие положения
            </h2>
            <div className="space-y-3 text-sm leading-relaxed text-[var(--text-muted)]">
              <p>
                <strong className="text-[var(--text)]">1.1.</strong> Настоящий Договор является публичной офертой (ст. 437 Гражданского кодекса РФ) и определяет условия предоставления доступа к программному обеспечению (SaaS-платформе) «AgentCore», размещенному в сети Интернет по адресу: https://agentcore.work.
              </p>
              <p>
                <strong className="text-[var(--text)]">1.2.</strong> Исполнитель: <strong className="text-[var(--text)]">{companyData.companyName}</strong> (ИНН: {companyData.inn}, ОГРН: {companyData.ogrn}, КПП: {companyData.kpp}), адрес: {companyData.legalAddress}. Директор: {companyData.director}.
              </p>
              <p>
                <strong className="text-[var(--text)]">1.3.</strong> Заказчик — любое дееспособное физическое или юридическое лицо, совершившее акцепт настоящей Оферты путем регистрации на Платформе и/или оплаты Услуг.
              </p>
              <p>
                <strong className="text-[var(--text)]">1.4.</strong> Акцептом Оферты является совершение Заказчиком любого из следующих действий: регистрация на Платформе, оплата Услуг, или иное использование функционала Платформы. Акцепт означает полное и безоговорочное согласие Заказчика с условиями настоящей Оферты.
              </p>
            </div>
          </section>

          {/* 2. Предмет договора */}
          <section>
            <h2 className="text-lg font-semibold text-[var(--text)] mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[var(--accent-soft)] text-[var(--brand)] text-xs font-bold flex items-center justify-center">2</span>
              Предмет договора
            </h2>
            <div className="space-y-3 text-sm leading-relaxed text-[var(--text-muted)]">
              <p>
                <strong className="text-[var(--text)]">2.1.</strong> Исполнитель предоставляет Заказчику доступ к программному обеспечению «AgentCore» — облачной платформе для создания, настройки и управления AI-агентами (программными роботами), осуществляющими автоматическую обработку запросов пользователей через интегрированные каналы коммуникации.
              </p>
              <p>
                <strong className="text-[var(--text)]">2.2.</strong> Платформа предоставляется по модели SaaS (Software as a Service). Заказчик не получает право на копирование, декомпиляцию, распространение или иное использование программного кода Платформы.
              </p>
              <p>
                <strong className="text-[var(--text)]">2.3.</strong> <strong className="text-[var(--text)]">Момент исполнения обязательств:</strong> доступ к Платформе предоставляется Заказчику в момент подтверждения успешной оплаты (активации тарифа) и открытия доступа к личному кабинету. Исполнитель считается исполнившим обязательства по передаче доступа в момент активации учетной записи Заказчика на Платформе.
              </p>
            </div>
          </section>

          {/* 3. Тарифы и оплата */}
          <section>
            <h2 className="text-lg font-semibold text-[var(--text)] mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[var(--accent-soft)] text-[var(--brand)] text-xs font-bold flex items-center justify-center">3</span>
              Тарифы и оплата
            </h2>
            <div className="space-y-3 text-sm leading-relaxed text-[var(--text-muted)]">
              <p>
                <strong className="text-[var(--text)]">3.1.</strong> Актуальные тарифы и их стоимость размещаются на странице <Link href="/pricing" className="text-[var(--brand)] underline">Тарифы</Link> и являются неотъемлемой частью настоящей Оферты. Стоимость указана в рублях РФ и включает НДС 20%.
              </p>
              <p>
                <strong className="text-[var(--text)]">3.2.</strong> Действующие тарифы:
              </p>
              <div className="grid sm:grid-cols-3 gap-3 my-4">
                <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
                  <div className="font-semibold text-[var(--text)] mb-1">Стартовый</div>
                  <div className="text-lg font-bold text-[var(--brand)]">4 499 ₽</div>
                  <div className="text-xs text-[var(--text-muted)] mb-2">единоразово + 1 месяц</div>
                  <ul className="text-xs text-[var(--text-muted)] space-y-1">
                    <li>• 1 AI-агент</li>
                    <li>• 1 000 AI-токенов/мес</li>
                    <li>• 2 интеграции</li>
                    <li>• Базовая поддержка</li>
                  </ul>
                </div>
                <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
                  <div className="font-semibold text-[var(--text)] mb-1">Профессиональный</div>
                  <div className="text-lg font-bold text-[var(--brand)]">2 499 ₽</div>
                  <div className="text-xs text-[var(--text-muted)] mb-2">/месяц</div>
                  <ul className="text-xs text-[var(--text-muted)] space-y-1">
                    <li>• 1 AI-агент</li>
                    <li>• 10 000 AI-токенов/мес</li>
                    <li>• 10 интеграций</li>
                    <li>• Приоритетная поддержка</li>
                  </ul>
                </div>
                <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
                  <div className="font-semibold text-[var(--text)] mb-1">Бизнес</div>
                  <div className="text-lg font-bold text-[var(--brand)]">9 999 ₽</div>
                  <div className="text-xs text-[var(--text-muted)] mb-2">/месяц</div>
                  <ul className="text-xs text-[var(--text-muted)] space-y-1">
                    <li>• 5 AI-агентов</li>
                    <li>• 50 000 AI-токенов/мес</li>
                    <li>• Все интеграции</li>
                    <li>• 24/7 поддержка</li>
                  </ul>
                </div>
              </div>
              <p>
                <strong className="text-[var(--text)]">3.3.</strong> Оплата производится через платёжный шлюз <strong className="text-[var(--text)]">ЮKassa (ООО «ЮMoney», НКО АО «Тинькофф Банк»)</strong> банковскими картами (Visa, Mastercard, МИР), через Систему Быстрых Платежей (СБП), или иными доступными способами.
              </p>
              <p>
                <strong className="text-[var(--text)]">3.4.</strong> При оплате Заказчик перенаправляется на защищённую страницу ЮKassa. Данные банковских карт не обрабатываются и не хранятся на серверах Исполнителя. Все транзакции проходят через TLS/SSL шифрование.
              </p>
              <p>
                <strong className="text-[var(--text)]">3.5.</strong> После подтверждения оплаты Заказчику направляется электронное уведомление на указанный email с информацией о транзакции.
              </p>
            </div>
          </section>

          {/* 4. Рекуррентные платежи */}
          <section>
            <h2 className="text-lg font-semibold text-[var(--text)] mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[var(--accent-soft)] text-[var(--brand)] text-xs font-bold flex items-center justify-center">4</span>
              Рекуррентные платежи (автопродление)
            </h2>
            <div className="space-y-3 text-sm leading-relaxed text-[var(--text-muted)]">
              <p>
                <strong className="text-[var(--text)]">4.1.</strong> При оформлении подписки на тарифы «Профессиональный» или «Бизнес» Заказчик может дать согласие на автоматическое продление подписки (рекуррентные платежи) на аналогичный срок.
              </p>
              <p>
                <strong className="text-[var(--text)]">4.2.</strong> Автоматическое списание производится в последний день оплаченного периода. За 3 (три) дня до списания Заказчику направляется уведомление на email.
              </p>
              <p>
                <strong className="text-[var(--text)]">4.3.</strong> Заказчик вправе отказаться от автопродления в любой момент в личном кабинете Платформы (раздел «Настройки → Оплата») или обратившись в службу поддержки по адресу <a href={`mailto:${companyData.supportEmail || companyData.email}`} className="text-[var(--brand)] underline">{companyData.supportEmail || companyData.email}</a>.
              </p>
              <p>
                <strong className="text-[var(--text)]">4.4.</strong> При отказе от автопродления доступ к платным функциям сохраняется до окончания оплаченного периода. Далее тариф автоматически переходит на «Стартовый» (если агент был активирован) или доступ ограничивается.
              </p>
            </div>
          </section>

          {/* 5. Возврат средств */}
          <section>
            <h2 className="text-lg font-semibold text-[var(--text)] mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[var(--accent-soft)] text-[var(--brand)] text-xs font-bold flex items-center justify-center">5</span>
              Возврат средств
            </h2>
            <div className="space-y-3 text-sm leading-relaxed text-[var(--text-muted)]">
              <p>
                <strong className="text-[var(--text)]">5.1.</strong> Заказчик вправе отказаться от услуг и потребовать возврата средств в следующих случаях:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong className="text-[var(--text)]">В течение 7 (семи) календарных дней</strong> с момента первой оплаты тарифа «Стартовый» — при условии, что Заказчик не использовал более 10% выделенных AI-токенов и не активировал интеграции с внешними каналами.</li>
                <li><strong className="text-[var(--text)]">В течение 14 (четырнадцати) календарных дней</strong> с момента оплаты ежемесячной подписки — при условии технической неработоспособности Платформы (доступность менее 95%) в течение более 3 дней подряд, подтверждённой службой поддержки.</li>
                <li>При нарушении Исполнителем условий настоящей Оферты или в случае предоставления недостоверной информации о тарифах.</li>
              </ul>
              <p>
                <strong className="text-[var(--text)]">5.2.</strong> <strong className="text-[var(--text)]">Возврат не производится</strong>, если:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Истёк срок, указанный в п. 5.1.</li>
                <li>Заказчик использовал более 50% AI-токенов или активировал интеграции с внешними каналами (Telegram, WhatsApp и т.д.).</li>
                <li>Заказчик нарушил условия настоящей Оферты или законодательство РФ.</li>
                <li>Услуги были полностью оказаны (доступ предоставлен, агент создан и функционирует).</li>
              </ul>
              <p>
                <strong className="text-[var(--text)]">5.3.</strong> Для запроса возврата Заказчик направляет обращение на <a href={`mailto:${companyData.email}`} className="text-[var(--brand)] underline">{companyData.email}</a> с указанием причины, даты оплаты, номера транзакции (из email от ЮKassa). Рассмотрение заявки — в течение 10 (десяти) рабочих дней.
              </p>
              <p>
                <strong className="text-[var(--text)]">5.4.</strong> Возврат производится на реквизиты, с которых была произведена оплата, в течение 5-30 рабочих дней в зависимости от банка-эмитента и платёжной системы.
              </p>
              <p>
                <strong className="text-[var(--text)]">5.5.</strong> Возврат средств за использованные AI-токены или за период, в течение которого доступ к Платформе был предоставлен, не производится (ст. 32 Закона РФ «О защите прав потребителей» применяется с учётом специфики цифрового контента).
              </p>
            </div>
          </section>

          {/* 6. Права и обязанности */}
          <section>
            <h2 className="text-lg font-semibold text-[var(--text)] mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[var(--accent-soft)] text-[var(--brand)] text-xs font-bold flex items-center justify-center">6</span>
              Права и обязанности сторон
            </h2>
            <div className="space-y-3 text-sm leading-relaxed text-[var(--text-muted)]">
              <p>
                <strong className="text-[var(--text)]">6.1. Исполнитель обязуется:</strong>
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Предоставить Заказчику доступ к Платформе в соответствии с выбранным тарифом.</li>
                <li>Обеспечить доступность Платформы на уровне не ниже 99% в месяц (за исключением форс-мажорных обстоятельств и проведения технических работ).</li>
                <li>Обеспечить конфиденциальность данных Заказчика в соответствии с Политикой конфиденциальности.</li>
                <li>Информировать Заказчика об изменениях тарифов за 30 дней до вступления изменений в силу.</li>
              </ul>
              <p>
                <strong className="text-[var(--text)]">6.2. Заказчик обязуется:</strong>
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Предоставлять достоверную информацию при регистрации.</li>
                <li>Не использовать Платформу для распространения противоправной информации, вредоносного ПО, спама, фишинга или иных действий, нарушающих законодательство РФ.</li>
                <li>Не передавать доступ к аккаунту третьим лицам.</li>
                <li>Самостоятельно нести ответственность за содержание данных, загружаемых в AI-агентов (базы знаний, FAQ, инструкции).</li>
              </ul>
            </div>
          </section>

          {/* 7. Ответственность */}
          <section>
            <h2 className="text-lg font-semibold text-[var(--text)] mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[var(--accent-soft)] text-[var(--brand)] text-xs font-bold flex items-center justify-center">7</span>
              Ответственность и ограничения
            </h2>
            <div className="space-y-3 text-sm leading-relaxed text-[var(--text-muted)]">
              <p>
                <strong className="text-[var(--text)]">7.1.</strong> Исполнитель не несёт ответственности за содержание ответов, генерируемых AI-агентами. Заказчик самостоятельно контролирует и несёт ответственность за поведение и ответы своих AI-агентов.
              </p>
              <p>
                <strong className="text-[var(--text)]">7.2.</strong> Исполнитель не несёт ответственности за перебои в работе Платформы, вызванные действиями/бездействием третьих лиц, провайдеров, хостинга, платёжных систем, или форс-мажорными обстоятельствами.
              </p>
              <p>
                <strong className="text-[var(--text)]">7.3.</strong> Совокупная ответственность Исполнителя ограничена суммой, уплаченной Заказчиком за последний оплаченный месяц, за исключением случаев причинения вреда жизни, здоровью или имуществу потребителя.
              </p>
              <p>
                <strong className="text-[var(--text)]">7.4.</strong> Заказчик осознаёт, что AI-агенты могут генерировать неточную, неполную или ошибочную информацию. Исполнитель не гарантирует достоверность ответов AI.
              </p>
            </div>
          </section>

          {/* 8. Реквизиты */}
          <section>
            <h2 className="text-lg font-semibold text-[var(--text)] mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[var(--accent-soft)] text-[var(--brand)] text-xs font-bold flex items-center justify-center">8</span>
              Реквизиты Исполнителя
            </h2>
            <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--surface)] space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-[var(--text-muted)]">Полное наименование:</span><span className="text-[var(--text)] font-medium">{companyData.companyFullName || companyData.companyName}</span></div>
              <div className="flex justify-between"><span className="text-[var(--text-muted)]">ИНН:</span><span className="text-[var(--text)] font-medium">{companyData.inn}</span></div>
              <div className="flex justify-between"><span className="text-[var(--text-muted)]">ОГРН:</span><span className="text-[var(--text)] font-medium">{companyData.ogrn}</span></div>
              <div className="flex justify-between"><span className="text-[var(--text-muted)]">КПП:</span><span className="text-[var(--text)] font-medium">{companyData.kpp}</span></div>
              <div className="flex justify-between"><span className="text-[var(--text-muted)]">Юридический адрес:</span><span className="text-[var(--text)] font-medium">{companyData.legalAddress}</span></div>
              <div className="flex justify-between"><span className="text-[var(--text-muted)]">Email:</span><span className="text-[var(--text)] font-medium">{companyData.email}</span></div>
              <div className="flex justify-between"><span className="text-[var(--text-muted)]">Телефон:</span><span className="text-[var(--text)] font-medium">{companyData.phone}</span></div>
            </div>
          </section>

          {/* Footer note */}
          <div className="p-4 rounded-xl bg-[var(--accent-soft)] border border-[var(--border)] text-sm text-[var(--text-muted)] mt-8">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-[var(--brand)]" />
              <span className="font-semibold text-[var(--text)]">Важно</span>
            </div>
            <p>Настоящая оферта составлена в соответствии с требованиями Гражданского кодекса РФ, Федерального закона № 152-ФЗ «О персональных данных», Федерального закона № 54-ФЗ «О применении контрольно-кассовой техники» и требованиями платёжной системы ЮKassa.</p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
