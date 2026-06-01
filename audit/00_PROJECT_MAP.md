# AgentCore v3 — Project Map

> Comprehensive structural overview, entry points, external integrations, environment variable inventory, and known architectural weak spots.
> Generated: 2026-05-31

---

## 1. Applications

| Application | Technology | Port | Location |
|-------------|-----------|------|----------|
| **API** | Express.js | `4000` | `apps/api/` |
| **Web** | Next.js 14 (App Router) | `3000` | `apps/web/` |
| **Prisma Schema** | Prisma ORM | — | `packages/prisma/` |

### 1.1 API (`apps/api/`)
- **Entry Point**: `server.js` (1053 lines) — monolithic Express server
- **Database Client**: Prisma (`packages/prisma`)
- **External APIs**: Suggy LLM API, YooKassa payments, Telegram Bot

### 1.2 Web (`apps/web/`)
- **Framework**: Next.js 14 with App Router (`src/app/`)
- **Styling**: Tailwind CSS (`tailwind.config.js`, `postcss.config.js`)
- **Configuration**: `next.config.js`

### 1.3 Prisma (`packages/prisma/`)
- **Schema**: `packages/prisma/schema.prisma`
- Defines database models for PostgreSQL 16

---

## 2. Entry Points

### Runtime Entry Points

| File | Purpose | Notes |
|------|---------|-------|
| `apps/api/server.js` | Express API server | **1053 lines**, monolithic, main backend |
| `apps/web/src/app/layout.tsx` | Next.js root layout | Global providers, metadata, fonts |
| `apps/web/src/app/page.tsx` | Landing page | Public marketing/homepage |
| `apps/web/src/app/dashboard/page.tsx` | Dashboard | Authenticated user dashboard |
| `apps/web/src/app/login/page.tsx` | Authentication | Login/signup flows |
| `apps/web/src/app/onboarding/page.tsx` | User onboarding | First-time setup wizard |
| `apps/web/src/app/chat/page.tsx` | Chat interface | LLM chat interaction UI |

### Infrastructure & Deployment Entry Points

| File | Purpose | Location |
|------|---------|----------|
| `ecosystem.config.js` | PM2 process manager configuration | Project root |
| `docker-compose.yml` | PostgreSQL 16 container orchestration | Project root |
| `deploy.py` | SSH-based deployment script | Project root |
| `quick_deploy.py` | API-only fast deploy | Project root |
| `deploy_all.py` | Full deploy + E2E validation | Project root |
| `tg_devops_bot.py` | Telegram DevOps management bot | Project root |

---

## 3. External Integrations

### 3.1 Suggy API (`api.suggy.lol/v1`)
- **Usage**: LLM model listing, chat completions, streaming responses, image generation
- **Base URL**: Configurable via `SUGGY_BASE_URL` (default: `https://api.suggy.lol/v1`)
- **Authentication**: `SUGGY_PROJECT_KEY` (required)
- **Endpoints used**: Models, chat completions (streaming and non-streaming)

### 3.2 YooKassa
- **Usage**: Payment processing
- **Features**: Payment creation, refunds, payment capture
- **Credentials**: `YOOKASSA_SHOP_ID`, `YOOKASSA_SECRET_KEY`, `YOOKASSA_WEBHOOK_SECRET`

### 3.3 Telegram Bot
- **Usage**: DevOps management, deployment triggers, server status
- **Entry Point**: `tg_devops_bot.py`
- **Authentication**: `BOT_TOKEN`, `ALLOWED_USERS`

### 3.4 PostgreSQL 16
- **Usage**: Primary persistent database
- **Connection**: Via `DATABASE_URL`
- **ORM**: Prisma (`packages/prisma/schema.prisma`)
- **Container**: Defined in `docker-compose.yml`

---

## 4. ENV Variables — Used vs Declared

### 4.1 API Environment Variables (`apps/api/.env` / `.env.example`)

| Variable | Required | Fallback | Status |
|----------|----------|----------|--------|
| `DATABASE_URL` | ✅ Yes | — | Active |
| `JWT_SECRET` | ✅ Yes | — | Active, no fallback |
| `SUGGY_PROJECT_KEY` | ✅ Yes | — | Active, no fallback |
| `PORT` | No | `4000` | Active |
| `SUGGY_BASE_URL` | No | `https://api.suggy.lol/v1` | Active |
| `MODEL_CACHE_TTL` | No | `60000` | Active |
| `CORS_ORIGINS` | No | `localhost:3000` | Active |
| `WEBCHAT_API_KEY` | No | — | Optional |
| `YOOKASSA_SHOP_ID` | No | — | Optional |
| `YOOKASSA_SECRET_KEY` | No | — | Optional |
| `YOOKASSA_WEBHOOK_SECRET` | No | — | Optional |
| `STRIPE_SECRET_KEY` | — | — | **Declared but unused in code** |
| `STRIPE_WEBHOOK_SECRET` | — | — | **Declared but unused in code** |
| `REDIS_URL` | — | — | **Declared but unused in code** |

