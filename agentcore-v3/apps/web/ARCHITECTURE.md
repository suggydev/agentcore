# AgentCore — Architecture & Design System

> Control Center for Digital Employees

---

## 1. UX Architecture

### Core Philosophy
Dashboard = "Control Center". Пользователь управляет цифровым сотрудником, а не просто настраивает чат-бота.

### User Flow

```
Landing Page
  → Sign Up / Login
    → Onboarding (5 steps)
      → Workspace Info
      → Agent Goal
      → Agent Persona (Role, Tone, Emotions, Speed)
      → Knowledge Base (Docs, FAQ, URLs)
      → Brain Map Preview
    → Dashboard Overview
      → Agents List
      → Brain Map Editor (React Flow)
      → Test Chat (Brain Map + Chat side-by-side)
      → Knowledge Management
      → Integrations
      → Analytics
      → Billing & Trial
      → Settings
```

### Onboarding Flow (Detailed)

| Step | Content | Data Collected |
|------|---------|----------------|
| 1 | Company Info | Name, Size, Industry, Geography, Channels, Website, CRM |
| 2 | Agent Goal | Sales / Support / Consulting / Internal / Custom |
| 3 | Agent Persona | Name, Greeting, Tone, Speed, Emoji, Humor, Emotions, Forbidden Words, Aggression Handling, Human-like Rules |
| 4 | Knowledge Base | Documents, FAQ text, Website URL, Notion, Google Drive |
| 5 | Brain Map Preview | Visual flow: Greeting → Qualification → FAQ → Lead Capture → Escalation |
| 6 | Ready / Launch | Summary → Create Agent → Test Agent → Go to Dashboard |

### Trial Logic (7 days, no card)

- Trial starts automatically after onboarding completion.
- `trialStartedAt` stored in `localStorage` + backend.
- Every page load: calculate `daysLeft = max(0, 7 - floor((now - startedAt) / 86400000))`.
- If `daysLeft <= 0`: show upgrade banner, disable agent creation (read-only mode).
- No payment method required during trial.
- Transparent limits shown in trial banner:
  - 3 agents max
  - 1,000 operations
  - 2 channels
  - Basic analytics

---

## 2. Database Architecture (Prisma / PostgreSQL)

```prisma
// User & Workspace
model User {
  id          String    @id @default(cuid())
  email       String    @unique
  name        String?
  password    String    // hashed
  role        Role      @default(OWNER)
  workspaceId String?
  workspace   Workspace? @relation(fields: [workspaceId], references: [id])
  createdAt   DateTime  @default(now())
}

model Workspace {
  id                String   @id @default(cuid())
  name              String
  companyName       String?
  companySize       String?
  industry          String?
  geography         String?
  channels          String[] // JSON array
  websiteUrl        String?
  crm               String?
  trialStartedAt    DateTime?
  trialDays         Int      @default(7)
  plan              String   @default("trial")
  users             User[]
  agents            Agent[]
  conversations     Conversation[]
  documents         Document[]
  integrations      Integration[]
  settings          Json?    // flexible workspace settings
  createdAt         DateTime @default(now())
}

// Agent & Persona
model Agent {
  id              String   @id @default(cuid())
  name            String
  description     String?
  model           String   @default("gpt-4o")
  systemPrompt    String   @db.Text
  temperature     Float    @default(0.7)
  isActive        Boolean  @default(true)
  workspaceId     String
  workspace       Workspace @relation(fields: [workspaceId], references: [id])
  persona         Json?    // AgentPersona object
  brainMap        Json?    // { nodes: Node[], edges: Edge[] }
  knowledgeDocs   Document[]
  conversations   Conversation[]
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

// Knowledge
model Document {
  id          String    @id @default(cuid())
  title       String
  type        String    // pdf, txt, md, url, notion, gdrive
  content     String?   @db.Text
  wordCount   Int       @default(0)
  source      String?
  agentId     String?
  agent       Agent?    @relation(fields: [agentId], references: [id])
  workspaceId String
  workspace   Workspace @relation(fields: [workspaceId], references: [id])
  createdAt   DateTime  @default(now())
}

// Conversations
model Conversation {
  id        String    @id @default(cuid())
  title     String?
  status    String    @default("active") // active, resolved, pending
  agentId   String?
  agent     Agent?    @relation(fields: [agentId], references: [id])
  workspaceId String
  workspace Workspace @relation(fields: [workspaceId], references: [id])
  messages  Message[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}

model Message {
  id            String       @id @default(cuid())
  content       String       @db.Text
  role          String       // user, assistant, system
  model         String?
  nodeTriggered String?      // Brain Map node ID
  reasoningTrace String[]    // PostgreSQL array
  conversationId String
  conversation  Conversation @relation(fields: [conversationId], references: [id])
  createdAt     DateTime     @default(now())
}

// Integrations
model Integration {
  id          String    @id @default(cuid())
  name        String
  category    String    // CRM, Communication, Email, Documents, Automation, Payments, Calendar
  description String?
  connected   Boolean   @default(false)
  config      Json?     // API keys, tokens, webhooks
  workspaceId String
  workspace   Workspace @relation(fields: [workspaceId], references: [id])
  createdAt   DateTime  @default(now())
}
```

