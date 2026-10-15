# Deployment Guide

## Architecture

| Component | Platform | Notes |
|-----------|----------|-------|
| Next.js app | Vercel | Auto-deploys from main branch |
| Database | Neon | Serverless PostgreSQL |
| n8n automation | Render | Docker container with persistent volume |

## Environment Setup

### Vercel (Next.js)

Required environment variables:
- `DATABASE_URL` — Neon connection string (pooled)
- `NEXTAUTH_SECRET` — Random secret for session encryption
- `NEXTAUTH_URL` — Production URL (e.g., https://your-app.vercel.app)
- `N8N_WEBHOOK_BASE_URL` — n8n instance URL
- `N8N_WEBHOOK_SECRET` — Shared secret for webhook auth
- `GEMINI_API_KEY` — Google AI API key
- `X_CLIENT_ID` — X OAuth 2.0 client ID
- `X_CLIENT_SECRET` — X OAuth 2.0 client secret

### Render (n8n)

Required environment variables:
- `N8N_ENCRYPTION_KEY` — Encryption key for stored credentials
- `DB_POSTGRESDB_HOST` — Neon hostname
- `DB_POSTGRESDB_PORT` — 5432
- `DB_POSTGRESDB_DATABASE` — Database name
- `DB_POSTGRESDB_USER` — Database user
- `DB_POSTGRESDB_PASSWORD` — Database password
- `DB_POSTGRESDB_SSL_ENABLED` — true
- `WEBHOOK_URL` — Public webhook URL
- `N8N_BASIC_AUTH_USER` — n8n UI username
- `N8N_BASIC_AUTH_PASSWORD` — n8n UI password
- `GENERIC_TIMEZONE` — UTC

### Neon (Database)

- Create a project and database.
- Use the pooled connection string for the app.
- Enable SSL.
- Run migrations before first deployment.

## Deployment Steps

### First Deploy

1. Set up Neon database and note connection strings.
2. Run database migrations locally against Neon.
3. Configure Vercel project with environment variables.
4. Deploy Next.js app to Vercel.
5. Configure Render Docker service for n8n.
6. Import n8n workflows and configure credentials.
7. Verify webhook connectivity between app and n8n.

### Subsequent Deploys

1. Push to main branch → Vercel auto-deploys.
2. Run new migrations if schema changed.
3. Update n8n workflows if automation changed.

## Limitations

- **Render free tier**: Container may sleep after inactivity. Scheduled workflows may not fire reliably. Consider a paid plan for production.
- **Neon free tier**: Compute scales to zero after inactivity. First query after sleep has cold-start latency.
- **Vercel free tier**: Limited serverless function execution time and invocations.

Document the selected tier and its constraints for production planning.
