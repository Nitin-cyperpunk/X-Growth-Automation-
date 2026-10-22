import { z } from "zod";

export const CONTENT_PILLARS = [
  "ai_ml",
  "web_dev",
  "engineering",
  "building_in_public",
  "experiments",
  "career",
] as const;

export const POST_FORMATS = [
  "short",
  "story",
  "technical",
  "thread_opener",
  "listicle",
  "question",
] as const;

export const TONE_OPTIONS = [
  "informative",
  "conversational",
  "provocative",
  "storytelling",
] as const;

export const IMPROVEMENT_TYPES = [
  "improve_hook",
  "make_clearer",
  "make_specific",
  "make_natural",
  "thread_outline",
  "adapt_pillar",
] as const;

export const generatePostSchema = z.object({
  topic: z.string().min(3, "Topic must be at least 3 characters").max(1000),
  pillar: z.enum(CONTENT_PILLARS),
  format: z.enum(POST_FORMATS).default("short"),
  tone: z.enum(TONE_OPTIONS).default("conversational"),
  instructions: z.string().max(500).optional(),
  audience: z.string().max(200).optional(),
  charLimit: z.number().int().min(50).max(280).default(280),
  variationCount: z.number().int().min(1).max(5).default(1),
});

export const improveContentSchema = z.object({
  content: z.string().min(1).max(2000),
  improvementType: z.enum(IMPROVEMENT_TYPES),
  pillar: z.enum(CONTENT_PILLARS).optional(),
  instructions: z.string().max(500).optional(),
});

export const qualityScoresSchema = z.object({
  relevance: z.number().min(1).max(10),
  originality: z.number().min(1).max(10),
  clarity: z.number().min(1).max(10),
  engagement_potential: z.number().min(1).max(10),
  authenticity: z.number().min(1).max(10),
  actionability: z.number().min(1).max(10),
});

export const generatedPostSchema = z.object({
  content: z.string().min(1).max(500),
  hook_type: z.string(),
  content_pillar: z.string(),
  scores: qualityScoresSchema,
  average_score: z.number().min(1).max(10),
  variation_angle: z.string(),
});

export const generationResponseSchema = z.object({
  posts: z.array(generatedPostSchema).min(1).max(5),
});

export const improvementResponseSchema = z.object({
  improved_content: z.string().min(1).max(500),
  changes_made: z.string(),
  scores: qualityScoresSchema,
  average_score: z.number().min(1).max(10),
});

export type GeneratePostInput = z.infer<typeof generatePostSchema>;
export type ImproveContentInput = z.infer<typeof improveContentSchema>;
export type QualityScores = z.infer<typeof qualityScoresSchema>;
export type GeneratedPost = z.infer<typeof generatedPostSchema>;
export type GenerationResponse = z.infer<typeof generationResponseSchema>;
export type ImprovementResponse = z.infer<typeof improvementResponseSchema>;
