# Phase 1 — Agent Assignments

Assignments for all 137 functions from [`01_FUNCTION_INVENTORY.csv`](01_FUNCTION_INVENTORY.csv) to 25 audit agents.

Cross-cutting agents (23–25) analyze **all** functions for their respective domains.

---

## Agent Assignment Table

| # | Agent | Functions | Count |
|---|-------|-----------|-------|
| 1 | AuthAuditor | FN-0002, FN-0007, FN-0008, FN-0009, FN-0032 | 5 |
| 2 | MiddlewareAuditor | FN-0001, FN-0003, FN-0004, FN-0033, FN-0034, FN-0124 | 6 |
| 3 | SmartRoutingAuditor | FN-0005, FN-0006, FN-0010, FN-0011, FN-0012 | 5 |
| 4 | AgentsAPIAuditor | FN-0013, FN-0014, FN-0015, FN-0016 | 4 |
| 5 | ConversationsAuditor | FN-0017, FN-0018, FN-0019, FN-0020 | 4 |
| 6 | WebChatPublicAuditor | FN-0021 | 1 |
| 7 | BillingAuditor | FN-0022, FN-0023, FN-0024 | 3 |
| 8 | WorkspaceAuditor | FN-0025 | 1 |
| 9 | CRMAuditor | FN-0026, FN-0027 | 2 |
| 10 | KnowledgeBaseAuditor | FN-0028, FN-0029 | 2 |
| 11 | AnalyticsAuditor | FN-0030 | 1 |
| 12 | HealthAuditor | FN-0031 | 1 |
| 13 | YooKassaAuditor | FN-0035, FN-0036, FN-0037, FN-0038, FN-0039, FN-0040, FN-0041 | 7 |
| 14 | DeployScriptsAuditor | FN-0042, FN-0043, FN-0044, FN-0045, FN-0046, FN-0047, FN-0048, FN-0049, FN-0050, FN-0051 | 10 |
| 15 | TelegramBotAuditor | FN-0052, FN-0053, FN-0054, FN-0055, FN-0056, FN-0057, FN-0058 | 7 |
| 16 | PrismaSchemaAuditor | FN-0129, FN-0130, FN-0131, FN-0132, FN-0133, FN-0134, FN-0135, FN-0136 | 8 |
| 17 | StoreAuditor | FN-0059, FN-0060, FN-0061, FN-0062, FN-0063, FN-0064, FN-0065, FN-0066 | 8 |
| 18 | DataConfigAuditor | FN-0067, FN-0068, FN-0069 | 3 |
| 19 | LandingAuditor | FN-0071, FN-0072, FN-0073, FN-0074, FN-0075, FN-0076, FN-0077, FN-0078, FN-0079, FN-0080, FN-0081, FN-0082, FN-0083, FN-0084 | 14 |
| 20 | DashboardPagesAuditor | FN-0085, FN-0086, FN-0087, FN-0088, FN-0089, FN-0090, FN-0091, FN-0092, FN-0093, FN-0094, FN-0095, FN-0096, FN-0097, FN-0098, FN-0099, FN-0100, FN-0101, FN-0102, FN-0103, FN-0104, FN-0105, FN-0106, FN-0107, FN-0108, FN-0109 | 25 |
| 21 | ComponentsAuditor | FN-0110, FN-0111, FN-0112, FN-0113, FN-0114, FN-0115, FN-0116, FN-0117, FN-0118, FN-0119, FN-0120, FN-0121, FN-0122, FN-0123 | 14 |
| 22 | InfraConfigAuditor | FN-0124, FN-0125, FN-0126, FN-0127, FN-0128 | 5 |
| 23 | SecurityAuditor | **Cross-cutting:** auth, CORS, secrets, rate limits | — |
| 24 | PerformanceAuditor | **Cross-cutting:** N+1, caching, pagination | — |
| 25 | UXFlowAuditor | **Cross-cutting:** user journeys, onboarding, chat | — |

---

## Summary

- **Scoped agents (1–22):** 136 functions assigned
- **Cross-cutting agents (23–25):** analyze all functions
- **Total functions:** 136+ across 25 agents
