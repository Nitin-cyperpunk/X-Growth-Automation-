import { describe, it, expect } from "vitest";
import {
  xOAuthStateSchema,
  xOAuthCallbackSchema,
  xPublishPostSchema,
  xDisconnectSchema,
  xFetchMetricsSchema,
  xTokenResponseSchema,
  xUserResponseSchema,
  xCreateTweetResponseSchema,
  xTweetMetricsResponseSchema,
  countCharacters,
  isWithinCharacterLimit,
  POST_CHARACTER_LIMIT,
} from "@/lib/validators/x";

describe("X API validators", () => {
  describe("xOAuthStateSchema", () => {
    it("validates correct state", () => {
      const result = xOAuthStateSchema.safeParse({
        state: "abc123",
        codeVerifier: "verifier123",
      });
      expect(result.success).toBe(true);
    });

    it("rejects empty state", () => {
      const result = xOAuthStateSchema.safeParse({
        state: "",
        codeVerifier: "verifier123",
      });
      expect(result.success).toBe(false);
    });

    it("accepts optional returnTo", () => {
      const result = xOAuthStateSchema.safeParse({
        state: "abc",
        codeVerifier: "verifier",
        returnTo: "/settings",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("xOAuthCallbackSchema", () => {
    it("validates correct callback params", () => {
      const result = xOAuthCallbackSchema.safeParse({
        code: "auth-code-123",
        state: "state-456",
      });
      expect(result.success).toBe(true);
    });

    it("rejects missing code", () => {
      const result = xOAuthCallbackSchema.safeParse({
        state: "state-456",
      });
      expect(result.success).toBe(false);
    });

    it("rejects empty code", () => {
      const result = xOAuthCallbackSchema.safeParse({
        code: "",
        state: "state-456",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("xPublishPostSchema", () => {
    it("validates correct publish input", () => {
      const result = xPublishPostSchema.safeParse({
        postId: "550e8400-e29b-41d4-a716-446655440000",
        xAccountId: "550e8400-e29b-41d4-a716-446655440001",
      });
      expect(result.success).toBe(true);
    });

    it("rejects non-UUID postId", () => {
      const result = xPublishPostSchema.safeParse({
        postId: "not-a-uuid",
        xAccountId: "550e8400-e29b-41d4-a716-446655440001",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("xDisconnectSchema", () => {
    it("validates correct disconnect input", () => {
      const result = xDisconnectSchema.safeParse({
        xAccountId: "550e8400-e29b-41d4-a716-446655440000",
      });
      expect(result.success).toBe(true);
    });

    it("rejects non-UUID", () => {
      const result = xDisconnectSchema.safeParse({
        xAccountId: "bad-id",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("xFetchMetricsSchema", () => {
    it("validates correct metrics input", () => {
      const result = xFetchMetricsSchema.safeParse({
        postId: "550e8400-e29b-41d4-a716-446655440000",
        xAccountId: "550e8400-e29b-41d4-a716-446655440001",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("xTokenResponseSchema", () => {
    it("validates X token response", () => {
      const result = xTokenResponseSchema.safeParse({
        access_token: "test-token",
        token_type: "bearer",
        expires_in: 7200,
        scope: "tweet.read tweet.write",
      });
      expect(result.success).toBe(true);
    });

    it("allows optional refresh_token", () => {
      const result = xTokenResponseSchema.safeParse({
        access_token: "test",
        refresh_token: "refresh",
        token_type: "bearer",
        expires_in: 7200,
        scope: "tweet.read",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.refresh_token).toBe("refresh");
      }
    });

    it("rejects negative expires_in", () => {
      const result = xTokenResponseSchema.safeParse({
        access_token: "test",
        token_type: "bearer",
        expires_in: -1,
        scope: "tweet.read",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("xUserResponseSchema", () => {
    it("validates user response", () => {
      const result = xUserResponseSchema.safeParse({
        data: {
          id: "12345",
          name: "Test User",
          username: "testuser",
        },
      });
      expect(result.success).toBe(true);
    });

    it("allows optional profile_image_url", () => {
      const result = xUserResponseSchema.safeParse({
        data: {
          id: "12345",
          name: "Test User",
          username: "testuser",
          profile_image_url: "https://pbs.twimg.com/profile.jpg",
        },
      });
      expect(result.success).toBe(true);
    });

    it("rejects missing username", () => {
      const result = xUserResponseSchema.safeParse({
        data: {
          id: "12345",
          name: "Test User",
        },
      });
      expect(result.success).toBe(false);
    });
  });

  describe("xCreateTweetResponseSchema", () => {
    it("validates tweet creation response", () => {
      const result = xCreateTweetResponseSchema.safeParse({
        data: {
          id: "1234567890",
          text: "Hello world!",
        },
      });
      expect(result.success).toBe(true);
    });
  });

  describe("xTweetMetricsResponseSchema", () => {
    it("validates metrics response", () => {
      const result = xTweetMetricsResponseSchema.safeParse({
        data: {
          id: "1234567890",
          text: "Hello world!",
          public_metrics: {
            impression_count: 100,
            like_count: 10,
            reply_count: 5,
            retweet_count: 3,
            quote_count: 1,
            bookmark_count: 2,
          },
        },
      });
      expect(result.success).toBe(true);
    });

    it("allows optional public_metrics", () => {
      const result = xTweetMetricsResponseSchema.safeParse({
        data: {
          id: "1234567890",
          text: "Hello",
        },
      });
      expect(result.success).toBe(true);
    });
  });

  describe("character counting", () => {
    it("counts plain text correctly", () => {
      expect(countCharacters("Hello world")).toBe(11);
    });

    it("counts empty string", () => {
      expect(countCharacters("")).toBe(0);
    });

    it("counts URLs as 23 characters", () => {
      const text = "Check this out https://example.com/very/long/path/here";
      expect(countCharacters(text)).toBe(15 + 23);
    });

    it("counts multiple URLs", () => {
      const text =
        "Link1 https://a.com and https://b.com end";
      expect(countCharacters(text)).toBe(6 + 23 + 5 + 23 + 4);
    });

    it("counts text without URLs normally", () => {
      const text = "No URLs here, just text!";
      expect(countCharacters(text)).toBe(24);
    });

    it("returns correct limit constant", () => {
      expect(POST_CHARACTER_LIMIT).toBe(280);
    });

    it("checks within limit correctly", () => {
      expect(isWithinCharacterLimit("short")).toBe(true);
      expect(isWithinCharacterLimit("x".repeat(280))).toBe(true);
      expect(isWithinCharacterLimit("x".repeat(281))).toBe(false);
    });

    it("counts emojis by JS string length", () => {
      expect(countCharacters("Hello! 🎉")).toBe("Hello! 🎉".length);
    });
  });
});
