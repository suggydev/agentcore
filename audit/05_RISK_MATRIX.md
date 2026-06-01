# Risk Matrix — AgentCore v3

| # | Risk | Likelihood (1-5) | Impact (1-5) | Score | Owner | Mitigation Status |
|---|------|-----------------|-------------|-------|-------|-------------------|
| 1 | Data loss due to db push instead of migrations | 4 | 5 | 20 | PrismaMigrationsLead | NOT STARTED |
| 2 | Regression without tests catching it | 5 | 5 | 25 | TestBootstrapLead | NOT STARTED |
| 3 | Security breach via weak RBAC | 3 | 5 | 15 | RBACDesigner | NOT STARTED |
| 4 | DDoS / abuse on public webchat | 3 | 4 | 12 | WebChatPublicFixer | PARTIALLY DONE (rate limit + API key) |
| 5 | Billing incorrectness / revenue loss | 3 | 5 | 15 | BillingCoreRefactor | NOT STARTED |
| 6 | AI costs explode without metering | 4 | 4 | 16 | AIUsageMeteringLead | NOT STARTED |
| 7 | YooKassa integration broken in production | 3 | 4 | 12 | YooKassaHardeningLead | NOT STARTED |
| 8 | Streaming chat loses messages | 3 | 3 | 9 | StreamingConsistencyFixer | NOT STARTED |
| 9 | Monolithic server blocks team scaling | 4 | 3 | 12 | BackendDecomposer | NOT STARTED |
| 10 | No backup = total data loss on incident | 2 | 5 | 10 | BackupRestoreLead | NOT STARTED |
| 11 | Secrets in git history | 2 | 5 | 10 | SecretsScrubber | NOT STARTED |
| 12 | CORS too permissive (already fixed) | 1 | 4 | 4 | CORSHeadersFixer | DONE |
| 13 | Hardcoded secrets in code (already fixed) | 1 | 5 | 5 | SecurityAuditor | DONE |
| 14 | Cross-workspace data leakage | 2 | 5 | 10 | MultiTenantBoundaryAuditor | PARTIALLY DONE (workspaceId checks) |
| 15 | No observability = blind debugging | 4 | 3 | 12 | ObservabilityLead | NOT STARTED |
| 16 | Frontend bundle too large | 3 | 2 | 6 | PerformanceAuditor | NOT STARTED |
| 17 | Knowledge base not intelligent | 4 | 3 | 12 | KnowledgePipelineDesigner | NOT STARTED |
| 18 | No queue = slow response on heavy load | 3 | 3 | 9 | InfraDeploymentLead | NOT STARTED |
| 19 | Deploy scripts fail silently | 3 | 3 | 9 | DeployScriptsFixer | PARTIALLY DONE |
| 20 | Telegram bot unavailable for ops | 2 | 2 | 4 | TelegramBotFixer | NOT STARTED |

## Score Interpretation

| Score | Priority | Action |
|-------|----------|--------|
| 20-25 | CRITICAL | Immediate action required |
| 15-19 | HIGH | Address within 1-2 sprints |
| 10-14 | MEDIUM | Address within 1 month |
| 5-9 | LOW | Address when convenient |
| 1-4 | MINIMAL | Monitor only |

## TOP 5 Critical Risks

1. **Regression without tests (25)** — No automated tests = every change is risky
2. **Data loss from db push (20)** — Production data at risk
3. **AI costs explode (16)** — No metering = surprise bills
4. **Security breach via weak RBAC (15)** — All users have OWNER = no boundaries
5. **Billing incorrectness (15)** — Revenue at risk
