# Domain Model Evolution: v3 → v4

## Overview

This document describes the database schema evolution from the current **v3** schema (8 models) to the target **v4** schema (20+ models). The migration introduces multi-tenancy, enterprise features, granular permissions, advanced analytics, and robust billing/operations infrastructure.

---

## Current Schema (v3)

The v3 schema is built around a single workspace concept with basic CRM, knowledge base, and billing support.

### Model Summary

| # | Model | Key Fields |
|---|-------|-----------|
| 1 | **Workspace** | `id`, `name`, `plan`, `trialEndsAt`, `settings`, `createdAt`, `updatedAt` |
| 2 | **User** | `id`, `name`, `email`, `password`, `workspaceId`, `role`, `createdAt`, `updatedAt` |
| 3 | **Agent** | `id`, `name`, `description`, `model`, `systemPrompt`, `temperature`, `maxTokens`, `isActive`, `workspaceId`, `createdAt`, `updatedAt` |
| 4 | **Conversation** | `id`, `title`, `workspaceId`, `agentId`, `userId`, `createdAt`, `updatedAt` |
| 5 | **Message** | `id`, `content`, `role`, `model`, `order`, `conversationId`, `createdAt` |
| 6 | **CRMContact** | `id`, `name`, `email`, `phone`, `status`, `notes`, `workspaceId`, `createdAt`, `updatedAt` |
| 7 | **KnowledgeDocument** | `id`, `title`, `content`, `type`, `workspaceId`, `createdAt`, `updatedAt` |
| 8 | **BillingTransaction** | `id`, `workspaceId`, `amount`, `currency`, `status`, `provider`, `createdAt` |

### v3 Prisma Schema Reference

```prisma
model Workspace {
  id        String   @id @default(cuid())
  name      String
  plan      String   @default("free")
  trialEndsAt DateTime?
  settings  Json?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  users     User[]
  agents    Agent[]
  conversations Conversation[]
  crmContacts CRMContact[]
  knowledgeDocuments KnowledgeDocument[]
  billingTransactions BillingTransaction[]
}

model User {
  id          String   @id @default(cuid())
  name        String
  email       String   @unique
  password    String
  workspaceId String
  role        String   @default("member")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  workspace   Workspace @relation(fields: [workspaceId], references: [id])
  conversations Conversation[]
}

model Agent {
  id           String   @id @default(cuid())
  name         String
  description  String?
  model        String
  systemPrompt String?
  temperature  Float    @default(0.7)
  maxTokens    Int      @default(2048)
  isActive     Boolean  @default(true)
  workspaceId  String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  workspace    Workspace @relation(fields: [workspaceId], references: [id])
  conversations Conversation[]
}

model Conversation {
  id          String   @id @default(cuid())
  title       String?
  workspaceId String
  agentId     String?
  userId      String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  workspace   Workspace @relation(fields: [workspaceId], references: [id])
  agent       Agent?    @relation(fields: [agentId], references: [id])
  user        User?     @relation(fields: [userId], references: [id])
  messages    Message[]
}

model Message {
  id             String   @id @default(cuid())
  content        String
  role           String
  model          String?
  order          Int
  conversationId String
  createdAt      DateTime @default(now())

  conversation   Conversation @relation(fields: [conversationId], references: [id])
}

model CRMContact {
  id          String   @id @default(cuid())
  name        String
  email       String?
  phone       String?
  status      String   @default("lead")
  notes       String?
  workspaceId String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  workspace   Workspace @relation(fields: [workspaceId], references: [id])
}

model KnowledgeDocument {
  id          String   @id @default(cuid())
  title       String
  content     String
  type        String   @default("text")
  workspaceId String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  workspace   Workspace @relation(fields: [workspaceId], references: [id])
}

model BillingTransaction {
  id          String   @id @default(cuid())
  workspaceId String
  amount      Decimal
  currency    String   @default("USD")
  status      String
  provider    String
  createdAt   DateTime @default(now())

  workspace   Workspace @relation(fields: [workspaceId], references: [id])
}
```

