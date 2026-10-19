import { describe, it, expect } from "vitest";
import { createPostSchema, updatePostSchema, X_MAX_CHARS } from "@/lib/validators/posts";

describe("createPostSchema", () => {
  it("accepts valid post content", () => {
    const result = createPostSchema.safeParse({ content: "Hello world" });
    expect(result.success).toBe(true);
  });

  it("rejects empty content", () => {
    const result = createPostSchema.safeParse({ content: "" });
    expect(result.success).toBe(false);
  });

  it("rejects content over character limit", () => {
    const result = createPostSchema.safeParse({
      content: "a".repeat(X_MAX_CHARS + 1),
    });
    expect(result.success).toBe(false);
  });

  it("accepts content at exactly the character limit", () => {
    const result = createPostSchema.safeParse({
      content: "a".repeat(X_MAX_CHARS),
    });
    expect(result.success).toBe(true);
  });

  it("accepts optional scheduledFor as ISO datetime", () => {
    const result = createPostSchema.safeParse({
      content: "Test post",
      scheduledFor: "2026-12-01T10:00:00Z",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid scheduledFor format", () => {
    const result = createPostSchema.safeParse({
      content: "Test post",
      scheduledFor: "not-a-date",
    });
    expect(result.success).toBe(false);
  });
});

describe("updatePostSchema", () => {
  it("accepts partial updates", () => {
    const result = updatePostSchema.safeParse({ status: "approved" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid status values", () => {
    const result = updatePostSchema.safeParse({ status: "invalid" });
    expect(result.success).toBe(false);
  });

  it("accepts empty object (no updates)", () => {
    const result = updatePostSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});