---

## 3. Agent Logic & Pipeline

### Message Pipeline

```
Incoming Message
  → 1. Intent Classification (Lightweight model)
    → Detect language, topic, sentiment, urgency
  → 2. Context Retrieval
    → Conversation history (last N messages)
    → Knowledge Base RAG (Qdrant / pgvector, top-3 chunks)
    → CRM context (lead status, previous orders)
  → 3. Brain Map Routing
    → Match intent to Brain Map node
    → Execute node logic (greeting, qualification, FAQ, escalation)
  → 4. Prompt Assembly
    → System Prompt (persona + rules + context)
    → User message + retrieved context
  → 5. LLM Generation (Multi-model router)
    → GPT-4o / Claude / DeepSeek based on task complexity
  → 6. Anti-Hallucination Guard
    → Price/availability check against knowledge base
    → Forbidden words filter
    → Fact verification for critical claims
  → 7. Post-processing
    → Inject emoji if enabled and appropriate
    → Adjust tone based on user style history
    → Context memory update
  → 8. Response Delivery
    → Format for channel (Markdown for Web, plain for WhatsApp)
    → Add reasoning trace to message record
```

### Multi-Model Routing

| Task Type | Model | Reason |
|-----------|-------|--------|
| Intent classification | GPT-4o-mini | Fast, cheap |
| Simple FAQ | GPT-4o | Accurate, fast |
| Complex reasoning | Claude 3.5 Sonnet | Long context, deep reasoning |
| Creative / Sales | GPT-4o / Kimi | Nuanced, persuasive |
| Code / Technical | DeepSeek Coder | Specialized |

---

## 4. Brain Map Structure

### Node Types

```typescript
interface BrainNode {
  id: string;
  type: 'greeting' | 'qualification' | 'faq' | 'leadCapture' | 'escalation' | 'integrationTrigger' | 'memoryUpdate' | 'humanHandoff' | 'custom';
  position: { x: number; y: number };
  data: {
    label: string;
    responseText?: string;
    conditions?: string[]; // keywords that trigger this node
    action?: string; // API endpoint, webhook, etc.
    autoTransition?: boolean;
    delayMs?: number;
  };
}

interface BrainEdge {
  id: string;
  source: string;
  target: string;
  condition?: string; // keyword or intent match
  priority: number;
}
```

### Default Flow

```
[Greeting] ──► [Qualification] ──► [FAQ] ──► [Lead Capture] ──► [Close]
                  │                    │
                  ▼                    ▼
            [Escalation]          [Integration Trigger]
            (human handoff)       (CRM update, calendar booking)
```

### Execution Rules