---

## Target Schema (v4)

The v4 schema introduces enterprise-grade multi-tenancy, granular permissions, advanced AI agent management, multi-channel conversations, comprehensive analytics, and robust billing/operations infrastructure.

---

### Core Tenanting

#### Organization

Multi-org support. Replaces the single workspace concept for enterprise deployments.

```prisma
model Organization {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique
  logoUrl     String?
  billingEmail String
  metadata    Json?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  workspaces  Workspace[]
  roles       Role[]
}
```

#### Workspace

Project-level isolation within an organization.

```prisma
model Workspace {
  id              String   @id @default(cuid())
  name            String
  slug            String
  description     String?
  organizationId  String
  planId          String?
  settings        Json?
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  organization    Organization @relation(fields: [organizationId], references: [id])
  plan            Plan?        @relation(fields: [planId], references: [id])

  members         WorkspaceMember[]
  agents          Agent[]
  conversations   Conversation[]
  knowledgeDocuments KnowledgeDocument[]
  apiKeys         ApiKey[]
  webchatWidgets  WebchatWidget[]
  webhooks        Webhook[]
  auditLogs       AuditLog[]
  usageEvents     UsageEvent[]
  aggregateDaily  AggregateDaily[]
  subscriptions   Subscription[]
  usageQuotas     UsageQuota[]
  invoices        Invoice[]
  paymentMethods  PaymentMethod[]
}
```

#### WorkspaceMember

Many-to-many relationship between `User` and `Workspace` with assigned `Role`.

```prisma
model WorkspaceMember {
  id          String   @id @default(cuid())
  workspaceId String
  userId      String
  roleId      String
  invitedBy   String?
  joinedAt    DateTime @default(now())
  updatedAt   DateTime @updatedAt

  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  role        Role      @relation(fields: [roleId], references: [id])

  @@unique([workspaceId, userId])
  @@index([userId])
}
```

#### Role

Predefined and custom roles: `ADMIN`, `MANAGER`, `AGENT_OPERATOR`, `VIEWER`, `BILLING`.

```prisma
model Role {
  id          String   @id @default(cuid())
  name        String   // e.g. "ADMIN"
  displayName String
  description String?
  isSystem    Boolean  @default(false)
  organizationId String?
  workspaceId String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  organization Organization? @relation(fields: [organizationId], references: [id])
  workspace    Workspace?    @relation(fields: [workspaceId], references: [id])
  permissions  RolePermission[]
  members      WorkspaceMember[]

  @@unique([name, organizationId, workspaceId])
}
```

#### Permission

Granular permissions: `agents.create`, `conversations.read`, `billing.manage`, etc.

```prisma
model Permission {
  id          String   @id @default(cuid())
  scope       String   @unique // e.g. "agents.create"
  description String?
  category    String   // e.g. "agents", "billing", "conversations"
  createdAt   DateTime @default(now())

  roles       RolePermission[]
}

model RolePermission {
  roleId       String
  permissionId String

  role         Role       @relation(fields: [roleId], references: [id], onDelete: Cascade)
  permission   Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)

  @@id([roleId, permissionId])
}
```

---

### Identity & Access

#### User

Extended with MFA, email verification, avatar, and preferences.

```prisma
model User {
  id            String   @id @default(cuid())
  name          String
  email         String   @unique
  password      String
  avatarUrl     String?
  emailVerified Boolean  @default(false)
  mfaEnabled    Boolean  @default(false)
  mfaSecret     String?
  lastLoginAt   DateTime?
  preferences   Json?    // UI theme, notification settings, locale
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  memberships   WorkspaceMember[]
  sessions      Session[]
  refreshTokens RefreshToken[]
  apiKeys       ApiKey[]
  auditLogs     AuditLog[]
  conversations Conversation[]
}
```

#### RefreshToken

Secure long-lived session support with revocation.

