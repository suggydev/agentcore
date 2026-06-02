'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function RefundPage() {
 return (
 <div className="min-h-screen bg-[var(--bg)]">
 <div className="max-w-3xl mx-auto px-5 py-16">
 <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-[var(--brand)] hover:text-[var(--brand)] mb-8 transition-colors">
 <ArrowLeft className="w-4 h-4" /> На главную
 </Link>
 <h1 className="heading-2 text-[var(--text)] mb-3">Возврат и обмен</h1>
 <p className="text-sm text-[var(--text-muted)] mb-10">Условия возврата средств. Последнее обновление: 2026-06-01 (обновите в Настройки → Данные компании → lastUpdatedDate)</p>

 <div className="prose prose-sm max-w-none text-[var(--text)] space-y-6">
 <h2 className="text-lg font-semibold text-[var(--text)] mt-10 mb-3">1. Общие условия возврата</h2>
 <p>AgentCore предоставляет цифровые услуги (SaaS-платформа для создания AI-агентов). В связи с характером услуги (предоставление доступа к онлайн-платформе) стандартные процедуры возврата товаров не применяются.</p>
 <p>При этом мы стремимся обеспечить справедливые условия для всех пользователей.</p>

 <h2 className="text-lg font-semibold text-[var(--text)] mt-10 mb-3">2. Бесплатный пробный период</h2>
 <p>Каждый новый пользователь получает 7 (семь) календарных дней бесплатного доступа ко всем функциям платформы. За это время вы можете полноценно оценить сервис до принятия решения об оплате.</p>

 <h2 className="text-lg font-semibold text-[var(--text)] mt-10 mb-3">3. Гарантия возврата</h2>
 <p>Если вы оформили платную подписку и в течение 7 (семи) календарных дней с момента оплаты решили, что сервис вам не подходит, мы вернём 100% уплаченной суммы.</p>
 <p>Для возврата средств необходимо:</p>
 <ol className="list-decimal pl-5 space-y-1">
 <li>Написать на <a href="mailto:billing@agentcore.work" className="text-[var(--brand)] underline">billing@agentcore.work</a> с темой «Возврат средств»</li>
 <li>Указать email, использованный при регистрации</li>
 <li>При необходимости — кратко описать причину возврата (это поможет нам улучшить сервис)</li>
 </ol>

 <h2 className="text-lg font-semibold text-[var(--text)] mt-10 mb-3">4. Сроки возврата</h2>
 <p>Возврат средств производится в течение 5-10 рабочих дней с момента получения запроса. Средства возвращаются тем же способом, которым была произведена оплата (банковская карта, электронный кошелёк).</p>

 <h2 className="text-lg font-semibold text-[var(--text)] mt-10 mb-3">5. Случаи, когда возврат не производится</h2>
 <p>Возврат не производится в следующих случаях:</p>
 <ul className="list-disc pl-5 space-y-1">
 <li>С момента оплаты прошло более 7 календарных дней</li>
 <li>Пользователь нарушил условия Пользовательского соглашения</li>
 <li>Аккаунт был заблокирован за нарушение правил платформы</li>
 </ul>

 <h2 className="text-lg font-semibold text-[var(--text)] mt-10 mb-3">6. Частичный возврат</h2>
 <p>Частичный возврат средств за неиспользованный период подписки НЕ предусмотрен. Вы можете отменить подписку в любой момент — доступ к платформе сохранится до конца оплаченного периода, но средства за оставшиеся дни не возвращаются.</p>

 <h2 className="text-lg font-semibold text-[var(--text)] mt-10 mb-3">7. Отмена подписки</h2>
 <p>Отменить подписку можно в разделе «Тарифы» личного кабинета. После отмены подписка не будет автоматически продлена на следующий период. Доступ к платформе при этом сохраняется до конца оплаченного периода.</p>

 <h2 className="text-lg font-semibold text-[var(--text)] mt-10 mb-3">8. Спорные ситуации</h2>
 <p>Если вы считаете, что списание средств произошло ошибочно, или у вас возникли вопросы по платежу — свяжитесь с нами: <a href="mailto:billing@agentcore.work" className="text-[var(--brand)] underline">billing@agentcore.work</a>. Мы рассмотрим ваш запрос в течение 2 рабочих дней.</p>

 <p className="text-xs text-[var(--text-muted)] bg-[var(--accent-soft)] border border-[var(--border)] p-3 rounded-lg mt-6">
 Документ находится на стадии финального согласования
 </p>
 </div>
 </div>
 </div>
 );
}
