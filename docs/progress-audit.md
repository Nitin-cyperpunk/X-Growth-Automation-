# Progress Audit

Last updated: 2026-10-22

## Completed

### Milestone 0 — Repository Foundation
- [x] Git repository initialized and pushed to GitHub
- [x] AGENTS.md — engineering contract
- [x] CLAUDE.md — Claude Code operating instructions
- [x] skills.md — AI content creation guidelines
- [x] Next.js 15 (App Router) with TypeScript strict mode
- [x] Tailwind CSS v4 configured
- [x] ESLint configured (next/core-web-vitals + next/typescript)
- [x] Vitest + Testing Library test setup
- [x] Architecture, security, testing, deployment documentation
- [x] .env.example with placeholder values
- [x] .gitignore configured

### Milestone 1 — Database Schema, Auth, and Dashboard Shell
- [x] Drizzle ORM + @neondatabase/serverless installed
- [x] Database schema: users, x_accounts, content_ideas, posts, ai_generations, post_metrics, audit_logs
- [x] Drizzle config (drizzle.config.ts)
- [x] Database client with lazy initialization (lib/db/index.ts)
- [x] NextAuth.js v5 (beta) credential auth
- [x] Auth middleware — redirects unauthenticated users to /login
- [x] Login page with Suspense boundary for useSearchParams
- [x] Dashboard layout with sidebar navigation and topbar
- [x] All page routes: Dashboard, Compose, AI Writer, Ideas, Queue, Published, Analytics, Insights, Settings
- [x] Zod validators: auth, posts (280 char limit), ideas (categories, tags)
- [x] Reusable UI components: PageHeader, EmptyState
- [x] Session provider for client components

### Milestone 2 — Neon Database Connection and Persistence
- [x] Neon PostgreSQL project created and connected
- [x] Initial migration applied (0000_unique_aqueduct.sql — 7 tables, 3 enums, 9 FKs, 7 indexes)
- [x] Seed script for admin user (scripts/seed.ts)
- [x] Two users seeded (admin@concaveinsights.com, singhnitin9975@gmail.com)
- [x] Auth session helper (lib/auth/session.ts — getAuthenticatedUserId)
- [x] Server actions: Ideas CRUD (lib/actions/ideas.ts — getIdeas, createIdea, updateIdea, deleteIdea, convertIdeaToDraft)
- [x] Server actions: Posts CRUD (lib/actions/posts.ts — getPostsByStatus, createPost, updatePost, deletePost, updatePostStatus, getPost)
- [x] Centralized post status state machine (lib/services/post-transitions.ts)
- [x] All CRUD operations enforce user ownership (userId filtering on every query)
- [x] Zod validation on all mutation inputs
- [x] Error responses never expose SQL, credentials, or stack traces

### Milestone 3 — Core Content Management (Prompt 03)
- [x] Compose page: Save Draft + Submit for Approval with DB persistence, preview pane
- [x] Ideas Inbox: Full CRUD with DB, search, filter by status/category, inline editing, convert idea to draft
- [x] Content Queue: Real data by status tab, state transition buttons, delete actions
- [x] Published Posts: Real data from DB with publish date and X link display
- [x] AI Writer: UI preview (style picker, variation angles) — requires GEMINI_API_KEY to activate
- [x] ESLint .next/ directory excluded from linting
- [x] next.config.ts outputFileTracingRoot set for correct workspace resolution

