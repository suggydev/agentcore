# CHANGELOG — redesign/cto-style

## 2026-06-02 — Полный редизайн AgentCore

### Добавлено

**Дизайн-система (cto.new-style)**
- Палитра: тёплый off-white (#FAFAF7), чёрный CTA (#1A1A1A), фиолетовый бренд (#6E56CF)
- Dark mode: тёплый тёмный (#0F0F0E), surfaces (#1A1916)
- Типографика: Inter (UI) + JetBrains Mono (промпты/код)
- CSS custom properties для всех токенов (`--bg`, `--surface`, `--brand`, etc.)
- Компоненты: Button, Card, Input, Modal, Toast, Skeleton, Tabs, StatusBadge
- ThemeProvider с localStorage и системной preference
- i18n-хелпер `t()` со словарём 80+ ключей
- Motion: 150-200ms cubic-bezier, spring для модалок

**Навигация (5 пунктов вместо 12)**
- Агенты → главная (/agents)
- Brain Map → /agents/brain-map
- База знаний → /knowledge
- Настройки → /settings (поглотила Тарифы, Баланс, Платежи, Профиль)
- Баланс виджет внизу сайдбара + Пополнить
- Новый сайдбар: 200px, glass-эффект, theme toggle
- Убран дублирующий баланс из топбара

**Редактор агента (split-view)**
- Левая панель (55%): 5 табов — Промпт, Знания, Каналы, Диалоги, Метрики
- Правая панель (45%): живой чат-превью с горячей перезагрузкой промпта (debounce 500ms)
- Таб «Промпт»: cto.new-style большое monospace-поле, модель, температура, библиотека вставок
- Таб «Знания»: drag-n-drop, URL-парсинг, Q&A пары, поиск
- Таб «Каналы»: 14 интеграций по категориям, 3-шаговый connect-флоу, тест-сообщение
- Таб «Диалоги»: только диалоги этого агента, фильтры, перехват оператором
- Таб «Метрики»: 5 ключевых метрик со sparklines
- Автосохранение промпта (debounce 1s), Cmd+S, Cmd+Enter в чате

**Галерея шаблонов при создании агента**
- 6 шаблонов: Продавец-консультант, Запись на услуги, Поддержка клиентов, Квалификация лидов, Сбор отзывов, С нуля
- Каждый шаблон = preset промпт + предложенные интеграции + knowledge-структура
- Выбор emoji-аватара для агента

**Интеграции (14 коннекторов, рабочий end-to-end)**
- Integration table в Prisma (credentials зашифрованы AES-256-GCM)
- IntegrationLog для дебага
- IntegrationProvider базовый класс с retry (3 попытки, exponential backoff)
- IntegrationRegistry — центральный реестр всех провайдеров
- MessageDispatcher — входящее сообщение → агент → ответ → отправка
- Webhook routes `/api/webhooks/:provider/:agentId` с HMAC-верификацией
- 14 провайдеров: Telegram, WhatsApp, VK, Avito, Я.Мессенджер, amoCRM, Bitrix24, 1С, Mail.ru, Я.360, Unisender, Google Drive, Albato, Webhooks
- Каждый провайдер: initialize, sendMessage, handleWebhook, healthCheck, disconnect
- Encryption utility: encrypt/decrypt/verifyHmac
- E2E тесты для каждого провайдера (14 spec-файлов)

**Микро-взаимодействия**
- Cmd+K — глобальный поиск (обновлён на новые роуты)
- Skeleton loaders вместо спиннеров
- Toast уведомления (snug правый нижний угол, 3 сек)
- Optimistic UI на критичных операциях

### Удалено / Переехало

| Было | Стало |
|------|-------|
| Обзор (дашборд со счётчиками) | Удалён. Главная = список агентов |
| Интеграции (отдельная страница) | Вкладка «Каналы» внутри редактора агента |
| Диалоги (отдельная страница) | Вкладка «Диалоги» внутри редактора |
| Заказы | Вкладка внутри редактора (если e-commerce skill) |
| Платежи | Настройки → Биллинг |
| Клиенты | Вкладка «Контакты» внутри редактора |
| Аналитика | Вкладка «Метрики» внутри редактора |
| Тарифы | Настройки → Подписка |
| Баланс (отдельная страница) | Виджет в сайдбаре + Настройки → Биллинг |
| Виджеты-счётчики | Удалены — юзер работает с агентом, а не смотрит цифры |
| Info tooltip у пунктов меню | Удалены — хорошие названия не требуют пояснений |
| «Агент #41» в UI | Удалено — технические ID не показываются юзеру |
| Дублирующий баланс в топбаре | Удалён — баланс только в сайдбаре |

### Редиректы

Все старые роуты перенаправляют:
- `/dashboard` → `/agents`
- `/dashboard/integrations` → `/agents`
- `/dashboard/conversations` → `/agents`
- `/dashboard/orders` → `/agents`
- `/dashboard/customers` → `/agents`
- `/dashboard/analytics` → `/agents`
- `/dashboard/payments` → `/settings`
- `/dashboard/billing` → `/settings`
- `/dashboard/credits` → `/settings`
- `/dashboard/settings` → `/settings`
- `/dashboard/agents/[id]` → `/agents/[id]`

### a11y

- Все кнопки имеют aria-label или видимый текст
- Инпуты ассоциированы с label
- Focus-visible состояния (ring-2 ring-brand)
- Tabs: role="tablist/tab/tabpanel", aria-selected
- Modals: aria-modal, role="dialog"
- Loading: role="status", sr-only текст
