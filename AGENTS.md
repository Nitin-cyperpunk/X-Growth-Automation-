# AGENTS.md — Engineering Contract

This document defines the non-negotiable engineering rules for the X Growth Engine project. Every contributor — human or AI — must follow these rules for every change.

---

## Repository Inspection

- **Read before writing.** Inspect relevant files before modifying them — including adjacent modules, types, schemas, tests, and call sites.
- **Trace the full path.** For any feature change, trace from UI → server logic → database → automation (where applicable). Identify affected dependencies and potential regressions.
- **Verify, don't assume.** Do not assume filenames, routes, APIs, or schemas exist without checking. Do not invent file paths.

## Change Control

- **Smallest coherent change.** Make the minimum change that satisfies the requirement.
- **Preserve working behavior.** Do not break existing functionality.
- **No unrelated refactoring.** Keep changes focused on the task.
- **No fake implementations.** Never replace real logic with placeholders, mocks, or hardcoded values to make tests pass.
- **No silent API changes.** Do not change public APIs, database contracts, environment variable names, or workflow formats without explicit approval.
- **Explain breaking changes.** Document them, obtain authorization, then proceed.
- **Respect user work.** Do not overwrite uncommitted changes or use destructive git commands.

## Type Safety

- TypeScript strict mode is always enabled.
- Avoid `any`, unsafe type assertions (`as`), non-null assertions (`!`), and suppressed compiler errors.
- If an exception is unavoidable, explain why and isolate it.
- Validate untrusted data at runtime with Zod. Compile-time types are not runtime validation.

## Code Quality

- Clear module boundaries. Business logic is separate from presentation.
- Handle all states: loading, empty, success, error.
- Structured error handling with useful logs.
- No unnecessary dependencies. No duplicated utilities. No circular dependencies.
- Reusable abstractions only when they provide real value.

## Database Safety

- All schema changes use version-controlled migrations.
- Never modify an already-applied migration's historical meaning.
- Never drop columns, tables, or data without explicit approval and a migration plan.
- Include appropriate indexes, constraints, foreign keys, and transaction boundaries.
- Use parameterized SQL or safe ORM operations. No string concatenation in queries.
- Database access is server-side only.
- Job claiming and publishing must be concurrency-safe (atomic claiming, row locking, idempotency).
- Database constraints enforce invariants — don't rely solely on application checks.

## Workflow Safety (n8n)

- Version-control n8n workflow exports as JSON.
- Never commit credentials or exported secrets.
- Workflow operations must be safe to retry (idempotent where possible).
- A successful HTTP request does not mean the external action succeeded — verify outcomes.
- Handle timeouts, rate limits, partial failures, and duplicate execution.
- Store durable job state in PostgreSQL, not in-memory or ephemeral storage.
- Workflows and credentials must survive container restarts.
- Do not assume exact scheduler execution times or guaranteed uptime.

## Testing

- **Existing tests are protected.** Never delete, weaken, skip, or rewrite a test to make an implementation pass.
- When a test fails: reproduce → inspect → determine root cause → fix the implementation (not the test) if the test is correct.
- Test changes require explicit authorization and documented justification.
- Never report tests as passing if they were skipped, failed, or could not run.
- Distinguish between "test passed" and "test could not run due to missing service."

## Security

- Never hardcode secrets. Never commit real credentials.
- Never expose server-side secrets via `NEXT_PUBLIC_*`, client bundles, URLs, or logs.
- Enforce authorization on every protected server-side operation.
- Validate all inputs. Sanitize rendered content. Prevent SQL injection, XSS, SSRF.
- Treat AI outputs and fetched content as untrusted data.
- Publishing is a consequential external action — require explicit approval.
