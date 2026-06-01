# Dead Code Report — AgentCore v3

## Summary

| Category | Count |
|----------|-------|
| Dead DB columns | 2 |
| Unused npm dependencies | 2 confirmed |
| Empty directories (planned but not implemented) | 3 |
| Functions with suspiciously low usage | 4 |
| Unused exports | 0 found |

## 1. Dead Database Columns

### Conversation.userId (schema.prisma:68)
- Marked: "@deprecated Dead column — never populated or read"
- Action: Remove or implement
- Risk: Breaking change if removed (migration needed)

### Workspace.subscriptionEndsAt (schema.prisma:17)
- Marked: "@deprecated Field not yet used — reserved for future"
- Action: Remove or implement subscription lifecycle

## 2. Unused npm Dependencies

### stripe (apps/api/package.json)
- Status: Imported nowhere in codebase
- Action: Remove or implement Stripe billing
- Cost: ~0 (not imported = tree-shaken from bundle)

### express-rate-limit (apps/api/package.json)
- Status: Not referenced in server.js
- Action: Implement rate limiting or remove

## 3. Empty Directories (Unimplemented Features)

| Directory | Intended Purpose | Status |
|-----------|-----------------|--------|
| src/hooks/ | React custom hooks | Empty — no hooks extracted |
| src/app/api/auth/ | Next.js API auth routes | Empty — all auth is in Express API |
| public/images/ | Static images | Empty — no images |

## 4. Suspect Functions

### KnowledgeDocument type fields (schema)
- "url" and "file" types defined but never used
- Only "text" type is created via API

### Agent.isActive field (schema.prisma:51)
- Defined but no API endpoint toggles it
- Default is true, never set to false

### BillingTransaction status "pending" (schema.prisma:127)
- Default is "completed"
- No code creates "pending" or "failed" transactions

## 5. CSS Classes with No Usage

The globals.css defines ~50 component classes. Most are used. However:
- `.clip-reveal` class — referenced in CSS but unclear if any component uses it
- `.laptop-frame`, `.laptop-base` — defined but not observed in components

## Recommendations

1. Remove deprecated DB columns (userId, subscriptionEndsAt) — migration required
2. Remove unused npm deps (stripe, express-rate-limit) or implement them
3. Remove empty directories or create placeholder files explaining intent
4. Implement status flow for BillingTransaction (pending → completed/failed)
5. Either use Agent.isActive in API or remove
