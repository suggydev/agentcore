# AGENTS.md — Инструкция для AI-агентов, работающих над AgentCore

> **ОБЯЗАТЕЛЬНО К ПРОЧТЕНИЮ** перед началом любой работы над проектом.

## 1. Проект

**AgentCore v3** — no-code платформа для создания AI-агентов малым и средним бизнесом.
Сайт: https://agentcore.work | API: https://api.agentcore.work

## 2. Рабочий процесс (ОБЯЗАТЕЛЬНЫЙ ПОРЯДОК)

### Перед началом работы
1. `git pull` — получить последнюю версию
2. Прочитать AGENTS.md (этот файл)
3. Понять, какой департамент отвечает за задачу (см. раздел 5)

### Во время работы
1. **НИКОГДА не писать заглушки** (`// TODO`, `// ...`, `// implement later`). Каждая строка — продакшен-код.
2. **Каждая функция — с обработкой ошибок**. try/catch, проверка null/undefined, валидация входа.
3. **Типизация — строгая**. Никаких `any`, `unknown` только с `instanceof` проверкой.
4. **Комментарии — только WHY, не WHAT**. Объясняй почему сделан выбор, а не что делает код.
5. **Файл не длиннее 500 строк**. Если больше — разбей на модули.

### После завершения
1. `npm run build` в `apps/web` — убедиться что TypeScript компилируется
2. Проверить что сервер стартует: `node apps/api/server.js`
3. Сделать commit с осмысленным сообщением на русском
4. **`git push` — ОБЯЗАТЕЛЬНО**

## 3. Git-правила

```bash
# Коммиты на русском, в формате:
# [Dept N] Краткое описание изменения

git add -A
git commit -m "[Dept 4] Фикс streaming-ответов в chat.js — сохранение в БД"
git push origin main
```

**Перед push всегда:**
- `git pull --rebase` чтобы не было конфликтов
- Проверить что билд проходит локально

## 4. Структура проекта

```
agentcore-v3/
├── apps/
│   ├── api/                  # Express.js API (порт 4000)
│   │   ├── server.js         # Точка входа
│   │   ├── config/           # Конфигурация (Zod-валидация .env)
│   │   ├── routes/           # Роуты API
│   │   ├── services/         # Suggy AI, YooKassa
│   │   ├── middleware/       # Auth, rate-limit, error handler
│   │   └── utils/            # Утилиты
│   └── web/                  # Next.js 14 фронтенд (порт 3000)
│       └── src/
│           ├── app/          # App Router страницы
│           ├── components/   # React-компоненты
│           ├── store/        # Zustand state management
│           └── data/         # Конфигурации, i18n, шаблоны
├── packages/
│   └── prisma/               # Схема БД (PostgreSQL)
├── nginx/                    # Конфигурация Nginx
├── docker-compose.yml        # PostgreSQL
└── ecosystem.config.js       # PM2 конфигурация
```

## 5. Департаменты и зоны ответственности

| Dept | Название | Файлы |
|------|----------|-------|
| 1 | Core Architecture | `server.js`, `config/`, `ecosystem.config.js` |
| 2 | Frontend UI/UX | `apps/web/src/app/`, `apps/web/src/components/` |
| 3 | State Management | `apps/web/src/store/`, Zustand stores |
| 4 | Backend API | `apps/api/routes/`, `apps/api/middleware/` |
| 5 | Database | `packages/prisma/schema.prisma`, `prisma-client.js` |
| 6 | Security | `middleware/auth.js`, `helmet`, CORS, rate-limit |
| 7 | Performance | `next.config.js`, bundle size, lazy loading |
| 8 | QA/Testing | `apps/api/tests/`, сборка, краш-тесты |
| 9 | DevOps/Infra | `nginx/`, `docker-compose.yml`, PM2, деплой |
| 10 | Council | Финальный аудит, разрешение конфликтов |

## 6. Технический стек

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS + Framer Motion + Zustand + ReactFlow
- **Backend**: Express.js + Prisma ORM + Zod + JWT + bcryptjs
- **AI**: Suggy API (прокси к Fireworks/OpenRouter)
- **База**: PostgreSQL 16
- **Платежи**: YooKassa
- **Деплой**: Ubuntu 24.04 + Nginx + PM2 + Let's Encrypt

## 7. E2E Testing

- **Command**: `cd apps/web && npx playwright test --project=chromium`
- **Config**: `apps/web/playwright.config.ts` (workers: 5, auth state: `playwright/.auth/user.json`)
- **Current Status**: 151 passed, 45 skipped, 0 failed (June 10, 2026)
- **Skipped**: 45 tests (11 backend-only API/webhook/security/infra tests; 34 needs-backend tests for chat/knowledge/dialogs/channels)
- **Key**: `workers: 5` prevents timeouts (10 workers caused 14 failures due to overload)
- **Test user**: `test-e2e-new@agentcore.work` (trial plan, 1 workspace)
- **Auth**: Shared via `tests/e2e/global-setup.ts` with 1-hour expiry
- **Rate limit**: Auth limiter allows 100 req/15min for test users (email contains 'test' + 'agentcore.work')

## 8. Контакты

- GitHub: https://github.com/ayvabrat/agentcore.git
- Сервер: 31.76.102.116 (root)
- Домен: agentcore.work
