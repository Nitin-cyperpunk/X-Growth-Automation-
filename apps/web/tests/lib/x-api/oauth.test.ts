import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("X API OAuth", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("getOAuthConfig", () => {
    it("returns null when env vars are not set", async () => {
      delete process.env.X_CLIENT_ID;
      delete process.env.X_CLIENT_SECRET;
      const { getOAuthConfig } = await import("@/lib/x-api/oauth");
      expect(getOAuthConfig()).toBeNull();
    });

    it("returns null when only client ID is set", async () => {
      process.env.X_CLIENT_ID = "test-client-id";
      delete process.env.X_CLIENT_SECRET;
      const { getOAuthConfig } = await import("@/lib/x-api/oauth");
      expect(getOAuthConfig()).toBeNull();
    });

    it("returns config when both env vars are set", async () => {
      process.env.X_CLIENT_ID = "test-client-id";
      process.env.X_CLIENT_SECRET = "test-client-secret";
      process.env.NEXTAUTH_URL = "https://example.com";
      const { getOAuthConfig } = await import("@/lib/x-api/oauth");
      const config = getOAuthConfig();
      expect(config).not.toBeNull();
      expect(config!.clientId).toBe("test-client-id");
      expect(config!.clientSecret).toBe("test-client-secret");
      expect(config!.redirectUri).toBe("https://example.com/api/x/callback");
    });

    it("defaults to localhost when NEXTAUTH_URL is not set", async () => {
      process.env.X_CLIENT_ID = "test-client-id";
      process.env.X_CLIENT_SECRET = "test-client-secret";
      delete process.env.NEXTAUTH_URL;
      const { getOAuthConfig } = await import("@/lib/x-api/oauth");
      const config = getOAuthConfig();
      expect(config!.redirectUri).toBe(
        "http://localhost:3000/api/x/callback"
      );
    });
  });

  describe("isXApiConfigured", () => {
    it("returns false when not configured", async () => {
      delete process.env.X_CLIENT_ID;
      delete process.env.X_CLIENT_SECRET;
      const { isXApiConfigured } = await import("@/lib/x-api/oauth");
      expect(isXApiConfigured()).toBe(false);
    });

    it("returns true when configured", async () => {
      process.env.X_CLIENT_ID = "test-client-id";
      process.env.X_CLIENT_SECRET = "test-client-secret";
      const { isXApiConfigured } = await import("@/lib/x-api/oauth");
      expect(isXApiConfigured()).toBe(true);
    });
  });

  describe("generatePKCE", () => {
    it("generates code verifier and challenge", async () => {
      const { generatePKCE } = await import("@/lib/x-api/oauth");
      const { codeVerifier, codeChallenge } = generatePKCE();

      expect(codeVerifier).toBeTruthy();
      expect(codeVerifier.length).toBeGreaterThanOrEqual(32);
      expect(codeVerifier.length).toBeLessThanOrEqual(128);
      expect(codeChallenge).toBeTruthy();
      expect(codeChallenge).not.toBe(codeVerifier);
    });

    it("generates different values each time", async () => {
      const { generatePKCE } = await import("@/lib/x-api/oauth");
      const first = generatePKCE();
      const second = generatePKCE();
      expect(first.codeVerifier).not.toBe(second.codeVerifier);
    });
  });

  describe("generateState", () => {
    it("generates a hex string", async () => {
      const { generateState } = await import("@/lib/x-api/oauth");
      const state = generateState();
      expect(state).toMatch(/^[0-9a-f]+$/);
      expect(state.length).toBe(64);
    });

    it("generates unique values", async () => {
      const { generateState } = await import("@/lib/x-api/oauth");
      const first = generateState();
      const second = generateState();
      expect(first).not.toBe(second);
    });
  });

  describe("buildAuthorizationUrl", () => {
    it("builds correct authorization URL", async () => {
      const { buildAuthorizationUrl } = await import("@/lib/x-api/oauth");
      const config = {
        clientId: "my-client-id",
        clientSecret: "my-client-secret",
        redirectUri: "https://example.com/api/x/callback",
      };

      const url = buildAuthorizationUrl(config, "test-state", "test-challenge");
      const parsed = new URL(url);

      expect(parsed.origin).toBe("https://x.com");
      expect(parsed.pathname).toBe("/i/oauth2/authorize");
      expect(parsed.searchParams.get("response_type")).toBe("code");
      expect(parsed.searchParams.get("client_id")).toBe("my-client-id");
      expect(parsed.searchParams.get("redirect_uri")).toBe(
        "https://example.com/api/x/callback"
      );
      expect(parsed.searchParams.get("state")).toBe("test-state");
      expect(parsed.searchParams.get("code_challenge")).toBe("test-challenge");
      expect(parsed.searchParams.get("code_challenge_method")).toBe("S256");
    });

    it("includes required scopes", async () => {
      const { buildAuthorizationUrl } = await import("@/lib/x-api/oauth");
      const config = {
        clientId: "id",
        clientSecret: "secret",
        redirectUri: "https://example.com/callback",
      };

      const url = buildAuthorizationUrl(config, "state", "challenge");
      const parsed = new URL(url);
      const scope = parsed.searchParams.get("scope")!;

      expect(scope).toContain("tweet.read");
      expect(scope).toContain("tweet.write");
      expect(scope).toContain("users.read");
      expect(scope).toContain("offline.access");
    });
  });

  describe("exchangeCodeForToken", () => {
    it("throws on 401 response", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: false,
          status: 401,
          text: () => Promise.resolve("Unauthorized"),
        })
      );

      const { exchangeCodeForToken } = await import("@/lib/x-api/oauth");
      const config = {
        clientId: "id",
        clientSecret: "secret",
        redirectUri: "https://example.com/callback",
      };

      await expect(
        exchangeCodeForToken(config, "code", "verifier")
      ).rejects.toThrow("Invalid client credentials");
    });

    it("throws on 400 response", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: false,
          status: 400,
          text: () => Promise.resolve("Bad Request"),
        })
      );

      const { exchangeCodeForToken } = await import("@/lib/x-api/oauth");
      const config = {
        clientId: "id",
        clientSecret: "secret",
        redirectUri: "https://example.com/callback",
      };

      await expect(
        exchangeCodeForToken(config, "code", "verifier")
      ).rejects.toThrow("Invalid or expired authorization code");
    });

    it("returns token data on success", async () => {
      const tokenData = {
        access_token: "test-access-token",
        refresh_token: "test-refresh-token",
        token_type: "bearer",
        expires_in: 7200,
        scope: "tweet.read tweet.write users.read offline.access",
      };

      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(tokenData),
        })
      );

      const { exchangeCodeForToken } = await import("@/lib/x-api/oauth");
      const config = {
        clientId: "id",
        clientSecret: "secret",
        redirectUri: "https://example.com/callback",
      };

      const result = await exchangeCodeForToken(config, "code", "verifier");
      expect(result.access_token).toBe("test-access-token");
      expect(result.refresh_token).toBe("test-refresh-token");
      expect(result.expires_in).toBe(7200);
    });
  });
});
