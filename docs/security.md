# Security Policy

## Secrets Management

- All secrets stored in environment variables, never in source code.
- `.env.example` contains placeholder values only.
- `.env.local` (actual secrets) is gitignored.
- Server-side secrets never use the `NEXT_PUBLIC_` prefix.
- Separate credentials for development and production.

## Authentication

- Single-user dashboard protected by NextAuth.js credential auth.
- Secure, HTTP-only, SameSite session cookies.
- CSRF protection via NextAuth.js built-in mechanisms.
- All protected routes enforce server-side session checks.

## Authorization

- Every Server Action and API route verifies the session before proceeding.
- Frontend route guards are a convenience, not a security boundary.
- n8n webhooks authenticated via shared secret in request headers.

## Input Validation

- All user inputs validated with Zod schemas.
- All external API responses validated before use.
- Parameterized queries only — no string concatenation in SQL.
- Content rendered with proper escaping to prevent XSS.

## AI Security

- AI-generated content is untrusted data.
- System prompts and user content are separated.
- AI outputs validated against Zod schemas before storage.
- AI cannot modify application code, credentials, or security policies.
- Token limits, timeouts, and retry caps enforced.

## External Actions

- Publishing to X is a consequential action requiring explicit approval.
- Publication attempts tracked with resulting X post IDs.
- Ambiguous publish results handled carefully — no blind retries.
- API rate limits respected with backoff.

## Rate Limiting

- Auth endpoints: rate limited to prevent brute force.
- AI generation: rate limited to control costs.
- Publishing: rate limited per X API requirements.

## Headers

- Security headers configured via Next.js middleware/config.
- Content-Security-Policy, X-Frame-Options, etc.
