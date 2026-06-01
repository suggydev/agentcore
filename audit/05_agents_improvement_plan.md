# 45+ Specialized Improvement Agents — AgentCore v3

Each agent has a clear mission, target files, and verification criteria.

## AGENT GROUP A: Test Writers (5 agents)

### Agent-Improve-01: Agent-TestWriter-API-Unit
- **Mission**: Write unit tests for all Express route handlers
- **Files**: server.js (all endpoints)
- **Tests**: ~30 test cases — auth, agents CRUD, conversations CRUD, billing, CRM, knowledge, analytics
- **Tools**: Jest + Supertest + Prisma mock
- **Criteria**: 80%+ code coverage on API routes

### Agent-Improve-02: Agent-TestWriter-API-Middleware
- **Mission**: Write tests for middleware: authenticate, checkTrial, error handler
- **Files**: server.js:26-54, 929-932
- **Tests**: Token validation, expiry, trial check, error propagation
- **Criteria**: All middleware paths tested

### Agent-Improve-03: Agent-TestWriter-API-Integration
- **Mission**: Write integration tests for full API flows
- **Files**: server.js (full flow: register → login → create agent → chat → billing)
- **Tests**: ~10 integration scenarios
- **Tools**: Jest + Supertest + real test DB
- **Criteria**: All critical paths tested end-to-end

### Agent-Improve-04: Agent-TestWriter-Frontend-Components
- **Mission**: Write unit tests for React components
- **Files**: All components/ + sections/
- **Tests**: Render tests, prop validation, interaction tests
- **Tools**: Jest + React Testing Library
- **Criteria**: Every component has at least smoke test

### Agent-Improve-05: Agent-TestWriter-Frontend-E2E
- **Mission**: Write E2E tests for critical user flows
- **Files**: Landing page → login → dashboard → agents → chat
- **Tests**: 5 critical user journeys
- **Tools**: Playwright
- **Criteria**: All 5 flows pass

## AGENT GROUP B: Security Hardening (8 agents)

### Agent-Improve-06: Agent-Security-WebchatAuth
- **Mission**: Add authentication to webchat endpoint
- **Files**: server.js:611-718, .env.example
- **Fix**: Add API key or token validation middleware
- **Criteria**: Webchat requires valid credentials; 401 on missing key

### Agent-Improve-07: Agent-Security-HardcodedSecrets
- **Mission**: Remove ALL hardcoded secrets and fallbacks
- **Files**: server.js:13-14, tg_devops_bot.py, deploy scripts
- **Fix**: Env-only secrets, crash on missing required vars, no fallbacks
- **Criteria**: Zero hardcoded secrets; env validation at startup

### Agent-Improve-08: Agent-Security-RateLimiting
- **Mission**: Implement rate limiting on all endpoints
- **Files**: server.js (add express-rate-limit middleware)
- **Fix**: Different limits per endpoint type (auth vs data vs AI)
- **Criteria**: Rate limits enforced; 429 responses returned

### Agent-Improve-09: Agent-Security-InputValidation
- **Mission**: Add proper validation to all POST/PUT endpoints
- **Files**: server.js (CRM, knowledge, workspace endpoints)
- **Fix**: Zod schemas for every endpoint; remove {...req.body} patterns
- **Criteria**: All endpoints have Zod validation; no mass assignment

### Agent-Improve-10: Agent-Security-CORS
- **Mission**: Restrict CORS from wildcard to specific origins
- **Files**: server.js:22
- **Fix**: Configurable CORS origins from env
- **Criteria**: Only allowed origins can make requests

### Agent-Improve-11: Agent-Security-JWTHardening
- **Mission**: Improve JWT security
- **Files**: server.js:13,194,216
- **Fix**: Token refresh endpoint, shorter expiry, secret rotation support
- **Criteria**: Refresh flow implemented

### Agent-Improve-12: Agent-Security-PromptSanitization
- **Mission**: Sanitize user input before passing to LLM
- **Files**: server.js (chat completions, messages, webchat)
- **Fix**: Strip/reject prompt injection patterns
- **Criteria**: Prompt injection attempts blocked

### Agent-Improve-13: Agent-Security-SecretsScan
- **Mission**: Run secrets scan, add .gitignore rules
- **Files**: .env files, server.js, deploy scripts
- **Fix**: Ensure .env is in .gitignore; check for leaked secrets in git history
- **Criteria**: No secrets in git; pre-commit hook added

## AGENT GROUP C: Bug Fixes (7 agents)

### Agent-Improve-14: Agent-BugFix-TrialCheckConsistency
- **Mission**: Apply checkTrial middleware consistently
- **Files**: server.js (messages, webchat, images endpoints)
- **Fix**: Add checkTrial to all endpoints that consume AI credits
- **Criteria**: All AI-consuming endpoints have trial check

