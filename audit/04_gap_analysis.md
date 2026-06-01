# Gap Analysis — AgentCore v3

Analysis of gaps between what code SHOULD do, what it ACTUALLY does, and what can be PROVEN.

## Gap Categories

### 1. TEST COVERAGE GAP (CRITICAL)

**Current state**: 0% automated test coverage. Zero test files exist.
**Gap**: 100% of functionality is untested.
**Impact**: Any change risks regression. No confidence in correctness.
**Priority**: CRITICAL — must be addressed before any production use.

### 2. AUTHENTICATION GAPS

| Gap | Severity | Detail |
|-----|----------|--------|
| Webchat endpoint has NO auth | CRITICAL | /api/channels/webchat/message — public, no API key, no rate limit |
| checkTrial only on chat/completions | HIGH | messages, webchat endpoints bypass trial check |
| No rate limiting on auth endpoints | HIGH | Login + register vulnerable to brute force |
| JWT refresh mechanism missing | MEDIUM | Tokens expire in 7 days, no refresh endpoint |
| CORS wildcard (*) on all origins | MEDIUM | Enables CSRF from any origin |

### 3. DATA VALIDATION GAPS

| Gap | Severity | Detail |
|-----|----------|--------|
| CRM create POST uses {...req.body} | HIGH | Mass assignment — attacker can set any field |
| Knowledge doc create same issue | HIGH | Same mass assignment pattern |
| No sanitization of user input to LLM | MEDIUM | systemPrompt passed directly to external API |
| PUT /api/agents uses updateMany | MEDIUM | Returns count instead of updated object |

### 4. SCALABILITY GAPS

| Gap | Severity | Detail |
|-----|----------|--------|
| No pagination on 5 list endpoints | HIGH | GET /api/agents, /conversations, /crm/customers, /knowledge/documents |
| Conversations include ALL messages | HIGH | N+1 query problem with unlimited growth |
| Usage endpoint reports all-time, not monthly | MEDIUM | API contract misleading |
| In-memory model cache (single instance) | LOW | Not shared across PM2 instances |

### 5. ERROR HANDLING GAPS

| Gap | Severity | Detail |
|-----|----------|--------|
| No express-async-errors | HIGH | Async errors will crash the process |
| Generic 500 on all errors | MEDIUM | No error tracking ID, hard to debug |
| Error messages in Russian | LOW | Internationalization needed |
| Streaming errors from Suggy not caught | MEDIUM | Stream pipes directly — errors go to client raw |

### 6. SECURITY GAPS

| Gap | Severity | Detail |
|-----|----------|--------|
| Hardcoded Suggy API key fallback | CRITICAL | Exposed in source code |
| Hardcoded JWT secret fallback | HIGH | Should only come from env |
| No CSRF protection | HIGH | CORS wildcard + no CSRF tokens |
| No input sanitization for LLM prompts | MEDIUM | Prompt injection possible |
| DB credentials hardcoded in env file | MEDIUM | .env has plaintext DB password |
| SSH password in .env for deploy scripts | HIGH | agentcore2026 visible in docker-compose |

### 7. OBSERVABILITY GAPS

| Gap | Severity | Detail |
|-----|----------|--------|
| Only console.log/error | HIGH | No structured logging, log levels, or formatting |
| No metrics/monitoring | HIGH | No counters, histograms, alerts |
| No request ID tracking | MEDIUM | Can't trace requests through system |
| No health check for DB connectivity | MEDIUM | Health only checks models, not DB |

### 8. ARCHITECTURE GAPS

| Gap | Severity | Detail |
|-----|----------|--------|
| Monolithic server.js (949 lines) | MEDIUM | All routes in single file |
| No service layer separation | MEDIUM | Business logic mixed with route handlers |
| No dependency injection | LOW | Testing harder without DI |
| No feature flags | LOW | Can't toggle features without deploy |
| Billing transactions not used in endpoints | HIGH | Schema exists but no API creates transactions |

### Priority Matrix

| Priority | Count | Action |
|----------|-------|--------|
| CRITICAL | 3 | Webchat auth, hardcoded API key, zero test coverage |
| HIGH | 12 | Pagination, rate limiting, mass assignment, async errors |
| MEDIUM | 10 | Logging, observability, architecture, CORS |
| LOW | 5 | Feature flags, DI, i18n, cache sharing |
