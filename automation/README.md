# Automation (n8n)

This directory contains version-controlled n8n workflow exports and documentation.

## Structure

```
automation/
├── workflows/                    — Exported n8n workflow JSON files
│   └── content-preparation.json  — Template for scheduled content generation
├── credentials.example.md        — Required credentials documentation
└── README.md
```

## Available Workflows

| Workflow | Webhook Path | Description |
|----------|-------------|-------------|
| Content Preparation | `/webhook/content-preparation` | Generate draft posts on a schedule |
| Queue Processing | `/webhook/queue-processing` | Process scheduled posts in the queue |
| Daily Ideas | `/webhook/daily-ideas` | Generate content ideas using AI |

## Setup

1. Deploy n8n (Docker, Render, or cloud).
2. Import workflows from `workflows/` directory into n8n.
3. Configure credentials in the n8n UI (see `credentials.example.md`).
4. Set the shared webhook secret in both n8n and the Next.js `.env.local`:
   - In n8n: configure the webhook node to validate `x-webhook-signature` header.
   - In Next.js: set `N8N_WEBHOOK_SECRET` to the same value.
5. Verify webhook connectivity.

## Webhook Contract

### Outbound (Next.js → n8n)

Triggers are sent as `POST` to `{N8N_BASE_URL}/webhook/{path}`.

Headers:
- `Content-Type: application/json`
- `X-Webhook-Signature: {hmac-sha256-hex}`
- `X-Webhook-Timestamp: {unix-ms}`

Payload:
```json
{
  "eventId": "uuid",
  "eventType": "content_preparation | queue_processing | daily_ideas",
  "schemaVersion": 1,
  "occurredAt": "2026-10-22T12:00:00.000Z",
  "userId": "uuid",
  "data": {
    "executionId": "uuid",
    "timezone": "UTC",
    "config": {}
  }
}
```

Signature is computed as: `HMAC-SHA256(secret, "{timestamp}.{json-body}")`

### Inbound (n8n → Next.js)

Callbacks are sent as `POST` to `{NEXTAUTH_URL}/api/webhooks/n8n`.

Headers:
- `Content-Type: application/json`
- `X-Webhook-Signature: {hmac-sha256-hex}`
- `X-Webhook-Timestamp: {unix-ms}`

Payload:
```json
{
  "eventId": "uuid",
  "executionId": "uuid",
  "status": "succeeded | failed",
  "result": {},
  "errorMessage": "optional error description"
}
```

## Security

- Webhook secret is shared between Next.js and n8n — never commit real secrets.
- HMAC-SHA256 signatures with timestamp prevent replay attacks (5-minute window).
- Constant-time signature comparison prevents timing attacks.
- HTTPS required in production.
- SSRF protections block localhost, metadata endpoints, and internal hosts in production.
- All inbound payloads are validated with Zod before processing.

## Safety Rules

- Never commit credentials or secrets in workflow exports.
- Workflows must be safe to retry (idempotent where possible).
- Job state is stored in PostgreSQL, not n8n memory.
- Handle rate limits, timeouts, and partial failures.
- Execution records use unique idempotency keys to prevent duplicates.

## Deployment Notes

### Render (Docker)

If running n8n on Render's free tier:
- **Limitation**: Free web services spin down after 15 minutes of inactivity.
- Scheduled workflows may not fire reliably on the free tier.
- **Recommendation**: Use Render's paid tier ($7/mo) or a dedicated VPS for persistent scheduling.
- Alternatively, use n8n Cloud for managed hosting with reliable scheduling.

### Self-hosted (Docker)

```bash
docker run -d \
  --name n8n \
  -p 5678:5678 \
  -e N8N_BASIC_AUTH_ACTIVE=true \
  -e N8N_BASIC_AUTH_USER=admin \
  -e N8N_BASIC_AUTH_PASSWORD=changeme \
  -v n8n_data:/home/node/.n8n \
  n8nio/n8n
```
