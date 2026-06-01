# TODO — Осознанно оставленные моки и технический долг

## Approved Mocks / Placeholders

| # | Что | Где | Почему оставлено | Когда уберём | Тикет |
|---|-----|-----|------------------|-------------|-------|
| 1 | Billing limits хардкод (agents:5, messages:1000, storage:100) | routes/billing.js:12 | Нет таблицы Plan и UsageQuota. Требуется Phase 11 Billing Maturity. | Phase 11 | BILLING-001 |
| 2 | YooKassa integration untested | services/yookassa.js | Нет sandbox ключей для тестирования. Требуется тестовый аккаунт YooKassa. | Phase 11 | BILLING-002 |
| 3 | Knowledge base без поиска (RAG) | routes/knowledge.js | Нет vector DB и embeddings. Требуется Phase 6. | Phase 6 | KB-001 |
| 4 | Analytics агрегаты без event streaming | routes/analytics.js | Нет Kafka/Redis Streams. Текущие агрегаты на PostgreSQL count() — достаточно для MVP. | Phase 10 | ANALYTICS-001 |
| 5 | Telegram бот не запущен | tg_devops_bot.py | Нет BOT_TOKEN в окружении. Требуется создание бота через @BotFather. | Phase 15 | OPS-001 |
| 6 | Image generation endpoint не тестирован | routes/chat.js | Нет тестовых API-ключей с доступом к image models в sandbox. | Phase 2 | AI-001 |

## Технический долг (приоритеты)

| # | Что | Приоритет | Owner | Phase |
|---|-----|-----------|-------|-------|
| 1 | Все пользователи имеют role=OWNER — нет RBAC | CRITICAL | RBACDesigner | Phase 3 |
| 2 | ~~Streaming chat не сохраняет в БД~~ | ~~HIGH~~ | ~~StreamingConsistencyFixer~~ | ~~FIXED~~ |
| 3 | Нет миграций (db push) | HIGH | MigrationWriter | Phase 1 |
| 4 | 0% test coverage на фронтенде | HIGH | E2ETestWriter | Phase 2 |
| 5 | console.log вместо structured logging | MEDIUM | StructuredLoggingLead | Phase 2 |
| 6 | Нет Redis (кеширование, сессии) | MEDIUM | InfraDeploymentLead | Phase 14 |
| 7 | Stripe dependency в package.json но не используется | LOW | BillingCoreRefactor | Phase 11 |
| 8 | Нет email-системы | MEDIUM | IntegrationsChannelsPlanner | Phase 7 |
| 9 | deploy.py encoding crash на Windows (CP866) | LOW | DeployScriptsFixer | Phase 15 |
| 10 | Нет backup automation | HIGH | BackupRestoreLead | Phase 2 |

## Закрытые пункты (исправлено)

| # | Что | Когда исправлено | Коммит |
|---|-----|-----------------|--------|
| 1 | Hardcoded JWT_SECRET и SUGGY_PROJECT_KEY | stabilization | server.js env validation |
| 2 | CORS wildcard | stabilization | CORS allowlist |
| 3 | routeToModel выбирал image-модели для chat | stabilization | filter by supports_chat |
| 4 | Отсутствие rate limit | stabilization | 3-tier express-rate-limit |
| 5 | PUT/DELETE agents возвращали странные данные | stabilization | findFirst + update/deleteMany count |
| 6 | billing/usage возвращал all-time вместо month | stabilization | date filter added |
| 7 | Prisma client cache conflict | stabilization | deleted stale node_modules/.prisma |
| 8 | Отсутствие request ID tracking | stabilization | middleware added |
| 9 | Monolithic server.js (1053 lines) | Phase 2 start | modularized to routes/ middleware/ services/ config/ |
| 10 | Деплой обновлённого backend на production | deploy | deployed to /opt/agentcore-v3/apps/api |
| 11 | Тестовая инфраструктура Jest + Supertest | Phase 2 | jest.config.js, tests/setup.js, 3 test suites |
| 12 | Fallback models при недоступности Suggy API | Phase 2 | config.FALLBACK_MODELS + resilient fetchModels |
| 13 | 0% test coverage → 29 integration tests | Phase 2 | 29 tests (1 skipped - needs real Suggy key), 3 suites, real PostgreSQL, no mocks |
| 14 | Streaming chat persistence | Phase 2 | Conversation + messages saved before streaming, placeholder assistant message on stream end |
| 15 | Resilient model fetching with fallback | Phase 2 | config.FALLBACK_MODELS used when Suggy API unavailable (production stability) |
