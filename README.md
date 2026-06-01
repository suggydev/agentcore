# AgentCore v3 — No-Code AI Agent Platform

> Создайте AI-агента для бизнеса за 60 секунд. Без программистов.

**[agentcore.work](https://agentcore.work)** — платформа для малого и среднего бизнеса. Создавайте цифровых сотрудников для продаж, поддержки, консультаций и автоматизации процессов.

---

## Стек

| Слой | Технологии |
|------|-----------|
| **Frontend** | Next.js 14 (App Router), TypeScript, Tailwind CSS, Framer Motion, Zustand, ReactFlow |
| **Backend** | Express.js, Prisma ORM, Zod, JWT, bcryptjs |
| **AI** | Suggy API (Fireworks/OpenRouter прокси) — 9+ моделей |
| **Database** | PostgreSQL 16 |
| **Billing** | YooKassa |
| **DevOps** | Nginx, PM2, Let's Encrypt, systemd |

## Архитектура

```
agentcore-v3/
├── apps/
│   ├── api/                    # Express API (:4000)
│   │   ├── server.js           # Точка входа
│   │   ├── config/index.js     # Zod-валидация окружения
│   │   ├── routes/             # 28+ эндпоинтов
│   │   │   ├── auth.js         # Регистрация, вход, JWT
│   │   │   ├── agents.js       # CRUD агентов
│   │   │   ├── chat.js         # Chat completions + streaming
│   │   │   ├── conversations.js # Диалоги с knowledge base
│   │   │   ├── billing.js      # План, триал, YooKassa
│   │   │   ├── crm.js          # CRM контакты
│   │   │   ├── knowledge.js    # База знаний
│   │   │   ├── analytics.js    # Статистика
│   │   │   ├── webchat.js      # WebChat виджет
│   │   │   ├── workspace.js    # Настройки workspace
│   │   │   └── health.js       # Health check
│   │   ├── services/
│   │   │   ├── suggy.js        # AI-модели, авто-роутинг
│   │   │   └── yookassa.js     # Платёжная интеграция
│   │   └── middleware/
│   │       ├── auth.js         # JWT + trial check + webchat
│   │       ├── rateLimit.js    # Rate limiting
│   │       └── errorHandler.js # Глобальный обработчик ошибок
│   └── web/                    # Next.js 14 (:3000)
│       └── src/
│           ├── app/            # 30 страниц (App Router)
│           │   ├── dashboard/  # Панель управления
│           │   ├── login/      # Вход / Регистрация
│           │   ├── onboarding/ # Настройка workspace
│           │   ├── chat/       # Чат с агентом
│           │   └── sections/   # Лендинг
│           ├── components/     # React-компоненты
│           ├── data/           # i18n, конфиги, шаблоны
│           └── store/          # Zustand state
├── packages/
│   └── prisma/
│       └── schema.prisma       # 8 моделей БД
├── nginx/
│   └── agentcore.work.conf     # Nginx + SSL
├── docker-compose.yml          # PostgreSQL
└── ecosystem.config.js         # PM2
```

## Быстрый старт

```bash
# Локально
cd agentcore-v3

# База данных
docker-compose up -d postgres

# API
cd apps/api
npm install
npx prisma generate
npm start          # http://localhost:4000

# Frontend
cd apps/web
npm install
npm run dev        # http://localhost:3000
```

## API Endpoints

| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/api/auth/register` | Регистрация |
| POST | `/api/auth/login` | Вход |
| GET | `/api/auth/me` | Профиль |
| GET | `/api/agents` | Список агентов |
| POST | `/api/agents` | Создать агента |
| GET | `/api/agents/:id` | Детали агента |
| PUT | `/api/agents/:id` | Обновить агента |
| DELETE | `/api/agents/:id` | Удалить агента |
| POST | `/api/v1/chat/completions` | AI-ответ (stream/non-stream) |
| POST | `/api/v1/chat/images/generations` | Генерация изображений |
| GET | `/api/v1/models` | Список AI-моделей |
| GET | `/api/conversations` | Список диалогов |
| POST | `/api/conversations` | Создать диалог |
| GET | `/api/conversations/:id` | История диалога |
| POST | `/api/conversations/:id/messages` | Отправить сообщение |
| GET | `/api/crm` | CRM-контакты |
| POST | `/api/crm` | Создать контакт |
| GET | `/api/knowledge` | База знаний |
| POST | `/api/knowledge` | Добавить документ |
| GET | `/api/billing/plan` | Тариф |
| GET | `/api/billing/trial-status` | Статус триала |
| GET | `/api/billing/suggy-balance` | Баланс |
| POST | `/api/billing/top-up` | Пополнение (YooKassa) |
| GET | `/api/analytics` | Статистика |
| PUT | `/api/workspace` | Настройки |
| GET | `/api/health` | Health check |

## Переменные окружения

```env
# apps/api/.env
DATABASE_URL=postgresql://agentcore:password@localhost:5432/agentcore
JWT_SECRET=your-32-char-secret
SUGGY_PROJECT_KEY=sk_proj_...
PORT=4000
NODE_ENV=production
CORS_ORIGINS=https://agentcore.work,http://localhost:3000
CLIENT_URL=https://agentcore.work
TRIAL_CREDIT_AMOUNT=10
TRIAL_DAYS=14
YOOKASSA_SHOP_ID=
YOOKASSA_SECRET_KEY=
```

```env
# apps/web/.env
NEXT_PUBLIC_API_URL=https://api.agentcore.work
NEXT_PUBLIC_APP_URL=https://agentcore.work
```

## Деплой

```bash
# Продакшен (Ubuntu 24.04)
cd agentcore-v3
docker-compose up -d postgres

# API
cd apps/api
npm install && npx prisma generate && npm start

# Web
cd apps/web
npm install && npm run build
pm2 start node_modules/.bin/next --name agentcore-web -- start -p 3000

# Nginx + SSL
sudo cp nginx/agentcore.work.conf /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/agentcore.work /etc/nginx/sites-enabled/
sudo certbot --nginx -d agentcore.work -d api.agentcore.work
```

## Команда

Разработка: [ayvabrat](https://github.com/ayvabrat)  
AI-агенты: 10 департаментов × 105 специализированных агентов

## Лицензия

MIT © AgentCore
