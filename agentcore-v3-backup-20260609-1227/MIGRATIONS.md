# MIGRATIONS — redesign/cto-style

## 1. База данных

### Новые таблицы

**Integration** — привязка интеграций к конкретному агенту (не workspace):

```sql
CREATE TABLE "Integration" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT cuid(),
  "agentId" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "credentials" TEXT NOT NULL,  -- AES-256-GCM encrypted JSON
  "status" TEXT NOT NULL DEFAULT 'active',
  "webhookUrl" TEXT,
  "webhookSecret" TEXT,
  "lastHealthCheck" TIMESTAMP,
  "lastError" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT "Integration_agentId_provider_key" UNIQUE ("agentId", "provider"),
  CONSTRAINT "Integration_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "Integration_agentId_idx" ON "Integration"("agentId");
CREATE INDEX "Integration_provider_idx" ON "Integration"("provider");
```

**IntegrationLog** — логирование всех операций интеграций:

```sql
CREATE TABLE "IntegrationLog" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT cuid(),
  "integrationId" TEXT NOT NULL,
  "direction" TEXT NOT NULL,  -- inbound, outbound
  "eventType" TEXT NOT NULL,  -- message, webhook, error, health_check
  "payload" TEXT,  -- JSON string, sanitized
  "status" TEXT NOT NULL,  -- success, error, retry
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT "IntegrationLog_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "Integration"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "IntegrationLog_integrationId_idx" ON "IntegrationLog"("integrationId");
CREATE INDEX "IntegrationLog_integrationId_createdAt_idx" ON "IntegrationLog"("integrationId", "createdAt");
CREATE INDEX "IntegrationLog_direction_idx" ON "IntegrationLog"("direction");
```

### Миграция данных

Старые интеграции хранились в `Workspace.settings.integrations` как JSON. Новая схема хранит их в таблице `Integration` с шифрованием.

**Шаг миграции:**

1. Запустить `npx prisma db push` для создания новых таблиц
2. Выполнить миграционный скрипт:

```javascript
const { prisma } = require('./apps/api/prisma-client');
const { encrypt } = require('./apps/api/utils/encryption');

async function migrateIntegrations() {
  const workspaces = await prisma.workspace.findMany({
    include: { agents: true }
  });

  for (const ws of workspaces) {
    const settings = ws.settings || {};
    const oldIntegrations = settings.integrations || {};
    const defaultAgent = ws.agents[0]; // Привязываем к первому агенту

    if (!defaultAgent) continue;

    for (const [provider, data] of Object.entries(oldIntegrations)) {
      if (!data.connected) continue;

      const existing = await prisma.integration.findUnique({
        where: { agentId_provider: { agentId: defaultAgent.id, provider } }
      });

      if (existing) continue;

      const credentials = encrypt(JSON.stringify(data));
      await prisma.integration.create({
        data: {
          agentId: defaultAgent.id,
          provider,
          credentials,
          status: 'active',
          webhookUrl: data.webhookUrl,
          webhookSecret: data.webhookSecret,
        }
      });
    }
  }

  console.log('Migration complete');
}

migrateIntegrations();
```

3. Старые данные в `Workspace.settings.integrations` можно оставить для совместимости — новые API-эндпоинты используют таблицу `Integration`

## 2. Переменные окружения

Добавить в `.env` (API):

```
ENCRYPTION_KEY=<32-byte hex string, generated with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
```

Если `ENCRYPTION_KEY` не задан, используется `DATABASE_URL` как fallback (не рекомендуется для production).

## 3. Роутинг

### Новые роуты (фронтенд)

| Путь | Описание |
|------|----------|
| `/agents` | Главная — галерея агентов |
| `/agents/[id]` | Редактор агента (split-view) |
| `/agents/brain-map` | Brain Map |
| `/knowledge` | База знаний |
| `/settings` | Настройки (Профиль, Подписка, Биллинг, Безопасность) |
| `/settings/upgrade` | Повышение тарифа |

### Устаревшие роуты (редирект)

Все `/dashboard/*` роуты перенаправляют на новые. Закладки пользователей продолжат работать.

### Новые API-эндпоинты

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/integrations?agentId=...` | Интеграции агента |
| POST | `/api/integrations/:provider/connect` | Подключить (body: { agentId, ...credentials }) |
| DELETE | `/api/integrations/:provider/disconnect` | Отключить (query: agentId) |
| GET | `/api/integrations/:provider/health` | Health-check (query: agentId) |
| POST | `/api/integrations/:provider/test-message` | Тестовое сообщение (query: agentId) |
| GET | `/api/integrations/providers` | Список доступных провайдеров |
| POST | `/api/webhooks/:provider/:agentId` | Публичный webhook-приёмник |

## 4. Nginx

Добавить проксирование для webhook-эндпоинтов (если не покрывается общим `/api/`):

```nginx
location /api/webhooks/ {
    proxy_pass http://127.0.0.1:4000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

## 5. PM2

Перезапустить после деплоя:

```bash
cd /root/agentcore-v3
git pull origin redesign/cto-style
cd apps/api && npx prisma generate && npx prisma db push
pm2 restart all
```