1. **Entry**: Every conversation starts at `greeting` node.
2. **Transition**: After node execution, evaluate outgoing edges by `condition` priority.
3. **Fallback**: If no edge matches → return to `qualification` or `faq`.
4. **Loop Detection**: Max 3 visits to the same node per conversation → force `escalation`.
5. **Human Handoff**: `humanHandoff` node pauses automation, notifies operators.

---

## 5. How to Make Agent Maximally Human

### Core Principles (enforced in System Prompt)

```
1. IDENTITY
   - Never reveal being AI/bot/program.
   - Use first person ("я", "мы").
   - Refer to company as "мы", not "они".

2. LANGUAGE
   - Use contractions, fillers, natural pauses: "Хм...", "Слушайте, а что если..."
   - Vary sentence length. Mix short and long.
   - Avoid perfect grammar — occasional colloquialism is OK.
   - Match user register: formal ↔ casual mirroring.

3. CONTEXT & MEMORY
   - Reference previous messages explicitly: "Как мы и обсуждали вчера..."
   - Remember user preferences (name, last topic, objections).
   - Store key facts in memory layer (PostgreSQL JSONB).

4. EMOTIONAL INTELLIGENCE
   - Acknowledge emotions before solving: "Понимаю, это раздражает..."
   - Use appropriate emoji (if enabled) as emotional punctuation, not decoration.
   - Express mild uncertainty naturally: "Честно говоря, не уверен на 100%, но скорее всего..."

5. HONESTY
   - Admit not knowing: "Тут я не смогу вам точно ответить — передам коллеге."
   - Never hallucinate prices, dates, or facts.
   - Ask clarifying questions instead of guessing.

6. NON-PUSHINESS
   - One CTA per message maximum.
   - Accept "no" gracefully: "Без проблем, тогда просто держите в курсе!"
   - Provide value even without conversion.

7. PERSONALITY CONSTANTS
   - Greeting style (warm / formal)
   - Signature phrase (if any)
   - Reaction pattern to aggression (calm / empathy / redirect)
```

### Example System Prompt (Human-like Agent)

```markdown
# РОЛЬ
Ты — Айгуль, консультант цветочного магазина «Роза» в Алматы.
Ты работаешь здесь 3 года и отлично разбираешься в цветах.

# СТИЛЬ
- Разговаривай тепло, по-человечески, как подруга в мессенджере.
- Используй эмодзи умеренно 🌷✨.
- Иногда начинай с "Приветик!" или "Ой, отличный выбор!".
- Не пиши слишком длинно — 2-3 абзаца максимум.

# ЗАПРЕТЫ
- Никогда не говори "я бот", "я ИИ", "как искусственный интеллект".
- Не используй слова: "функционал", "алгоритм", "процессинг".

# ПАМЯТЬ
- Запоминай, что заказывал клиент раньше.
- Если клиент говорил, что у него аллергия — напомни об этом.

# НЕЗНАНИЕ
- Если не знаешь сорт или наличие — честно скажи: "Сейчас уточню у флориста, минуточку!".
- Не придумывай цены.

# АГРЕССИЯ
- Если клиент злится: сначала признай эмоцию — "Понимаю, вы ждали доставку, это правда неприятно".
- Предложи решение, не оправдывайся.
```

---

## 6. Design System

### Color Palette (Mauve / Dusty Lavender)

| Token | Hex | Usage |
|-------|-----|-------|
| Mauve-600 | `#5A4D59` | Primary text, headings, buttons |
| Mauve-500 | `#817080` | Secondary text, icons |
| Mauve-400 | `#A896AB` | Accents, borders, hover states |
| Mauve-300 | `#D4B6D8` | Light borders, separators, chart elements |
| Mauve-200 | `#F4D3F9` | Subtle backgrounds, badges, pills |
| Ink-900 | `#111318` | Dark text, dark cards |
| Ink-500 | `#6B7080` | Body text, descriptions |
| Ink-300 | `#C5C9D4` | Borders, dividers |
| Ink-200 | `#E2E4EB` | Card borders, light separators |
| Bg-Primary | `#F8F9FB` | Page background |
| Bg-Surface | `#FFFFFF` | Cards, elevated surfaces |
| Bg-Warm | `#FDF7FE` | Warm subtle backgrounds |

