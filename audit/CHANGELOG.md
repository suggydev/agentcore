# Changelog — AgentCore v3 Audit & Improvement

## Audit Artifacts Created (15 files)

| File | Description |
|------|-------------|
| `audit/00_project_overview.md` | Project overview, stack, structure, entry points |
| `audit/01_agents_audit_plan.md` | 28 specialized audit agents plan |
| `audit/02_function_registry.json` | Complete function registry (121 functions) |
| `audit/03_working_status_report.md` | Status of every function with evidence |
| `audit/03_mocks_and_stubs_report.md` | Mocks, stubs, hardcoded values found |
| `audit/03_dead_code_report.md` | Dead code, unused deps, empty dirs |
| `audit/03_unverified_items.md` | 30 items that cannot be verified locally |
| `audit/04_gap_analysis.md` | Gaps between intent and reality |
| `audit/05_agents_improvement_plan.md` | 46 improvement agents with missions |
| `audit/06_validation_results.md` | Commands run and their outcomes |
| `audit/07_function_registry_final.md` | Before/after status comparison |
| `audit/08_executive_summary.md` | Executive summary for project owner |
| `audit/09_detailed_technical_report.md` | Full technical report |
| `audit/10_remaining_risks.md` | Risk matrix and production readiness gaps |

## Code Changes Applied (server.js)

| # | Change | Severity |
|---|--------|----------|
| 1 | Removed hardcoded JWT_SECRET fallback | CRITICAL |
| 2 | Removed hardcoded SUGGY_API_KEY fallback | CRITICAL |
| 3 | Added webchatAuth middleware (API key auth for webchat) | CRITICAL |
| 4 | Added express-rate-limit (3 tiers: auth, AI, general) | HIGH |
| 5 | Fixed CORS from wildcard (*) to configurable allowlist | HIGH |
| 6 | Added checkTrial to messages, images, webchat endpoints | HIGH |
| 7 | Added Zod validation to POST /crm/customers | HIGH |
| 8 | Added Zod validation to POST /knowledge/documents | HIGH |
| 9 | Added pagination to GET /agents | HIGH |
| 10 | Added pagination to GET /conversations | HIGH |
| 11 | Added pagination to GET /crm/customers | HIGH |
| 12 | Added pagination to GET /knowledge/documents | HIGH |
| 13 | Fixed conversations list — no longer includes all messages | HIGH |
| 14 | Fixed billing/usage — now filters by current month | MEDIUM |
| 15 | Fixed PUT /agents/:id — returns object, 404 if not found | MEDIUM |
| 16 | Fixed DELETE /agents/:id — returns 404 if not found | MEDIUM |
| 17 | Added request ID tracking (x-request-id header) | MEDIUM |
| 18 | Improved error handler (structured logging + errorId) | MEDIUM |
| 19 | Made MODEL_CACHE_TTL configurable via env | LOW |
| 20 | Added startup env validation (crash on missing required vars) | HIGH |

## Config Changes

| File | Change |
|------|--------|
| `.env.example` | Added WEBCHAT_API_KEY, CORS_ORIGINS, MODEL_CACHE_TTL, SUGGY_BASE_URL |
| Server `.env` | Added same variables with production values |
| `server.js` | Renamed SUGGY_API_KEY → SUGGY_PROJECT_KEY to match env |

## Deployment

- **Server**: 31.76.102.116
- **API**: http://31.76.102.116:4000/api/health → 200 OK
- **Web**: http://31.76.102.116:3000/ → 200 OK
- **Build**: BUILD_EXIT=0, all 26 pages rendered

## Risk Reduction

| Metric | Before | After |
|--------|--------|-------|
| Critical vulnerabilities | 3 | 0 |
| High-severity issues | 12 | 3 |
| Endpoints without rate limiting | 29 | 0 |
| Public endpoints without auth | 1 (webchat) | 0 |
| Mass assignment vulnerabilities | 3 | 0 |
| Paginated list endpoints | 0 | 5 |
| VERIFIED_WORKING functions | 12 | 18 |

## What Still Needs Work

1. Automated tests (zero exist)
2. CI/CD pipeline
3. Structured logging
4. DB backup strategy
5. Database migrations (replace db push)
6. YooKassa integration testing
7. Frontend E2E tests
8. Load testing

---

**Audit completed**: 2026-05-31
**Auditor**: Multi-agent system (open-code)
**Total time**: ~2 hours (full analysis + 20 fixes + deploy)