### Milestone 4 — Gemini AI Integration (Prompt 05)
- [x] @google/generative-ai v0.24.1 installed
- [x] Server-side Gemini client (lib/ai/gemini.ts) — singleton, retry with exponential backoff, 30s timeout
- [x] Content generator service (lib/ai/content-generator.ts) — generatePosts, improveContent
- [x] System prompts encode skills.md rules: identity, voice, scoring (6 criteria, 1-10), quality gates
- [x] Structured JSON output with Zod validation of every AI response
- [x] 6 post formats (short, story, technical, thread_opener, listicle, question)
- [x] 6 improvement types (improve_hook, make_clearer, make_specific, make_natural, thread_outline, adapt_pillar)
- [x] 4 tone options (informative, conversational, provocative, storytelling)
- [x] 1-5 variation generation with different angles per request
- [x] Character-limit enforcement with post-generation truncation
- [x] Server actions (lib/actions/ai.ts) — checkAiAvailability, generatePostAction, improveContentAction, getAiModelInfo
- [x] All server actions require authentication and validate inputs with Zod
- [x] AI Writer page: server component wrapper + full interactive client UI
- [x] Generate tab: topic, pillar, format, tone, variation count, extra instructions
- [x] Improve tab: content input, 6 improvement type chips, pillar select
- [x] Results display: PostCard with scores visualization, save-as-draft, iterate buttons
- [x] Honest empty state when GEMINI_API_KEY not configured
- [x] API key is server-side only — never exposed to client
- [x] Zod schemas for all AI request/response types (lib/validators/ai.ts)
- [x] Model: gemini-2.0-flash | responseMimeType: application/json

### Milestone 5 — n8n Automation & Workflow Integration (Prompt 06)
- [x] Database migration: workflow_configs and workflow_executions tables (0001_workflow_automation.sql)
- [x] Enums: workflow_type (content_preparation, queue_processing, daily_ideas), execution_status (pending, running, succeeded, failed, retrying)
- [x] Unique index on (user_id, workflow_type) for one config per user per workflow
- [x] Unique idempotency_key on executions to prevent duplicates
- [x] n8n client service (lib/n8n/client.ts):
  - URL validation with SSRF protection (blocks localhost, metadata endpoints, .internal in production)
  - HTTPS enforcement in production
  - HMAC-SHA256 webhook signing with timestamp and replay protection (5-minute window)
  - Constant-time signature comparison via crypto.timingSafeEqual
  - Request timeouts (15s) and bounded retries (1 retry)
  - Redirect rejection (fetch redirect: "error")
  - Path traversal protection
- [x] Zod validators (lib/validators/workflows.ts):
  - workflowConfigSchema, updateWorkflowConfigSchema, triggerWorkflowSchema, webhookCallbackSchema
  - Cron expression validation with presets (9am, 6pm, twice daily, weekday schedules)
  - 16 supported timezones
- [x] Server actions (lib/actions/workflows.ts):
  - checkN8nStatus, getWorkflowConfigs, upsertWorkflowConfig, updateWorkflowConfig
  - triggerWorkflow: creates execution record before n8n request, idempotency key dedup
  - getWorkflowExecutions: paginated, filterable by type
  - All actions require authentication and validate ownership
