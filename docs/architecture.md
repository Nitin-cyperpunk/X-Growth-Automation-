# Architecture

## Overview

X Growth Engine is a personal AI-powered X (Twitter) content management and growth platform. It enables a single authorized user to create, generate, evaluate, schedule, and publish posts — and analyze their performance.

## Stack

| Layer | Technology | Hosting |
|-------|-----------|---------|
| Frontend & API | Next.js (App Router), React, TypeScript | Vercel |
| Database | PostgreSQL | Neon |
| ORM | Drizzle ORM | — |
| Authentication | NextAuth.js (Auth.js) | — |
| AI | Gemini API | — |
| Social | X API v2 (OAuth 2.0) | — |
| Automation | n8n (Docker) | Render |
| Styling | Tailwind CSS + shadcn/ui | — |
| Validation | Zod | — |
| Charts | Recharts | — |

## Architecture Decisions

### Why Drizzle ORM
- Type-safe SQL queries with full TypeScript inference.
- Lightweight — no heavy runtime. Works well with Neon's serverless driver.
- SQL-like API — easy to reason about generated queries.
- Built-in migration tooling with version-controlled SQL files.

### Why NextAuth.js
- Mature, well-maintained auth library for Next.js.
- Supports credential-based auth for the single-user dashboard.
- Session management with secure HTTP-only cookies.
- No external auth service dependency.

### Why n8n for Automation
- Visual workflow builder with version-controllable JSON exports.
- Built-in schedule triggers, webhooks, and PostgreSQL nodes.
- Self-hosted in Docker — full control over execution.
- Handles retry logic, error handling, and workflow state.

## Request Flow

```
Browser → Next.js App Router
  ├── Server Components (data fetching)
  ├── Server Actions (mutations)
  ├── API Routes (webhook endpoints, n8n callbacks)
  └── Middleware (auth checks)

n8n → Webhook/Schedule Trigger
  ├── Query PostgreSQL for due jobs
  ├── Call X API to publish
  ├── Update job status in PostgreSQL
  └── Handle failures and retries
```

## Directory Structure

```
apps/web/                  — Next.js application
  app/                     — App Router pages and layouts
    (auth)/                — Authentication pages
    (dashboard)/           — Protected dashboard pages
    api/                   — API routes (webhooks)
  components/              — React components
    ui/                    — shadcn/ui primitives
  lib/                     — Shared utilities
    db/                    — Database client, schema, queries
    auth/                  — Auth configuration
    ai/                    — Gemini integration
    x/                     — X API integration
    validators/            — Zod schemas
  server/                  — Server-only code
    actions/               — Server Actions
  tests/                   — Test files

automation/                — n8n configuration
  workflows/               — Exported workflow JSON files

database/                  — Database documentation
  migrations/              — Drizzle migration files

docs/                      — Project documentation
scripts/                   — Dev/deploy scripts
```

## Security Boundaries

1. **Browser ↔ Server**: Auth middleware validates sessions. Server Actions and API routes check authorization.
2. **Server ↔ Database**: Parameterized queries via Drizzle. No raw string concatenation.
3. **Server ↔ External APIs**: Secrets stay server-side. Responses validated with Zod.
4. **n8n ↔ App**: Webhook authentication via shared secret. n8n never exposes app secrets.
5. **AI ↔ App**: AI outputs are untrusted data. Schema-validated before storage.

## Database Design Principles

- UTC timestamps everywhere.
- Explicit job status enums with defined state transitions.
- Atomic job claiming for concurrency safety.
- Foreign keys and constraints enforce data integrity.
- Indexes on scheduling queries, account lookups, and metrics.

## Future Multi-User Path

The schema includes a `users` table from day one. All entities reference `user_id`. When multi-user support is needed:
- Replace single-user auth with provider-based auth.
- Add tenant isolation to queries.
- No schema rewrite required.
