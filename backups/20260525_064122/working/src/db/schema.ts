import {
  pgEnum,
  pgTable,
  uuid,
  text,
  integer,
  bigint,
  boolean,
  numeric,
  jsonb,
  timestamp,
  index,
  uniqueIndex,
  unique,
  check,
  primaryKey,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// ═══════════════════════════════════════════════════════════
// ENUMS
// ═══════════════════════════════════════════════════════════

export const appRoleEnum = pgEnum('app_role', [
  'owner',
  'admin',
  'operator',
  'viewer',
]);

export const agentTypeEnum = pgEnum('agent_type', [
  'browser',
  'crm',
  'support',
  'sales',
  'research',
  'custom',
]);

export const agentStatusEnum = pgEnum('agent_status', [
  'active',
  'paused',
  'error',
  'draft',
]);

export const executionStatusEnum = pgEnum('execution_status', [
  'success',
  'failed',
  'running',
  'timeout',
]);

export const leadStatusEnum = pgEnum('lead_status', [
  'new',
  'qualified',
  'contacted',
  'converted',
  'lost',
]);

export const subscriptionPlanEnum = pgEnum('subscription_plan', [
  'starter',
  'growth',
  'scale',
  'enterprise',
  'basic',
  'extended',
  'premium',
  'custom',
]);

export const subscriptionStatusEnum = pgEnum('subscription_status', [
  'trialing',
  'active',
  'past_due',
  'canceled',
  'pending',
]);

export const providerKindEnum = pgEnum('provider_kind', [
  'openai',
  'anthropic',
  'stripe',
  'smtp',
  'lovable_ai',
  'custom',
  'slack',
  'telegram_user',
  'amocrm',
  'bitrix24',
  'zapier',
  'hubspot',
  'salesforce',
  'whatsapp',
]);

export const walletTxTypeEnum = pgEnum('wallet_tx_type', [
  'topup',
  'usage',
  'refund',
  'adjustment',
  'subscription',
]);

export const walletTxStatusEnum = pgEnum('wallet_tx_status', [
  'pending',
  'succeeded',
  'failed',
  'canceled',
]);

export const agentRequestStatusEnum = pgEnum('agent_request_status', [
  'new',
  'contacted',
  'in_progress',
  'done',
  'declined',
]);

export const agentRequestTierEnum = pgEnum('agent_request_tier', [
  'pilot',
  'standard',
  'enterprise',
]);

// ═══════════════════════════════════════════════════════════
// COMPANIES
// ═══════════════════════════════════════════════════════════

export const companies = pgTable('companies', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  industry: text('industry'),
  companySize: text('company_size'),
  useCase: text('use_case'),
  country: text('country'),
  timezone: text('timezone').default('UTC'),
  logoUrl: text('logo_url'),
  dataRetentionDays: integer('data_retention_days').default(90),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ═══════════════════════════════════════════════════════════
// PROFILES
// ═══════════════════════════════════════════════════════════

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey(),
  email: text('email'),
  fullName: text('full_name'),
  avatarUrl: text('avatar_url'),
  passwordHash: text('password_hash'),
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'set null' }),
  twoFactorSecret: text('two_factor_secret'),
  twoFactorEnabled: boolean('two_factor_enabled').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ═══════════════════════════════════════════════════════════
// USER ROLES
// ═══════════════════════════════════════════════════════════

export const userRoles = pgTable(
  'user_roles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    role: appRoleEnum('role').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    unqUserRole: unique().on(t.userId, t.companyId, t.role),
  }),
);

// ═══════════════════════════════════════════════════════════
// AGENTS
// ═══════════════════════════════════════════════════════════

