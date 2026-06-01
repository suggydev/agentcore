# Блокеры и зависимости между агентами

## Активные блокеры

### BLOCKER-001: Нет тестовой базы данных
- **Описание**: Jest тесты не могут прогоняться без PostgreSQL на localhost:5432
- **Блокирует**: UnitTestWriter, IntegrationTestWriter, все backend fixers
- **Решение**: Добавлен docker-compose.test.yml (postgres:16-alpine на порту 5433). Требуется запуск Docker и настройка TEST_DATABASE_URL.
- **Статус**: Частично решено — файл создан, Docker не запущен.
- **Владелец**: InfraDeploymentLead

### BLOCKER-002: Модульная декомпозиция server.js
- **Описание**: server.js разбит на routes/, middleware/, services/, config/. Нужно убедиться, что все импорты корректны и приложение стартует.
- **Блокирует**: дальнейший рефакторинг (добавление новых ручек)
- **Решение**: Все файлы созданы. Нужно тестовое подтверждение запуска.
- **Статус**: В процессе — код написан, требует smoke-test.
- **Владелец**: BackendDecomposer

### BLOCKER-003: Prisma schema v3 → v4 миграция
- **Описание**: Новые модели (WorkspaceMember, Role, AuditLog, UsageEvent) ещё не добавлены в schema.prisma.
- **Блокирует**: RBACDesigner, BillingCoreRefactor, AuditLogDesigner
- **Решение**: План в /strategy/02_domain_model_evolution.md. Нужно выполнить prisma migrate dev с новыми моделями.
- **Статус**: Заблокировано — требуется одобрение schema changes перед миграцией.
- **Владелец**: PrismaSchemaFixer

### BLOCKER-004: YooKassa тестовые ключи
- **Описание**: Невозможно протестировать billing webhooks без sandbox аккаунта YooKassa.
- **Блокирует**: YooKassaHardeningLead, BillingCoreRefactor
- **Решение**: Зарегистрировать test shop в YooKassa и получить shopId + secretKey.
- **Статус**: Заблокировано — требуется действие пользователя.
- **Владелец**: Пользователь

### BLOCKER-005: Frontend не поддерживает новую пагинацию
- **Описание**: GET /api/agents и другие списковые endpoint'ы теперь возвращают { data, total, page, limit, totalPages } вместо массива.
- **Блокирует**: DashboardPagesAuditor
- **Решение**: Обновить все fetch-вызовы во фронтенде для работы с новой структурой.
- **Статус**: Частично решено — необходимо проверить каждую страницу дашборда.
- **Владелец**: DashboardPagesAuditor

## Разрешённые блокеры

### BLOCKER-006: Prisma client stale cache
- **Решение**: Удалён apps/api/node_modules/.prisma, сделана regenerate.
- **Дата закрытия**: stabilization phase

### BLOCKER-007: routeToModel выбирал image-модели для chat
- **Решение**: Добавлена фильтрация models.filter(m => m.supports_chat === true).
- **Дата закрытия**: stabilization phase

### BLOCKER-008: Hardcoded secrets в коде
- **Решение**: Убраны fallback'ы, добавлена fatal validation при старте.
- **Дата закрытия**: stabilization phase
