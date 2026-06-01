# Mocks & Stubs Report — AgentCore v3

## Key Finding: No Mocks or Stubs in Production Code

The project contains ZERO mocks, stubs, fakes, or test doubles in its production source code. This is a positive finding — the production code appears to be intended as real implementation.

However, several markers of incompleteness were detected:

### TODO / FIXME / HACK Markers

None found via code search. The codebase is clean of explicit TODO/FIXME/HACK comments.

### Hardcoded / Incomplete Implementations

| File | Line | Issue | Severity |
|------|------|-------|----------|
| server.js | 13 | JWT_SECRET hardcoded fallback 'agentcore-v3-secret-key-2026' | HIGH |
| server.js | 14 | SUGGY_API_KEY hardcoded as fallback | CRITICAL |
| server.js | 731 | Hardcoded limits object: { agents: 5, messages: 1000, storage: 100 } | MEDIUM |
| server.js | 15 | Hardcoded Suggy base URL | LOW |
| server.js | 19 | Hardcoded cache TTL (60s) | LOW |
| tg_devops_bot.py | 26 | BOT_TOKEN from env with no fallback — crashes if missing | MEDIUM |
| tg_devops_bot.py | 28 | Hardcoded server IP 31.76.102.116 | HIGH |
| deploy.py | 17-18 | Hardcoded server host + username | HIGH |
| quick_deploy.py | 15-17 | Hardcoded server host + username | HIGH |
| deploy_all.py | 11 | Hardcoded host + username inline | HIGH |

### Deprecated / Not-yet-implemented Features

| What | Where | Evidence |
|------|-------|----------|
| RBAC (roles) | schema.prisma:36 | Comment: "RBAC not yet implemented — role always OWNER" |
| subscriptionEndsAt | schema.prisma:17 | @deprecated: "Field not yet used" |
| Conversation.userId | schema.prisma:68 | @deprecated: "Dead column — never populated or read" |
| KnowledgeDocument types "url", "file" | schema.prisma:110 | Comment: "Currently only text is used" |
| Stripe integration | package.json deps | Listed but no code uses it |
| express-rate-limit | package.json deps | Listed but no middleware uses it |
| REDIS_URL | .env.example | Listed but no Redis code exists |
| hooks/ directory | src/hooks/ | Empty directory — no custom hooks implemented |
| api/auth/ directory | src/app/api/auth/ | Empty — no Next.js API routes |

### Demo/Placeholder Data

| File | Type | Content |
|------|------|---------|
| landingContent.ts:46-51 | DEMO_CHAT | Hardcoded demo chat message (not dynamic) |
| landingContent.ts:53-56 | FLOATING_CARDS | Static floating card data |
| testPrompts in agentTemplates.ts | Static test data | Each template has 3 testPrompts — static strings, never used in tests |
| i18n.ts:69-73 | agent.testPrompts | Static test prompt strings in i18n |

### Summary

- **Clean production code**: No mock/stub patterns detected
- **Critical hardcoded secrets**: 2 instances (JWT fallback, Suggy API key fallback)
- **Deprecated DB columns**: 2 (subscriptionEndsAt, userId)
- **Unimplemented features**: 6 (RBAC, Stripe, rate-limit, Redis, hooks, auth routes)
- **Empty directories**: 2 (hooks/, api/auth/)

### Recommendations

1. Move ALL secrets to environment variables only — remove hardcoded fallbacks
2. Either implement or remove Stripe dependency
3. Either implement express-rate-limit or remove from deps
4. Remove deprecated DB columns or implement them
5. Implement hooks/ or remove empty directory
6. Make demo data (landingContent) clearly labeled as such
