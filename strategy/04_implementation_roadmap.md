# AgentCore v4 Implementation Roadmap

> **Version:** 1.0  
> **Date:** 2026-05-31  
> **Scope:** Transformation of AgentCore v3 to v4 (16 phases, 52 weeks)  
> **Team:** 2 senior backend engineers, 1 senior frontend engineer, 1 DevOps engineer, 1 QA engineer (from week 5)

---

## Table of Contents

1. [Phase 1: Foundation](#phase-1-foundation-weeks-1--2)
2. [Phase 2: Stabilization](#phase-2-stabilization-weeks-3--4)
3. [Phase 3: Data Layer Evolution](#phase-3-data-layer-evolution-weeks-5--6)
4. [Phase 4: Auth & Security Hardening](#phase-4-auth--security-hardening-weeks-7--8)
5. [Phase 5: AI Engine Improvements](#phase-5-ai-engine-improvements-weeks-9--10)
6. [Phase 6: Knowledge Base Intelligence](#phase-6-knowledge-base-intelligence-weeks-11--12)
7. [Phase 7: Channel Expansion](#phase-7-channel-expansion-weeks-13--14)
8. [Phase 8: Team Collaboration](#phase-8-team-collaboration-weeks-15--16)
9. [Phase 9: CRM & Automation](#phase-9-crm--automation-weeks-17--18)
10. [Phase 10: Analytics & Insights](#phase-10-analytics--insights-weeks-19--20)
11. [Phase 11: Billing Maturity](#phase-11-billing-maturity-weeks-21--22)
12. [Phase 12: No-Code Builder](#phase-12-no-code-builder-weeks-23--26)
13. [Phase 13: Enterprise Features](#phase-13-enterprise-features-weeks-27--30)
14. [Phase 14: Performance & Scale](#phase-14-performance--scale-weeks-31--34)
15. [Phase 15: DevOps & Reliability](#phase-15-devops--reliability-weeks-35--38)
16. [Phase 16: Platform & Ecosystem](#phase-16-platform--ecosystem-weeks-39--52)

---

## Execution Model

- **Sprint length:** 2 weeks
- **Daily standups:** 15 min
- **Sprint planning & retro:** Every sprint boundary
- **Weekly demos:** Friday afternoons for stakeholder feedback
- **Monthly security audits:** Third Friday of each month
- **Feature flags:** All major changes must be gated by LaunchDarkly / Unleash / in-house toggle system
- **Rollback plan:** Every phase defines explicit rollback steps and data compatibility constraints

---

## Velocity Assumptions

| Role | Count | Start Week | Notes |
|------|-------|------------|-------|
| Senior Backend Engineer | 2 | Week 1 | Node.js / TypeScript / Prisma |
| Senior Frontend Engineer | 1 | Week 1 | React / Next.js |
| DevOps Engineer | 1 | Week 1 | AWS / Docker / K8s |
| QA Engineer | 1 | Week 5 | Manual + automated testing |

---

## Risk Mitigation (Global)

- **Rollback plan:** Every phase has a documented rollback procedure and data compatibility constraints.
- **Feature flags:** All major changes must be gated by a feature toggle system (LaunchDarkly, Unleash, or in-house).
- **Parallel tracks:** Backend and frontend workstreams run in parallel where decoupling is possible.
- **Weekly demos:** Stakeholder demos every Friday to surface integration risks early.
- **Monthly security audits:** Third Friday of each month, rotating focus area.

---

## Phase 1: Foundation (Weeks 1–2)

**Theme:** Establish a clean, secure, and observable codebase for v4 development.

### Goals
- Complete audit (DONE)
- Modularize monolithic `server.js` (IN PROGRESS)
- Add Jest + Supertest test infrastructure (IN PROGRESS)
- Fix critical security issues (DONE)
- Add Prisma migrations workflow
- Docker Compose for local dev

### Milestones
- **M1.1:** Monolithic server fully decomposed into route modules, middleware modules, and service layer modules.
- **M1.2:** Jest test runner integrated with `npm test`, coverage reporting, and at least one example test per layer (unit, integration, e2e).
- **M1.3:** Prisma migration baseline established; `prisma migrate dev` runs cleanly from a fresh clone.
- **M1.4:** Docker Compose stack (`docker-compose.yml`) brings up API, PostgreSQL, and Redis with one command.
- **M1.5:** All critical security findings from audit remediated and verified.

### Deliverables
- `src/routes/`, `src/services/`, `src/middleware/` directories with clear ownership.
- `jest.config.js` and `tests/` directory structure.
- `prisma/migrations/` baseline migration.
- `docker-compose.yml` and `Dockerfile` optimized for local development.
- Security audit sign-off document.

### Acceptance Criteria
- [ ] `npm run test` passes in CI (or local simulated CI) with zero failures.
- [ ] `docker compose up` starts the full local stack in < 60 seconds.
- [ ] Code coverage baseline captured (target: any number > 0%; actual value recorded).
- [ ] All `TODO` and `FIXME` comments from modularization tracked in backlog, none remain in production paths.
- [ ] OWASP ZAP or similar scan shows zero critical/high issues.

### Rollback Plan
- Keep `server.js` in a `legacy/` folder for the duration of Phase 1 and 2.
- If route decomposition introduces regressions, revert to the legacy server behind a feature flag.

---

## Phase 2: Stabilization (Weeks 3–4)

**Theme:** Achieve production-grade reliability, observability, and automation before feature velocity increases.

### Goals
- Achieve 80% test coverage on API
- Add CI/CD pipeline (GitHub Actions)
- Add structured logging (Pino)
- Add health checks and metrics (Prometheus)
- Add backup automation
- Fix all PARTIAL/UNKNOWN audit findings

### Milestones
- **M2.1:** 80% API test coverage measured by Jest + Istanbul.
- **M2.2:** GitHub Actions workflow runs lint, test, build, and deploy to staging on every PR.
- **M2.3:** Pino logger replaces all `console.log` usage; logs are JSON-structured and include `trace_id`.
- **M2.4:** `/health` and `/metrics` endpoints expose liveness, readiness, and Prometheus-format metrics.
- **M2.5:** Automated nightly backups for PostgreSQL to S3-compatible storage with 7-day retention.
- **M2.6:** All PARTIAL and UNKNOWN audit findings converted to DONE or risk-accepted with justification.

### Deliverables
- `.github/workflows/ci.yml` with lint, test, build, and deploy jobs.
- `src/lib/logger.ts` (Pino wrapper) used across all services.
- `src/routes/health.ts` and `src/routes/metrics.ts`.
- Backup script and cron configuration (or AWS Backup plan).
- Updated audit tracker showing all findings resolved.

### Acceptance Criteria
- [ ] `npm run test:coverage` reports ≥ 80% lines covered for all files in `src/routes/` and `src/services/`.
- [ ] CI pipeline fails on lint errors, test failures, or coverage drop below baseline.
- [ ] Every API request logs `trace_id`, `method`, `path`, `status`, `duration_ms`, and `user_id` (if authenticated).
- [ ] `/health` returns 200 only when DB and Redis connections are alive; returns 503 otherwise.
- [ ] `/metrics` is scrapeable by Prometheus and includes `http_requests_total`, `http_request_duration_seconds`, and custom business metrics.
- [ ] Backup restore tested successfully to a temporary database at least once during the phase.
- [ ] Zero open PARTIAL or UNKNOWN audit items.

### Rollback Plan
- CI pipeline can be disabled via GitHub UI if it blocks hotfixes.
- Legacy logging module kept in `src/lib/logger-legacy.ts` for one sprint after Pino adoption.

---

## Phase 3: Data Layer Evolution (Weeks 5–6)

**Theme:** Build a robust, performant, and auditable data foundation for multi-tenant scale.

### Goals
- Expand Prisma schema (WorkspaceMember, Role, Permission, AuditLog)
- Add database indexes for performance
- Implement soft deletes
- Add data versioning for critical entities
- Set up database migration CI gate

### Milestones
- **M3.1:** Prisma schema includes `WorkspaceMember`, `Role`, `Permission`, `AuditLog`, and join tables.
- **M3.2:** Indexes added on all foreign keys, search fields, and timestamp columns used in filtering.
- **M3.3:** `deletedAt` column added to all tenant-scoped tables; queries filtered by `deletedAt: null` by default via middleware or Prisma extension.
- **M3.4:** Data versioning implemented for `Workspace`, `Agent`, and `Conversation` using a shadow/history table or temporal extension.
- **M3.5:** Migration CI gate blocks PR merge if `prisma migrate diff` reports uncommitted schema changes.

### Deliverables
- Updated `prisma/schema.prisma` with new models and indexes.
- `prisma/migrations/` folder with sequential, squashed migrations for the phase.
- `src/lib/prisma-soft-delete.ts` extension or middleware.
- Versioning trigger/extension or application-layer history writer.
- CI job that validates schema drift.

### Acceptance Criteria
- [ ] All new tables have appropriate foreign key constraints and `ON DELETE` rules.
- [ ] EXPLAIN ANALYZE on top 10 API queries shows index usage (no seq scans on large tables).
- [ ] Soft delete middleware prevents hard-deleted records from appearing in all standard queries without code changes in routes.
- [ ] Versioning captures before/after state for every UPDATE and DELETE on target tables.
- [ ] CI fails if a PR modifies `schema.prisma` without an accompanying migration file.
- [ ] Migration rollback tested on a copy of production schema; rollback completes in < 5 minutes.

### Rollback Plan
- Keep a pre-migration schema dump (`schema-v3.sql`) and data snapshot.
- If soft delete causes query regressions, disable middleware and revert to hard deletes temporarily.

---

## Phase 4: Auth & Security Hardening (Weeks 7–8)

**Theme:** Move from basic JWT to enterprise-grade authentication, authorization, and secrets management.

### Goals
- JWT refresh tokens
- Password reset flow (email)
- API key authentication for integrations
- RBAC implementation
- Rate limiting per workspace (not just global)
- Add helmet.js security headers
- Secrets management (HashiCorp Vault or AWS Secrets Manager)

### Milestones
- **M4.1:** Access token / refresh token pair issued on login; refresh endpoint rotates tokens securely.
- **M4.2:** Password reset flow: token emailed via SendGrid/AWS SES, single-use, 15-minute expiry.
- **M4.3:** Workspace-scoped API keys generated with prefix, hashed storage, and usage tracking.
- **M4.4:** RBAC middleware enforces `Permission` checks on all protected routes; roles editable by workspace admin.
- **M4.5:** Rate limiter keys requests by `workspaceId` + `userId` (or IP for unauthenticated), with configurable limits per plan.
- **M4.6:** `helmet` middleware applied with CSP, HSTS, and referrer-policy headers.
- **M4.7:** All secrets (DB URLs, API keys, JWT secret) moved to Vault or AWS Secrets Manager; app reads at startup.

### Deliverables
- `src/services/auth/token-service.ts` (access + refresh logic).
- `src/services/auth/password-reset-service.ts`.
- `src/routes/api-keys.ts` and `src/middleware/api-key-auth.ts`.
- `src/middleware/rbac.ts` with decorator/helper for route-level permission checks.
- `src/middleware/rate-limit.ts` updated for workspace-aware limits.
- `src/middleware/security.ts` (helmet configuration).
- Secrets integration module (`src/lib/secrets.ts`).

### Acceptance Criteria
- [ ] Access tokens expire in 15 minutes; refresh tokens expire in 7 days and are single-use.
- [ ] Password reset email arrives in < 60 seconds; link invalid after use or expiry.
- [ ] API key authenticates requests without session cookies and appears in audit logs.
- [ ] User with `read-only` role receives 403 on POST/PUT/DELETE attempts.
- [ ] Rate limit returns `429` with `Retry-After` header; limits are configurable per workspace in admin settings.
- [ ] Security headers scan (Mozilla Observatory or `curl -I`) scores A- or better.
- [ ] No plaintext secrets in `.env` files on production hosts; rotation procedure documented.

### Rollback Plan
- Legacy JWT-only auth remains available behind a feature flag for one phase.
- If Vault is unavailable, app falls back to environment variables with an alert.

---

## Phase 5: AI Engine Improvements (Weeks 9–10)

**Theme:** Make the AI engine reliable, observable, cost-aware, and experiment-friendly.

### Goals
- Streaming chat persistence to DB
- Conversation context window management
- AI cost tracking per message
- Model fallback chains (if primary fails, try backup)
- Prompt template system
- System prompt A/B testing framework

### Milestones
- **M5.1:** Every streamed chat chunk is persisted to `Message` table with `role`, `content`, `createdAt`, and `tokens_used`.
- **M5.2:** Context window manager truncates or summarizes history to fit model limits before each request.
- **M5.3:** Cost table tracks `input_tokens`, `output_tokens`, `model`, `cost_usd` per message.
- **M5.4:** Model fallback chain defined in config; primary failure automatically retries with secondary model.
- **M5.5:** Prompt template system supports variables, partials, and versioning.
- **M5.6:** A/B test framework can route 50% of conversations to prompt variant A and 50% to variant B; results tracked.

### Deliverables
- `src/services/ai/stream-persistence.ts`.
- `src/services/ai/context-manager.ts`.
- `src/services/ai/cost-tracker.ts`.
- `src/services/ai/model-router.ts`.
- `src/services/ai/prompt-template.ts`.
- `src/services/ai/ab-test.ts`.

### Acceptance Criteria
- [ ] Streaming messages are queryable in the DB within 500ms of stream completion.
- [ ] Context manager prevents `context_length_exceeded` errors in 99% of conversations under 50 turns.
- [ ] Cost tracker accuracy verified against OpenAI dashboard; discrepancy < 1%.
- [ ] Fallback chain triggers within 2 seconds of primary failure; user sees no error.
- [ ] Prompt templates are editable by non-engineers via a JSON/YAML config UI.
- [ ] A/B test framework tracks conversion/quality metric per variant with statistical significance calculation.

### Rollback Plan
- Disable streaming persistence if DB write latency impacts stream speed (fallback to async queue).
- Revert to single-model routing via feature flag.

---

## Phase 6: Knowledge Base Intelligence (Weeks 11–12)

**Theme:** Enable RAG-powered answers with vector search and source attribution.

### Goals
- Document chunking (semantic splitter)
- Embeddings generation (OpenAI text-embedding-3)
- Vector search with pgvector
- RAG pipeline integration into chat
- Knowledge source attribution (show which doc was used)

### Milestones
- **M6.1:** Document upload triggers async chunking service with semantic boundaries (paragraphs + overlap).
- **M6.2:** `Embedding` table stores `vector` (pgvector `vector(1536)`), `chunk_text`, `document_id`, `metadata`.
- **M6.3:** Vector search query (`<=>` cosine similarity) returns top-k chunks in < 200ms for 10k chunks.
- **M6.4:** RAG pipeline injects retrieved chunks into system prompt context before AI call.
- **M6.5:** Chat response includes `sources` array with `document_id`, `title`, `chunk_index`, and `relevance_score`.

### Deliverables
- `src/services/kb/chunker.ts`.
- `src/services/kb/embeddings.ts`.
- `src/services/kb/vector-search.ts`.
- `src/services/kb/rag-pipeline.ts`.
- `src/services/kb/attribution.ts`.

### Acceptance Criteria
- [ ] 100-page PDF chunked into semantically coherent pieces with < 20% boundary fragmentation (sample review).
- [ ] Embedding generation completes within 5 seconds per page of text.
- [ ] Vector search returns relevant chunks in top-3 for 90% of test queries (human-evaluated).
- [ ] RAG pipeline latency (search + AI call) < 5 seconds end-to-end for standard queries.
- [ ] Attribution JSON is exposed in API and rendered in UI as clickable source links.
- [ ] Fallback to keyword search if pgvector is unavailable (feature flag).

### Rollback Plan
- Disable RAG injection via feature flag; AI reverts to general knowledge responses.
- Keep pre-RAG chat path as default for one phase after launch.

---

## Phase 7: Channel Expansion (Weeks 13–14)

**Theme:** Unify customer conversations across messaging, email, and social platforms.

### Goals
- Telegram bot adapter
- WhatsApp Business API adapter
- Email channel (IMAP/SMTP)
- Slack app adapter
- Unified customer identity across channels

### Milestones
- **M7.1:** Telegram bot receives messages, routes to AgentCore conversation engine, and sends replies.
- **M7.2:** WhatsApp Business API adapter handles inbound/outbound messages via Meta API.
- **M7.3:** Email channel polls IMAP inbox and sends replies via SMTP; threads mapped to conversations.
- **M7.4:** Slack app adapter supports DMs and channel mentions, routing to the same conversation queue.
- **M7.5:** `CustomerIdentity` service deduplicates contacts across channels by phone/email/external ID.

### Deliverables
- `src/channels/telegram/adapter.ts`.
- `src/channels/whatsapp/adapter.ts`.
- `src/channels/email/adapter.ts`.
- `src/channels/slack/adapter.ts`.
- `src/services/customer/identity-unifier.ts`.

### Acceptance Criteria
- [ ] Each adapter passes a message round-trip test in isolated environment.
- [ ] Telegram adapter handles file/photo uploads as attachments.
- [ ] WhatsApp adapter supports text, quick replies, and template messages.
- [ ] Email adapter correctly threads replies using `In-Reply-To` / `References` headers.
- [ ] Slack adapter responds to `@AgentCore` mentions in channels and direct messages.
- [ ] Unified identity merges two channels for the same customer without data loss; merge history logged.
- [ ] All adapters include rate limit and retry logic; alert on 5 consecutive failures.

### Rollback Plan
- Adapters can be disabled per-workspace in settings.
- If identity merging causes duplication bugs, disable auto-merge and require manual linking.

---

## Phase 8: Team Collaboration (Weeks 15–16)

**Theme:** Transform AgentCore from a bot tool into a collaborative team inbox.

### Goals
- Team inbox UI
- Conversation assignment (auto + manual)
- Agent handoff (AI → human, human → AI)
- Internal notes on conversations
- Typing indicators and presence
- Real-time updates (WebSocket/SSE)

### Milestones
- **M8.1:** Team inbox UI lists conversations with filters (assigned to me, unassigned, resolved).
- **M8.2:** Auto-assignment rules (round-robin, load-balanced, skill-based); manual override available.
- **M8.3:** Handoff protocol: AI can escalate to human; human can return to AI with summary context.
- **M8.4:** Internal notes (`type: 'internal'`) visible only to team members, not sent to customer.
- **M8.5:** WebSocket or SSE broadcasts typing status, presence (online/away), and new messages.
- **M8.6:** Real-time updates reflect in UI within 1 second of server event.

### Deliverables
- Frontend: Team inbox page with assignment controls.
- `src/services/assignment/auto-assigner.ts`.
- `src/services/handoff/protocol.ts`.
- `src/services/notes/internal-notes.ts`.
- `src/services/realtime/websocket-server.ts` or SSE broadcaster.

### Acceptance Criteria
- [ ] Inbox loads 50 conversations in < 1 second; pagination supports 10k+ conversations.
- [ ] Auto-assignment distributes new conversations evenly across active agents.
- [ ] Handoff preserves full conversation context; AI summary visible to human agent on takeover.
- [ ] Internal notes are never rendered in customer-facing channels or API responses.
- [ ] Typing indicator shows within 2 seconds when agent begins typing.
- [ ] Real-time connection reconnects automatically on drop with exponential backoff.

### Rollback Plan
- If WebSocket load is too high, fall back to SSE or 5-second polling behind a feature flag.
- Handoff can be disabled per-workspace, keeping pure AI mode.

---

## Phase 9: CRM & Automation (Weeks 17–18)

**Theme:** Embed lightweight CRM and workflow automation into the conversation lifecycle.

### Goals
- Advanced CRM (pipelines, stages, tasks)
- Automation rules (if-then workflows)
- Contact enrichment (Clearbit/similar)
- Lead scoring
- CSV/Excel import/export

### Milestones
- **M9.1:** CRM module supports customizable pipelines, stages, and task assignments per contact/deal.
- **M9.2:** Automation engine evaluates event-driven rules (e.g., "if tag = 'pricing', then assign to sales and create task").
- **M9.3:** Contact enrichment fetches public data (company, title, social) from Clearbit or similar API.
- **M9.4:** Lead scoring algorithm combines engagement, enrichment, and AI sentiment into a 0-100 score.
- **M9.5:** Contacts and deals can be exported to CSV/Excel and imported with validation and error reporting.

### Deliverables
- `src/services/crm/pipeline.ts`, `stage.ts`, `task.ts`.
- `src/services/automation/engine.ts` and `rule-definition.ts`.
- `src/services/enrichment/clearbit-client.ts`.
- `src/services/scoring/lead-scorer.ts`.
- `src/services/import-export/csv-handler.ts`, `excel-handler.ts`.

### Acceptance Criteria
- [ ] Pipeline UI supports drag-and-drop stage transitions with audit trail.
- [ ] Automation rules execute within 5 seconds of trigger event; failures are retried once and logged.
- [ ] Enrichment data populates within 10 seconds for 80% of business email domains.
- [ ] Lead score updates automatically on new conversation, email open, or stage change.
- [ ] Import of 1,000 contacts completes in < 30 seconds with a detailed error report for invalid rows.
- [ ] Export respects workspace data scope and GDPR filters.

### Rollback Plan
- Automation engine can be paused globally or per-workspace.
- Enrichment cache retained for 30 days; if API fails, serve cached or empty data.

---

## Phase 10: Analytics & Insights (Weeks 19–20)

**Theme:** Turn conversation and operational data into actionable intelligence.

### Goals
- Event streaming pipeline
- Real-time dashboard with charts
- Conversation quality scoring
- Agent performance comparison
- Customer satisfaction analytics
- Cost analytics per workspace

### Milestones
- **M10.1:** Event streaming pipeline captures all significant actions (message sent, handoff, resolution, error) to Kafka or event bus.
- **M10.2:** Dashboard displays real-time charts: conversations/hour, resolution time, active agents.
- **M10.3:** Conversation quality score derived from sentiment, response time, and customer feedback.
- **M10.4:** Agent performance table compares humans and AI bots on first-response time, resolution rate, and CSAT.
- **M10.5:** CSAT trends, NPS correlation, and feedback word clouds surfaced.
- **M10.6:** Cost analytics shows AI spend, infrastructure cost, and revenue per workspace.

### Deliverables
- `src/services/analytics/event-stream.ts`.
- Frontend: Analytics dashboard with chart library (e.g., Recharts, Chart.js).
- `src/services/analytics/quality-scorer.ts`.
- `src/services/analytics/agent-performance.ts`.
- `src/services/analytics/cost-analytics.ts`.

### Acceptance Criteria
- [ ] Events are emitted within 100ms of action completion; pipeline latency < 1 second to analytics store.
- [ ] Dashboard loads in < 2 seconds with default 7-day view.
- [ ] Quality score recalculates nightly and on-demand for any conversation.
- [ ] Agent performance comparison supports filtering by time range, channel, and workspace.
- [ ] CSAT survey sent after conversation resolution; response rate tracked.
- [ ] Cost analytics accuracy verified against cloud billing; discrepancy < 5%.

### Rollback Plan
- If event pipeline fails, write events to a fallback table for later replay.
- Dashboard can be disabled per-workspace for performance or privacy reasons.

---

## Phase 11: Billing Maturity (Weeks 21–22)

**Theme:** Build a reliable, transparent, and fraud-resistant billing system.

### Goals
- Real usage metering
- Quota enforcement (soft + hard limits)
- Plan management UI
- Automated invoicing
- YooKassa webhook reliability
- Stripe integration (alternative)
- Overcharge protection

### Milestones
- **M11.1:** Usage meter tracks messages, AI tokens, storage, and team seats per workspace daily.
- **M11.2:** Soft limits trigger warnings; hard limits block further usage with a paywall/upgrade prompt.
- **M11.3:** Plan configuration UI allows creating and editing tiers, prices, and included quotas.
- **M11.4:** Invoices generated automatically at billing cycle end with line-item detail.
- **M11.5:** YooKassa webhooks are idempotent, retried, and reconciled against internal ledger.
- **M11.6:** Stripe integration offers an alternative payment method with the same plan/usage model.
- **M11.7:** Overcharge protection caps monthly spend at 2x plan price unless explicitly authorized.

### Deliverables
- `src/services/billing/meter.ts`.
- `src/services/billing/quota-enforcer.ts`.
- Frontend: Plan management admin page.
- `src/services/billing/invoicing.ts`.
- `src/services/billing/yookassa-webhook.ts`.
- `src/services/billing/stripe-webhook.ts`.
- `src/services/billing/overcharge-guard.ts`.

### Acceptance Criteria
- [ ] Usage meter accuracy verified: discrepancy with actual API calls < 0.1%.
- [ ] Soft limit email sent at 80% usage; hard limit blocks new AI requests at 100%.
- [ ] Invoice PDF generated and emailed within 1 hour of cycle close.
- [ ] YooKassa webhook handler is idempotent; duplicate notifications do not double-charge.
- [ ] Stripe checkout session creates customer and subscription correctly.
- [ ] Overcharge guard triggers at 2x plan price and requires admin override to continue.

### Rollback Plan
- Disable auto-invoicing and revert to manual billing if automation errors occur.
- Both YooKassa and Stripe can be toggled per region via feature flag.

---

## Phase 12: No-Code Builder (Weeks 23–26)

**Theme:** Empower non-technical users to design conversation flows visually.

### Goals
- Visual conversation flow editor
- Node-based builder (React Flow)
- Pre-built templates
- Conditional logic nodes
- Integration nodes (webhook, CRM action)
- Preview and test mode

### Milestones
- **M12.1:** Canvas-based editor with drag-and-drop nodes (start, message, input, condition, action, end).
- **M12.2:** React Flow integration with custom node types and edge validation.
- **M12.3:** Template gallery with 10+ pre-built flows (support, lead capture, survey, onboarding).
- **M12.4:** Conditional logic nodes evaluate variables, user properties, and conversation context.
- **M12.5:** Integration nodes call webhooks, create CRM deals, or send emails without code.
- **M12.6:** Preview mode simulates conversation; test mode runs against staging AI with debug output.

### Deliverables
- Frontend: No-code builder page (`/builder`).
- `src/services/flow/engine.ts` (runtime interpreter for saved flows).
- `src/services/flow/template-library.ts`.
- `src/services/flow/condition-evaluator.ts`.
- `src/services/flow/integration-executor.ts`.
- `src/services/flow/preview-simulator.ts`.

### Acceptance Criteria
- [ ] Builder supports 50+ nodes per flow without performance degradation.
- [ ] Invalid connections (e.g., no path from start) are highlighted with error tooltips.
- [ ] Templates load in < 2 seconds and are customizable after import.
- [ ] Condition nodes support `equals`, `contains`, `greater_than`, `exists`, and regex operators.
- [ ] Integration nodes timeout after 10 seconds and surface error messages in the flow.
- [ ] Preview mode shows message history, current node, and variable state in a debug sidebar.

### Rollback Plan
- Builder saves flows as JSON; if engine breaks, revert to previous flow version.
- Classic AI-only mode remains available for workspaces not using builder flows.

---

## Phase 13: Enterprise Features (Weeks 27–30)

**Theme:** Meet enterprise security, compliance, and customization requirements.

### Goals
- SAML 2.0 SSO
- SCIM provisioning
- Audit log UI
- Data export (GDPR)
- Custom data retention policies
- White-label customization

### Milestones
- **M13.1:** SAML 2.0 SSO supports Okta, Azure AD, and Google Workspace as IdPs.
- **M13.2:** SCIM 2.0 endpoint allows IdP to provision/deprovision users and groups automatically.
- **M13.3:** Audit log UI searchable by user, action, date, and workspace with CSV export.
- **M13.4:** GDPR data export generates a ZIP of all personal data within 30 seconds.
- **M13.5:** Retention policies configurable per workspace (e.g., delete messages after 90 days, anonymize after 365).
- **M13.6:** White-label settings: custom domain, logo, colors, email sender, and branded PDF invoices.

### Deliverables
- `src/services/auth/saml.ts`.
- `src/services/scim/server.ts`.
- Frontend: Audit log viewer page.
- `src/services/gdpr/data-export.ts`.
- `src/services/retention/policy-engine.ts`.
- Frontend: White-label settings page.

### Acceptance Criteria
- [ ] SAML login flow completes in < 5 seconds from IdP redirect.
- [ ] SCIM user created in AgentCore within 1 second of IdP provisioning.
- [ ] Audit log retains 2 years of events; search returns results in < 2 seconds for 1M events.
- [ ] GDPR export includes all messages, contacts, attachments, and billing records for the requesting user.
- [ ] Retention policy executes nightly; deleted data is unrecoverable (or anonymized as configured).
- [ ] White-label changes reflect in customer-facing chat widget, emails, and invoices within 5 minutes.

### Rollback Plan
- SAML can be disabled per-workspace; local auth remains as fallback.
- Retention policy execution can be paused globally if data loss risk is detected.

---

## Phase 14: Performance & Scale (Weeks 31–34)

**Theme:** Prepare the platform for high-volume, low-latency operation at scale.

### Goals
- Redis caching layer
- Background job queue (BullMQ)
- CDN for static assets
- Database read replicas
- API response caching
- Connection pooling optimization

### Milestones
- **M14.1:** Redis caches frequently accessed data (workspaces, plans, sessions) with TTL and invalidation.
- **M14.2:** BullMQ queues handle embeddings, exports, reports, and webhooks with retry and dead-letter.
- **M14.3:** Static assets served via CDN with cache-busting filenames.
- **M14.4:** Read replicas handle analytics and export queries; writes go to primary.
- **M14.5:** API response caching (ETag, Cache-Control) for public and semi-static endpoints.
- **M14.6:** Connection pool tuned for Node.js event loop; no pool exhaustion under load test.

### Deliverables
- `src/lib/redis-cache.ts`.
- `src/lib/queue.ts` (BullMQ wrapper).
- CDN configuration and asset pipeline update.
- Prisma read replica datasource configuration.
- `src/middleware/api-cache.ts`.
- Database connection pool tuning documentation.

### Acceptance Criteria
- [ ] Cache hit ratio > 80% for workspace and plan lookups under normal load.
- [ ] Background job success rate > 99.5%; failed jobs visible in monitoring UI.
- [ ] Static asset load time < 100ms from global CDN edge.
- [ ] Read replica lag < 1 second; analytics queries do not impact write latency.
- [ ] API cache reduces average response time by 30% for cached endpoints.
- [ ] Load test (k6) with 1,000 concurrent users shows p95 latency < 500ms and zero 5xx errors.

### Rollback Plan
- Cache can be bypassed via feature flag or HTTP header (`X-Cache-Bypass`).
- If read replica lag exceeds 5 seconds, redirect reads to primary temporarily.

---

## Phase 15: DevOps & Reliability (Weeks 35–38)

**Theme:** Achieve carrier-grade deployment practices and disaster recovery confidence.

### Goals
- Kubernetes migration
- Blue-green deployments
- Automated rollback
- Chaos engineering tests
- SLA monitoring and alerting
- Disaster recovery drills

### Milestones
- **M15.1:** Production workload migrated to Kubernetes with Helm charts and namespace isolation.
- **M15.2:** Blue-green deployment switches traffic only after health checks pass; zero-downtime releases.
- **M15.3:** Automated rollback triggers if error rate exceeds threshold for 2 minutes post-deployment.
- **M15.4:** Chaos engineering suite randomly kills pods, degrades DB, and delays network; system recovers.
- **M15.5:** SLA dashboard tracks availability, latency, and error rate per service with PagerDuty/Opsgenie alerts.
- **M15.6:** Quarterly disaster recovery drill: restore from backup to alternate region in < 1 hour with < 5 minutes data loss.

### Deliverables
- Helm charts (`helm/` directory).
- Blue-green deployment scripts or Argo Rollouts configuration.
- `src/lib/auto-rollback.ts` or CI/CD pipeline hook.
- Chaos tests (Litmus, Gremlin, or custom scripts).
- SLA monitoring stack (Prometheus + Grafana + Alertmanager).
- DR runbook and quarterly drill report template.

### Acceptance Criteria
- [ ] Kubernetes manifests pass `helm lint` and `kubeval` validation.
- [ ] Blue-green deployment completes in < 5 minutes with no user-facing errors.
- [ ] Rollback decision made automatically within 2 minutes of anomaly detection.
- [ ] Chaos test suite runs weekly in staging; all SEV-1 scenarios have documented recovery steps.
- [ ] Alert fires within 30 seconds of SLA breach (p99 latency > 1s or error rate > 0.1%).
- [ ] DR drill documented with RTO (Recovery Time Objective) and RPO (Recovery Point Objective) met.

### Rollback Plan
- VMs or previous ECS setup kept warm for one month after K8s migration.
- If auto-rollback misfires, manual approval gate can be re-enabled.

---

## Phase 16: Platform & Ecosystem (Weeks 39–52)

**Theme:** Open AgentCore to developers, partners, and the broader market.

### Goals
- Public API v2 (OpenAPI spec)
- Webhook marketplace
- Integration SDK
- Partner portal
- App marketplace
- Documentation portal
- Community forum

### Milestones
- **M16.1:** Public API v2 documented with OpenAPI 3.1, code-generated clients for Node, Python, and Go.
- **M16.2:** Webhook marketplace lists pre-built integrations (Zapier, Make, n8n, Salesforce) with one-click install.
- **M16.3:** Integration SDK (Node.js package) simplifies building custom channels and actions.
- **M16.4:** Partner portal tracks referrals, revenue share, and customer lifecycle.
- **M16.5:** App marketplace allows third-party developers to publish extensions; review and approval workflow.
- **M16.6:** Documentation portal hosts guides, API reference, and searchable knowledge base.
- **M16.7:** Community forum (Discourse or similar) supports feature requests, Q&A, and show-and-tell.

### Deliverables
- `openapi/v2.yml` and generated SDKs.
- `src/services/marketplace/webhook-store.ts`.
- NPM package `@agentcore/sdk`.
- Frontend: Partner portal (`/partners`).
- Frontend: App marketplace (`/apps`).
- Documentation site (Docusaurus, Mintlify, or custom).
- Community forum instance.

### Acceptance Criteria
- [ ] OpenAPI spec passes validation and generates working client code.
- [ ] Webhook marketplace integrations install in < 3 clicks and authenticate via OAuth.
- [ ] SDK supports creating a custom channel with < 50 lines of code and includes TypeScript types.
- [ ] Partner portal calculates revenue share accurately and pays out monthly.
- [ ] Marketplace apps are sandboxed; they cannot access data outside the installing workspace.
- [ ] Documentation portal covers 100% of public API endpoints and top 20 user workflows.
- [ ] Community forum has moderation tools, spam filtering, and single sign-on with AgentCore auth.

### Rollback Plan
- Public API v2 can be rate-limited or disabled if abuse detected.
- Marketplace apps can be suspended per-app or globally by admin.

---

## Cross-Phase Dependencies

```
Phase 1 ──► Phase 2 ──► Phase 3 ──► Phase 4 ──► Phase 5 ──► Phase 6
   │           │           │           │           │           │
   └───────────┴───────────┴───────────┴───────────┴───────────┘
                              (sequential backbone)

Phase 7 ──► Phase 8 ──► Phase 9 ──► Phase 10
   │           │           │           │
   └───────────┴───────────┴───────────┘
          (frontend-heavy; parallel with backbone after Phase 6)

Phase 11 ──► Phase 12 ──► Phase 13
    │            │            │
    └────────────┴────────────┘
          (billing and enterprise; parallel from Phase 8 onwards)

Phase 14, 15, 16: Infrastructure and ecosystem layers that can run
                  in parallel with feature work from Phase 10 onward,
                  resourced by the DevOps engineer and backend team.
```

---

## Budget & Resource Allocation (Indicative)

| Phase | Backend | Frontend | DevOps | QA | Duration |
|-------|---------|----------|--------|----|----------|
| 1-2   | 100%    | 50%      | 75%    | —  | 4 weeks  |
| 3-6   | 100%    | 75%      | 50%    | 100% | 8 weeks |
| 7-10  | 75%     | 100%     | 25%    | 100% | 8 weeks |
| 11-13 | 75%     | 100%     | 25%    | 100% | 8 weeks |
| 14-15 | 50%     | 25%      | 100%   | 50%  | 8 weeks |
| 16    | 50%     | 75%      | 50%    | 75%  | 14 weeks |

> Percentages represent approximate time allocation per role during the phase.

---

## Success Metrics (v4 Launch)

| Metric | Target | Measurement |
|--------|--------|-------------|
| API Uptime | 99.95% | Prometheus over 30 days |
| API Test Coverage | ≥ 80% | Jest Istanbul report |
| AI Response Time (p95) | < 3s | APM instrumentation |
| RAG Accuracy (top-3) | ≥ 90% | Human evaluation sample |
| Billing Accuracy | 99.9% | Reconciliation vs. payment provider |
| Security Audit | Zero critical/high | Monthly OWASP ZAP scan |
| Feature Flag Coverage | 100% major changes | LaunchDarkly audit |
| CSAT Score | ≥ 4.2 / 5 | Post-conversation survey |

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-05-31 | Engineering | Initial 16-phase roadmap |

---

*This roadmap is a living document. Phase boundaries, resource allocation, and priorities should be reviewed at the end of every sprint.*
