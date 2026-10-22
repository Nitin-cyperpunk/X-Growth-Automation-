import { describe, it, expect } from "vitest";
import { createIdeaSchema, updateIdeaSchema } from "@/lib/validators/ideas";

describe("idea validators — extended coverage for Prompt 04", () => {
  describe("createIdeaSchema — boundary cases", () => {
    it("accepts minimal valid idea (title only)", () => {
      const result = createIdeaSchema.safeParse({ title: "My idea" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.category).toBe("other");
        expect(result.data.tags).toEqual([]);
      }
    });

    it("accepts idea with all fields populated", () => {
      const result = createIdeaSchema.safeParse({
        title: "Full idea",
        body: "Detailed description of the idea",
        category: "ai_ml",
        tags: ["tag1", "tag2", "tag3"],
      });
      expect(result.success).toBe(true);
    });

    it("rejects title exceeding 500 characters", () => {
      const result = createIdeaSchema.safeParse({
        title: "x".repeat(501),
      });
      expect(result.success).toBe(false);
    });

    it("rejects body exceeding 5000 characters", () => {
      const result = createIdeaSchema.safeParse({
        title: "Valid title",
        body: "x".repeat(5001),
      });
      expect(result.success).toBe(false);
    });

    it("rejects more than 10 tags", () => {
      const result = createIdeaSchema.safeParse({
        title: "Valid",
        tags: Array.from({ length: 11 }, (_, i) => `tag${i}`),
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid category value", () => {
      const result = createIdeaSchema.safeParse({
        title: "Valid",
        category: "invalid_category",
      });
      expect(result.success).toBe(false);
    });

    it("accepts all valid category values", () => {
      const categories = [
        "ai_ml", "web_dev", "engineering", "building_in_public",
        "experiments", "career", "other",
      ];
      for (const category of categories) {
        const result = createIdeaSchema.safeParse({ title: "Test", category });
        expect(result.success).toBe(true);
      }
    });
  });

  describe("updateIdeaSchema — partial updates", () => {
    it("accepts empty object (no fields to update)", () => {
      const result = updateIdeaSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("accepts status change only", () => {
      const result = updateIdeaSchema.safeParse({ status: "archived" });
      expect(result.success).toBe(true);
    });

    it("accepts nullable body (clear body content)", () => {
      const result = updateIdeaSchema.safeParse({ body: null });
      expect(result.success).toBe(true);
    });

    it("rejects invalid status value", () => {
      const result = updateIdeaSchema.safeParse({ status: "nonexistent" });
      expect(result.success).toBe(false);
    });

    it("accepts all valid status values", () => {
      const statuses = ["new", "developing", "ready", "used", "archived"];
      for (const status of statuses) {
        const result = updateIdeaSchema.safeParse({ status });
        expect(result.success).toBe(true);
      }
    });
  });
});
