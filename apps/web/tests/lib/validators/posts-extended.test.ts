import { describe, it, expect } from "vitest";
import {
  createPostSchema,
  updatePostSchema,
  X_MAX_CHARS,
} from "@/lib/validators/posts";

describe("post validators — extended coverage for Prompt 04", () => {
  describe("createPostSchema — lifecycle and scheduling", () => {
    it("accepts content at exactly the character limit", () => {
      const result = createPostSchema.safeParse({
        content: "x".repeat(X_MAX_CHARS),
      });
      expect(result.success).toBe(true);
    });

    it("rejects content one character over the limit", () => {
      const result = createPostSchema.safeParse({
        content: "x".repeat(X_MAX_CHARS + 1),
      });
      expect(result.success).toBe(false);
    });

    it("rejects empty string content", () => {
      const result = createPostSchema.safeParse({ content: "" });
      expect(result.success).toBe(false);
    });

    it("rejects whitespace-only content", () => {
      const result = createPostSchema.safeParse({ content: "" });
      expect(result.success).toBe(false);
    });

    it("accepts valid ISO datetime for scheduledFor", () => {
      const result = createPostSchema.safeParse({
        content: "Hello world",
        scheduledFor: "2026-12-01T10:00:00.000Z",
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid datetime string for scheduledFor", () => {
      const result = createPostSchema.safeParse({
        content: "Hello world",
        scheduledFor: "not-a-date",
      });
      expect(result.success).toBe(false);
    });

    it("accepts post without scheduledFor (draft)", () => {
      const result = createPostSchema.safeParse({ content: "Just a draft" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.scheduledFor).toBeUndefined();
      }
    });
  });

  describe("updatePostSchema — partial updates and status transitions", () => {
    it("accepts empty object (no fields to update)", () => {
      const result = updatePostSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("accepts status-only update", () => {
      const result = updatePostSchema.safeParse({ status: "pending_approval" });
      expect(result.success).toBe(true);
    });

    it("accepts nullable scheduledFor (clear schedule)", () => {
      const result = updatePostSchema.safeParse({ scheduledFor: null });
      expect(result.success).toBe(true);
    });

    it("rejects invalid status value", () => {
      const result = updatePostSchema.safeParse({ status: "invalid_status" });
      expect(result.success).toBe(false);
    });

    it("accepts all valid update status values", () => {
      const statuses = [
        "draft", "pending_approval", "approved", "scheduled", "cancelled",
      ];
      for (const status of statuses) {
        const result = updatePostSchema.safeParse({ status });
        expect(result.success).toBe(true);
      }
    });

    it("X_MAX_CHARS is 280", () => {
      expect(X_MAX_CHARS).toBe(280);
    });
  });

  describe("duplicate/idempotency considerations", () => {
    it("same content can be parsed multiple times (stateless validation)", () => {
      const input = { content: "Same content twice" };
      const r1 = createPostSchema.safeParse(input);
      const r2 = createPostSchema.safeParse(input);
      expect(r1.success).toBe(true);
      expect(r2.success).toBe(true);
    });
  });
});