```prisma
model RefreshToken {
  id        String   @id @default(cuid())
  userId    String
  tokenHash String   @unique
  expiresAt DateTime
  revoked   Boolean  @default(false)
  userAgent String?
  ip        String?
  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([tokenHash])
}
```

#### ApiKey

Programmatic access with scoped permissions and expiration.

```prisma
model ApiKey {
  id          String   @id @default(cuid())
  name        String
  keyHash     String   @unique
  scopes      String[] // e.g. ["agents:read", "conversations:write"]
  workspaceId String?
  userId      String
  lastUsedAt  DateTime?
  expiresAt   DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  workspace   Workspace? @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  user        User       @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([keyHash])
}
```

#### Session

Server-side session store (e.g., for express-session or custom session management).

```prisma
model Session {
  id        String   @id @default(cuid())
  sid       String   @unique
  userId    String?
  data      Json?    // serialized session payload
  expiresAt DateTime
  createdAt DateTime @default(now())

  user      User?    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([sid])
  @@index([expiresAt])
}
```

---

### AI & Agents

#### Agent

Versioning, drafts, publishing, and visual customization.

```prisma
model Agent {
  id            String   @id @default(cuid())
  name          String
  description   String?
  model         String
  systemPrompt  String?
  temperature   Float    @default(0.7)
  maxTokens     Int      @default(2048)
  isActive      Boolean  @default(true)
  version       Int      @default(1)
  parentAgentId String?  // for forks/clones
  isDraft       Boolean  @default(false)
  publishedAt   DateTime?
  icon          String?
  color         String?
  tags          String[]
  workspaceId   String
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  workspace     Workspace       @relation(fields: [workspaceId], references: [id])
  versions      AgentVersion[]
  deployments   AgentDeployment[]
  conversations Conversation[]
  parentAgent   Agent?          @relation("AgentFork", fields: [parentAgentId], references: [id])
  forkedAgents  Agent[]         @relation("AgentFork")
}
```

#### AgentVersion

Immutable config snapshots with changelog.

```prisma
model AgentVersion {
  id          String   @id @default(cuid())
  agentId     String
  version     Int
  config      Json     // full agent config snapshot
  changelog   String?
  createdBy   String?
  createdAt   DateTime @default(now())

  agent       Agent    @relation(fields: [agentId], references: [id], onDelete: Cascade)

  @@unique([agentId, version])
  @@index([agentId])
}
```

#### AgentDeployment

Track where and how agents are deployed.

```prisma
model AgentDeployment {
  id             String   @id @default(cuid())
  agentId        String
  channel        String   // "webchat", "telegram", "api", "slack"
  configOverrides Json?
  status         String   @default("active") // active, paused, archived
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  agent          Agent    @relation(fields: [agentId], references: [id], onDelete: Cascade)

  @@index([agentId])
  @@index([status])
}
```

#### ModelProvider

Abstraction over LLM providers for cost tracking and capability flags.

```prisma
model ModelProvider {
  id                 String   @id @default(cuid())
  name               String   @unique // e.g. "openai/gpt-4"
  displayName        String
  baseUrl            String?
  apiKeyEnvVar       String?
  supportsChat       Boolean  @default(true)
  supportsImage      Boolean  @default(false)
  supportsEmbedding  Boolean  @default(false)
  costPer1kInput     Decimal?
  costPer1kOutput    Decimal?
  isActive           Boolean  @default(true)
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
}
```

#### PromptTemplate

Reusable prompt fragments for agents.

```prisma
model PromptTemplate {
  id          String   @id @default(cuid())
  name        String
  template    String
  variables   String[] // e.g. ["customerName", "orderId"]
  category    String   @default("general")
  workspaceId String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  @@unique([name, workspaceId])
}
```

---

### Conversations & Channels

#### Conversation

Rich conversation metadata: channel, priority, assignment, resolution.

