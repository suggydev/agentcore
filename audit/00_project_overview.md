# AgentCore v3 — Project Overview

## Executive Summary

AgentCore v3 — AI-агентная платформа для бизнеса. Позволяет создавать ИИ-сотрудников (агентов), которые работают через WhatsApp, Telegram, Instagram, веб-чат, обрабатывают заказы, консультируют клиентов и интегрируются с CRM.

Проект представляет собой full-stack монорепо (Turborepo) с Express.js API бэкендом и Next.js 14 фронтендом.

---

## Stack

| Layer | Technology |
|---|---|
| **Runtime** | Node.js (backend), Next.js 14 (frontend) |
| **Language** | JavaScript (API), TypeScript (Frontend), Python (deploy scripts) |
| **Framework (FE)** | Next.js 14 (App Router), React 18 |
| **Framework (BE)** | Express.js |
| **ORM** | Prisma (PostgreSQL) |
| **Database** | PostgreSQL 16 (Docker) |
| **Auth** | JWT (jsonwebtoken + bcryptjs) |
| **Validation** | Zod |
| **State (FE)** | Zustand (persist middleware) |
| **Styling** | Tailwind CSS |
| **Animation** | Framer Motion, GSAP, Lenis |
| **Payment** | YooKassa (Russian processor), Stripe (in dependencies, not wired) |
| **LLM API** | Suggy API (`api.suggy.lol`) |
| **Package Manager** | npm (workspaces via Turborepo) |
| **Process Manager** | PM2 (production) |
| **Container** | Docker Compose (PostgreSQL) |
| **Deploy** | paramiko (SSH/SFTP Python scripts) |

---

## Project Structure

```
AgentCore/
├── package.json              # Root: Turborepo workspace
├── deploy.py                 # Full deploy (tarball → SSH → restart)
├── quick_deploy.py           # API-only deploy + background web build
├── tg_devops_bot.py           # Telegram DevOps bot
├── PROJECT_AUDIT.md           # Prior audit (160 components)
├── README.md                  # Project documentation
└── agentcore-v3/
    ├── docker-compose.yml     # PostgreSQL 16 container
    ├── ecosystem.config.js    # PM2 config (API:4000, Web:3000)
    ├── deploy_all.py          # Full deploy with e2e tests
    ├── ASSUMPTIONS.md         # Business/security assumptions
    ├── docs/
    │   └── yookassa-readiness-checklist.md
    ├── packages/
    │   └── prisma/
    │       └── schema.prisma  # 8 models (Workspace, User, Agent, Conversation, Message, CRMContact, KnowledgeDocument, BillingTransaction)
    ├── apps/
        ├── api/
        │   ├── server.js      # MAIN: 949 lines, ~25 endpoints
        │   ├── services/
        │   │   └── yookassa.js # YooKassa payment wrapper (6 functions)
        │   ├── package.json
        │   └── .env / .env.example
        └── web/
            ├── next.config.js
            ├── tailwind.config.js
            ├── tsconfig.json
            ├── src/
            │   ├── app/
            │   │   ├── layout.tsx      # Root layout (Inter, Manrope, Onest, Unbounded fonts)
            │   │   ├── page.tsx         # Landing page (composes sections)
            │   │   ├── globals.css      # 503 lines: design system, animations
            │   │   ├── sections/         # 11 landing section components
            │   │   ├── dashboard/        # 15 dashboard pages
            │   │   ├── login/page.tsx
            │   │   ├── onboarding/page.tsx
            │   │   ├── chat/page.tsx
            │   │   ├── agents/page.tsx
            │   │   └── [legal pages]    # contacts, delivery, refund, requisites, terms, privacy
            │   ├── components/           # 14 shared components
            │   ├── data/                 # 4 data/config files
            │   └── store/
            │       └── agentStore.ts     # Zustand store (onboarding state)
            ├── public/
            └── deploy.py
```

---

## Entry Points

1. **API**: `apps/api/server.js` → Express on port 4000
2. **Web**: `apps/web` → Next.js 14 on port 3000
3. **CLI/DevOps**: `tg_devops_bot.py` → Telegram bot
4. **Deploy**: `deploy.py`, `quick_deploy.py`, `deploy_all.py`, `apps/web/deploy.py`

---

## Commands

| Command | Location | Description |
|---|---|---|
| `npm run dev` | Root | Turborepo dev (API + Web) |
| `npm run build` | Root | Build all packages |
| `npm run lint` | Root | Lint all packages |
| `npm run start` | `apps/api` | Start Express in production |
| `npm run dev` | `apps/api` | Start API with nodemon |
| `npm run dev` | `apps/web` | Next.js dev server |
| `npm run build` | `apps/web` | Next.js production build |
| `npx prisma generate` | `apps/api` | Generate Prisma client |
| `npx prisma db push` | `apps/api` | Push schema to DB |

---

## Environment Variables Required

### API (`.env`)
- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET` — JWT signing key
- `SUGGY_PROJECT_KEY` — LLM API key
- `YOOKASSA_SHOP_ID` / `YOOKASSA_SECRET_KEY` — Payment (optional)
- `STRIPE_SECRET_KEY` — (in dependencies, not wired)
- `PORT` — default 4000

### Web (`.env`)
- `NEXT_PUBLIC_API_URL` — API base URL

### Deploy Scripts (`.env`)
- `SERVER_PASS` — SSH password
- `BOT_TOKEN` — Telegram bot token
- `ALLOWED_USERS` — Telegram user IDs

---

## What can be verified locally?

| Item | Status |
|---|---|
| Static code analysis | YES — all source files readable |
| Type checking (Web) | YES — `tsc --noEmit` |
| Linting | PARTIAL — no lint config visible |
| Unit tests | NO — zero test files found |
| Integration tests | NO — no test infrastructure |
| E2E tests | NO — deploy_all.py tests server remotely |
| API database connectivity | NO — PostgreSQL not running locally |
| API Suggy calls | NO — requires Suggy API key + network |
| Frontend build | PARTIAL — `npm run build` possible |
| Docker compose | PARTIAL — requires Docker |
| Deploy scripts | NO — requires remote server + server SSH |

---

## Risks Identified

1. **Hardcoded API key** in `server.js:14` (Suggy key as fallback)
2. **No authentication on webchat endpoint** (`/api/channels/webchat/message`)
3. **Hardcoded JWT secret** in `server.js:13` (fallback)
4. **No rate limiting** on auth endpoints (rate-limit in deps but not used)
5. **No input sanitization** beyond Zod schema validation
6. **No CSRF protection**
7. **Zero automated tests**
8. **cors({ origin: '*' })** on all routes
9. **Password plaintext in env** (deployment scripts use ephemeral connections)
10. **Database: db push --accept-data-loss** used in deploys (can drop data)
11. **Subscription/billing: Stripe in deps but not integrated**
12. **userId column in Conversation marked @deprecated** — dead column
13. **No pagination** on list endpoints (GET /api/agents, /api/conversations, etc.)
14. **Empty directories** (hooks/, api/auth/) suggest unimplemented features
15. **System prompt injection risk** — user-controllable systemPrompt passed directly to LLM

---

## File Count Summary

| Category | Files |
|---|---|
| API source | 2 files (server.js, yookassa.js) |
| Frontend pages | 27 files |
| Frontend sections | 11 files |
| Frontend components | 14 files |
| Frontend data | 4 files |
| Frontend store | 1 file |
| Config/Infra | 8 files |
| Deploy scripts | 5 files (Python) |
| Documentation | 5 files |
| Prisma schema | 1 file |
| **Total** | ~77 source files |
