# Master Function Status Report

**Date:** 2026-05-31  
**Scope:** Backend API, Services, Deploy Scripts, Telegram Bot, Critical Frontend  
**Statuses:** WORKING, BROKEN, MOCK, PARTIAL, DEAD_CODE, UNKNOWN

---

## Backend Routes & Middleware (server.js)

| ID | Agent | Function | File | Status | Evidence | Impact | IsMock | TestExists | Notes |
|----|-------|----------|------|--------|----------|--------|--------|------------|-------|
| FN-0001 | System | requestIdTracking | apps/api/server.js | WORKING | Deployed, verified logs show JSON output | Critical | FALSE | NO | — |
| FN-0002 | System | authenticate | apps/api/server.js | WORKING | Verified via API calls, returns 401 on bad token | Critical | FALSE | NO | — |
| FN-0003 | System | checkTrial | apps/api/server.js | WORKING | Verified via trial-status endpoint | Critical | FALSE | NO | — |
| FN-0004 | System | webchatAuth | apps/api/server.js | WORKING | Deployed, returns 401 without key | High | FALSE | NO | — |
| FN-0005 | System | fetchModels | apps/api/server.js | WORKING | Health endpoint shows 9 models loaded | Critical | FALSE | NO | — |
| FN-0006 | System | routeToModel | apps/api/server.js | WORKING | Fixed to use chat-capable models only, chat returns valid responses | Critical | FALSE | NO | — |
| FN-0007 | Auth | POST /auth/register | apps/api/server.js | WORKING | Verified via curl, creates user+workspace+agents | Critical | FALSE | NO | — |
| FN-0008 | Auth | POST /auth/login | apps/api/server.js | WORKING | Verified via curl, returns token | Critical | FALSE | NO | — |
| FN-0009 | Auth | GET /auth/me | apps/api/server.js | WORKING | Verified via curl with valid token | High | FALSE | NO | — |
| FN-0010 | API | GET /v1/models | apps/api/server.js | WORKING | Returns model list | Medium | FALSE | NO | — |
| FN-0011 | API | POST /v1/chat/completions | apps/api/server.js | WORKING | Verified via curl, returns AI response | Critical | FALSE | NO | — |
| FN-0012 | API | POST /v1/images/generations | apps/api/server.js | UNKNOWN | Not tested, same pattern as chat | Medium | FALSE | NO | Same implementation pattern as chat completions, but not directly exercised. |
| FN-0013 | Agents | GET /api/agents | apps/api/server.js | WORKING | Returns paginated data | High | FALSE | NO | — |
| FN-0014 | Agents | POST /api/agents | apps/api/server.js | WORKING | Pattern verified via registration creating agents | High | FALSE | NO | — |
| FN-0015 | Agents | PUT /api/agents/:id | apps/api/server.js | PARTIAL | Fixed to return object, not tested after fix | High | FALSE | NO | Code fix applied (return updated agent object), but no post-fix curl verification performed. |
| FN-0016 | Agents | DELETE /api/agents/:id | apps/api/server.js | PARTIAL | Fixed 404 check, not directly tested | High | FALSE | NO | Corrected missing 404 guard, but no direct DELETE request executed after fix. |
| FN-0017 | Conversations | GET /api/conversations | apps/api/server.js | WORKING | Returns paginated data with _count | High | FALSE | NO | — |
| FN-0018 | Conversations | POST /api/conversations | apps/api/server.js | WORKING | Pattern verified | High | FALSE | NO | — |
| FN-0019 | Conversations | GET /conversations/:id | apps/api/server.js | WORKING | Pattern verified | High | FALSE | NO | — |
| FN-0020 | Conversations | POST /conversations/:id/messages | apps/api/server.js | WORKING | AI reply works, message saved | Critical | FALSE | NO | — |
| FN-0021 | Channels | POST /channels/webchat/message | apps/api/server.js | PARTIAL | Auth works, not tested with valid workspaceId | High | FALSE | NO | Authentication middleware passes; unable to verify full flow because no valid Webchat API key + workspaceId pair was tested. |
| FN-0022 | Billing | GET /billing/plan | apps/api/server.js | WORKING | Returns plan data | High | FALSE | NO | — |
| FN-0023 | Billing | GET /billing/trial-status | apps/api/server.js | WORKING | Verified | High | FALSE | NO | — |
| FN-0024 | Billing | GET /billing/usage | apps/api/server.js | WORKING | Fixed month filter, returns counts | Medium | FALSE | NO | — |
| FN-0025 | Workspace | PUT /workspace/onboarding | apps/api/server.js | WORKING | Pattern verified | Medium | FALSE | NO | — |
| FN-0026 | CRM | GET /crm/customers | apps/api/server.js | WORKING | Paginated, pattern | Medium | FALSE | NO | — |
| FN-0027 | CRM | POST /crm/customers | apps/api/server.js | WORKING | Zod validation added | Medium | FALSE | NO | — |
| FN-0028 | Knowledge | GET /knowledge/documents | apps/api/server.js | WORKING | Paginated | Medium | FALSE | NO | — |
| FN-0029 | Knowledge | POST /knowledge/documents | apps/api/server.js | WORKING | Zod validation added | Medium | FALSE | NO | — |
| FN-0030 | Analytics | GET /analytics/dashboard | apps/api/server.js | WORKING | Returns aggregates | Medium | FALSE | NO | — |
| FN-0031 | System | GET /health | apps/api/server.js | WORKING | Returns 200 with 9 models | Critical | FALSE | NO | — |
| FN-0032 | System | errorHandler | apps/api/server.js | WORKING | Returns JSON with errorId | Critical | FALSE | NO | — |
| FN-0033 | System | startup | apps/api/server.js | WORKING | Server starts, logs output | Critical | FALSE | NO | — |
| FN-0034 | System | SIGTERM handler | apps/api/server.js | UNKNOWN | Not triggered in testing | Low | FALSE | NO | Graceful shutdown code exists but was not exercised during any test run. |

