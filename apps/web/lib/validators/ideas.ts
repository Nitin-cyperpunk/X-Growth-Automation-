import { z } from "zod";

export const createIdeaSchema = z.object({
  title: z.string().min(1, "Title is required").max(500),
  body: z.string().max(5000).optional(),
  category: z
    .enum([
      "ai_ml",
      "web_dev",
      "engineering",
      "building_in_public",
      "experiments",
      "career",
      "other",
    ])
    .default("other"),
  tags: z.array(z.string().max(50)).max(10).default([]),
});

export const updateIdeaSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  body: z.string().max(5000).nullable().optional(),
  status: z
    .enum(["new", "developing", "ready", "used", "archived"])
    .optional(),
  category: z
    .enum([
      "ai_ml",
      "web_dev",
      "engineering",
      "building_in_public",
      "experiments",
      "career",
      "other",
    ])
    .optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
});

export type CreateIdeaInput = z.infer<typeof createIdeaSchema>;
export type UpdateIdeaInput = z.infer<typeof updateIdeaSchema>;
