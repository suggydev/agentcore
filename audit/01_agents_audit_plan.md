# Agent Audit Plan — 25+ Specialized Agents

## Phase 1 Audit Agents

Each agent has a clear mission, scope, and expected artifact.

---

### Agent-01: Agent-RepoMapper
- **Mission**: Build complete structural map of repository
- **Scope**: All directories, all files, package dependencies
- **Analyzes**: `agentcore-v3/` (all), root `.py` files, config files
- **Artifacts**: Repository tree, package dependency graph
- **Risks**: Empty directories (unfinished features), dead files
- **Completion**: Full file listing with categorization

### Agent-02: Agent-EntryPointFinder
- **Mission**: Identify all code entry points
- **Scope**: `server.js`, `next.config.js`, page.tsx files, layout.tsx, deploy scripts, ecosystem.config.js
- **Artifacts**: Entry point map with startup sequences
- **Risks**: Missing error handlers at entry points, hardcoded configs
- **Completion**: All entry points documented with call chains

### Agent-03: Agent-FunctionIndexer
- **Mission**: Index every standalone function
- **Scope**: `server.js`, `yookassa.js`, `tg_devops_bot.py`, deploy scripts
- **Artifacts**: Function index with signatures, async status, exports
- **Risks**: Unnamed callbacks with business logic, duplicate logic
- **Completion**: Every function node catalogued

### Agent-04: Agent-ClassMethodIndexer
- **Mission**: Index all class methods, service methods, store methods
- **Scope**: `agentStore.ts`, YooKassa service, any class-based code
- **Artifacts**: Method registry grouped by class/module
- **Risks**: State mutation methods without guards, untyped actions
- **Completion**: All methods catalogued

### Agent-05: Agent-APIFlowAuditor
- **Mission**: Trace all API request flows end-to-end
- **Scope**: `server.js` all endpoints, middleware chain
- **Artifacts**: API flow diagrams, middleware audit, response patterns
- **Risks**: Missing auth on public endpoints, no rate limiting, error leaks
- **Completion**: Every endpoint traced with middleware stack

### Agent-06: Agent-FrontendFlowAuditor
- **Mission**: Audit all UI components, hooks, state management
- **Scope**: All TSX files, agentStore.ts, data files
- **Artifacts**: Component tree, state flow diagram, hook usage
- **Risks**: Client-side rendering issues, missing error boundaries, no suspense
- **Completion**: Complete frontend component/path audit

### Agent-07: Agent-TestCoverageAuditor
- **Mission**: Find all tests and measure coverage
- **Scope**: Entire repo (search for test files, test frameworks)
- **Artifacts**: Test inventory, coverage gaps
- **Risks**: Zero test files expected — this is a critical finding
- **Completion**: Document exactly what tests exist (likely none)

### Agent-08: Agent-MockStubDetector
- **Mission**: Find all mocks, stubs, fakes, TODO, FIXME, HACK markers
- **Scope**: All source files
- **Artifacts**: Mock/stub registry, incomplete code report
- **Risks**: Code shipped with hardcoded test data, unimplemented features
- **Completion**: All markers and stubs documented

### Agent-09: Agent-DependencyGraphAuditor
- **Mission**: Build full dependency graph (imports, requires, consumes)
- **Scope**: All source files, package.json files
- **Artifacts**: Dependency graph, circular dependency report
- **Risks**: Unused dependencies, missing peer deps, circular refs
- **Completion**: Complete dependency map

### Agent-10: Agent-DeadCodeHunter
- **Mission**: Find unused exports, unreachable code, dead columns
- **Scope**: All source files, Prisma schema, CSS classes
- **Artifacts**: Dead code index
- **Risks**: Dead DB columns (Conversation.userId), unused functions
- **Completion**: All unused code identified

### Agent-11: Agent-ErrorHandlingAuditor
- **Mission**: Audit error handling quality and completeness
- **Scope**: All try/catch blocks, middleware error handlers, API responses
- **Artifacts**: Error handling quality report per endpoint
- **Risks**: Generic error messages, stack trace leaks, silent failures
- **Completion**: Error handling score per function

### Agent-12: Agent-AsyncFlowAuditor
- **Mission**: Examine all async operations for correctness
- **Scope**: All async functions, Promise chains, event handlers
- **Artifacts**: Async flow report with race condition analysis
- **Risks**: Missing awaits, unhandled rejections, no timeouts
- **Completion**: All async code audited

### Agent-13: Agent-TypeSafetyAuditor
- **Mission**: Check TypeScript types, schema validations, contracts
- **Scope**: All .ts/.tsx files, Zod schemas, Prisma schema
- **Artifacts**: Type safety gaps report
- **Risks**: `any` types, missing validations, inconsistent interfaces
- **Completion**: Type gap analysis