export const agents = pgTable(
  'agents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    type: agentTypeEnum('type').notNull().default('custom'),
    model: text('model').notNull().default('google/gemini-2.5-flash'),
    status: agentStatusEnum('status').notNull().default('draft'),
    config: jsonb('config').notNull().default(sql`'{}'::jsonb`),
    tools: jsonb('tools').notNull().default(sql`'[]'::jsonb`),
    memoryMode: text('memory_mode').default('short'),
    maxTokensPerTask: integer('max_tokens_per_task').default(8000),
    dailyBudgetUsd: numeric('daily_budget_usd', { precision: 10, scale: 2 }).default('10.00'),
    timeoutSeconds: integer('timeout_seconds').default(120),
    rateLimitPerMin: integer('rate_limit_per_min').default(60),
    isTestMode: boolean('is_test_mode').default(false),
    // Tone & communication
    tone: text('tone').notNull().default('professional'),
    toneInstructions: text('tone_instructions'),
    greetingTemplate: text('greeting_template'),
    closingTemplate: text('closing_template'),
    // Restrictions
    restrictions: text('restrictions').array().notNull().default(sql`'{}'`),
    forbiddenTopics: text('forbidden_topics').array().notNull().default(sql`'{}'`),
    maxAutoRepliesPerConversation: integer('max_auto_replies_per_conversation').notNull().default(0),
    // Rate limiting / scheduling
    maxMessagesPerDay: integer('max_messages_per_day').notNull().default(0),
    maxRunsPerDay: integer('max_runs_per_day').notNull().default(0),
    maxAutoRepliesPerDay: integer('max_auto_replies_per_day').notNull().default(0),
    allowedHoursStart: integer('allowed_hours_start'),
    allowedHoursEnd: integer('allowed_hours_end'),
    allowedDays: text('allowed_days').array().default(sql`'{"mon","tue","wed","thu","fri","sat","sun"}'`),
    createdBy: uuid('created_by'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('agents_company_id_idx').on(t.companyId),
    check('chk_allowed_hours_start', sql`${t.allowedHoursStart} IS NULL OR (${t.allowedHoursStart} >= 0 AND ${t.allowedHoursStart} <= 23)`),
    check('chk_allowed_hours_end', sql`${t.allowedHoursEnd} IS NULL OR (${t.allowedHoursEnd} >= 0 AND ${t.allowedHoursEnd} <= 23)`),
  ],
);

// ═══════════════════════════════════════════════════════════
// AGENT LOGS / EXECUTIONS
// ═══════════════════════════════════════════════════════════

export const agentLogs = pgTable(
  'agent_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    agentId: uuid('agent_id')
      .notNull()
      .references(() => agents.id, { onDelete: 'cascade' }),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    taskType: text('task_type'),
    prompt: text('prompt'),
    response: text('response'),
    toolCalls: jsonb('tool_calls').default(sql`'[]'::jsonb`),
    tokensUsed: integer('tokens_used').default(0),
    costUsd: numeric('cost_usd', { precision: 10, scale: 4 }).default('0'),
    durationMs: integer('duration_ms').default(0),
    status: executionStatusEnum('status').notNull().default('running'),
    errorMessage: text('error_message'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('agent_logs_agent_id_created_at_idx').on(t.agentId, t.createdAt),
    index('agent_logs_company_id_created_at_idx').on(t.companyId, t.createdAt),
  ],
);

// ═══════════════════════════════════════════════════════════
// LEADS / CRM
// ═══════════════════════════════════════════════════════════

export const leads = pgTable(
  'leads',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    agentId: uuid('agent_id').references(() => agents.id, { onDelete: 'set null' }),
    name: text('name'),
    email: text('email'),
    phone: text('phone'),
    status: leadStatusEnum('status').notNull().default('new'),
    aiScore: integer('ai_score').default(0),
    notes: text('notes'),
    source: text('source'),
    metadata: jsonb('metadata').default(sql`'{}'::jsonb`),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    lastActionAt: timestamp('last_action_at', { withTimezone: true }),
  },
  (t) => [index('leads_company_id_created_at_idx').on(t.companyId, t.createdAt)],
);

// ═══════════════════════════════════════════════════════════
// API KEYS
// ═══════════════════════════════════════════════════════════

