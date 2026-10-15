# Database

## Overview

X Growth Engine uses Neon PostgreSQL with Drizzle ORM.

## Migrations

Migration files live in `apps/web/drizzle/` (managed by Drizzle Kit).

```bash
# Generate migration from schema changes
cd apps/web && npx drizzle-kit generate

# Apply migrations
cd apps/web && npx drizzle-kit migrate

# Open Drizzle Studio (visual DB browser)
cd apps/web && npx drizzle-kit studio
```

## Rules

- All schema changes go through migrations — no manual DDL.
- Never modify an applied migration.
- Never drop columns/tables without explicit approval.
- Use parameterized queries only.
- All timestamps in UTC.
