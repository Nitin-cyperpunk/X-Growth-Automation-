import { z } from "zod";

const X_MAX_CHARS = 280;

export const createPostSchema = z.object({
  content: z
    .string()
    .min(1, "Post content is required")
    .max(X_MAX_CHARS, `Post must be ${X_MAX_CHARS} characters or less`),
  scheduledFor: z.string().datetime().optional(),
});

export const updatePostSchema = z.object({
  content: z
    .string()
    .min(1, "Post content is required")
    .max(X_MAX_CHARS, `Post must be ${X_MAX_CHARS} characters or less`)
    .optional(),
  status: z
    .enum([
      "draft",
      "pending_approval",
      "approved",
      "scheduled",
      "cancelled",
    ])
    .optional(),
  scheduledFor: z.string().datetime().nullable().optional(),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export { X_MAX_CHARS };
