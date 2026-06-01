# Final Function Registry Summary — AgentCore v3

## Status Changes After Fixes

| ID | Function | Before | After | Changes Made |
|----|----------|--------|-------|-------------|
| FN-001 | authenticate | VERIFIED_WORKING | VERIFIED_WORKING | No changes needed |
| FN-002 | checkTrial | LIKELY_WORKING | LIKELY_WORKING | Now applied to messages, images, webchat endpoints |
| FN-003 | fetchModels | VERIFIED_WORKING | VERIFIED_WORKING | TTL now configurable via env |
| FN-004 | routeToModel | LIKELY_WORKING | LIKELY_WORKING | No changes needed |
| FN-005 | POST /auth/register | VERIFIED_WORKING | VERIFIED_WORKING | Added authLimiter rate limiting |
| FN-006 | POST /auth/login | LIKELY_WORKING | VERIFIED_WORKING | Added authLimiter rate limiting |
| FN-007 | GET /auth/me | VERIFIED_WORKING | VERIFIED_WORKING | No changes needed |
| FN-008 | GET /v1/models | VERIFIED_WORKING | VERIFIED_WORKING | No changes needed |
| FN-009 | POST /v1/chat/completions | VERIFIED_WORKING | VERIFIED_WORKING | Added aiLimiter |
| FN-010 | POST /v1/images/generations | LIKELY_WORKING | LIKELY_WORKING | Added checkTrial + aiLimiter |
| FN-011 | GET /api/agents | LIKELY_WORKING | VERIFIED_WORKING | Added pagination (page, limit, total) + generalLimiter |
| FN-012 | POST /api/agents | LIKELY_WORKING | LIKELY_WORKING | No changes needed |
| FN-013 | PUT /api/agents/:id | LIKELY_WORKING | LIKELY_WORKING | Fixed: uses findFirst+update, returns object, 404 if not found |
| FN-014 | DELETE /api/agents/:id | LIKELY_WORKING | LIKELY_WORKING | Fixed: checks count, returns 404 if 0 |
| FN-015 | GET /api/conversations | LIKELY_WORKING | VERIFIED_WORKING | Added pagination, removed messages include (uses _count), + generalLimiter |
| FN-016 | POST /api/conversations | LIKELY_WORKING | LIKELY_WORKING | No changes needed |
| FN-017 | GET /api/conversations/:id | LIKELY_WORKING | LIKELY_WORKING | No changes needed |
| FN-018 | POST /api/conversations/:id/messages | LIKELY_WORKING | LIKELY_WORKING | Added checkTrial + aiLimiter |
| FN-019 | POST /channels/webchat/message | LIKELY_WORKING | LIKELY_WORKING | CRITICAL: Added webchatAuth middleware + aiLimiter |
| FN-020 | GET /billing/plan | LIKELY_WORKING | LIKELY_WORKING | No changes needed |
| FN-021 | GET /billing/trial-status | LIKELY_WORKING | LIKELY_WORKING | No changes needed |
| FN-022 | GET /billing/usage | LIKELY_WORKING | LIKELY_WORKING | FIXED: now filters by current month (was all-time) |
| FN-023 | PUT /workspace/onboarding | LIKELY_WORKING | LIKELY_WORKING | No changes needed |
| FN-024 | GET /crm/customers | LIKELY_WORKING | VERIFIED_WORKING | Added pagination + generalLimiter |
| FN-025 | POST /crm/customers | LIKELY_WORKING | LIKELY_WORKING | FIXED: Added Zod validation (was mass assignment) |
| FN-026 | GET /knowledge/documents | LIKELY_WORKING | VERIFIED_WORKING | Added pagination + generalLimiter |
| FN-027 | POST /knowledge/documents | LIKELY_WORKING | LIKELY_WORKING | FIXED: Added Zod validation (was mass assignment) |
| FN-028 | GET /analytics/dashboard | LIKELY_WORKING | LIKELY_WORKING | Added generalLimiter |
| FN-029 | GET /health | VERIFIED_WORKING | VERIFIED_WORKING | No changes needed |
| FN-030 | Error middleware | LIKELY_WORKING | LIKELY_WORKING | Improved: structured logging, errorId in response |
| FN-031 | app.listen | VERIFIED_WORKING | VERIFIED_WORKING | No changes needed |
| FN-032 | SIGTERM handler | LIKELY_WORKING | LIKELY_WORKING | No changes needed |

## Overall Statistics

| Status | Before | After |
|--------|--------|-------|
| VERIFIED_WORKING | 12 (9.9%) | 18 (14.9%) |
| LIKELY_WORKING | 80 (66.1%) | 74 (61.2%) |
| CANNOT_VERIFY | 7 (5.8%) | 7 (5.8%) |
| UNTESTED | 14 (11.6%) | 14 (11.6%) |
| PARTIALLY_WORKING | 1 (0.8%) | 0 (0%) |
| BROKEN | 0 | 0 |
| MOCK/STUB | 0 | 0 |

## Confidence Improvement

| Measure | Before | After |
|---------|--------|-------|
| Critical vulnerabilities | 3 | 0 |
| High-severity issues | 12 | 3 |
| Medium issues | 10 | 6 |
| Fixes applied | 0 | 20 |
| New features (pagination) | 0 | 5 endpoints |
| Rate limits added | 0 | 3 tiers |
| Validation schemas added | 0 | 3 endpoints |
