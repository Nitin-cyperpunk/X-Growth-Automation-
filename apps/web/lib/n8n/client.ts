import { createHmac, timingSafeEqual } from "crypto";

const REQUEST_TIMEOUT_MS = 15_000;
const MAX_RETRIES = 1;

export interface N8nConfig {
  baseUrl: string;
  webhookSecret: string;
}

export interface N8nTriggerPayload {
  eventId: string;
  eventType: string;
  schemaVersion: number;
  occurredAt: string;
  userId: string;
  data: Record<string, unknown>;
}

export interface N8nResponse {
  ok: boolean;
  status: number;
  body: unknown;
}

export function getN8nConfig(): N8nConfig | null {
  const baseUrl = process.env.N8N_BASE_URL;
  const webhookSecret = process.env.N8N_WEBHOOK_SECRET;

  if (!baseUrl || !webhookSecret) {
    return null;
  }

  return { baseUrl, webhookSecret };
}

export function isN8nConfigured(): boolean {
  return getN8nConfig() !== null;
}

export function validateN8nBaseUrl(url: string): { valid: boolean; error?: string } {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { valid: false, error: "Invalid URL format" };
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    return { valid: false, error: "URL must use http or https protocol" };
  }

  const hostname = parsed.hostname.toLowerCase();

  const blockedHosts = [
    "localhost",
    "127.0.0.1",
    "0.0.0.0",
    "::1",
    "[::1]",
    "metadata.google.internal",
    "169.254.169.254",
  ];

  if (process.env.NODE_ENV === "production") {
    if (blockedHosts.includes(hostname)) {
      return { valid: false, error: "URL points to a blocked host in production" };
    }
    if (hostname.endsWith(".internal") || hostname.endsWith(".local")) {
      return { valid: false, error: "URL points to an internal network host" };
    }
    if (parsed.protocol !== "https:") {
      return { valid: false, error: "Production URL must use HTTPS" };
    }
  }

  if (parsed.username || parsed.password) {
    return { valid: false, error: "URL must not contain credentials" };
  }

  return { valid: true };
}

export function createHmacSignature(
  payload: string,
  secret: string,
  timestamp: number
): string {
  const data = `${timestamp}.${payload}`;
  return createHmac("sha256", secret).update(data).digest("hex");
}

export function verifyHmacSignature(
  payload: string,
  signature: string,
  secret: string,
  timestamp: number,
  maxAgeMs: number = 300_000
): { valid: boolean; error?: string } {
  const now = Date.now();
  if (Math.abs(now - timestamp) > maxAgeMs) {
    return { valid: false, error: "Signature timestamp expired" };
  }

  const expected = createHmacSignature(payload, secret, timestamp);

  const sigBuffer = Buffer.from(signature, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");

  if (sigBuffer.length !== expectedBuffer.length) {
    return { valid: false, error: "Invalid signature" };
  }

  if (!timingSafeEqual(sigBuffer, expectedBuffer)) {
    return { valid: false, error: "Invalid signature" };
  }

  return { valid: true };
}

export async function triggerN8nWebhook(
  webhookPath: string,
  payload: N8nTriggerPayload
): Promise<N8nResponse> {
  const config = getN8nConfig();
  if (!config) {
    throw new Error("n8n is not configured. Set N8N_BASE_URL and N8N_WEBHOOK_SECRET in .env.local.");
  }

  const urlValidation = validateN8nBaseUrl(config.baseUrl);
  if (!urlValidation.valid) {
    throw new Error(`n8n base URL is invalid: ${urlValidation.error}`);
  }

  const safePath = webhookPath.replace(/^\/+/, "");
  if (safePath.includes("..") || safePath.includes("//")) {
    throw new Error("Invalid webhook path");
  }

  const url = new URL(`/webhook/${safePath}`, config.baseUrl);
  if (url.origin !== new URL(config.baseUrl).origin) {
    throw new Error("Webhook URL resolves to a different host (possible redirect bypass)");
  }

  const body = JSON.stringify(payload);
  const timestamp = Date.now();
  const signature = createHmacSignature(body, config.webhookSecret, timestamp);

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      const response = await fetch(url.toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Signature": signature,
          "X-Webhook-Timestamp": timestamp.toString(),
        },
        body,
        signal: controller.signal,
        redirect: "error",
      });

      clearTimeout(timeout);

      let responseBody: unknown;
      try {
        responseBody = await response.json();
      } catch {
        responseBody = null;
      }

      return {
        ok: response.ok,
        status: response.status,
        body: responseBody,
      };
    } catch (e) {
      lastError = e as Error;
      const msg = lastError.message || "";

      if (msg.includes("abort") || msg.includes("timeout")) {
        if (attempt < MAX_RETRIES) {
          continue;
        }
        throw new Error("n8n webhook request timed out. Check that n8n is running and reachable.");
      }

      if (msg.includes("redirect")) {
        throw new Error("n8n webhook was redirected. This may indicate a misconfigured URL.");
      }

      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
        continue;
      }

      throw new Error(`n8n webhook request failed: ${msg.slice(0, 200)}`);
    }
  }

  throw lastError || new Error("n8n webhook request failed after retries");
}
