import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("Token encryption", () => {
  const originalEnv = process.env;
  const VALID_KEY = Buffer.from("a".repeat(32)).toString("base64");

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("isEncryptionConfigured", () => {
    it("returns false when key is not set", async () => {
      delete process.env.X_TOKEN_ENCRYPTION_KEY;
      const { isEncryptionConfigured } = await import(
        "@/lib/x-api/encryption"
      );
      expect(isEncryptionConfigured()).toBe(false);
    });

    it("returns true when key is valid", async () => {
      process.env.X_TOKEN_ENCRYPTION_KEY = VALID_KEY;
      const { isEncryptionConfigured } = await import(
        "@/lib/x-api/encryption"
      );
      expect(isEncryptionConfigured()).toBe(true);
    });

    it("returns false when key is too short", async () => {
      process.env.X_TOKEN_ENCRYPTION_KEY = Buffer.from("short").toString(
        "base64"
      );
      const { isEncryptionConfigured } = await import(
        "@/lib/x-api/encryption"
      );
      expect(isEncryptionConfigured()).toBe(false);
    });
  });

  describe("encryptToken / decryptToken", () => {
    it("encrypts and decrypts a token correctly", async () => {
      process.env.X_TOKEN_ENCRYPTION_KEY = VALID_KEY;
      const { encryptToken, decryptToken } = await import(
        "@/lib/x-api/encryption"
      );

      const plaintext = "my-secret-access-token-12345";
      const encrypted = encryptToken(plaintext);
      expect(encrypted).not.toBe(plaintext);
      expect(encrypted).toBeTruthy();

      const decrypted = decryptToken(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it("produces different ciphertext each time (random IV)", async () => {
      process.env.X_TOKEN_ENCRYPTION_KEY = VALID_KEY;
      const { encryptToken } = await import("@/lib/x-api/encryption");

      const plaintext = "same-token";
      const encrypted1 = encryptToken(plaintext);
      const encrypted2 = encryptToken(plaintext);
      expect(encrypted1).not.toBe(encrypted2);
    });

    it("throws on decryption with wrong key", async () => {
      process.env.X_TOKEN_ENCRYPTION_KEY = VALID_KEY;
      const { encryptToken } = await import("@/lib/x-api/encryption");

      const encrypted = encryptToken("test-token");

      vi.resetModules();
      process.env.X_TOKEN_ENCRYPTION_KEY = Buffer.from("b".repeat(32)).toString(
        "base64"
      );
      const { decryptToken } = await import("@/lib/x-api/encryption");

      expect(() => decryptToken(encrypted)).toThrow();
    });

    it("throws on invalid ciphertext", async () => {
      process.env.X_TOKEN_ENCRYPTION_KEY = VALID_KEY;
      const { decryptToken } = await import("@/lib/x-api/encryption");

      expect(() => decryptToken("not-valid-base64!!!")).toThrow();
      expect(() => decryptToken(Buffer.from("short").toString("base64"))).toThrow();
    });

    it("throws when encryption key is not set", async () => {
      delete process.env.X_TOKEN_ENCRYPTION_KEY;
      const { encryptToken } = await import("@/lib/x-api/encryption");
      expect(() => encryptToken("test")).toThrow("X_TOKEN_ENCRYPTION_KEY");
    });

    it("handles single-character token", async () => {
      process.env.X_TOKEN_ENCRYPTION_KEY = VALID_KEY;
      const { encryptToken, decryptToken } = await import(
        "@/lib/x-api/encryption"
      );

      const encrypted = encryptToken("x");
      expect(decryptToken(encrypted)).toBe("x");
    });

    it("handles long tokens", async () => {
      process.env.X_TOKEN_ENCRYPTION_KEY = VALID_KEY;
      const { encryptToken, decryptToken } = await import(
        "@/lib/x-api/encryption"
      );

      const longToken = "x".repeat(2000);
      const encrypted = encryptToken(longToken);
      expect(decryptToken(encrypted)).toBe(longToken);
    });
  });
});