export const apiKeys = pgTable('api_keys', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id')
    .notNull()
    .references(() => companies.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  keyPrefix: text('key_prefix').notNull(),
  keyHash: text('key_hash').notNull(),
  scopes: text('scopes').array().default(sql`'{}'`),
  rateLimitPerMin: integer('rate_limit_per_min').default(60),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  createdBy: uuid('created_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ═══════════════════════════════════════════════════════════
// AUDIT LOGS
// ═══════════════════════════════════════════════════════════

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    userId: uuid('user_id'),
    action: text('action').notNull(),
    resourceType: text('resource_type'),
    resourceId: uuid('resource_id'),
    metadata: jsonb('metadata').default(sql`'{}'::jsonb`),
    ipAddress: text('ip_address'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('audit_logs_company_id_created_at_idx').on(t.companyId, t.createdAt)],
);

// ═══════════════════════════════════════════════════════════
// ALERTS
// ═══════════════════════════════════════════════════════════

export const alerts = pgTable(
  'alerts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    triggerType: text('trigger_type').notNull(),
    threshold: jsonb('threshold').default(sql`'{}'::jsonb`),
    channels: jsonb('channels').default(sql`'[]'::jsonb`),
    enabled: boolean('enabled').default(true),
    lastFiredAt: timestamp('last_fired_at', { withTimezone: true }),
    agentId: uuid('agent_id').references(() => agents.id, { onDelete: 'set null' }),
    cooldownMinutes: integer('cooldown_minutes').notNull().default(5),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('idx_alerts_enabled').on(t.enabled).where(sql`${t.enabled} = true`),
    index('idx_alerts_company_enabled').on(t.companyId, t.enabled),
  ],
);

// ═══════════════════════════════════════════════════════════
// SUBSCRIPTIONS
// ═══════════════════════════════════════════════════════════

export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id')
    .notNull()
    .references(() => companies.id, { onDelete: 'cascade' }),
  plan: subscriptionPlanEnum('plan').notNull().default('basic'),
  status: subscriptionStatusEnum('status').notNull().default('pending'),
  trialEndsAt: timestamp('trial_ends_at', { withTimezone: true }),
  currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }),
  stripeCustomerId: text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  paymentMethodId: text('payment_method_id'),
  yookassaSubscriptionId: text('yookassa_subscription_id'),
  lastPaymentId: text('last_payment_id'),
  lastPaymentDate: timestamp('last_payment_date', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ═══════════════════════════════════════════════════════════
// INTEGRATIONS
// ═══════════════════════════════════════════════════════════

export const integrations = pgTable('integrations', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id')
    .notNull()
    .references(() => companies.id, { onDelete: 'cascade' }),
  provider: text('provider').notNull(),
  config: jsonb('config').default(sql`'{}'::jsonb`),
  enabled: boolean('enabled').default(true),
  lastSyncAt: timestamp('last_sync_at', { withTimezone: true }),
  lastError: text('last_error'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ═══════════════════════════════════════════════════════════
// INVITATIONS
// ═══════════════════════════════════════════════════════════

export const invitations = pgTable(
  'invitations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    email: text('email').notNull(),
    role: appRoleEnum('role').notNull().default('viewer'),
    token: text('token').notNull().unique().default(sql`encode(gen_random_bytes(24),'hex')`),
    invitedBy: uuid('invited_by'),
    acceptedAt: timestamp('accepted_at', { withTimezone: true }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull().default(sql`now() + interval '7 days'`),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
);

// ═══════════════════════════════════════════════════════════
// PROVIDER CREDENTIALS
// ═══════════════════════════════════════════════════════════

export const providerCredentials = pgTable(
  'provider_credentials',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: uuid('company_id').notNull(),
    provider: providerKindEnum('provider').notNull(),
    label: text('label').notNull(),
    last4: text('last4').notNull().default(''),
    encrypted: text('encrypted').notNull(),
    iv: text('iv').notNull(),
    tag: text('tag').notNull(),
    meta: jsonb('meta').notNull().default(sql`'{}'::jsonb`),
    status: text('status').notNull().default('untested'),
    lastTestedAt: timestamp('last_tested_at', { withTimezone: true }),
    lastTestError: text('last_test_error'),
    createdBy: uuid('created_by'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('provider_credentials_company_id_idx').on(t.companyId)],
);

// ═══════════════════════════════════════════════════════════
// WALLET TRANSACTIONS
// ═══════════════════════════════════════════════════════════

export const walletTransactions = pgTable(
  'wallet_transactions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: uuid('company_id').notNull(),
    type: walletTxTypeEnum('type').notNull(),
    status: walletTxStatusEnum('status').notNull().default('pending'),
    amountKopecks: bigint('amount_kopecks', { mode: 'number' }).notNull(),
    currency: text('currency').notNull().default('RUB'),
    description: text('description'),
    externalId: text('external_id'),
    metadata: jsonb('metadata').notNull().default(sql`'{}'::jsonb`),
    createdBy: uuid('created_by'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('idx_wallet_tx_company_created').on(t.companyId, t.createdAt),
    index('idx_wallet_tx_external').on(t.externalId).where(sql`${t.externalId} IS NOT NULL`),
  ],
);

// ═══════════════════════════════════════════════════════════
// AGENTCORE SETTINGS
// ═══════════════════════════════════════════════════════════

export const agentcoreSettings = pgTable('agentcore_settings', {
  companyId: uuid('company_id').primaryKey(),
  balanceKopecks: bigint('balance_kopecks', { mode: 'number' }).notNull().default(0),
  upstreamBaseUrl: text('upstream_base_url').notNull().default('https://api.openai.com/v1'),
  upstreamEncrypted: text('upstream_encrypted'),
  upstreamIv: text('upstream_iv'),
  upstreamTag: text('upstream_tag'),
  upstreamLast4: text('upstream_last4').notNull().default(''),
  upstreamLabel: text('upstream_label').notNull().default('OpenAI'),
  defaultModel: text('default_model').notNull().default('gpt-4o-mini'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ═══════════════════════════════════════════════════════════
// AGENT REQUESTS
// ═══════════════════════════════════════════════════════════

export const agentRequests = pgTable(
  'agent_requests',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: uuid('company_id').notNull(),
    userId: uuid('user_id'),
    taskDescription: text('task_description').notNull(),
    industry: text('industry'),
    deadline: text('deadline'),
    budgetTier: agentRequestTierEnum('budget_tier').notNull().default('pilot'),
    contactEmail: text('contact_email').notNull(),
    contactPhone: text('contact_phone'),
    status: agentRequestStatusEnum('status').notNull().default('new'),
    managerNotes: text('manager_notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('idx_agent_requests_company').on(t.companyId, t.createdAt)],
);

// ═══════════════════════════════════════════════════════════
// INCIDENTS
// ═══════════════════════════════════════════════════════════

export const incidents = pgTable(
  'incidents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    agentId: uuid('agent_id').references(() => agents.id, { onDelete: 'set null' }),
    category: text('category').notNull().default('unknown'),
    severity: text('severity').notNull().default('medium'),
    title: text('title').notNull(),
    details: jsonb('details').notNull().default(sql`'{}'::jsonb`),
    status: text('status').notNull().default('open'),
    occurrences: integer('occurrences').notNull().default(1),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('incidents_company_idx').on(t.companyId, t.lastSeenAt)],
);

// ═══════════════════════════════════════════════════════════
// PLAN USAGE
// ═══════════════════════════════════════════════════════════

export const planUsage = pgTable(
  'plan_usage',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    resource: text('resource').notNull(),
    periodMonth: text('period_month').notNull(),
    count: integer('count').notNull().default(0),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique().on(t.companyId, t.resource, t.periodMonth),
    index('idx_plan_usage_company_period').on(t.companyId, t.resource, t.periodMonth),
  ],
);

// ═══════════════════════════════════════════════════════════
// TELEGRAM MESSAGES
// ═══════════════════════════════════════════════════════════

export const telegramMessages = pgTable(
  'telegram_messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    telegramUserId: bigint('telegram_user_id', { mode: 'number' }).notNull(),
    chatId: bigint('chat_id', { mode: 'number' }).notNull(),
    fromUserId: bigint('from_user_id', { mode: 'number' }),
    text: text('text'),
    raw: jsonb('raw'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('idx_telegram_messages_company').on(t.companyId, t.createdAt),
    index('idx_telegram_messages_chat').on(t.chatId, t.createdAt),
  ],
);

// ═══════════════════════════════════════════════════════════
// TELEGRAM USER SESSIONS
// ═══════════════════════════════════════════════════════════

export const telegramUserSessions = pgTable('telegram_user_sessions', {
  id: text('id').primaryKey(),
  companyId: uuid('company_id')
    .notNull()
    .references(() => companies.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  phone: text('phone').notNull(),
  telegramUserId: bigint('telegram_user_id', { mode: 'number' }),
  phoneCodeHash: text('phone_code_hash'),
  status: text('status').notNull().default('pending'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ═══════════════════════════════════════════════════════════
// WHATSAPP MESSAGES
// ═══════════════════════════════════════════════════════════

export const whatsappMessages = pgTable(
  'whatsapp_messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    phoneNumberId: text('phone_number_id').notNull(),
    fromUser: text('from_user').notNull(),
    messageType: text('message_type').notNull().default('text'),
    text: text('text'),
    mediaUrl: text('media_url'),
    whatsappId: text('whatsapp_id'),
    deliveryStatus: text('delivery_status').default('pending'),
    raw: jsonb('raw'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('idx_whatsapp_messages_company').on(t.companyId, t.createdAt),
    index('idx_whatsapp_messages_from').on(t.fromUser, t.createdAt),
  ],
);

// ═══════════════════════════════════════════════════════════
// NOTIFICATIONS LOG
// ═══════════════════════════════════════════════════════════

export const notificationsLog = pgTable(
  'notifications_log',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    recipient: text('recipient').notNull(),
    template: text('template').notNull(),
    vars: jsonb('vars'),
    status: text('status').notNull().default('pending'),
    errorMessage: text('error_message'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('idx_notifications_log_company').on(t.companyId, t.createdAt)],
);

// ═══════════════════════════════════════════════════════════
// SUPPORT CHATS
// ═══════════════════════════════════════════════════════════

export const supportChats = pgTable(
  'support_chats',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').references(() => profiles.id, { onDelete: 'set null' }),
    guestEmail: text('guest_email'),
    sessionId: text('session_id').notNull().unique(),
    status: text('status').notNull().default('open'),
    assignedOperatorId: uuid('assigned_operator_id').references(() => profiles.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    closedAt: timestamp('closed_at', { withTimezone: true }),
  },
  (t) => [
    index('idx_support_chats_session').on(t.sessionId),
    index('idx_support_chats_company').on(t.companyId, t.createdAt),
  ],
);

// ═══════════════════════════════════════════════════════════
// SUPPORT MESSAGES
// ═══════════════════════════════════════════════════════════

export const supportMessages = pgTable(
  'support_messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    chatId: uuid('chat_id')
      .notNull()
      .references(() => supportChats.id, { onDelete: 'cascade' }),
    senderId: uuid('sender_id').references(() => profiles.id),
    senderType: text('sender_type').notNull(),
    message: text('message').notNull(),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('idx_support_messages_chat').on(t.chatId, t.createdAt)],
);

// ═══════════════════════════════════════════════════════════
// AGENT KNOWLEDGE
// ═══════════════════════════════════════════════════════════

export const agentKnowledge = pgTable(
  'agent_knowledge',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    agentId: uuid('agent_id').references(() => agents.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    content: text('content').notNull().default(''),
    category: text('category').notNull().default('general'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('idx_agent_knowledge_company').on(t.companyId),
    index('idx_agent_knowledge_agent').on(t.agentId).where(sql`${t.agentId} IS NOT NULL`),
    index('idx_agent_knowledge_category').on(t.companyId, t.category),
  ],
);

// ═══════════════════════════════════════════════════════════
// AGENT VERSIONS
// ═══════════════════════════════════════════════════════════

export const agentVersions = pgTable(
  'agent_versions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    agentId: uuid('agent_id')
      .notNull()
      .references(() => agents.id, { onDelete: 'cascade' }),
    version: integer('version').notNull(),
    snapshot: jsonb('snapshot').notNull(),
    changeDescription: text('change_description'),
    createdBy: uuid('created_by').references(() => profiles.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique().on(t.agentId, t.version),
    index('idx_agent_versions_agent').on(t.agentId, t.version),
    index('idx_agent_versions_created').on(t.agentId, t.createdAt),
  ],
);

// ═══════════════════════════════════════════════════════════
// AGENT TEST RESULTS
// ═══════════════════════════════════════════════════════════

export const agentTestResults = pgTable(
  'agent_test_results',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    agentId: uuid('agent_id')
      .notNull()
      .references(() => agents.id, { onDelete: 'cascade' }),
    scenarioName: text('scenario_name').notNull(),
    input: text('input').notNull(),
    response: text('response'),
    metrics: jsonb('metrics'),
    passed: boolean('passed'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('idx_test_results_agent').on(t.agentId, t.createdAt)],
);

// ═══════════════════════════════════════════════════════════
// ROLE PERMISSIONS
// ═══════════════════════════════════════════════════════════

export const rolePermissions = pgTable(
  'role_permissions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    permission: text('permission').notNull(),
    granted: boolean('granted').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique('uq_role_permissions_user_perm').on(t.companyId, t.userId, t.permission),
    index('idx_role_permissions_company_user').on(t.companyId, t.userId),
  ],
);

// ═══════════════════════════════════════════════════════════
// AGENT TRIGGERS
// ═══════════════════════════════════════════════════════════

export const agentTriggers = pgTable(
  'agent_triggers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    agentId: uuid('agent_id')
      .notNull()
      .references(() => agents.id, { onDelete: 'cascade' }),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    triggerType: text('trigger_type').notNull(),
    config: jsonb('config').notNull().default(sql`'{}'::jsonb`),
    enabled: boolean('enabled').notNull().default(true),
    lastFiredAt: timestamp('last_fired_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('idx_agent_triggers_agent').on(t.agentId),
    index('idx_agent_triggers_company').on(t.companyId, t.enabled),
  ],
);

// ═══════════════════════════════════════════════════════════
// ONBOARDING STATE
// ═══════════════════════════════════════════════════════════

export const onboardingState = pgTable(
  'onboarding_state',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    completedSteps: integer('completed_steps').array().notNull().default(sql`'{}'`),
    dismissed: boolean('dismissed').notNull().default(false),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique().on(t.userId)],
);

// ═══════════════════════════════════════════════════════════
// TYPE EXPORTS FOR CONVENIENCE
// ═══════════════════════════════════════════════════════════

export type Company = typeof companies.$inferSelect;
export type NewCompany = typeof companies.$inferInsert;
export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
export type UserRole = typeof userRoles.$inferSelect;
export type NewUserRole = typeof userRoles.$inferInsert;
export type Agent = typeof agents.$inferSelect;
export type NewAgent = typeof agents.$inferInsert;
export type AgentLog = typeof agentLogs.$inferSelect;
export type NewAgentLog = typeof agentLogs.$inferInsert;
export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;
export type ApiKey = typeof apiKeys.$inferSelect;
export type NewApiKey = typeof apiKeys.$inferInsert;
export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
export type Alert = typeof alerts.$inferSelect;
export type NewAlert = typeof alerts.$inferInsert;
export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;
export type Integration = typeof integrations.$inferSelect;
export type NewIntegration = typeof integrations.$inferInsert;
export type Invitation = typeof invitations.$inferSelect;
export type NewInvitation = typeof invitations.$inferInsert;
export type ProviderCredential = typeof providerCredentials.$inferSelect;
export type NewProviderCredential = typeof providerCredentials.$inferInsert;
export type WalletTransaction = typeof walletTransactions.$inferSelect;
export type NewWalletTransaction = typeof walletTransactions.$inferInsert;
export type AgentcoreSetting = typeof agentcoreSettings.$inferSelect;
export type NewAgentcoreSetting = typeof agentcoreSettings.$inferInsert;
export type AgentRequest = typeof agentRequests.$inferSelect;
export type NewAgentRequest = typeof agentRequests.$inferInsert;
export type Incident = typeof incidents.$inferSelect;
export type NewIncident = typeof incidents.$inferInsert;
export type PlanUsage = typeof planUsage.$inferSelect;
export type NewPlanUsage = typeof planUsage.$inferInsert;
export type TelegramMessage = typeof telegramMessages.$inferSelect;
export type NewTelegramMessage = typeof telegramMessages.$inferInsert;
export type TelegramUserSession = typeof telegramUserSessions.$inferSelect;
export type NewTelegramUserSession = typeof telegramUserSessions.$inferInsert;
export type WhatsappMessage = typeof whatsappMessages.$inferSelect;
export type NewWhatsappMessage = typeof whatsappMessages.$inferInsert;
export type NotificationsLog = typeof notificationsLog.$inferSelect;
export type NewNotificationsLog = typeof notificationsLog.$inferInsert;
export type SupportChat = typeof supportChats.$inferSelect;
export type NewSupportChat = typeof supportChats.$inferInsert;
export type SupportMessage = typeof supportMessages.$inferSelect;
export type NewSupportMessage = typeof supportMessages.$inferInsert;
export type AgentKnowledge = typeof agentKnowledge.$inferSelect;
export type NewAgentKnowledge = typeof agentKnowledge.$inferInsert;
export type AgentVersion = typeof agentVersions.$inferSelect;
export type NewAgentVersion = typeof agentVersions.$inferInsert;
export type AgentTestResult = typeof agentTestResults.$inferSelect;
export type NewAgentTestResult = typeof agentTestResults.$inferInsert;
export type RolePermission = typeof rolePermissions.$inferSelect;
export type NewRolePermission = typeof rolePermissions.$inferInsert;
export type AgentTrigger = typeof agentTriggers.$inferSelect;
export type NewAgentTrigger = typeof agentTriggers.$inferInsert;
export type OnboardingState = typeof onboardingState.$inferSelect;
export type NewOnboardingState = typeof onboardingState.$inferInsert;