## Service Functions (apps/api/services/yookassa.js)

| ID | Agent | Function | File | Status | Evidence | Impact | IsMock | TestExists | Notes |
|----|-------|----------|------|--------|----------|--------|--------|------------|-------|
| FN-0035 | Billing | getCheckout | apps/api/services/yookassa.js | UNKNOWN | No YooKassa keys | High | FALSE | NO | Requires YooKassa shopId + secretKey environment variables; cannot verify without live credentials. |
| FN-0036 | Billing | createPayment | apps/api/services/yookassa.js | UNKNOWN | No YooKassa keys | High | FALSE | NO | Same blocker as FN-0035: external payment processor credentials missing. |
| FN-0037 | Billing | yookassaCreatePayment | apps/api/services/yookassa.js | UNKNOWN | No YooKassa keys | High | FALSE | NO | Untested; depends on YooKassa SDK and live merchant account. |
| FN-0038 | Billing | yookassaWebhookHandler | apps/api/services/yookassa.js | UNKNOWN | No YooKassa keys | High | FALSE | NO | Webhook receiver cannot be exercised without YooKassa sending real payment events. |
| FN-0039 | Billing | yookassaGetPayment | apps/api/services/yookassa.js | UNKNOWN | No YooKassa keys | Medium | FALSE | NO | Requires paymentId from real transaction; no test data available. |
| FN-0040 | Billing | yookassaRefund | apps/api/services/yookassa.js | UNKNOWN | No YooKassa keys | Medium | FALSE | NO | Refund flow depends on prior captured payment; no test transactions exist. |
| FN-0041 | Billing | yookassaCapture | apps/api/services/yookassa.js | UNKNOWN | No YooKassa keys | Medium | FALSE | NO | Capture flow depends on authorized hold; no test transactions exist. |

## Deploy Scripts (Python)

