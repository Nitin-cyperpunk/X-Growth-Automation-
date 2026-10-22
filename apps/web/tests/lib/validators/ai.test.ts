import { describe, it, expect } from "vitest";
import {
  generatePostSchema,
  improveContentSchema,
  generatedPostSchema,
  generationResponseSchema,
  improvementResponseSchema,
  qualityScoresSchema,
  CONTENT_PILLARS,
  POST_FORMATS,
  TONE_OPTIONS,
  IMPROVEMENT_TYPES,
} from "@/lib/validators/ai";

describe("AI validators", () => {
  describe("generatePostSchema", () => {
    it("accepts valid generation request", () => {
      const result = generatePostSchema.safeParse({
        topic: "Building a REST API with Next.js",
        pillar: "web_dev",
        format: "short",
        tone: "conversational",
        variationCount: 3,
      });
      expect(result.success).toBe(true);
    });

    it("applies defaults for format, tone, charLimit, variationCount", () => {
      const result = generatePostSchema.safeParse({
        topic: "Testing strategies",
        pillar: "engineering",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.format).toBe("short");
        expect(result.data.tone).toBe("conversational");
        expect(result.data.charLimit).toBe(280);
        expect(result.data.variationCount).toBe(1);
      }
    });

    it("rejects topic shorter than 3 characters", () => {
      const result = generatePostSchema.safeParse({
        topic: "ab",
        pillar: "ai_ml",
      });
      expect(result.success).toBe(false);
    });

    it("rejects topic longer than 1000 characters", () => {
      const result = generatePostSchema.safeParse({
        topic: "x".repeat(1001),
        pillar: "ai_ml",
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid pillar", () => {
      const result = generatePostSchema.safeParse({
        topic: "Valid topic",
        pillar: "invalid_pillar",
      });
      expect(result.success).toBe(false);
    });

    it("rejects variationCount > 5", () => {
      const result = generatePostSchema.safeParse({
        topic: "Valid topic",
        pillar: "ai_ml",
        variationCount: 6,
      });
      expect(result.success).toBe(false);
    });

    it("rejects variationCount < 1", () => {
      const result = generatePostSchema.safeParse({
        topic: "Valid topic",
        pillar: "ai_ml",
        variationCount: 0,
      });
      expect(result.success).toBe(false);
    });

    it("rejects charLimit below 50", () => {
      const result = generatePostSchema.safeParse({
        topic: "Valid topic",
        pillar: "ai_ml",
        charLimit: 10,
      });
      expect(result.success).toBe(false);
    });

    it("accepts all valid pillar values", () => {
      for (const pillar of CONTENT_PILLARS) {
        const result = generatePostSchema.safeParse({
          topic: "Test topic",
          pillar,
        });
        expect(result.success).toBe(true);
      }
    });

    it("accepts all valid format values", () => {
      for (const format of POST_FORMATS) {
        const result = generatePostSchema.safeParse({
          topic: "Test topic",
          pillar: "ai_ml",
          format,
        });
        expect(result.success).toBe(true);
      }
    });

    it("accepts all valid tone values", () => {
      for (const tone of TONE_OPTIONS) {
        const result = generatePostSchema.safeParse({
          topic: "Test topic",
          pillar: "ai_ml",
          tone,
        });
        expect(result.success).toBe(true);
      }
    });
  });

  describe("improveContentSchema", () => {
    it("accepts valid improve request", () => {
      const result = improveContentSchema.safeParse({
        content: "Here is my post about building APIs",
        improvementType: "improve_hook",
      });
      expect(result.success).toBe(true);
    });

    it("rejects empty content", () => {
      const result = improveContentSchema.safeParse({
        content: "",
        improvementType: "make_clearer",
      });
      expect(result.success).toBe(false);
    });

    it("rejects content over 2000 characters", () => {
      const result = improveContentSchema.safeParse({
        content: "x".repeat(2001),
        improvementType: "make_clearer",
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid improvement type", () => {
      const result = improveContentSchema.safeParse({
        content: "Some content",
        improvementType: "invalid_type",
      });
      expect(result.success).toBe(false);
    });

    it("accepts all valid improvement types", () => {
      for (const type of IMPROVEMENT_TYPES) {
        const result = improveContentSchema.safeParse({
          content: "Some content",
          improvementType: type,
        });
        expect(result.success).toBe(true);
      }
    });

    it("accepts optional pillar and instructions", () => {
      const result = improveContentSchema.safeParse({
        content: "Some content",
        improvementType: "adapt_pillar",
        pillar: "ai_ml",
        instructions: "Focus on practical examples",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("qualityScoresSchema", () => {
    it("accepts valid scores", () => {
      const result = qualityScoresSchema.safeParse({
        relevance: 8,
        originality: 7,
        clarity: 9,
        engagement_potential: 6,
        authenticity: 8,
        actionability: 7,
      });
      expect(result.success).toBe(true);
    });

    it("rejects score below 1", () => {
      const result = qualityScoresSchema.safeParse({
        relevance: 0,
        originality: 7,
        clarity: 9,
        engagement_potential: 6,
        authenticity: 8,
        actionability: 7,
      });
      expect(result.success).toBe(false);
    });

    it("rejects score above 10", () => {
      const result = qualityScoresSchema.safeParse({
        relevance: 11,
        originality: 7,
        clarity: 9,
        engagement_potential: 6,
        authenticity: 8,
        actionability: 7,
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing fields", () => {
      const result = qualityScoresSchema.safeParse({
        relevance: 8,
        originality: 7,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("generatedPostSchema", () => {
    const validPost = {
      content: "Here's a practical tip for building APIs with Next.js.",
      hook_type: "practical_tip",
      content_pillar: "Web Development",
      scores: {
        relevance: 8,
        originality: 7,
        clarity: 9,
        engagement_potential: 6,
        authenticity: 8,
        actionability: 7,
      },
      average_score: 7.5,
      variation_angle: "Practical tip approach",
    };

    it("accepts valid generated post", () => {
      const result = generatedPostSchema.safeParse(validPost);
      expect(result.success).toBe(true);
    });

    it("rejects empty content", () => {
      const result = generatedPostSchema.safeParse({
        ...validPost,
        content: "",
      });
      expect(result.success).toBe(false);
    });

    it("rejects content over 500 characters", () => {
      const result = generatedPostSchema.safeParse({
        ...validPost,
        content: "x".repeat(501),
      });
      expect(result.success).toBe(false);
    });
  });

  describe("generationResponseSchema", () => {
    const validPost = {
      content: "Test post content",
      hook_type: "question",
      content_pillar: "AI & ML",
      scores: {
        relevance: 7,
        originality: 6,
        clarity: 8,
        engagement_potential: 7,
        authenticity: 8,
        actionability: 6,
      },
      average_score: 7.0,
      variation_angle: "Question-led approach",
    };

    it("accepts valid response with single post", () => {
      const result = generationResponseSchema.safeParse({
        posts: [validPost],
      });
      expect(result.success).toBe(true);
    });

    it("accepts valid response with multiple posts", () => {
      const result = generationResponseSchema.safeParse({
        posts: [validPost, { ...validPost, variation_angle: "Different angle" }],
      });
      expect(result.success).toBe(true);
    });

    it("rejects empty posts array", () => {
      const result = generationResponseSchema.safeParse({ posts: [] });
      expect(result.success).toBe(false);
    });

    it("rejects more than 5 posts", () => {
      const result = generationResponseSchema.safeParse({
        posts: Array(6).fill(validPost),
      });
      expect(result.success).toBe(false);
    });
  });

  describe("improvementResponseSchema", () => {
    it("accepts valid improvement response", () => {
      const result = improvementResponseSchema.safeParse({
        improved_content: "Improved version of the post",
        changes_made: "Strengthened the opening hook",
        scores: {
          relevance: 8,
          originality: 7,
          clarity: 9,
          engagement_potential: 7,
          authenticity: 8,
          actionability: 7,
        },
        average_score: 7.7,
      });
      expect(result.success).toBe(true);
    });

    it("rejects missing changes_made", () => {
      const result = improvementResponseSchema.safeParse({
        improved_content: "Improved version",
        scores: {
          relevance: 8,
          originality: 7,
          clarity: 9,
          engagement_potential: 7,
          authenticity: 8,
          actionability: 7,
        },
        average_score: 7.7,
      });
      expect(result.success).toBe(false);
    });
  });
});