### Agent-14: Agent-SecurityAuditor
- **Mission**: Find security vulnerabilities
- **Scope**: Auth flow, data access, secrets, CORS, validation, SQL injection
- **Artifacts**: Security vulnerability report
- **Risks**: Hardcoded secrets, no rate limiting, wildcard CORS, JWT without refresh, password strength
- **Completion**: All security issues documented

### Agent-15: Agent-DatabaseFlowAuditor
- **Mission**: Audit all database operations
- **Scope**: Prisma schema, all prisma.* calls in server.js
- **Artifacts**: DB operation map, migration check, index audit
- **Risks**: Missing transactions, N+1 queries, no pagination, accept-data-loss deploys
- **Completion**: All DB operations audited with risk scoring

### Agent-16: Agent-ExternalIntegrationAuditor
- **Mission**: Check all external API/dependency integrations
- **Scope**: Suggy API, YooKassa, Stripe (listed but unused)
- **Artifacts**: Integration health report
- **Risks**: Hardcoded API keys, no retry logic, no circuit breaker, synchronous external calls in request handlers
- **Completion**: Integration risk matrix

### Agent-17: Agent-ConfigEnvAuditor
- **Mission**: Audit configuration and environment handling
- **Scope**: .env files, .env.example, env variable usage, config fallbacks
- **Artifacts**: Config audit with missing/insecure env report
- **Risks**: Hardcoded fallbacks, missing variables in example, .env leaked?
- **Completion**: All config points documented

### Agent-18: Agent-BuildReleaseAuditor
- **Mission**: Audit build process and CI/CD
- **Scope**: package.json scripts, Turbo config, Docker, PM2, deploy scripts
- **Artifacts**: Build/release audit
- **Risks**: No CI pipeline, manual deploys, no version tagging, accept-data-loss in deploy
- **Completion**: Build chain fully documented

### Agent-19: Agent-PerformanceAuditor
- **Mission**: Find performance issues
- **Scope**: All endpoints, frontend components, data fetching patterns
- **Artifacts**: Performance risk report
- **Risks**: No pagination, no caching headers, blocking calls, large payloads, unoptimized images
- **Completion**: Perf issues documented

### Agent-20: Agent-ObservabilityAuditor
- **Mission**: Check logging, metrics, tracing
- **Scope**: console.log/error calls, error handling, log levels, monitoring
- **Artifacts**: Observability gap report
- **Risks**: console.error only, no structured logging, no metrics, no health check detail
- **Completion**: Observability score

### Agent-21: Agent-CodeSmellAuditor
- **Mission**: Find code smells and anti-patterns
- **Scope**: All source files
- **Artifacts**: Code smell catalog
- **Risks**: God function (server.js 949 lines), duplicate logic, magic numbers
- **Completion**: Smell severity matrix

### Agent-22: Agent-DocsRealityChecker
- **Mission**: Cross-reference docs with actual code
- **Scope**: README.md, ARCHITECTURE.md, DESIGN_SYSTEM.md, ASSUMPTIONS.md, PROJECT_AUDIT.md vs code
- **Artifacts**: Documentation accuracy report
- **Risks**: Outdated docs, missing docs for implemented features
- **Completion**: Doc accuracy matrix

### Agent-23: Agent-RouteEndpointMapper
- **Mission**: Build complete route map
- **Scope**: All Express routes, Next.js pages (app router)
- **Artifacts**: Complete route table with auth requirements
- **Risks**: Orphan pages, broken links, auth gaps
- **Completion**: Every route/path documented

### Agent-24: Agent-StateMutationAuditor
- **Mission**: Audit all state mutations
- **Scope**: agentStore.ts (Zustand), React useState/useRef usage
- **Artifacts**: State mutation map
- **Risks**: State inconsistency, missing validation on setters, uncontrolled mutations
- **Completion**: All state mutations traced

### Agent-25: Agent-SchemaContractAuditor
- **Mission**: Check DTO, schema, validator consistency
- **Scope**: Zod schemas, Prisma schema, TypeScript interfaces
- **Artifacts**: Contract consistency report
- **Risks**: Zod schema doesn't match Prisma, missing fields in validation
- **Completion**: All data contracts audited

---

## Additional Specialized Agents (based on project specifics)

### Agent-26: Agent-LLMRoutingAuditor
- **Mission**: Audit smart model routing logic
- **Scope**: `routeToModel()` function, `fetchModels()`, model selection across endpoints
- **Risks**: Incorrect routing, missing models, hardcoded fallbacks

### Agent-27: Agent-AuthFlowAuditor
- **Mission**: Deep-dive on authentication/authorization
- **Scope**: `authenticate` middleware, `checkTrial`, JWT handling, bcrypt
- **Risks**: JWT expiry handling, secret rotation, role enforcement gaps

### Agent-28: Agent-FrontendDataFlowAuditor
- **Mission**: Trace data flow from API to UI
- **Scope**: API calls in frontend code, error states, loading states
- **Risks**: Missing loading/error states, no retry, no cache