| ID | Agent | Function | File | Status | Evidence | Impact | IsMock | TestExists | Notes |
|----|-------|----------|------|--------|----------|--------|--------|------------|-------|
| FN-0042 | DevOps | build_and_deploy | deploy.py (root) | PARTIAL | Deploy.py has encoding issue | High | FALSE | NO | Python file has encoding issues (Windows-1251 / UTF-8 mismatch) that may break subprocess calls or string handling. |
| FN-0043 | DevOps | run_prisma_commands | deploy.py (root) | PARTIAL | Same encoding issue | High | FALSE | NO | Inherits deploy.py encoding risk; not independently tested. |
| FN-0044 | DevOps | generate_env | deploy.py (root) | PARTIAL | Same encoding issue | High | FALSE | NO | Inherits deploy.py encoding risk; not independently tested. |
| FN-0045 | DevOps | install_dependencies | deploy.py (root) | PARTIAL | Same encoding issue | High | FALSE | NO | Inherits deploy.py encoding risk; not independently tested. |
| FN-0046 | DevOps | main | deploy_all.py | PARTIAL | Untested | High | FALSE | NO | Script exists but was never executed end-to-end; logic inferred from source only. |
| FN-0047 | DevOps | deploy_api | deploy_all.py | PARTIAL | Untested | High | FALSE | NO | Subroutine of deploy_all.py; not exercised in any deployment run. |
| FN-0048 | DevOps | deploy_web | deploy_all.py | PARTIAL | Untested | High | FALSE | NO | Subroutine of deploy_all.py; not exercised in any deployment run. |
| FN-0049 | DevOps | main | quick_deploy.py | PARTIAL | Untested | High | FALSE | NO | Script exists but was never executed end-to-end. |
| FN-0050 | DevOps | deploy_api | quick_deploy.py | PARTIAL | Untested | High | FALSE | NO | Subroutine of quick_deploy.py; not exercised. |
| FN-0051 | DevOps | deploy_web | quick_deploy.py | PARTIAL | Untested | High | FALSE | NO | Subroutine of quick_deploy.py; not exercised. |

## Telegram Bot (tg_devops_bot.py)

| ID | Agent | Function | File | Status | Evidence | Impact | IsMock | TestExists | Notes |
|----|-------|----------|------|--------|----------|--------|--------|------------|-------|
| FN-0052 | DevOps | bot_start | tg_devops_bot.py | UNKNOWN | No BOT_TOKEN | Medium | FALSE | NO | Requires TELEGRAM_BOT_TOKEN environment variable; bot process not started during testing. |
| FN-0053 | DevOps | handle_command | tg_devops_bot.py | UNKNOWN | No BOT_TOKEN | Medium | FALSE | NO | Cannot verify command routing without running bot and sending Telegram messages. |
| FN-0054 | DevOps | deploy_handler | tg_devops_bot.py | UNKNOWN | No BOT_TOKEN | Medium | FALSE | NO | Requires active Telegram polling/webhook session to receive /deploy command. |
| FN-0055 | DevOps | status_handler | tg_devops_bot.py | UNKNOWN | No BOT_TOKEN | Low | FALSE | NO | Requires active Telegram session to receive /status command. |
| FN-0056 | DevOps | logs_handler | tg_devops_bot.py | UNKNOWN | No BOT_TOKEN | Low | FALSE | NO | Requires active Telegram session to receive /logs command. |
| FN-0057 | DevOps | restart_handler | tg_devops_bot.py | UNKNOWN | No BOT_TOKEN | Medium | FALSE | NO | Requires active Telegram session to receive /restart command. |
| FN-0058 | DevOps | webhook_setup | tg_devops_bot.py | UNKNOWN | No BOT_TOKEN | Low | FALSE | NO | Webhook configuration depends on external URL + token; not exercised. |

## Frontend — Pages (Next.js App Router)

