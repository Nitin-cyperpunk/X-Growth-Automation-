# CLAUDE.md — Claude Code Operating Instructions

## Before Every Task

1. Read `AGENTS.md` — the engineering contract applies to every change.
2. Read `skills.md` only when working on AI content generation, evaluation, writing strategy, or related features.
3. Read the relevant docs (`docs/architecture.md`, `docs/security.md`, `docs/testing.md`) before making changes in those areas.
4. Inspect the actual repository state and git status before modifying files.

## Mandatory Cycle

Every task follows this cycle:

**INSPECT → PLAN → IMPLEMENT → TEST → REVIEW → REPORT**

### INSPECT
- Read the files you will change and their dependencies.
- Check git status for uncommitted work.
- Identify affected tests and potential regressions.

### PLAN
- For non-trivial tasks, write a short implementation plan.
- List files to change, tests to add/update, and security implications.
- For large tasks, break into milestones — verify each before continuing.

### IMPLEMENT
- Write the actual implementation, not just a plan.
- Follow the architecture in `docs/architecture.md`.
- Use migrations for database changes.

### TEST
- Run relevant tests after implementation.
- Run type checking (`npx tsc --noEmit`) and linting (`npm run lint`).
- Never skip this step.

### REVIEW
- Review the diff for unintended changes.
- Check for exposed secrets, accidental deletions, weakened tests.

### REPORT
Summarize: what changed, files modified, tests run, actual results, unresolved risks.
Do not claim a check passed if it was not executed.

## Key Commands

```bash
# Development
cd apps/web && pnpm dev

# Type checking
cd apps/web && pnpm typecheck

# Linting
cd apps/web && pnpm lint

# Tests
cd apps/web && pnpm test

# Database migrations
cd apps/web && pnpm db:migrate

# Full check (typecheck + lint + test)
cd apps/web && pnpm check
```

## Package Manager

This project uses **pnpm**. Do not use npm or yarn.

## Project Structure

```
apps/web/          — Next.js application (App Router)
automation/        — n8n workflow exports and documentation
database/          — Migration files and database documentation
docs/              — Architecture, security, testing, deployment docs
scripts/           — Development and deployment scripts
```

## Environment

- All secrets go in `.env.local` (never committed).
- `.env.example` has placeholders only.
- Server-side secrets never use `NEXT_PUBLIC_` prefix.

## When Blocked

- If a credential or external service is unavailable, implement what you can, document the blocker, and do not fabricate results.
- If a requirement is ambiguous and the wrong guess is dangerous, ask.
- If a test fails and you're unsure why, investigate — don't delete the test.
