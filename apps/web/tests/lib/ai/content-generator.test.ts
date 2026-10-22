import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockGenerateContent } = vi.hoisted(() => ({
  mockGenerateContent: vi.fn(),
}));

vi.mock("@/lib/ai/gemini", () => ({
  generateContent: mockGenerateContent,
  getModelId: () => "gemini-2.0-flash",
}));

import { generatePosts, improveContent } from "@/lib/ai/content-generator";
import type { GeneratePostInput, ImproveContentInput } from "@/lib/validators/ai";

const VALID_SCORES = {
  relevance: 8,
  originality: 7,
  clarity: 9,
  engagement_potential: 6,
  authenticity: 8,
  actionability: 7,
};

function makeGenerationResponse(overrides: Record<string, unknown> = {}) {
  return {
    posts: [
      {
        content: "Here's a practical tip for API design.",
        hook_type: "practical_tip",
        content_pillar: "Web Development",
        scores: VALID_SCORES,
        average_score: 7.5,
        variation_angle: "Practical angle",
        ...overrides,
      },
    ],
  };
}

function makeImprovementResponse(overrides: Record<string, unknown> = {}) {
  return {
    improved_content: "Better version of the post.",
    changes_made: "Strengthened the opening hook",
    scores: VALID_SCORES,
    average_score: 7.5,
    ...overrides,
  };
}

const baseGenerateInput: GeneratePostInput = {
  topic: "Building REST APIs with Next.js",
  pillar: "web_dev",
  format: "short",
  tone: "conversational",
  charLimit: 280,
  variationCount: 1,
};

const baseImproveInput: ImproveContentInput = {
  content: "Here is my post about APIs",
  improvementType: "improve_hook",
};

