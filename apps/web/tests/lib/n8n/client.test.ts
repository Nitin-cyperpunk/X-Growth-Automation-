import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("n8n client", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("isN8nConfigured", () => {
    it("returns false when env vars are not set", async () => {
      delete process.env.N8N_BASE_URL;
      delete process.env.N8N_WEBHOOK_SECRET;
      const { isN8nConfigured } = await import("@/lib/n8n/client");
      expect(isN8nConfigured()).toBe(false);
    });

    it("returns false when only base URL is set", async () => {
      process.env.N8N_BASE_URL = "https://n8n.example.com";
      delete process.env.N8N_WEBHOOK_SECRET;
      const { isN8nConfigured } = await import("@/lib/n8n/client");
      expect(isN8nConfigured()).toBe(false);
    });

    it("returns false when only secret is set", async () => {
      delete process.env.N8N_BASE_URL;
      process.env.N8N_WEBHOOK_SECRET = "test-secret";
      const { isN8nConfigured } = await import("@/lib/n8n/client");
      expect(isN8nConfigured()).toBe(false);
    });

    it("returns true when both env vars are set", async () => {
      process.env.N8N_BASE_URL = "https://n8n.example.com";
      process.env.N8N_WEBHOOK_SECRET = "test-secret";
      const { isN8nConfigured } = await import("@/lib/n8n/client");
      expect(isN8nConfigured()).toBe(true);
    });
  });

  describe("validateN8nBaseUrl", () => {
    it("accepts valid HTTPS URL", async () => {
      const { validateN8nBaseUrl } = await import("@/lib/n8n/client");
      const result = validateN8nBaseUrl("https://n8n.example.com");
      expect(result.valid).toBe(true);
    });

    it("accepts HTTP URL in non-production", async () => {
      (process.env as Record<string, string | undefined>).NODE_ENV = "development";
      const { validateN8nBaseUrl } = await import("@/lib/n8n/client");
      const result = validateN8nBaseUrl("http://localhost:5678");
      expect(result.valid).toBe(true);
    });

    it("rejects HTTP in production", async () => {
      (process.env as Record<string, string | undefined>).NODE_ENV = "production";
      const { validateN8nBaseUrl } = await import("@/lib/n8n/client");
      const result = validateN8nBaseUrl("http://n8n.example.com");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("HTTPS");
    });

    it("rejects invalid URL", async () => {
      const { validateN8nBaseUrl } = await import("@/lib/n8n/client");
      const result = validateN8nBaseUrl("not a url");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("Invalid URL");
    });

    it("rejects FTP protocol", async () => {
      const { validateN8nBaseUrl } = await import("@/lib/n8n/client");
      const result = validateN8nBaseUrl("ftp://n8n.example.com");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("http or https");
    });

    it("rejects URL with credentials", async () => {
      const { validateN8nBaseUrl } = await import("@/lib/n8n/client");
      const result = validateN8nBaseUrl("https://user:pass@n8n.example.com");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("credentials");
    });

    it("blocks localhost in production", async () => {
      (process.env as Record<string, string | undefined>).NODE_ENV = "production";
      const { validateN8nBaseUrl } = await import("@/lib/n8n/client");
      const result = validateN8nBaseUrl("https://localhost:5678");
      expect(result.valid).toBe(false);
    });

    it("blocks 127.0.0.1 in production", async () => {
      (process.env as Record<string, string | undefined>).NODE_ENV = "production";
      const { validateN8nBaseUrl } = await import("@/lib/n8n/client");
      const result = validateN8nBaseUrl("https://127.0.0.1:5678");
      expect(result.valid).toBe(false);
    });

    it("blocks metadata endpoint in production", async () => {
      (process.env as Record<string, string | undefined>).NODE_ENV = "production";
      const { validateN8nBaseUrl } = await import("@/lib/n8n/client");
      const result = validateN8nBaseUrl("https://169.254.169.254");
      expect(result.valid).toBe(false);
    });

    it("blocks .internal domains in production", async () => {
      (process.env as Record<string, string | undefined>).NODE_ENV = "production";
      const { validateN8nBaseUrl } = await import("@/lib/n8n/client");
      const result = validateN8nBaseUrl("https://metadata.google.internal");
      expect(result.valid).toBe(false);
    });
  });

  describe("HMAC signatures", () => {
    it("creates and verifies a valid signature", async () => {
      const { createHmacSignature, verifyHmacSignature } = await import(
        "@/lib/n8n/client"
      );
      const payload = '{"test":"data"}';
      const secret = "my-secret-key";
      const timestamp = Date.now();

      const sig = createHmacSignature(payload, secret, timestamp);
      const result = verifyHmacSignature(payload, sig, secret, timestamp);
      expect(result.valid).toBe(true);
    });

    it("rejects signature with wrong payload", async () => {
      const { createHmacSignature, verifyHmacSignature } = await import(
        "@/lib/n8n/client"
      );
      const secret = "my-secret-key";
      const timestamp = Date.now();

      const sig = createHmacSignature('{"test":"data"}', secret, timestamp);
      const result = verifyHmacSignature('{"test":"tampered"}', sig, secret, timestamp);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("Invalid signature");
    });

    it("rejects signature with wrong secret", async () => {
      const { createHmacSignature, verifyHmacSignature } = await import(
        "@/lib/n8n/client"
      );
      const payload = '{"test":"data"}';
      const timestamp = Date.now();

      const sig = createHmacSignature(payload, "secret-a", timestamp);
      const result = verifyHmacSignature(payload, sig, "secret-b", timestamp);
      expect(result.valid).toBe(false);
    });

    it("rejects expired timestamp", async () => {
      const { createHmacSignature, verifyHmacSignature } = await import(
        "@/lib/n8n/client"
      );
      const payload = '{"test":"data"}';
      const secret = "my-secret-key";
      const oldTimestamp = Date.now() - 600_000;

      const sig = createHmacSignature(payload, secret, oldTimestamp);
      const result = verifyHmacSignature(payload, sig, secret, oldTimestamp);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("expired");
    });

    it("uses constant-time comparison", async () => {
      const { createHmacSignature, verifyHmacSignature } = await import(
        "@/lib/n8n/client"
      );
      const payload = '{"test":"data"}';
      const secret = "my-secret-key";
      const timestamp = Date.now();

      const sig = createHmacSignature(payload, secret, timestamp);
      expect(sig).toMatch(/^[0-9a-f]{64}$/);

      const result = verifyHmacSignature(payload, sig, secret, timestamp);
      expect(result.valid).toBe(true);
    });
  });

  describe("triggerN8nWebhook", () => {
    it("throws when n8n is not configured", async () => {
      delete process.env.N8N_BASE_URL;
      delete process.env.N8N_WEBHOOK_SECRET;
      const { triggerN8nWebhook } = await import("@/lib/n8n/client");

      await expect(
        triggerN8nWebhook("test-path", {
          eventId: "test-id",
          eventType: "test",
          schemaVersion: 1,
          occurredAt: new Date().toISOString(),
          userId: "user-1",
          data: {},
        })
      ).rejects.toThrow("n8n is not configured");
    });
  });
});
