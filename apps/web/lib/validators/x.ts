import { z } from "zod";

export const xOAuthStateSchema = z.object({
  state: z.string().min(1).max(256),
  codeVerifier: z.string().min(1).max(256),
  returnTo: z.string().max(500).optional(),
});

export const xOAuthCallbackSchema = z.object({
  code: z.string().min(1, "Authorization code is required"),
  state: z.string().min(1, "State parameter is required"),
});

export const xPublishPostSchema = z.object({
  postId: z.string().uuid("Invalid post ID"),
  xAccountId: z.string().uuid("Invalid X account ID"),
});

export const xDisconnectSchema = z.object({
  xAccountId: z.string().uuid("Invalid X account ID"),
});

export const xManualSetupSchema = z.object({
  xUsername: z
    .string()
    .min(1, "Username is required")
    .max(15, "X usernames are at most 15 characters")
    .regex(/^[A-Za-z0-9_]+$/, "Only letters, numbers, and underscores"),
});

export const xPendingTokensSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().nullable(),
  expiresAt: z.string().min(1),
});

export const xFetchMetricsSchema = z.object({
  postId: z.string().uuid("Invalid post ID"),
  xAccountId: z.string().uuid("Invalid X account ID"),
});

export const xTokenResponseSchema = z.object({
  access_token: z.string().min(1),
  refresh_token: z.string().optional(),
  token_type: z.string(),
  expires_in: z.number().positive(),
  scope: z.string(),
});

export const xUserResponseSchema = z.object({
  data: z.object({
    id: z.string().min(1),
    name: z.string(),
    username: z.string().min(1),
    profile_image_url: z.string().optional(),
  }),
});

export const xCreateTweetResponseSchema = z.object({
  data: z.object({
    id: z.string().min(1),
    text: z.string(),
  }),
});

export const xTweetMetricsResponseSchema = z.object({
  data: z.object({
    id: z.string(),
    text: z.string(),
    created_at: z.string().optional(),
    public_metrics: z
      .object({
        impression_count: z.number().default(0),
        like_count: z.number().default(0),
        reply_count: z.number().default(0),
        retweet_count: z.number().default(0),
        quote_count: z.number().default(0),
        bookmark_count: z.number().default(0),
      })
      .optional(),
  }),
});

export const POST_CHARACTER_LIMIT = 280;

export function countCharacters(text: string): number {
  const urlRegex = /https?:\/\/\S+/g;
  let count = 0;
  let lastIndex = 0;

  for (const match of text.matchAll(urlRegex)) {
    count += text.slice(lastIndex, match.index).length;
    count += 23;
    lastIndex = match.index! + match[0].length;
  }
  count += text.slice(lastIndex).length;

  return count;
}

export function isWithinCharacterLimit(text: string): boolean {
  return countCharacters(text) <= POST_CHARACTER_LIMIT;
}

export type XOAuthState = z.infer<typeof xOAuthStateSchema>;
export type XOAuthCallback = z.infer<typeof xOAuthCallbackSchema>;
export type XPublishPost = z.infer<typeof xPublishPostSchema>;
export type XDisconnect = z.infer<typeof xDisconnectSchema>;
export type XFetchMetrics = z.infer<typeof xFetchMetricsSchema>;
export type XManualSetup = z.infer<typeof xManualSetupSchema>;
export type XPendingTokens = z.infer<typeof xPendingTokensSchema>;