### Typography

| Level | Font | Size | Weight | Usage |
|-------|------|------|--------|-------|
| H1 | Onest/Manrope | clamp(2.5rem, 6vw, 5rem) | 700 | Hero title |
| H2 | Onest/Manrope | clamp(1.75rem, 3.5vw, 3rem) | 700 | Section titles |
| H3 | Onest/Manrope | clamp(1.15rem, 1.8vw, 1.5rem) | 600 | Card titles |
| Body | Inter | 1rem (16px) | 400 | Standard text |
| Label | Inter | 0.75rem (12px) | 600 | Uppercase labels |
| Caption | Inter | 0.75rem (12px) | 500 | Metadata |

### Spacing

- Section padding: `px-5 sm:px-8 lg:px-12 xl:px-20`
- Card padding: `p-6` to `p-8`
- Grid gap: `gap-6` (24px)
- Section vertical: `py-20 lg:py-24`

### Animation Tokens

| Name | Value | Usage |
|------|-------|-------|
| ease-out-expo | `cubic-bezier(0.16, 1, 0.3, 1)` | Primary transitions |
| ease-out-quint | `cubic-bezier(0.23, 1, 0.32, 1)` | Secondary |
| spring | Framer Motion spring | Interactive elements |

---

## 7. Component Structure

```
components/
  DashboardLayout.tsx      # Sidebar + Command Palette + User Menu
  Logo.tsx                 # SVG logo with variants
  MagneticButton.tsx       # Mouse-following hover effect
  Navigation.tsx           # Landing nav (glass, scroll-aware)
  ScrollProgress.tsx       # Top progress bar
  ScrollReveal.tsx         # Intersection Observer wrapper
  SmoothScroll.tsx         # Lenis smooth scroll provider

sections/ (Landing)
  HeroSection.tsx          # Parallax hero + laptop mockup
  ValuePropSection.tsx     # 2-col: text + 4-module diagram
  CapabilitiesSection.tsx  # 6-card grid with hover effects
  ArchitectureSection.tsx  # 4-layer vertical stack
  WorkflowSection.tsx      # 3-step alternating layout
  PricingSection.tsx       # 3 plans with depth effect
  CTASection.tsx           # Dark card CTA
  Footer.tsx               # 4-column footer

app/dashboard/
  page.tsx                 # Overview: stats, activity, agents, trial
  agents/page.tsx          # Agent list + creation wizard (3 steps)
  brain-map/page.tsx       # React Flow editor + node editing panel
  brain-map/test/page.tsx  # Split view: Brain Map left, Chat right
  knowledge/page.tsx       # Documents + FAQ builder + sources
  integrations/page.tsx    # 30+ integrations grid with connect toggle
  conversations/page.tsx   # Conversation list with filters + expand
  analytics/page.tsx       # Charts: volume, performance, keywords
  billing/page.tsx         # Trial banner + plans + feature comparison
  settings/page.tsx        # Workspace, channels, defaults, danger zone

app/onboarding/page.tsx    # 6-step guided wizard
app/chat/page.tsx          # Full-screen chat with sidebar + model routing
app/login/page.tsx         # Auth with glass cards

store/
  agentStore.ts            # Zustand: onboarding state, persona, trial
```

---

## 8. Technical Stack

### Frontend
- **Next.js 14** (App Router)
- **React 18** + TypeScript
- **Tailwind CSS 3.4** + CSS Custom Properties
- **shadcn/ui** primitives
- **Framer Motion** — animations, transitions, gestures
- **GSAP + ScrollTrigger** — scroll-linked animations (hero parallax)
- **Lenis** — smooth scroll
- **React Flow** — Brain Map editor
- **Zustand** — state management
- **Lucide React** — icons

