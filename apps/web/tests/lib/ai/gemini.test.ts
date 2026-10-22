import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("gemini client", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("isGeminiConfigured", () => {
    it("returns false when GEMINI_API_KEY is not set", async () => {
      delete process.env.GEMINI_API_KEY;
      const { isGeminiConfigured } = await import("@/lib/ai/gemini");
      expect(isGeminiConfigured()).toBe(false);
    });

    it("returns true when GEMINI_API_KEY is set", async () => {
      process.env.GEMINI_API_KEY = "test-key-123";
      const { isGeminiConfigured } = await import("@/lib/ai/gemini");
      expect(isGeminiConfigured()).toBe(true);
    });

    it("returns false when GEMINI_API_KEY is empty string", async () => {
      process.env.GEMINI_API_KEY = "";
      const { isGeminiConfigured } = await import("@/lib/ai/gemini");
      expect(isGeminiConfigured()).toBe(false);
    });
  });

  describe("getGeminiApiKey", () => {
    it("returns null when key is not set", async () => {
      delete process.env.GEMINI_API_KEY;
      const { getGeminiApiKey } = await import("@/lib/ai/gemini");
      expect(getGeminiApiKey()).toBeNull();
    });

    it("returns the key when set", async () => {
      process.env.GEMINI_API_KEY = "my-secret-key";
      const { getGeminiApiKey } = await import("@/lib/ai/gemini");
      expect(getGeminiApiKey()).toBe("my-secret-key");
    });
  });

  describe("getModelId", () => {
    it("returns the model identifier", async () => {
      const { getModelId } = await import("@/lib/ai/gemini");
      expect(getModelId()).toBe("gemini-2.0-flash");
    });
  });

  describe("generateContent", () => {
    it("throws when API key is not configured", async () => {
      delete process.env.GEMINI_API_KEY;
      const { generateContent } = await import("@/lib/ai/gemini");
      await expect(
        generateContent("system prompt", "user prompt")
      ).rejects.toThrow("GEMINI_API_KEY is not configured");
    });
  });
});
