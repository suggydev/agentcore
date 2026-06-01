# Unverified Items Report — AgentCore v3

## What cannot be verified in current environment

| # | Item | Reason | Required to Verify |
|---|------|--------|-------------------|
| 1 | YooKassa payment flow (7 functions) | No YOOKASSA_SHOP_ID / SECRET_KEY | YooKassa sandbox credentials |
| 2 | Telegram DevOps Bot (7 functions) | No BOT_TOKEN | Telegram bot token + python-telegram-bot |
| 3 | All Python deploy scripts (except server-tested) | No Python environment setup | Python 3 + paramiko + server access |
| 4 | Quick deploy flow | Not executed | Server SSH access |
| 5 | Web-only deploy flow | Not executed | Server SSH access |
| 6 | Database migration safety | db push --accept-data-loss | Safe migration testing |
| 7 | Frontend component rendering | No test framework | Jest + React Testing Library |
| 8 | Frontend state management (Zustand) | No tests | Zustand test utilities |
| 9 | Error boundary behavior | No triggering tests | Error simulation |
| 10 | Streaming chat responses | No streaming test | SSE client test |
| 11 | Image generation flow | Not tested | Valid image prompt + API |
| 12 | Conversation message flow (100 lines) | Complex logic, not tested | Integration test |
| 13 | Webchat public endpoint (security) | Not tested | Penetration test |
| 14 | Trial expiry enforcement | Partially tested | Time manipulation test |
| 15 | Workspace onboarding merge logic | Not tested | Integration test |
| 16 | Analytics dashboard queries | Not tested | DB with mock data |
| 17 | Graceful shutdown (SIGTERM) | Not tested | Process signal test |
| 18 | Global error handler (async errors) | Not tested | express-async-errors test |
| 19 | Model routing (all 9 regex branches) | Partially tested | Test each routing branch |
| 20 | Prisma client generation | Verified on server | N/A |
| 21 | Docker compose PostgreSQL | Docker not running | Docker desktop |
| 22 | PM2 process management | Not tested with PM2 | PM2 installation |
| 23 | Docker volumes persistence | Not tested | Docker + restart cycle |
| 24 | Frontend GSAP animations | No visual test | Browser automation (Playwright/Cypress) |
| 25 | Frontend Framer Motion animations | No visual test | Browser automation |
| 26 | Command palette keyboard navigation | Not tested | E2E test |
| 27 | Onboarding tour steps | Not tested | E2E test |
| 28 | Cross-browser compatibility | Not tested | Multi-browser testing |
| 29 | Mobile responsiveness | Not tested | Device testing |
| 30 | Accessibility (a11y) | Not tested | a11y audit |

## Confidence Levels

| Level | Definition | Count |
|-------|-----------|-------|
| HIGH | Verified by runtime test or deploy smoke test | 12 |
| MEDIUM | Code pattern consistent with verified functions | 80 |
| LOW | Untested; untestable locally; complex logic | 29 |

## What WOULD be needed for full verification

1. **Test framework**: Jest + Supertest for API + React Testing Library for frontend
2. **CI/CD pipeline**: Automated test runs on push
3. **Staging environment**: Separate from production
4. **Test database**: Separate PostgreSQL with seed data
5. **Mock Suggy API**: For deterministic LLM tests
6. **YooKassa sandbox**: For payment flow testing
7. **Playwright/Cypress**: For E2E and visual tests
8. **Monitoring setup**: For verifying observability