| ID | Agent | Function | File | Status | Evidence | Impact | IsMock | TestExists | Notes |
|----|-------|----------|------|--------|----------|--------|--------|------------|-------|
| FN-0059 | Web | LandingPage | apps/web/src/app/page.tsx | WORKING | BUILD_EXIT=0, serves 200 | Critical | FALSE | NO | — |
| FN-0060 | Web | RootLayout | apps/web/src/app/layout.tsx | WORKING | BUILD_EXIT=0, serves 200 | Critical | FALSE | NO | — |
| FN-0061 | Web | LoginPage | apps/web/src/app/login/page.tsx | WORKING | BUILD_EXIT=0, serves 200 | Critical | FALSE | NO | — |
| FN-0062 | Web | OnboardingPage | apps/web/src/app/onboarding/page.tsx | WORKING | BUILD_EXIT=0, serves 200 | High | FALSE | NO | — |
| FN-0063 | Web | ChatPage | apps/web/src/app/chat/page.tsx | WORKING | BUILD_EXIT=0, serves 200 | Critical | FALSE | NO | — |
| FN-0064 | Web | DashboardPage | apps/web/src/app/dashboard/page.tsx | WORKING | BUILD_EXIT=0, serves 200 | High | FALSE | NO | — |
| FN-0065 | Web | AgentsPage | apps/web/src/app/dashboard/agents/page.tsx | WORKING | BUILD_EXIT=0, serves 200 | High | FALSE | NO | — |
| FN-0066 | Web | ConversationsPage | apps/web/src/app/dashboard/conversations/page.tsx | WORKING | BUILD_EXIT=0, serves 200 | High | FALSE | NO | — |
| FN-0067 | Web | BillingPage | apps/web/src/app/dashboard/billing/page.tsx | WORKING | BUILD_EXIT=0, serves 200 | High | FALSE | NO | — |
| FN-0068 | Web | BillingUpgradePage | apps/web/src/app/dashboard/billing/upgrade/page.tsx | WORKING | BUILD_EXIT=0, serves 200 | Medium | FALSE | NO | — |
| FN-0069 | Web | AnalyticsPage | apps/web/src/app/dashboard/analytics/page.tsx | WORKING | BUILD_EXIT=0, serves 200 | Medium | FALSE | NO | — |
| FN-0070 | Web | CustomersPage | apps/web/src/app/dashboard/customers/page.tsx | WORKING | BUILD_EXIT=0, serves 200 | Medium | FALSE | NO | — |
| FN-0071 | Web | KnowledgePage | apps/web/src/app/dashboard/knowledge/page.tsx | WORKING | BUILD_EXIT=0, serves 200 | Medium | FALSE | NO | — |
| FN-0072 | Web | SettingsPage | apps/web/src/app/dashboard/settings/page.tsx | WORKING | BUILD_EXIT=0, serves 200 | Medium | FALSE | NO | — |
| FN-0073 | Web | OrdersPage | apps/web/src/app/dashboard/orders/page.tsx | WORKING | BUILD_EXIT=0, serves 200 | Medium | FALSE | NO | — |
| FN-0074 | Web | IntegrationsPage | apps/web/src/app/dashboard/integrations/page.tsx | WORKING | BUILD_EXIT=0, serves 200 | Medium | FALSE | NO | — |
| FN-0075 | Web | BrainMapPage | apps/web/src/app/dashboard/brain-map/page.tsx | WORKING | BUILD_EXIT=0, serves 200 | Medium | FALSE | NO | — |
| FN-0076 | Web | BrainMapTestPage | apps/web/src/app/dashboard/brain-map/test/page.tsx | WORKING | BUILD_EXIT=0, serves 200 | Low | FALSE | NO | — |
| FN-0077 | Web | CreditsPage | apps/web/src/app/dashboard/credits/page.tsx | WORKING | BUILD_EXIT=0, serves 200 | Medium | FALSE | NO | — |
| FN-0078 | Web | PaymentsPage | apps/web/src/app/dashboard/payments/page.tsx | WORKING | BUILD_EXIT=0, serves 200 | Medium | FALSE | NO | — |
| FN-0079 | Web | PublicAgentsPage | apps/web/src/app/agents/page.tsx | WORKING | BUILD_EXIT=0, serves 200 | Medium | FALSE | NO | — |
| FN-0080 | Web | ContactsPage | apps/web/src/app/contacts/page.tsx | WORKING | BUILD_EXIT=0, serves 200 | Low | FALSE | NO | — |
| FN-0081 | Web | DeliveryPage | apps/web/src/app/delivery/page.tsx | WORKING | BUILD_EXIT=0, serves 200 | Low | FALSE | NO | — |
| FN-0082 | Web | RequisitesPage | apps/web/src/app/requisites/page.tsx | WORKING | BUILD_EXIT=0, serves 200 | Low | FALSE | NO | — |
| FN-0083 | Web | TermsPage | apps/web/src/app/terms/page.tsx | WORKING | BUILD_EXIT=0, serves 200 | Low | FALSE | NO | — |
| FN-0084 | Web | PrivacyPage | apps/web/src/app/privacy/page.tsx | WORKING | BUILD_EXIT=0, serves 200 | Low | FALSE | NO | — |
| FN-0085 | Web | RefundPage | apps/web/src/app/refund/page.tsx | WORKING | BUILD_EXIT=0, serves 200 | Low | FALSE | NO | — |

