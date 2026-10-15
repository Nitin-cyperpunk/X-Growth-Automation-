# n8n Credentials Setup

Configure these credentials in the n8n UI after importing workflows.

## PostgreSQL

- **Type**: PostgreSQL
- **Host**: Your Neon hostname
- **Port**: 5432
- **Database**: Your database name
- **User**: Your database user
- **Password**: Your database password
- **SSL**: Enabled

## Webhook Authentication

Incoming webhooks from the Next.js app include a shared secret in the `x-webhook-secret` header. Configure this to match the `N8N_WEBHOOK_SECRET` in the app's environment.

## X API (if used directly in n8n)

- **Type**: OAuth 2.0
- **Client ID**: From X Developer Portal
- **Client Secret**: From X Developer Portal

Note: X API calls are primarily handled by the Next.js app. n8n triggers publishing via the app's webhook endpoints.