describe("content-generator", () => {
  beforeEach(() => {
    mockGenerateContent.mockReset();
  });

  describe("generatePosts", () => {
    it("returns validated posts from Gemini response", async () => {
      const response = makeGenerationResponse();
      mockGenerateContent.mockResolvedValue(JSON.stringify(response));

      const result = await generatePosts(baseGenerateInput);
      expect(result.posts).toHaveLength(1);
      expect(result.posts[0].content).toBe("Here's a practical tip for API design.");
      expect(result.posts[0].scores.relevance).toBe(8);
    });

    it("passes system and user prompts to Gemini", async () => {
      mockGenerateContent.mockResolvedValue(
        JSON.stringify(makeGenerationResponse())
      );

      await generatePosts(baseGenerateInput);

      expect(mockGenerateContent).toHaveBeenCalledOnce();
      const [systemPrompt, userPrompt] = mockGenerateContent.mock.calls[0];
      expect(systemPrompt).toContain("AI writing assistant");
      expect(userPrompt).toContain("Building REST APIs with Next.js");
      expect(userPrompt).toContain("Web Development");
    });

    it("generates multiple variations", async () => {
      const response = {
        posts: [
          {
            content: "Post variation 1",
            hook_type: "question",
            content_pillar: "Web Development",
            scores: VALID_SCORES,
            average_score: 7.5,
            variation_angle: "Question-led",
          },
          {
            content: "Post variation 2",
            hook_type: "statistic",
            content_pillar: "Web Development",
            scores: VALID_SCORES,
            average_score: 7.0,
            variation_angle: "Data-driven",
          },
          {
            content: "Post variation 3",
            hook_type: "story",
            content_pillar: "Web Development",
            scores: VALID_SCORES,
            average_score: 7.2,
            variation_angle: "Narrative",
          },
        ],
      };
      mockGenerateContent.mockResolvedValue(JSON.stringify(response));

      const result = await generatePosts({
        ...baseGenerateInput,
        variationCount: 3,
      });
      expect(result.posts).toHaveLength(3);
    });

    it("truncates content exceeding charLimit", async () => {
      const longContent = "x".repeat(300);
      const response = makeGenerationResponse({ content: longContent });
      mockGenerateContent.mockResolvedValue(JSON.stringify(response));

      const result = await generatePosts({
        ...baseGenerateInput,
        charLimit: 100,
      });
      expect(result.posts[0].content.length).toBeLessThanOrEqual(100);
    });

    it("throws on invalid JSON from Gemini", async () => {
      mockGenerateContent.mockResolvedValue("not valid json {{{");

      await expect(generatePosts(baseGenerateInput)).rejects.toThrow(
        "AI returned invalid JSON"
      );
    });

    it("throws on malformed response structure", async () => {
      mockGenerateContent.mockResolvedValue(
        JSON.stringify({ wrong_key: "wrong" })
      );

      await expect(generatePosts(baseGenerateInput)).rejects.toThrow(
        "AI response failed validation"
      );
    });

    it("throws on missing scores in response", async () => {
      const response = {
        posts: [
          {
            content: "Post text",
            hook_type: "question",
            content_pillar: "Web Dev",
            average_score: 7.0,
            variation_angle: "Angle",
          },
        ],
      };
      mockGenerateContent.mockResolvedValue(JSON.stringify(response));

      await expect(generatePosts(baseGenerateInput)).rejects.toThrow(
        "AI response failed validation"
      );
    });

    it("propagates Gemini errors", async () => {
      mockGenerateContent.mockRejectedValue(new Error("API connection failed"));

      await expect(generatePosts(baseGenerateInput)).rejects.toThrow(
        "API connection failed"
      );
    });

    it("includes instructions and audience in prompt when provided", async () => {
      mockGenerateContent.mockResolvedValue(
        JSON.stringify(makeGenerationResponse())
      );

      await generatePosts({
        ...baseGenerateInput,
        instructions: "Focus on error handling",
        audience: "Junior developers",
      });

      const userPrompt = mockGenerateContent.mock.calls[0][1];
      expect(userPrompt).toContain("Focus on error handling");
      expect(userPrompt).toContain("Junior developers");
    });
  });

  describe("improveContent", () => {
    it("returns validated improvement from Gemini", async () => {
      const response = makeImprovementResponse();
      mockGenerateContent.mockResolvedValue(JSON.stringify(response));

      const result = await improveContent(baseImproveInput);
      expect(result.improved_content).toBe("Better version of the post.");
      expect(result.changes_made).toBe("Strengthened the opening hook");
    });

    it("truncates improved content exceeding 280 characters", async () => {
      const response = makeImprovementResponse({
        improved_content: "x".repeat(400),
      });
      mockGenerateContent.mockResolvedValue(JSON.stringify(response));

      const result = await improveContent(baseImproveInput);
      expect(result.improved_content.length).toBeLessThanOrEqual(280);
    });

    it("includes improvement type in prompt", async () => {
      mockGenerateContent.mockResolvedValue(
        JSON.stringify(makeImprovementResponse())
      );

      await improveContent({
        content: "My post",
        improvementType: "make_clearer",
      });

      const userPrompt = mockGenerateContent.mock.calls[0][1];
      expect(userPrompt).toContain("make_clearer");
    });

    it("includes pillar adaptation in prompt", async () => {
      mockGenerateContent.mockResolvedValue(
        JSON.stringify(makeImprovementResponse())
      );

      await improveContent({
        content: "My post",
        improvementType: "adapt_pillar",
        pillar: "ai_ml",
      });

      const userPrompt = mockGenerateContent.mock.calls[0][1];
      expect(userPrompt).toContain("AI & Machine Learning");
    });

    it("throws on invalid JSON", async () => {
      mockGenerateContent.mockResolvedValue("broken json");

      await expect(improveContent(baseImproveInput)).rejects.toThrow(
        "AI returned invalid JSON"
      );
    });

    it("throws on malformed improvement response", async () => {
      mockGenerateContent.mockResolvedValue(
        JSON.stringify({ improved_content: "text" })
      );

      await expect(improveContent(baseImproveInput)).rejects.toThrow(
        "AI response failed validation"
      );
    });

    it("does not overwrite original content", async () => {
      mockGenerateContent.mockResolvedValue(
        JSON.stringify(makeImprovementResponse())
      );

      const input = { ...baseImproveInput };
      await improveContent(input);
      expect(input.content).toBe("Here is my post about APIs");
    });

    it("propagates Gemini errors", async () => {
      mockGenerateContent.mockRejectedValue(
        new Error("Rate limit reached")
      );

      await expect(improveContent(baseImproveInput)).rejects.toThrow(
        "Rate limit reached"
      );
    });
  });
});
