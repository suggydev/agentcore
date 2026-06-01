# Remaining Risks — AgentCore v3

## Risk Matrix

| Risk | Severity | Likelihood | Impact | Status |
|------|----------|-----------|--------|--------|
| Data loss via db push --accept-data-loss | CRITICAL | MEDIUM | HIGH | Not fixed |
| Zero test coverage | CRITICAL | HIGH | HIGH | Not addressed |
| No DB backups | HIGH | MEDIUM | HIGH | Not addressed |
| Async errors crash process | HIGH | MEDIUM | HIGH | Not fixed (no express-async-errors) |
| No CI/CD | MEDIUM | HIGH | MEDIUM | Not addressed |
| Monolithic server.js | MEDIUM | LOW | MEDIUM | Not refactored |
| Streaming chat doesn't save to DB | MEDIUM | MEDIUM | LOW | Not fixed |
| Webchat brute-force workspaceId | MEDIUM | LOW | MEDIUM | Partial (rate limited but IDs guessable) |
| CORS callback may cause 400 errors | LOW | MEDIUM | LOW | Needs testing |
| YooKassa untestable | LOW | N/A | LOW | Requires external keys |
| Frontend a11y unknown | LOW | MEDIUM | MEDIUM | Not tested |
| Mobile responsiveness unknown | LOW | MEDIUM | MEDIUM | Not tested |

## What's Needed for Production

1. **Test framework** — Jest + Supertest + React Testing Library
2. **CI/CD** — GitHub Actions with lint → test → build → deploy
3. **Database migrations** — Replace db push with proper migrations
4. **Backup strategy** — pg_dump cron + S3 storage
5. **Monitoring** — PM2 metrics + health alerts
6. **Structured logging** — Replace console.log with pino/winston
7. **Staging environment** — Separate from production
8. **E2E tests** — Playwright for critical flows
9. **Load testing** — Verify API handles production traffic
10. **Security audit** — Penetration testing by external team