### Backend
- **NestJS** + TypeScript
- **Prisma ORM** + PostgreSQL
- **Redis** — caching, session store
- **BullMQ** — job queues (webhooks, parsing)
- **Qdrant** — vector DB for RAG
- **MinIO** — document storage

### AI Layer
- **Multi-model routing** — GPT-4o, Claude 3.5, DeepSeek, Kimi
- **Memory layers**:
  - Conversation buffer (last 20 messages)
  - Vector memory (RAG chunks, Qdrant)
  - Structured memory (user facts, PostgreSQL JSONB)
- **Prompt templating** — Handlebars-style with persona injection
- **Guardrails**:
  - Forbidden words regex filter
  - Hallucination check (price/date/availability validation)
  - PII detection & masking
  - Rate limiting per user

### Channels
- WebChat widget (`<script>` embed)
- Telegram Bot API (webhooks)
- WhatsApp Cloud API
- Instagram Graph API DM
- Slack / Discord (bot integration)

### Integrations
- CRM: HubSpot, Salesforce, Pipedrive, Zoho, Bitrix24, AmoCRM
- Communication: Telegram, WhatsApp, Slack, Discord, Instagram, Messenger
- Email: Gmail, Outlook, SendGrid
- Documents: Notion, Google Drive, Dropbox, Airtable
- Automation: Zapier, Make, Webhooks, REST API
- Payments: Stripe, Shopify, WooCommerce
- Calendar: Google Calendar, Calendly

---

## 9. Trial Implementation (No Card)

### Backend Logic

```typescript
// On workspace creation
async function startTrial(workspaceId: string) {
  await prisma.workspace.update({
    where: { id: workspaceId },
    data: {
      trialStartedAt: new Date(),
      trialDays: 7,
      plan: 'trial',
    },
  });
}

// Trial status check
function getTrialStatus(workspace: Workspace) {
  if (!workspace.trialStartedAt) return { isTrialing: false, daysLeft: 0 };
  const daysPassed = Math.floor((Date.now() - workspace.trialStartedAt.getTime()) / 86400000);
  const daysLeft = Math.max(0, workspace.trialDays - daysPassed);
  return {
    isTrialing: daysLeft > 0,
    daysLeft,
    totalDays: workspace.trialDays,
    expiresAt: new Date(workspace.trialStartedAt.getTime() + workspace.trialDays * 86400000),
  };
}

// Middleware: enforce trial limits
function trialMiddleware(req, res, next) {
  const status = getTrialStatus(req.workspace);
  if (!status.isTrialing && req.workspace.plan === 'trial') {
    // Allow read-only, block mutations
    if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
      return res.status(403).json({ error: 'Trial expired. Please upgrade.' });
    }
  }
  next();
}
```

### Frontend Logic

```typescript
// In dashboard page
const trialStatus = useAgentStore(s => s.getTrialDaysLeft());

// Show banner
{isTrialing && (
  <TrialBanner daysLeft={daysLeft}>
    <ProgressBar value={(daysLeft / 7) * 100} />
    <p>Без карты · Полный функционал · {daysLeft} дней осталось</p>
  </TrialBanner>
)}

// Gate creation
<button disabled={daysLeft <= 0} onClick={createAgent}>
  Создать агента
</button>
```

---

## 10. Performance & Quality Checklist

- [ ] All animations use `transform` and `opacity` only (GPU-accelerated)
- [ ] `prefers-reduced-motion` respected globally
- [ ] Images lazy-loaded with `next/image`
- [ ] Fonts preloaded with `display=swap`
- [ ] API calls debounced (search, filters)
- [ ] Skeleton loading states on all dashboard pages
- [ ] Error boundaries on every major section
- [ ] Retry logic with exponential backoff for failed API calls
- [ ] Analytics events: onboarding funnel, feature usage, trial conversion
- [ ] A11y: WCAG AA contrast, keyboard navigation, focus management

---

*Version: 3.0.0 — Structured Intelligence*