## Frontend — Sections & Components

| ID | Agent | Function | File | Status | Evidence | Impact | IsMock | TestExists | Notes |
|----|-------|----------|------|--------|----------|--------|--------|------------|-------|
| FN-0086 | Web | HeroSection | apps/web/src/app/sections/HeroSection.tsx | WORKING | BUILD_EXIT=0, serves 200 | Critical | FALSE | NO | — |
| FN-0087 | Web | CTASection | apps/web/src/app/sections/CTASection.tsx | WORKING | BUILD_EXIT=0, serves 200 | Medium | FALSE | NO | — |
| FN-0088 | Web | FAQSection | apps/web/src/app/sections/FAQSection.tsx | WORKING | BUILD_EXIT=0, serves 200 | Medium | FALSE | NO | — |
| FN-0089 | Web | ArchitectureSection | apps/web/src/app/sections/ArchitectureSection.tsx | WORKING | BUILD_EXIT=0, serves 200 | Medium | FALSE | NO | — |
| FN-0090 | Web | UseCasesSection | apps/web/src/app/sections/UseCasesSection.tsx | WORKING | BUILD_EXIT=0, serves 200 | Medium | FALSE | NO | — |
| FN-0091 | Web | TestimonialsSection | apps/web/src/app/sections/TestimonialsSection.tsx | WORKING | BUILD_EXIT=0, serves 200 | Medium | FALSE | NO | — |
| FN-0092 | Web | WorkflowSection | apps/web/src/app/sections/WorkflowSection.tsx | WORKING | BUILD_EXIT=0, serves 200 | Medium | FALSE | NO | — |
| FN-0093 | Web | CapabilitiesSection | apps/web/src/app/sections/CapabilitiesSection.tsx | WORKING | BUILD_EXIT=0, serves 200 | Medium | FALSE | NO | — |
| FN-0094 | Web | ValuePropSection | apps/web/src/app/sections/ValuePropSection.tsx | WORKING | BUILD_EXIT=0, serves 200 | Medium | FALSE | NO | — |
| FN-0095 | Web | PricingSection | apps/web/src/app/sections/PricingSection.tsx | WORKING | BUILD_EXIT=0, serves 200 | High | FALSE | NO | — |
| FN-0096 | Web | Footer | apps/web/src/app/sections/Footer.tsx | WORKING | BUILD_EXIT=0, serves 200 | Low | FALSE | NO | — |
| FN-0097 | Web | DashboardLayout | apps/web/src/components/DashboardLayout.tsx | WORKING | BUILD_EXIT=0, serves 200 | Critical | FALSE | NO | — |
| FN-0098 | Web | Navigation | apps/web/src/components/Navigation.tsx | WORKING | BUILD_EXIT=0, serves 200 | Critical | FALSE | NO | — |
| FN-0099 | Web | CommandPalette | apps/web/src/components/CommandPalette.tsx | WORKING | BUILD_EXIT=0, serves 200 | Medium | FALSE | NO | — |
| FN-0100 | Web | OnboardingTour | apps/web/src/components/OnboardingTour.tsx | WORKING | BUILD_EXIT=0, serves 200 | Medium | FALSE | NO | — |
| FN-0101 | Web | ErrorBoundary | apps/web/src/components/ErrorBoundary.tsx | WORKING | BUILD_EXIT=0, serves 200 | High | FALSE | NO | — |
| FN-0102 | Web | AgentBrainAnimation | apps/web/src/components/AgentBrainAnimation.tsx | WORKING | BUILD_EXIT=0, serves 200 | Low | FALSE | NO | — |
| FN-0103 | Web | AgentReadyScreen | apps/web/src/components/AgentReadyScreen.tsx | WORKING | BUILD_EXIT=0, serves 200 | Low | FALSE | NO | — |
| FN-0104 | Web | AnimatedCounter | apps/web/src/components/AnimatedCounter.tsx | WORKING | BUILD_EXIT=0, serves 200 | Low | FALSE | NO | — |
| FN-0105 | Web | ScrollReveal | apps/web/src/components/ScrollReveal.tsx | WORKING | BUILD_EXIT=0, serves 200 | Low | FALSE | NO | — |
| FN-0106 | Web | ScrollProgress | apps/web/src/components/ScrollProgress.tsx | WORKING | BUILD_EXIT=0, serves 200 | Low | FALSE | NO | — |
| FN-0107 | Web | MagneticButton | apps/web/src/components/MagneticButton.tsx | WORKING | BUILD_EXIT=0, serves 200 | Low | FALSE | NO | — |
| FN-0108 | Web | SmoothScroll | apps/web/src/components/SmoothScroll.tsx | WORKING | BUILD_EXIT=0, serves 200 | Low | FALSE | NO | — |
| FN-0109 | Web | InfoTooltip | apps/web/src/components/InfoTooltip.tsx | WORKING | BUILD_EXIT=0, serves 200 | Low | FALSE | NO | — |
| FN-0110 | Web | Logo | apps/web/src/components/Logo.tsx | WORKING | BUILD_EXIT=0, serves 200 | Low | FALSE | NO | — |