- [x] Webhook callback API route (app/api/webhooks/n8n/route.ts):
  - HMAC signature verification on inbound n8n callbacks
  - Zod validation of callback payload
  - Terminal state protection (won't overwrite succeeded/failed)
  - Error message truncation (1000 chars max)
- [x] Automation dashboard page (app/(dashboard)/automation/):
  - n8n connection status indicator
  - Workflow cards with enable/disable toggle, schedule configuration, manual trigger
  - Cron presets and timezone selector
  - Recent execution history table (status, times, retries, errors)
  - Honest empty state with setup instructions when n8n not configured
- [x] Sidebar: Automation nav item added
- [x] Settings: Real integration status for Gemini AI and n8n (reads env vars)
- [x] .env.example: Updated n8n section with N8N_BASE_URL, N8N_WEBHOOK_SECRET docs
- [x] Workflow template JSON (automation/workflows/content-preparation.json)
- [x] automation/README.md: Webhook contract, security docs, deployment notes
- [x] No X publishing in this milestone
- [x] API key and webhook secret are server-side only

### Testing
- [x] 190 tests passing across 14 test files
- [x] Post status transitions: 21 + 10 extended tests
- [x] Zod validators: auth (5), posts (9+14), ideas (10+12), AI (30), workflows (22)
- [x] AI content-generator: 17 tests (mocked Gemini, validation, truncation, errors)
- [x] Gemini client: 7 tests (config detection, missing key, model ID)
- [x] n8n client: 20 tests (config detection, URL validation, SSRF protection, HMAC signatures, replay rejection, missing config)
- [x] DB schema: 10 tests
- [x] Dashboard page rendering: 3 tests
- [x] All tests use mocks — no real API key, n8n instance, or charges required
- [x] TypeScript strict mode — zero type errors
- [x] ESLint — zero errors, zero warnings

## Database Architecture

**ORM**: Drizzle ORM with `@neondatabase/serverless` (neon-http driver)

**Trade-offs**:
- Drizzle was chosen for type-safe SQL with minimal runtime overhead, native Neon serverless support, and version-controlled migrations via Drizzle Kit.
- neon-http driver is used (not WebSocket) for stateless serverless compatibility — each request creates a fresh HTTP connection, avoiding connection pool exhaustion on Vercel.
- Migrations are sequential SQL files generated by `drizzle-kit generate` and applied with `drizzle-kit migrate`.

**Connection**:
- Pooled connection string (Neon pooler endpoint) via `DATABASE_URL` in `.env.local`
- Lazy-initialized singleton in `lib/db/index.ts` — avoids creating connections at import time
- All database access is server-side only (Server Components, Server Actions, API routes)

**Authorization**:
- Every database query includes `userId` filtering from the authenticated session
- `getAuthenticatedUserId()` throws if no valid session exists
- No user can read or modify another user's records

**Indexes**:
- `content_ideas_user_status_idx` — owner + status filtering
- `posts_user_status_idx` — owner + status filtering
- `posts_scheduled_idx` — status + scheduled time for queue lookups
- `posts_x_post_id_idx` — unique external X post ID
- `post_metrics_post_snapshot_idx` — metrics time-series queries
- `audit_logs_user_created_idx` — audit trail lookups
- `x_accounts_user_x_user_idx` — unique X account per user

## Not Yet Started

### ~~Milestone 4 — Gemini AI Integration~~ ✅ Complete (see above)

### Milestone 5 — X API Integration
- [ ] OAuth 2.0 flow for X account connection
- [ ] Token storage and refresh
- [ ] Post publishing
- [ ] Metrics retrieval

### ~~Milestone 6 — Scheduling and n8n~~ ✅ Complete (see Milestone 5 above, renamed from Prompt 06)

### Milestone 7 — Analytics Dashboard
- [ ] Recharts integration
- [ ] Metrics visualization
- [ ] AI-powered insights

### Milestone 8 — Production Hardening
- [ ] Security review
- [ ] Rate limiting
- [ ] Error monitoring
- [ ] Deployment automation

## Blockers

- **GEMINI_API_KEY**: Not configured. AI Writer page shows honest empty state.
- **X API credentials**: Not configured. Publish and metrics features unavailable.
- **N8N_BASE_URL / N8N_WEBHOOK_SECRET**: Not configured. Automation page shows setup instructions. Workflow triggers will fail until n8n is deployed and secrets are set.
- **Database migration 0001**: Must be applied (`pnpm db:migrate`) to create workflow_configs and workflow_executions tables.

## Environment Setup

```bash
# 1. Copy environment template
cp .env.example apps/web/.env.local

# 2. Get Neon connection string
#    Go to https://console.neon.tech → your project → Connection Details
#    Copy the pooled connection string (uses -pooler host)

# 3. Generate NEXTAUTH_SECRET
openssl rand -base64 32

# 4. Apply migrations
cd apps/web && pnpm db:migrate

# 5. Seed admin user
cd apps/web && pnpm db:seed

# 6. Run dev server
cd apps/web && pnpm dev
```
