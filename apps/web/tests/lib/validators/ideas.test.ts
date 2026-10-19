import { describe, it, expect } from "vitest";
import { createIdeaSchema, updateIdeaSchema } from "@/lib/validators/ideas";

describe("createIdeaSchema", () => {
  it("accepts valid idea", () => {
    const result = createIdeaSchema.safeParse({ title: "My idea" });
    expect(result.success).toBe(true);
  });

  it("rejects empty title", () => {
    const result = createIdeaSchema.safeParse({ title: "" });
    expect(result.success).toBe(false);
  });

  it("rejects title over 500 characters", () => {
    const result = createIdeaSchema.safeParse({ title: "a".repeat(501) });
    expect(result.success).toBe(false);
  });

  it("defaults category to other", () => {
    const result = createIdeaSchema.safeParse({ title: "Test idea" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.category).toBe("other");
    }
  });

  it("validates category enum", () => {
    const result = createIdeaSchema.safeParse({
      title: "Test",
      category: "ai_ml",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid category", () => {
    const result = createIdeaSchema.safeParse({
      title: "Test",
      category: "invalid",
    });
    expect(result.success).toBe(false);
  });

  it("accepts tags array", () => {
    const result = createIdeaSchema.safeParse({
      title: "Test",
      tags: ["react", "nextjs"],
    });
    expect(result.success).toBe(true);
  });

  it("rejects more than 10 tags", () => {
    const result = createIdeaSchema.safeParse({
      title: "Test",
      tags: Array.from({ length: 11 }, (_, i) => `tag${i}`),
    });
    expect(result.success).toBe(false);
  });
});

describe("updateIdeaSchema", () => {
  it("accepts partial updates", () => {
    const result = updateIdeaSchema.safeParse({ status: "developing" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid status", () => {
    const result = updateIdeaSchema.safeParse({ status: "invalid" });
    expect(result.success).toBe(false);
  });
});