```prisma
model Conversation {
  id                String   @id @default(cuid())
  title             String?
  workspaceId       String
  agentId           String?
  userId            String?  // internal user who started or is assigned
  customerId        String?
  channel           String   @default("webchat") // webchat, telegram, whatsapp, email, slack, api
  externalId        String?  // provider-side thread ID
  priority          String   @default("normal") // low, normal, high, urgent
  status            String   @default("open") // open, pending, resolved, closed, spam
  assignedTo        String?  // userId
  tags              String[]
  resolvedAt        DateTime?
  satisfactionScore Int?     // 1-5 or 1-10
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  workspace         Workspace @relation(fields: [workspaceId], references: [id])
  agent             Agent?    @relation(fields: [agentId], references: [id])
  user              User?     @relation(fields: [userId], references: [id])
  customer          Customer? @relation(fields: [customerId], references: [id])
  messages          Message[]
  insights          ConversationInsight[]
}
```

#### Message

Enhanced with metadata, token usage, cost, latency, and feedback.

```prisma
model Message {
  id             String   @id @default(cuid())
  content        String
  role           String   // system, user, assistant, tool
  model          String?
  order          Int
  conversationId String
  metadata       Json?    // structured tool calls, attachments, etc.
  tokensUsed     Int?
  cost           Decimal?
  latencyMs      Int?
  feedback       String?  // thumbsUp, thumbsDown
  editedAt       DateTime?
  deletedAt      DateTime? // soft delete
  createdAt      DateTime @default(now())

  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)

  @@index([conversationId, order])
  @@index([createdAt])
}
```

#### Channel

Configuration for each supported communication channel.

```prisma
model Channel {
  id          String   @id @default(cuid())
  type        String   @unique // webchat, telegram, whatsapp, email, slack, api
  displayName String
  widgetId    String?  // references WebchatWidget for webchat type
  config      Json?    // provider-specific credentials and settings
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  widget      WebchatWidget? @relation(fields: [widgetId], references: [id])
}
```

#### WebchatWidget

Embeddable widget configuration per workspace.

```prisma
model WebchatWidget {
  id              String   @id @default(cuid())
  widgetId        String   @unique // public embed identifier
  workspaceId     String
  primaryColor    String   @default("#2563eb")
  position        String   @default("bottom-right")
  welcomeMessage  String?
  offlineMessage  String?
  avatarUrl       String?
  customCss       String?
  domains         String[] // allowlist for CORS/frame embedding
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  workspace       Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  channels        Channel[]
}
```

#### Customer

Unified customer profile across all channels (replaces and merges CRMContact).

```prisma
model Customer {
  id             String   @id @default(cuid())
  name           String?
  email          String?
  phone          String?
  externalIds    Json?    // { telegram: "123", whatsapp: "...", email: "..." }
  workspaceId    String
  firstSeenAt    DateTime @default(now())
  lastSeenAt     DateTime @default(now())
  sessionCount   Int      @default(0)
  totalMessages  Int      @default(0)
  country        String?
  language       String?
  deviceType     String?
  notes          String?
  status         String   @default("active") // active, churned, blocked
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  workspace      Workspace @relation(fields: [workspaceId], references: [id])
  conversations  Conversation[]
}
```

---

### Knowledge Base

#### KnowledgeDocument

File-backed documents with processing pipeline status.

```prisma
model KnowledgeDocument {
  id          String   @id @default(cuid())
  title       String
  content     String?
  fileUrl     String?
  fileSize    Int?
  mimeType    String?
  type        String   @default("text") // text, pdf, markdown, html
  status      String   @default("processing") // processing, indexed, failed
  workspaceId String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  workspace   Workspace @relation(fields: [workspaceId], references: [id])
  chunks      KnowledgeChunk[]
  searchLogs  KnowledgeSearchLog[]
}
```

#### KnowledgeChunk

Vector-searchable document chunks with embeddings.

```prisma
model KnowledgeChunk {
  id           String   @id @default(cuid())
  documentId   String
  content      String
  embedding    Bytes?   // or use vector extension: Unsupported("vector(1536)")
  chunkIndex   Int
  metadata     Json?
  tokenCount   Int?
  createdAt    DateTime @default(now())

  document     KnowledgeDocument @relation(fields: [documentId], references: [id], onDelete: Cascade)

  @@index([documentId])
  @@index([chunkIndex])
}
```

