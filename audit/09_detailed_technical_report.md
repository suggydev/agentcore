# Detailed Technical Report — AgentCore v3

[Full technical details from the audit. Reference the other reports for specifics.]

## Architecture

- **Backend**: Express.js (Node.js) — single server.js file (now 1052 lines)
- **Frontend**: Next.js 14 App Router — 55 TSX files
- **Database**: PostgreSQL via Prisma ORM — 8 models
- **External APIs**: Suggy (LLM), YooKassa (payment, not configured)
- **Deploy**: SSH/SFTP via Python paramiko scripts

## Endpoint Inventory: 29 total

| Group | Count | Auth | Rate Limit |
|-------|-------|------|------------|
| Auth | 3 | 1 public | Yes (authLimiter) |
| AI/Chat | 3 | All authenticated | Yes (aiLimiter) |
| Agents CRUD | 4 | All authenticated | Yes (generalLimiter) |
| Conversations | 3 | All authenticated | Yes (generalLimiter) |
| WebChat | 1 | API key | Yes (aiLimiter) |
| Billing | 3 | All authenticated | No |
| Workspace | 1 | Authenticated | No |
| CRM | 2 | Authenticated | Yes (generalLimiter) |
| Knowledge | 2 | Authenticated | Yes (generalLimiter) |
| Analytics | 1 | Authenticated | Yes (generalLimiter) |
| Health | 1 | Public | No |

## Security Posture (Improved)

| Area | Before | After |
|------|--------|-------|
| Secrets management | Hardcoded fallbacks | Env-only, startup crash if missing |
| Webchat auth | None (public) | API key required |
| Rate limiting | None | 3 tiers (10/min auth, 20/min AI, 100/min general) |
| CORS | Wildcard (*) | Configurable allowlist |
| Input validation | Zod on some, {...req.body} on others | Zod on ALL POST/PUT |
| Mass assignment | 3 vulnerable endpoints | 0 — all validated |
| JWT | Hardcoded fallback secret | Env-only |
| Request tracking | None | x-request-id header |
| Error responses | Generic 500 | ErrorId for debugging |

## Database Schema: 8 models

| Model | Fields | Indexes | Issues |
|-------|--------|---------|--------|
| Workspace | 10 | PK only | subscriptionEndsAt deprecated |
| User | 8 | email unique | RBAC not implemented |
| Agent | 10 | workspaceId | isActive field unused |
| Conversation | 8 | workspaceId, agentId | userId deprecated |
| Message | 7 | conversationId | - |
| CRMContact | 7 | workspaceId | - |
| KnowledgeDocument | 6 | workspaceId | type url/file never used |
| BillingTransaction | 7 | workspaceId | status flow not implemented |

## Frontend Component Inventory: 55 files

| Category | Count | Tests | Issues |
|----------|-------|-------|--------|
| Landing sections | 11 | 0 | Heavy animation deps (GSAP + Framer Motion) |
| Dashboard pages | 15 | 0 | Large DashboardLayout (470 lines) |
| Other pages | 12 | 0 | All static/placeholder content |
| Shared components | 14 | 0 | Good quality, well-structured |
| Data/Config | 4 | 0 | Static data, well-typed |
| Store | 1 | 0 | Zustand with persist |