### 4.2 Web Environment Variables (`apps/web/.env` / `.env.example`)

| Variable | Required | Fallback | Status |
|----------|----------|----------|--------|
| `NEXT_PUBLIC_API_URL` | ✅ Yes | — | Active |
| `NEXT_PUBLIC_APP_URL` | No | — | Optional |

### 4.3 Deploy Scripts Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `SERVER_PASS` | ✅ Yes | SSH deployment authentication |
| `BOT_TOKEN` | Yes (for bot) | Telegram bot authentication |
| `ALLOWED_USERS` | Yes (for bot) | Telegram bot access control |

---

## 5. Known Weak Spots

> Factual audit findings. Each item is traceable to specific files or architectural decisions.

### 5.1 Testing & Quality
- **0 automated tests** — No unit tests, integration tests, or E2E tests exist anywhere in the project.

### 5.2 Architecture
- **Monolithic `server.js`** — `apps/api/server.js` is 1053 lines of monolithic Express code. No route separation, no service layer abstraction.
- **No CI/CD pipeline** — Deployment is entirely manual via `deploy.py`, `quick_deploy.py`, and `deploy_all.py`.

### 5.3 Observability
- **No structured logging** — JSON logs have been introduced but remain basic. No centralized logging, no log correlation IDs, no log levels configuration.
- **No monitoring/alerting** — No health check endpoints, no metrics, no APM.

### 5.4 Data & Persistence
- **No DB migration discipline** — Prisma migrations are not enforced; schema changes may be applied ad-hoc.
- **No backup strategy** — PostgreSQL has no automated backup or point-in-time recovery configured.
- **Streaming chat doesn't persist to DB** — Chat completions via streaming are not stored persistently.

### 5.5 Security & Access Control
- **RBAC is placeholder only** — Role-based access control exists in schema/concepts but is not enforced in API routes.

### 5.6 Unused Infrastructure
- **Stripe unused** — `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` are present in `.env` but no Stripe integration code exists.
- **Redis unused** — `REDIS_URL` is present in `.env` but no Redis client code exists (caching, sessions, queues all missing).

### 5.7 Missing Systems
- **No knowledge base intelligence** — No document chunking, no embeddings, no vector search.
- **No email system** — No transactional email provider (Resend, SendGrid, AWS SES) configured.
- **No queue system** — No background job processing (Bull, RabbitMQ, SQS).
- **No background jobs** — Async work (emails, reports, exports) runs inline or not at all.
- **No webhook reliability layer** — YooKassa webhooks are consumed but without idempotency, retries, or delivery verification.

---

## File Reference Quick Map

```
AgentCore/
├── agentcore-v3/
│   ├── apps/
│   │   ├── api/
│   │   │   ├── server.js              (1053 lines — main API)
│   │   │   ├── .env                   (API env vars)
│   │   │   └── .env.example
│   │   └── web/
│   │       ├── src/
│   │       │   └── app/
│   │       │       ├── layout.tsx     (root layout)
│   │       │       ├── page.tsx       (landing)
│   │       │       ├── login/
│   │       │       │   └── page.tsx   (auth)
│   │       │       ├── onboarding/
│   │       │       │   └── page.tsx   (onboarding)
│   │       │       ├── chat/
│   │       │       │   └── page.tsx   (chat)
│   │       │       └── dashboard/
│   │       │           └── page.tsx   (dashboard)
│   │       ├── .env                   (Web env vars)
│   │       ├── .env.example
│   │       ├── next.config.js
│   │       ├── tailwind.config.js
│   │       └── postcss.config.js
│   ├── packages/
│   │   └── prisma/
│   │       └── schema.prisma          (DB schema)
│   ├── ecosystem.config.js            (PM2 config)
│   └── docker-compose.yml             (PostgreSQL 16)
├── deploy.py                          (SSH deploy)
├── quick_deploy.py                    (API-only deploy)
├── deploy_all.py                      (full deploy + E2E)
└── tg_devops_bot.py                   (Telegram DevOps bot)
```