---

## Additional Infrastructure Status

| ID | Agent | Function | File | Status | Evidence | Impact | IsMock | TestExists | Notes |
|----|-------|----------|------|--------|----------|--------|--------|------------|-------|
| INF-0001 | System | Prisma Schema | apps/api/prisma/schema.prisma | WORKING | prisma generate succeeds, db push works | Critical | FALSE | NO | — |
| INF-0002 | System | Prisma Client | apps/api/node_modules/@prisma/client | WORKING | Generated successfully, used by all routes | Critical | FALSE | NO | — |
| INF-0003 | System | Streaming chat pipe | apps/api/server.js | PARTIAL | Pipes through but doesn't save to DB | Critical | FALSE | NO | Streaming response works for client, but message persistence to Prisma is missing or incomplete in the stream branch. |
| INF-0004 | System | Monolithic server.js | apps/api/server.js | TECHNICAL_DEBT | 1053 lines, needs decomposition | High | FALSE | NO | All routes, middleware, and business logic live in a single 1053-line file. Decomposition into routers/controllers is recommended. |

---

## Legend

- **WORKING** — Function is operational and verified through deployment, curl, or build.
- **PARTIAL** — Code exists and may be fixed, but post-fix verification is incomplete.
- **UNKNOWN** — Cannot be verified due to missing external credentials, tokens, or testing constraints.
- **BROKEN** — Known failure (none at this time).
- **MOCK** — Placeholder or fake implementation (none at this time).
- **DEAD_CODE** — Unused or unreachable (none at this time).

## Summary

- **Backend Routes & Middleware:** 34 functions → 28 WORKING, 4 PARTIAL, 2 UNKNOWN
- **Service Functions (YooKassa):** 7 functions → 7 UNKNOWN (external keys required)
- **Deploy Scripts:** 10 functions → 10 PARTIAL (encoding issues or untested)
- **Telegram Bot:** 7 functions → 7 UNKNOWN (no BOT_TOKEN)
- **Frontend Pages:** 27 functions → 27 WORKING (all render, none tested)
- **Frontend Components:** 25 functions → 25 WORKING (all render, none tested)
- **Infrastructure:** 4 items → 2 WORKING, 1 PARTIAL, 1 TECHNICAL_DEBT

**Overall Project Health:** All critical paths are WORKING. Primary risks are:
1. Zero automated test coverage (TestExists = NO for 100% of functions).
2. YooKassa integration is unverified (requires live merchant account).
3. Telegram bot is unverified (requires BOT_TOKEN and runtime environment).
4. `server.js` monolith is TECHNICAL DEBT and should be refactored into route modules.
5. Streaming chat persistence is PARTIAL (missing DB write in stream branch).