### Agent-Improve-15: Agent-BugFix-BillingUsageMonth
- **Mission**: Fix billing/usage endpoint to actually filter by month
- **Files**: server.js:763-775
- **Fix**: Add createdAt gte filter for current month
- **Criteria**: Returns current month counts, not all-time

### Agent-Improve-16: Agent-BugFix-AgentUpdateResponse
- **Mission**: Fix PUT /api/agents to return updated object
- **Files**: server.js:435-446
- **Fix**: Use findFirst + update pattern; return agent; 404 if not found
- **Criteria**: Returns updated agent; 404 for non-existent

### Agent-Improve-17: Agent-BugFix-AsyncErrorHandling
- **Mission**: Add express-async-errors and proper async error catching
- **Files**: server.js (add package, wrap handlers)
- **Fix**: Install express-async-errors; ensure all async errors reach error middleware
- **Criteria**: Async errors caught; no unhandled rejections

### Agent-Improve-18: Agent-BugFix-ConversationOrder
- **Mission**: Fix conversation creation order (save after AI response)
- **Files**: server.js:310-327 (chat completions)
- **Fix**: Only save conversation after successful AI response
- **Criteria**: No orphaned conversations on AI failure

### Agent-Improve-19: Agent-BugFix-MessageHistoryLimit
- **Mission**: Limit conversation history sent to AI
- **Files**: server.js:540-545, 660-668
- **Fix**: Truncate history to last N messages (e.g., 20)
- **Criteria**: Token usage bounded; older messages don't cause context overflow

### Agent-Improve-20: Agent-BugFix-EdgeCases
- **Mission**: Handle edge cases: empty responses, null fields, missing data
- **Files**: All route handlers
- **Fix**: Null checks, default values, graceful degradation
- **Criteria**: All handlers handle missing/empty data gracefully

## AGENT GROUP D: Scalability & Performance (6 agents)

### Agent-Improve-21: Agent-Scale-Pagination
- **Mission**: Add pagination to ALL list endpoints
- **Files**: server.js (agents, conversations, customers, knowledge, analytics)
- **Fix**: Add skip/take query params; return total count
- **Criteria**: All list endpoints support ?page&limit

### Agent-Improve-22: Agent-Scale-MessageOptimization
- **Mission**: Don't include ALL messages in conversation list
- **Files**: server.js:463-474
- **Fix**: Remove messages include from list; add separate messages endpoint
- **Criteria**: Conversation list returns light payloads

### Agent-Improve-23: Agent-Scale-ModelCache
- **Mission**: Improve model cache for multi-instance
- **Files**: server.js:18-19, fetchModels
- **Fix**: Add Redis cache option; configurable TTL via env
- **Criteria**: Multi-instance cache sharing

### Agent-Improve-24: Agent-Scale-DBIndexing
- **Mission**: Verify and add missing database indexes
- **Files**: schema.prisma
- **Fix**: Add indexes for commonly queried fields (createdAt, status, type)
- **Criteria**: Query EXPLAIN shows index usage

### Agent-Improve-25: Agent-Scale-ConnectionPool
- **Mission**: Configure Prisma connection pool
- **Files**: server.js (PrismaClient init)
- **Fix**: Add connection_limit, pool_timeout config
- **Criteria**: Pool settings from env or reasonable defaults

### Agent-Improve-26: Agent-Perf-HeavyEndpoints
- **Mission**: Optimize heavy endpoints
- **Files**: analytics/dashboard, conversations list
- **Fix**: Add caching, limit query sizes, optimize includes
- **Criteria**: <500ms response time for typical queries

## AGENT GROUP E: Observability (4 agents)

### Agent-Improve-27: Agent-Observ-StructuredLogging
- **Mission**: Implement structured logging with log levels
- **Files**: server.js (replace console.log with logger)
- **Fix**: Add pino or winston; structured JSON logs; log levels
- **Criteria**: All logs are structured; log level configurable

### Agent-Improve-28: Agent-Observ-RequestTracking
- **Mission**: Add request ID tracking
- **Files**: server.js (middleware)
- **Fix**: Generate/forward request ID; include in logs and responses
- **Criteria**: Every request has traceable ID

### Agent-Improve-29: Agent-Observ-HealthCheck
- **Mission**: Improve health check with DB connectivity
- **Files**: server.js:914-923
- **Fix**: Add DB ping; return 503 if unhealthy; add version details
- **Criteria**: Health returns 200 only when DB+Models healthy

### Agent-Improve-30: Agent-Observ-ErrorTracking
- **Mission**: Add error tracking with IDs
- **Files**: server.js:929-932
- **Fix**: Generate error IDs; return in response; log full context
- **Criteria**: Errors include traceable ID for debugging

## AGENT GROUP F: Code Quality (6 agents)