#### KnowledgeSearchLog

Audit and improve retrieval quality.

```prisma
model KnowledgeSearchLog {
  id          String   @id @default(cuid())
  query       String
  results     Json?    // matched chunk IDs and scores
  latencyMs   Int?
  userId      String?
  workspaceId String
  documentId  String?
  feedback    String?  // helpful, not_helpful
  createdAt   DateTime @default(now())

  workspace   Workspace         @relation(fields: [workspaceId], references: [id])
  document    KnowledgeDocument? @relation(fields: [documentId], references: [id])

  @@index([workspaceId, createdAt])
}
```

---

### Analytics & Events

#### UsageEvent

Fine-grained event stream for real-time and historical analytics.

```prisma
model UsageEvent {
  id          String   @id @default(cuid())
  workspaceId String
  eventType   String   // message, image, token, storage, agent_run
  quantity    Int      @default(1)
  cost        Decimal?
  model       String?
  metadata    Json?
  createdAt   DateTime @default(now())

  workspace   Workspace @relation(fields: [workspaceId], references: [id])

  @@index([workspaceId, eventType, createdAt])
  @@index([createdAt])
}
```

#### AggregateDaily

Pre-aggregated daily metrics for fast dashboard queries.

```prisma
model AggregateDaily {
  id                String   @id @default(cuid())
  date              DateTime @db.Date
  workspaceId       String
  messagesCount     Int      @default(0)
  conversationsCount Int     @default(0)
  uniqueUsers       Int      @default(0)
  tokensIn          Int      @default(0)
  tokensOut         Int      @default(0)
  cost              Decimal? @default(0)
  activeAgents      Int      @default(0)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  workspace         Workspace @relation(fields: [workspaceId], references: [id])

  @@unique([date, workspaceId])
  @@index([workspaceId, date])
}
```

#### ConversationInsight

ML/NLP-derived conversation analytics.

```prisma
model ConversationInsight {
  id               String   @id @default(cuid())
  conversationId   String   @unique
  sentiment        Float?   // -1 to 1
  intent           String?
  topics           String[]
  resolutionTime   Int?     // seconds
  handoffCount     Int      @default(0)
  aiConfidence     Float?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  conversation     Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
}
```

---

### Billing

#### Plan

Self-service plan definitions with feature flags and limits.

```prisma
model Plan {
  id           String   @id @default(cuid())
  name         String   @unique
  displayName  String
  priceMonthly Decimal?
  priceYearly  Decimal?
  messageLimit Int?
  agentLimit   Int?
  storageLimit Int?     // in MB
  seatLimit    Int?
  features     Json?    // { analytics: true, webhooks: true, ... }
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  workspaces   Workspace[]
  subscriptions Subscription[]
}
```

#### Subscription

Stripe/YooKassa subscription tracking per workspace.

```prisma
model Subscription {
  id                   String   @id @default(cuid())
  workspaceId          String
  planId               String
  status               String   // trialing, active, past_due, canceled, unpaid
  currentPeriodStart   DateTime
  currentPeriodEnd     DateTime
  cancelAtPeriodEnd    Boolean  @default(false)
  canceledAt           DateTime?
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt

  workspace            Workspace @relation(fields: [workspaceId], references: [id])
  plan                 Plan      @relation(fields: [planId], references: [id])

  @@unique([workspaceId])
  @@index([status, currentPeriodEnd])
}
```

#### UsageQuota

Current period consumption against plan limits.

```prisma
model UsageQuota {
  id             String   @id @default(cuid())
  workspaceId    String
  period         String   // YYYY-MM
  messagesUsed   Int      @default(0)
  messagesLimit  Int?
  agentsUsed     Int      @default(0)
  agentsLimit    Int?
  storageUsed    Int      @default(0) // MB
  storageLimit   Int?
  seatsUsed      Int      @default(0)
  seatsLimit     Int?
  resetAt        DateTime?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  workspace      Workspace @relation(fields: [workspaceId], references: [id])

  @@unique([workspaceId, period])
}
```

