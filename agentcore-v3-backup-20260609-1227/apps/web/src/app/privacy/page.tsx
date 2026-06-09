'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield, Eye, Database, Share2, Clock, Trash2, Mail, Phone } from 'lucide-react';
import Footer from '../../components/Footer';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export default function PrivacyPage() {
  const [lastUpdated, setLastUpdated] = useState('06.06.2026');
  const [companyData, setCompanyData] = useState({
    companyName: '',
    inn: '',
    ogrn: '',
    legalAddress: '',
    email: '',
    phone: '',
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
              <Shield className="w-5 h-5 text-[var(--brand)]" />
            </div>
            <h1 className="text-2xl font-bold text-[var(--text)]">Политика конфиденциальности</h1>
          </div>
          <p className="text-sm text-[var(--text-muted)]">Обработка персональных данных в соответствии с Федеральным законом № 152-ФЗ</p>
          <div className="mt-4 flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <Clock className="w-3.5 h-3.5" />
            <span>Последнее обновление: {lastUpdated}</span>
          </div>
        </div>

        <div className="prose prose-sm max-w-none text-[var(--text)] space-y-8">
          <section>
            <h2 className="text-lg font-semibold text-[var(--text)] mb-4">1. Общие положения</h2>
            <div className="space-y-3 text-sm leading-relaxed text-[var(--text-muted)]">
              <p><strong className="text-[var(--text)]">1.1.</strong> Настоящая Политика конфиденциальности (далее — «Политика») разработана в соответствии с Федеральным законом от 27.07.2006 № 152-ФЗ «О персональных данных» и определяет порядок обработки и защиты персональных данных пользователей платформы AgentCore (далее — «Платформа»).</p>
              <p><strong className="text-[var(--text)]">1.2.</strong> Оператор персональных данных: <strong className="text-[var(--text)]">{companyData.companyName || '—'}</strong> (ИНН: {companyData.inn || '—'}, ОГРН: {companyData.ogrn || '—'}), адрес: {companyData.legalAddress || '—'}.</p>
              <p><strong className="text-[var(--text)]">1.3.</strong> Пользователь — физическое или юридическое лицо, использующее Платформу. Использование Платформы означает безоговорочное согласие с настоящей Политикой.</p>
              <p><strong className="text-[var(--text)]">1.4.</strong> Контакты Оператора: email <a href={`mailto:${companyData.email}`} className="text-[var(--brand)] underline">{companyData.email || '—'}</a>, телефон <a href={`tel:${companyData.phone}`} className="text-[var(--brand)] underline">{companyData.phone || '—'}</a>.</p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--text)] mb-4">2. Какие данные мы собираем</h2>
            <div className="space-y-3 text-sm leading-relaxed text-[var(--text-muted)]">
              <p><strong className="text-[var(--text)]">2.1.</strong> При регистрации и использовании Платформы мы собираем следующие персональные данные:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Контактные данные:</strong> email, имя пользователя (псевдоним), номер телефона (если указан).</li>
                <li><strong>Данные аккаунта:</strong> название компании/проекта, должность (если указаны).</li>
                <li><strong>Данные об устройстве:</strong> IP-адрес, тип браузера, операционная система, устройство (только для обеспечения безопасности и аналитики).</li>
                <li><strong>Данные о платежах:</strong> история транзакций, даты оплат, выбранные тарифы (банковские данные не хранятся — обрабатываются платёжным шлюзом ЮKassa).</li>
              </ul>
              <p><strong className="text-[var(--text)]">2.2.</strong> Данные, загружаемые в AI-агентов: базы знаний, FAQ, инструкции, логи диалогов. Эти данные обрабатываются в рамках предоставления Услуг и не используются для обучения сторонних моделей.</p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--text)] mb-4">3. Цели обработки данных</h2>
            <div className="space-y-3 text-sm leading-relaxed text-[var(--text-muted)]">
              <p><strong className="text-[var(--text)]">3.1.</strong> Персональные данные обрабатываются в следующих целях:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Идентификация пользователя и предоставление доступа к личному кабинету.</li>
                <li>Обработка платежей и ведение бухгалтерской отчётности.</li>
                <li>Отправка уведомлений (email) о статусе платежей, обновлениях, технических работах.</li>
                <li>Техническая поддержка и ответы на обращения пользователей.</li>
                <li>Аналитика и улучшение качества Платформы (обезличенные данные).</li>
                <li>Выполнение требований законодательства РФ (налоговое законодательство, бухгалтерский учёт).</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--text)] mb-4">4. Правовые основания обработки</h2>
            <div className="space-y-3 text-sm leading-relaxed text-[var(--text-muted)]">
              <p><strong className="text-[var(--text)]">4.1.</strong> Обработка персональных данных осуществляется на следующих правовых основаниях:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Согласие субъекта</strong> — при регистрации пользователь даёт согласие на обработку данных (ст. 9 ФЗ-152).</li>
                <li><strong>Исполнение договора</strong> — обработка необходима для предоставления доступа к Платформе (п. 5 ч. 1 ст. 6 ФЗ-152).</li>
                <li><strong>Законодательство</strong> — обработка необходима для выполнения требований законодательства (п. 2 ч. 1 ст. 6 ФЗ-152).</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--text)] mb-4">5. Передача данных третьим лицам</h2>
            <div className="space-y-3 text-sm leading-relaxed text-[var(--text-muted)]">
              <p><strong className="text-[var(--text)]">5.1.</strong> Мы не передаём, не продаём и не обмениваем персональными данными пользователей с третьими лицами, за исключением случаев, предусмотренных законодательством РФ или настоящей Политикой.</p>
              <p><strong className="text-[var(--text)]">5.2.</strong> Данные могут передаваться:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Платёжному шлюзу ЮKassa</strong> — для обработки платежей (только данные, необходимые для транзакции).</li>
                <li><strong>Хостинг-провайдеру</strong> — для обеспечения работы Платформы (данные хранятся на серверах в РФ).</li>
                <li><strong>Провайдеру email-рассылок</strong> — для отправки уведомлений (только email и имя пользователя).</li>
                <li><strong>Государственным органам</strong> — только по официальному запросу в рамках законодательства РФ.</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--text)] mb-4">6. Сроки хранения данных</h2>
            <div className="space-y-3 text-sm leading-relaxed text-[var(--text-muted)]">
              <p><strong className="text-[var(--text)]">6.1.</strong> Персональные данные хранятся в течение срока действия договорных отношений и не менее 5 (пяти) лет после их окончания (в соответствии с требованиями налогового законодательства РФ).</p>
              <p><strong className="text-[var(--text)]">6.2.</strong> Логи взаимодействия с AI-агентами хранятся в течение 1 (одного) года с момента последнего обращения, после чего обезличиваются или удаляются.</p>
              <p><strong className="text-[var(--text)]">6.3.</strong> Данные платежных транзакций хранятся в течение 5 (пяти) лет в соответствии с ФЗ-54 «О применении ККТ».</p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--text)] mb-4">7. Права субъекта данных</h2>
            <div className="space-y-3 text-sm leading-relaxed text-[var(--text-muted)]">
              <p><strong className="text-[var(--text)]">7.1.</strong> Пользователь имеет право:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Получить информацию о том, какие данные обрабатываются, целях и способах обработки.</li>
                <li>Требовать уточнения, блокирования или удаления своих персональных данных.</li>
                <li>Отозвать согласие на обработку данных (с ограничением — в случаях, предусмотренных законодательством).</li>
                <li>Направить обращение (жалобу) Оператору или в Роскомнадзор.</li>
              </ul>
              <p><strong className="text-[var(--text)]">7.2.</strong> Для реализации прав пользователь направляет запрос на <a href={`mailto:${companyData.email}`} className="text-[var(--brand)] underline">{companyData.email || '—'}</a> с указанием ФИО и email, привязанного к аккаунту. Ответ предоставляется в течение 30 (тридцати) дней.</p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--text)] mb-4">8. Защита данных</h2>
            <div className="space-y-3 text-sm leading-relaxed text-[var(--text-muted)]">
              <p><strong className="text-[var(--text)]">8.1.</strong> Оператор принимает следующие меры для защиты персональных данных:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Шифрование данных при передаче (TLS/SSL).</li>
                <li>Хранение паролей в хешированном виде (bcrypt).</li>
                <li>Ограничение доступа к данным (только авторизованные сотрудники).</li>
                <li>Регулярное резервное копирование и аудит безопасности.</li>
                <li>Серверы расположены в РФ, что обеспечивает соответствие требованиям законодательства о хранении данных.</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--text)] mb-4">9. Cookies и аналитика</h2>
            <div className="space-y-3 text-sm leading-relaxed text-[var(--text-muted)]">
              <p><strong className="text-[var(--text)]">9.1.</strong> Платформа использует cookie-файлы для: поддержания сессии авторизации, анализа посещаемости, запоминания предпочтений пользователя.</p>
              <p><strong className="text-[var(--text)]">9.2.</strong> Пользователь может отключить cookie в настройках браузера, однако это может ограничить функциональность Платформы.</p>
              <p><strong className="text-[var(--text)]">9.3.</strong> Мы не используем сторонние аналитические системы, собирающие персональные данные (Google Analytics, Яндекс.Метрика и т.д.) без явного согласия пользователя.</p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--text)] mb-4">10. Изменения Политики</h2>
            <div className="space-y-3 text-sm leading-relaxed text-[var(--text-muted)]">
              <p><strong className="text-[var(--text)]">10.1.</strong> Оператор вправе вносить изменения в настоящую Политику. Новая редакция вступает в силу с момента публикации на сайте.</p>
              <p><strong className="text-[var(--text)]">10.2.</strong> При существенных изменениях пользователи получают уведомление на email.</p>
              <p><strong className="text-[var(--text)]">10.3.</strong> По всем вопросам, связанным с обработкой персональных данных, обращайтесь: <a href={`mailto:${companyData.email}`} className="text-[var(--brand)] underline">{companyData.email || '—'}</a>.</p>
            </div>
          </section>

          <div className="p-4 rounded-xl bg-[var(--accent-soft)] border border-[var(--border)] text-sm text-[var(--text-muted)] mt-8">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-[var(--brand)]" />
              <span className="font-semibold text-[var(--text)]">Регистратор данных</span>
            </div>
            <p>Оператор зарегистрирован в реестре операторов персональных данных. Регистрационный номер в реестре Роскомнадзора: —.</p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
