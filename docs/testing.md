# Testing Policy

## Principles

1. **Tests protect behavior.** Every test asserts something the product must do.
2. **Existing tests are sacrosanct.** Never delete, weaken, or skip a passing test to accommodate new code.
3. **Failures are investigated, not suppressed.** A failing test means something is wrong — find out what.
4. **Missing services ≠ passing tests.** If a test can't run, report it honestly.

## Test Types

| Type | Tool | Scope |
|------|------|-------|
| Type checking | `tsc --noEmit` | All TypeScript files |
| Linting | ESLint | Code quality and consistency |
| Unit tests | Vitest | Business logic, utilities, validators |
| Component tests | Vitest + Testing Library | React component behavior |
| Integration tests | Vitest | Database queries, API adapters |
| E2E tests | Playwright (future) | Critical user journeys |

## Running Tests

```bash
# All checks
npm run check

# Individual checks
npx tsc --noEmit          # Type checking
npm run lint              # Linting
npm test                  # Unit and integration tests
npm run test:e2e          # E2E tests (when configured)
```

## Test Organization

- Test files live next to the code they test: `foo.ts` → `foo.test.ts`
- Shared test utilities in `tests/helpers/`
- Test fixtures in `tests/fixtures/`

## When a Test Fails

1. Reproduce the failure.
2. Read the test — understand what it expects and why.
3. Read the implementation — find where behavior diverges.
4. Determine root cause:
   - **Implementation bug**: fix the implementation.
   - **Outdated test**: document why the spec changed, get approval, then update.
   - **Environment issue**: document it, don't claim success.
5. Never change expected values without understanding why they changed.

## Coverage Expectations

- Business logic: high coverage expected.
- Database queries: integration tests for complex queries.
- API routes: test auth enforcement and validation.
- UI components: test user interactions, not implementation details.
- No arbitrary coverage percentage targets — coverage serves understanding, not metrics.

## Mocking Guidelines

- Mock external services (X API, Gemini API) at the boundary.
- Never mock the database in integration tests.
- Use dependency injection patterns that make testing natural.
- Mocks must behave like the real service — don't simplify away edge cases.