#### Invoice

Detailed invoice records with line items.

```prisma
model Invoice {
  id               String   @id @default(cuid())
  workspaceId      String
  amount           Decimal
  currency         String   @default("USD")
  status           String   // draft, open, paid, uncollectible, void
  dueDate          DateTime?
  paidAt           DateTime?
  items            Json?    // line items: [{ description, amount, quantity }]
  yookassaPaymentId String?
  stripeInvoiceId  String?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  workspace        Workspace @relation(fields: [workspaceId], references: [id])

  @@index([workspaceId, status])
  @@index([createdAt])
}
```

#### PaymentMethod

Stored payment instruments per workspace.

```prisma
model PaymentMethod {
  id          String   @id @default(cuid())
  workspaceId String
  type        String   // card, bank_transfer, yookassa, paypal
  providerToken String? // tokenized reference
  last4       String?
  brand       String?
  expiryMonth Int?
  expiryYear  Int?
  isDefault   Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  @@index([workspaceId])
}
```

---

### Operations

#### AuditLog

Comprehensive audit trail for compliance and debugging.

```prisma
model AuditLog {
  id           String   @id @default(cuid())
  workspaceId  String?
  userId       String?
  action       String   // e.g. "agent.updated", "conversation.deleted"
  resourceType String   // e.g. "Agent", "Conversation"
  resourceId   String?
  before       Json?    // previous state snapshot
  after        Json?    // new state snapshot
  ip           String?
  userAgent    String?
  createdAt    DateTime @default(now())

  workspace    Workspace? @relation(fields: [workspaceId], references: [id])
  user         User?      @relation(fields: [userId], references: [id])

  @@index([workspaceId, createdAt])
  @@index([userId, createdAt])
  @@index([resourceType, resourceId])
}
```

#### Webhook

Outbound webhook configuration with event filtering.

```prisma
model Webhook {
  id                 String   @id @default(cuid())
  workspaceId        String
  url                String
  events             String[] // e.g. ["message.created", "conversation.resolved"]
  secret             String   // HMAC signing secret
  status             String   @default("active") // active, paused, disabled
  lastDeliveryAt     DateTime?
  lastDeliveryStatus Int?     // HTTP status code
  retryCount         Int      @default(0)
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  workspace          Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  deliveries         WebhookDelivery[]

  @@index([workspaceId, status])
}
```

#### WebhookDelivery

Per-delivery attempt logs for reliability and debugging.

```prisma
model WebhookDelivery {
  id             String   @id @default(cuid())
  webhookId      String
  eventType      String
  payload        Json
  responseStatus Int?
  responseBody   String?  @db.Text
  attempt        Int      @default(1)
  createdAt      DateTime @default(now())

  webhook        Webhook  @relation(fields: [webhookId], references: [id], onDelete: Cascade)

  @@index([webhookId, createdAt])
}
```

#### SystemAlert

Internal operational alerting.

```prisma
model SystemAlert {
  id              String   @id @default(cuid())
  severity        String   // info, warning, error, critical
  component       String   // e.g. "billing", "llm", "embedding_pipeline"
  message         String
  details         Json?
  resolvedAt      DateTime?
  acknowledgedBy  String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([severity, createdAt])
  @@index([component, resolvedAt])
}
```

---

## Migration Strategy

### Principles

1. **Backward Compatibility**: v3 API and clients must continue functioning during the transition.
2. **Zero Downtime**: Use dual-write and feature flags; avoid destructive schema changes until cutover.
3. **Idempotency**: All backfill scripts must be safely re-runnable.
4. **Observability**: Log every migration step, count processed rows, and validate counts.

### Phase 1: Schema Preparation (Week 1)

1. **Add new tables as empty** alongside existing v3 tables.
2. **Create Prisma migration**: `prisma migrate dev --name v4_schema_baseline`.
3. **Add nullable columns** to existing tables where needed (e.g., `Customer` migration from `CRMContact`).
4. **Verify**: Run `prisma migrate status` and `prisma validate`.