### Agent-Improve-31: Agent-CodeQuality-RefactorServer
- **Mission**: Split monolithic server.js into route modules
- **Files**: server.js → routes/auth.js, routes/agents.js, routes/chat.js, routes/billing.js, routes/crm.js, routes/knowledge.js
- **Fix**: Extract routes; shared middleware; central server config
- **Criteria**: server.js <200 lines; each route file <200 lines

### Agent-Improve-32: Agent-CodeQuality-ServiceLayer
- **Mission**: Extract business logic into service layer
- **Files**: New: services/chatService.js, services/agentService.js, services/billingService.js, services/modelService.js
- **Fix**: Route handlers delegate to services; services handle Prisma + external APIs
- **Criteria**: Route handlers <20 lines each

### Agent-Improve-33: Agent-CodeQuality-TypeSafety
- **Mission**: Add TypeScript types to API (convert server.js to .ts or add JSDoc)
- **Files**: server.js → server.ts or add comprehensive JSDoc
- **Fix**: TypeScript interfaces for all request/response types; strict mode
- **Criteria**: No `any` types; all Prisma queries typed

### Agent-Improve-34: Agent-CodeQuality-DeadCodeRemoval
- **Mission**: Remove dead code and unused deps
- **Files**: schema.prisma (dead columns), package.json (stripe, rate-limit)
- **Fix**: Remove deprecated columns; remove unused deps; clean empty dirs
- **Criteria**: Zero dead code/deps; empty dirs have README or are removed

### Agent-Improve-35: Agent-CodeQuality-ConstantsExtract
- **Mission**: Extract magic numbers and strings into constants
- **Files**: server.js
- **Fix**: Config file for TTLs, limits, defaults, URLs, model IDs
- **Criteria**: Zero magic numbers in logic

### Agent-Improve-36: Agent-CodeQuality-ErrorMessages
- **Mission**: Standardize and localize error messages
- **Files**: server.js (all error responses)
- **Fix**: Error code system; i18n for Russian + English; consistent format
- **Criteria**: All errors have code + message; supports translation

## AGENT GROUP G: Frontend (5 agents)

### Agent-Improve-37: Agent-Frontend-ErrorStates
- **Mission**: Add proper loading/error/empty states to all pages
- **Files**: All page.tsx files
- **Fix**: Consistent state handling with ErrorBoundary, Suspense, loading skeletons
- **Criteria**: Every page handles loading, error, and empty states

### Agent-Improve-38: Agent-Frontend-APIErrorHandling
- **Mission**: Add proper API error handling to all fetch calls
- **Files**: All components making API calls
- **Fix**: Consistent error handling, retry logic, user-friendly messages
- **Criteria**: All API errors handled gracefully

### Agent-Improve-39: Agent-Frontend-StateConsistency
- **Mission**: Ensure Zustand store stays consistent with backend
- **Files**: agentStore.ts
- **Fix**: Add API sync actions; optimistic updates; rollback on failure
- **Criteria**: Store reflects backend state

### Agent-Improve-40: Agent-Frontend-Accessibility
- **Mission**: Improve web accessibility (a11y)
- **Files**: All TSX files
- **Fix**: ARIA labels, keyboard navigation, screen reader support, contrast
- **Criteria**: Lighthouse a11y score >90

### Agent-Improve-41: Agent-Frontend-MobileResponsive
- **Mission**: Verify and fix mobile responsive issues
- **Files**: All TSX files, globals.css
- **Fix**: Responsive breakpoints, touch targets, mobile navigation
- **Criteria**: Usable on 320px-1920px width range

## AGENT GROUP H: Infrastructure (5 agents)

### Agent-Improve-42: Agent-Infra-CI-GitHubActions
- **Mission**: Create GitHub Actions CI pipeline
- **Files**: New: .github/workflows/ci.yml
- **Fix**: Lint + typecheck + test + build on push
- **Criteria**: CI runs on every push; blocks merge on failure

### Agent-Improve-43: Agent-Infra-DockerCompose
- **Mission**: Complete docker-compose for full local dev
- **Files**: docker-compose.yml, Dockerfiles for api + web
- **Fix**: Add api + web services; dev volumes; hot reload
- **Criteria**: `docker-compose up` runs full stack locally

### Agent-Improve-44: Agent-Infra-EnvValidation
- **Mission**: Add startup env validation
- **Files**: server.js (startup)
- **Fix**: Validate all required env vars; crash early with clear message
- **Criteria**: Missing env vars caught at startup with helpful messages

### Agent-Improve-45: Agent-Infra-SeedData
- **Mission**: Create database seed script
- **Files**: New: prisma/seed.js
- **Fix**: Seed dev/test DB with sample data (workspace, agent, conversations)
- **Criteria**: `npm run seed` populates DB with test data

### Agent-Improve-46: Agent-Infra-BackupStrategy
- **Mission**: Document backup strategy
- **Files**: New: docs/backup.md
- **Fix**: DB backup script, restore procedure, schedule
- **Criteria**: Backup and restore documented and testable
