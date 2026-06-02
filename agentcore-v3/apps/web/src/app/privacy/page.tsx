'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export default function PrivacyPage() {
 const [lastUpdated, setLastUpdated] = useState('2026-06-01');

 useEffect(() => {
 const token = localStorage.getItem('token');
 if (!token) return;
 fetch(`${API_BASE}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
 .then(r => r.json())
 .then(res => {
 if (res?.workspace?.settings?.lastUpdatedDate) {
 setLastUpdated(res.workspace.settings.lastUpdatedDate);
 }
 })
 .catch(() => {});
 }, []);

 return (
 <div className="min-h-screen bg-[var(--bg)]">
 <div className="max-w-3xl mx-auto px-5 py-16">
 <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-[var(--brand)] hover:text-[var(--brand)] mb-8 transition-colors">
 <ArrowLeft className="w-4 h-4" /> На главную
 </Link>
 <h1 className="heading-2 text-[var(--text)] mb-3">Политика конфиденциальности</h1>
 <p className="text-sm text-[var(--text-muted)] mb-10">Последнее обновление: {lastUpdated}</p>
 
 <div className="prose prose-sm max-w-none text-[var(--text)] space-y-6">
 <p>Настоящая Политика конфиденциальности описывает, как AgentCore («мы», «наш») собирает, использует и защищает персональные данные пользователей («вы», «ваш») при использовании платформы AgentCore (agentcore.work) и связанных с ней сервисов.</p>

 <h2 className="text-lg font-semibold text-[var(--text)] mt-10 mb-3">1. Какие данные мы собираем</h2>
 <p><strong>При регистрации:</strong> имя, адрес электронной почты, пароль (в зашифрованном виде), название компании, отрасль, географическое положение.</p>
 <p><strong>При использовании сервиса:</strong> данные о созданных AI-агентах, загруженные документы и базы знаний, история диалогов с клиентами, настройки интеграций.</p>
 <p><strong>При оплате:</strong> информация о платежах (сумма, дата, способ оплаты). Мы НЕ храним данные банковских карт — они обрабатываются напрямую платёжными партнёрами (Stripe, ЮKassa).</p>
 <p><strong>Технические данные:</strong> IP-адрес, тип браузера, операционная система, временная зона, данные об использовании платформы.</p>

 <h2 className="text-lg font-semibold text-[var(--text)] mt-10 mb-3">2. Как мы используем данные</h2>
 <ul className="list-disc pl-5 space-y-1">
 <li>Предоставление доступа к платформе и её функциям</li>
 <li>Обработка платежей и выставление счетов</li>
 <li>Улучшение качества сервиса и пользовательского опыта</li>
 <li>Техническая поддержка и ответы на запросы</li>
 <li>Отправка уведомлений об обновлениях и изменениях в работе сервиса</li>
 <li>Анализ использования для развития продукта</li>
 <li>Соблюдение юридических обязательств</li>
 </ul>

 <h2 className="text-lg font-semibold text-[var(--text)] mt-10 mb-3">3. Хранение данных</h2>
 <p>Ваши данные хранятся на защищённых серверах в дата-центрах с ограниченным физическим доступом. Мы используем шифрование данных при передаче (HTTPS/TLS) и хранении. Данные хранятся в течение всего срока использования вами платформы и удаляются в течение 90 дней после закрытия аккаунта (за исключением данных, которые мы обязаны хранить по закону).</p>

 <h2 className="text-lg font-semibold text-[var(--text)] mt-10 mb-3">4. Передача данных третьим лицам</h2>
 <p>Мы не продаём ваши данные. Данные могут передаваться:</p>
 <ul className="list-disc pl-5 space-y-1">
 <li>Платёжным партнёрам (Stripe, ЮKassa) — для обработки платежей</li>
 <li>AI-провайдерам (OpenAI, Anthropic и др.) — для работы ваших AI-агентов</li>
 <li>Инфраструктурным провайдерам — для хостинга и доставки сервиса</li>
 <li>По требованию закона — правоохранительным органам при наличии законных оснований</li>
 </ul>

 <h2 className="text-lg font-semibold text-[var(--text)] mt-10 mb-3">5. Ваши права</h2>
 <ul className="list-disc pl-5 space-y-1">
 <li>Право на доступ к своим данным</li>
 <li>Право на исправление неточных данных</li>
 <li>Право на удаление данных («право быть забытым»)</li>
 <li>Право на ограничение обработки</li>
 <li>Право на перенос данных</li>
 <li>Право на отзыв согласия на обработку</li>
 </ul>
 <p>Для реализации этих прав напишите на <a href="mailto:privacy@agentcore.work" className="text-[var(--brand)] underline">privacy@agentcore.work</a>.</p>

 <h2 className="text-lg font-semibold text-[var(--text)] mt-10 mb-3">6. Cookies</h2>
 <p>Мы используем файлы cookie для обеспечения работы платформы, аутентификации пользователей и аналитики. Вы можете отключить cookies в настройках браузера, но это может повлиять на функциональность сервиса.</p>

 <h2 className="text-lg font-semibold text-[var(--text)] mt-10 mb-3">7. Изменения политики</h2>
 <p>Мы оставляем за собой право обновлять данную Политику. При существенных изменениях мы уведомим вас по email или через платформу. Продолжение использования сервиса после изменений означает ваше согласие с новой редакцией.</p>

 <h2 className="text-lg font-semibold text-[var(--text)] mt-10 mb-3">8. Контакты</h2>
 <p>По вопросам конфиденциальности: <a href="mailto:privacy@agentcore.work" className="text-[var(--brand)] underline">privacy@agentcore.work</a></p>
 <p>Адрес: г. Алматы, Казахстан</p>
 <p className="text-xs text-[var(--text-muted)] bg-[var(--accent-soft)] border border-[var(--border)] p-3 rounded-lg mt-4">
 Документ находится на стадии финального согласования
 </p>
 </div>
 </div>
 </div>
 );
}