### Phase 2: Backfill & Dual-Write (Week 2–3)

1. **Backfill static data**:
   - Insert default `Role` and `Permission` records.
   - Create `Organization` for every existing `Workspace` (single-org default).
   - Migrate `CRMContact` → `Customer` (map `status`, `notes`, add defaults for new fields).
   - Migrate `BillingTransaction` → `Invoice` + `PaymentMethod` stubs if data exists.

2. **Enable dual-write** behind feature flags:
   - Write to both v3 and v4 tables in application code.
   - Use `WRITE_V4=1` environment flag to control the new path.
   - Read from v3 by default; opt-in reads from v4 via `READ_V4=1`.

3. **Validation jobs**:
   - Hourly reconciliation: compare row counts and key aggregates between v3 and v4 tables.
   - Alert on any divergence.

### Phase 3: Cutover (Week 4)

1. **Promote v4 reads**: Switch `READ_V4=1` globally after 48 hours of zero divergence.
2. **Stop v3 writes**: Once reads are stable, disable dual-write to v3 tables (`WRITE_V4=1` only).
3. **Feature flags cleanup**: Remove old code paths.

### Phase 4: Cleanup (Week 5)

1. **Prune v3-only columns/tables**:
   - Drop deprecated columns (e.g., `Workspace.plan`, `User.workspaceId`, `User.role`).
   - Archive or drop old tables after 30-day retention.
2. **Final migration**: `prisma migrate dev --name v4_cleanup_v3`.
3. **Update documentation** and mark v3 API as deprecated.

### Rollback Plan

- **Before cutover**: Disable `WRITE_V4` and `READ_V4` flags; revert to v3-only code paths.
- **After cutover**: Restore v3 tables from pre-migration backup; redeploy previous release.
- **Database level**: Every destructive migration script must have an inverse rollback script committed to `migrations/rollback/`.

### Prisma Migration Checklist

```bash
# 1. Baseline new schema
npx prisma migrate dev --name v4_schema_baseline

# 2. Validate
npx prisma validate
npx prisma migrate status

# 3. Generate client for dual-write code
npx prisma generate

# 4. After cutover: cleanup migration
npx prisma migrate dev --name v4_cleanup_v3

# 5. Post-cleanup validation
npx prisma db pull   # ensure schema matches DB
npx prisma migrate deploy  # in CI/production
```

---

## Summary: v3 → v4 Model Mapping

| v3 Model | v4 Equivalent(s) | Notes |
|----------|-----------------|-------|
| Workspace | Organization + Workspace | Workspace becomes project-level; Organization adds multi-tenancy |
| User | User + WorkspaceMember + Role + Permission | Direct `workspaceId` and `role` replaced by many-to-many membership |
| Agent | Agent + AgentVersion + AgentDeployment + ModelProvider | Adds versioning, deployment tracking, provider abstraction |
| Conversation | Conversation + Channel + Customer + WebchatWidget | Richer metadata, channel abstraction, unified customer profile |
| Message | Message | Adds `metadata`, `tokensUsed`, `cost`, `latencyMs`, `feedback`, soft delete |
| CRMContact | Customer | Merged into unified cross-channel customer model |
| KnowledgeDocument | KnowledgeDocument + KnowledgeChunk + KnowledgeSearchLog | Adds file handling, vector chunks, search audit |
| BillingTransaction | Plan + Subscription + UsageQuota + Invoice + PaymentMethod | Full billing lifecycle replaces single transaction log |
| *(new)* | RefreshToken, ApiKey, Session | New identity/session infrastructure |
| *(new)* | PromptTemplate | Reusable prompt library |
| *(new)* | UsageEvent, AggregateDaily, ConversationInsight | Analytics and NLP-derived insights |
| *(new)* | AuditLog, Webhook, WebhookDelivery, SystemAlert | Operations and compliance infrastructure |
