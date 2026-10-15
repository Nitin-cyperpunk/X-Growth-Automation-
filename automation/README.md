# Automation (n8n)

This directory contains version-controlled n8n workflow exports and documentation.

## Structure

```
automation/
├── workflows/          — Exported n8n workflow JSON files
├── credentials.example.md  — Required credentials documentation
└── README.md
```

## Workflows

Workflows are exported as JSON from n8n and committed here for version control. They do not contain credentials — those are configured directly in n8n.

## Setup

1. Run n8n in Docker (see `docs/deployment.md`).
2. Import workflows from `workflows/` directory.
3. Configure credentials in the n8n UI.
4. Verify webhook connectivity with the Next.js app.

## Safety Rules

- Never commit credentials or secrets in workflow exports.
- Workflows must be safe to retry (idempotent where possible).
- Job state is stored in PostgreSQL, not n8n memory.
- Handle rate limits, timeouts, and partial failures.
