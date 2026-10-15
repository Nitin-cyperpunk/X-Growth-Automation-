# X Growth Engine

AI-powered X (Twitter) content management and growth platform.

## Features

- Connect and manage your X account
- Collect and organize content ideas
- Write posts manually or generate with AI (Gemini)
- Evaluate posts with configurable quality criteria
- Schedule, approve, and publish posts
- Track post performance metrics
- AI-powered performance insights
- Content strategy management

## Tech Stack

- **Frontend**: Next.js (App Router), React, TypeScript, Tailwind CSS, shadcn/ui
- **Database**: Neon PostgreSQL + Drizzle ORM
- **Authentication**: NextAuth.js
- **AI**: Gemini API
- **Social**: X API v2
- **Automation**: n8n (Docker)
- **Deployment**: Vercel + Render + Neon

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm

### Setup

```bash
# Install dependencies
cd apps/web && pnpm install

# Copy environment variables
cp .env.example .env.local
# Edit .env.local with your values

# Run development server
cd apps/web && pnpm dev
```

### Development Commands

```bash
cd apps/web

pnpm dev          # Start dev server
pnpm build        # Production build
pnpm typecheck    # TypeScript checking
pnpm lint         # ESLint
pnpm test         # Run tests
pnpm check        # All checks (typecheck + lint + test)
```

## Documentation

- [Architecture](docs/architecture.md)
- [Security](docs/security.md)
- [Testing](docs/testing.md)
- [Deployment](docs/deployment.md)

## Project Structure

```
apps/web/          — Next.js application
automation/        — n8n workflows and docs
database/          — Database documentation
docs/              — Project documentation
```
# X-Growth-Automation-
