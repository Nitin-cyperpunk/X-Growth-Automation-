import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/db", () => ({
  getDb: vi.fn(),
  schema: {
    xAccounts: {
      id: "id",
      userId: "user_id",
      xUserId: "x_user_id",
      xUsername: "x_username",
      xDisplayName: "x_display_name",
      accessToken: "access_token",
      refreshToken: "refresh_token",
      tokenExpiresAt: "token_expires_at",
      updatedAt: "updated_at",
    },
  },
}));

vi.mock("@/lib/x-api/encryption", () => ({
  encryptToken: vi.fn((t: string) => `encrypted_${t}`),
  decryptToken: vi.fn((t: string) => t.replace("encrypted_", "")),
}));

describe("X API client", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe("createXApiClient", () => {
    it("makes authenticated requests", async () => {
      const mockUser = {
        data: {
          id: "123",
          name: "Test User",
          username: "testuser",
        },
      };

      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockUser),
        })
      );

      const { createXApiClient } = await import("@/lib/x-api/client");
      const client = createXApiClient("test-token", null);
      const user = await client.getMe();

      expect(user.id).toBe("123");
      expect(user.username).toBe("testuser");

      const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(fetchCall[0]).toContain("/users/me");
      expect(fetchCall[1].headers.Authorization).toBe("Bearer test-token");
    });

    it("creates a tweet", async () => {
      const mockTweet = {
        data: { id: "tweet-123", text: "Hello world!" },
      };

      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockTweet),
        })
      );

      const { createXApiClient } = await import("@/lib/x-api/client");
      const client = createXApiClient("test-token", null);
      const tweet = await client.createTweet("Hello world!");

      expect(tweet.id).toBe("tweet-123");
      expect(tweet.text).toBe("Hello world!");

      const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(fetchCall[0]).toContain("/tweets");
      expect(fetchCall[1].method).toBe("POST");
      expect(JSON.parse(fetchCall[1].body)).toEqual({ text: "Hello world!" });
    });

    it("rejects empty tweet text", async () => {
      const { createXApiClient } = await import("@/lib/x-api/client");
      const client = createXApiClient("test-token", null);
      await expect(client.createTweet("")).rejects.toThrow("empty");
    });

    it("rejects tweet text over 280 chars", async () => {
      const { createXApiClient } = await import("@/lib/x-api/client");
      const client = createXApiClient("test-token", null);
      await expect(client.createTweet("x".repeat(281))).rejects.toThrow("280");
    });

    it("handles rate limit errors", async () => {
      const headers = new Map();
      headers.set("x-rate-limit-reset", String(Math.floor(Date.now() / 1000) + 900));

      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: false,
          status: 429,
          headers: { get: (name: string) => headers.get(name) },
          text: () => Promise.resolve("Rate limited"),
        })
      );

      const { createXApiClient } = await import("@/lib/x-api/client");
      const client = createXApiClient("test-token", null);
      await expect(client.getMe()).rejects.toThrow("rate limit");
    });

    it("handles generic API errors", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: false,
          status: 500,
          text: () => Promise.resolve("Internal Server Error"),
        })
      );

      const { createXApiClient } = await import("@/lib/x-api/client");
      const client = createXApiClient("test-token", null);
      await expect(client.getMe()).rejects.toThrow("X API error (500)");
    });

    it("gets tweet metrics", async () => {
      const mockTweet = {
        data: {
          id: "tweet-123",
          text: "Hello",
          created_at: "2026-01-01T00:00:00Z",
          public_metrics: {
            impression_count: 100,
            like_count: 10,
            reply_count: 5,
            retweet_count: 3,
            quote_count: 1,
            bookmark_count: 2,
          },
        },
      };

      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockTweet),
        })
      );

      const { createXApiClient } = await import("@/lib/x-api/client");
      const client = createXApiClient("test-token", null);
      const metrics = await client.getTweetMetrics("tweet-123");

      expect(metrics).not.toBeNull();
      expect(metrics!.impressionCount).toBe(100);
      expect(metrics!.likeCount).toBe(10);
      expect(metrics!.replyCount).toBe(5);
      expect(metrics!.repostCount).toBe(3);
    });

    it("returns null metrics on fetch error", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: false,
          status: 404,
          text: () => Promise.resolve("Not found"),
        })
      );

      const { createXApiClient } = await import("@/lib/x-api/client");
      const client = createXApiClient("test-token", null);
      const metrics = await client.getTweetMetrics("nonexistent");
      expect(metrics).toBeNull();
    });

    it("attempts token refresh on 401", async () => {
      let callCount = 0;
      vi.stubGlobal(
        "fetch",
        vi.fn().mockImplementation(async (url: string) => {
          callCount++;
          if (callCount === 1) {
            return {
              ok: false,
              status: 401,
              text: () => Promise.resolve("Unauthorized"),
              headers: { get: () => null },
            };
          }
          if (url.includes("oauth2/token")) {
            return {
              ok: true,
              json: () =>
                Promise.resolve({
                  access_token: "new-token",
                  token_type: "bearer",
                  expires_in: 7200,
                  scope: "tweet.read",
                }),
            };
          }
          return {
            ok: true,
            json: () =>
              Promise.resolve({
                data: { id: "123", name: "User", username: "user" },
              }),
          };
        })
      );

      const { createXApiClient } = await import("@/lib/x-api/client");

      process.env.X_CLIENT_ID = "test-id";
      process.env.X_CLIENT_SECRET = "test-secret";

      const onRefresh = vi.fn();
      const client = createXApiClient("old-token", "refresh-token", onRefresh);
      const user = await client.getMe();

      expect(user.username).toBe("user");
    });
  });
});
