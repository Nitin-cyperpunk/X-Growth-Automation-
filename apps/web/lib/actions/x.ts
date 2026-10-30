"use server";

import { revalidatePath } from "next/cache";
import { eq, and, isNotNull, desc } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { getAuthenticatedUserId } from "@/lib/auth/session";
import { isXApiConfigured, getOAuthConfig, revokeToken } from "@/lib/x-api/oauth";
import { getClientForAccount } from "@/lib/x-api/client";
import { decryptToken } from "@/lib/x-api/encryption";
import { cookies } from "next/headers";
import { xPublishPostSchema, xFetchMetricsSchema, xDisconnectSchema, xManualSetupSchema, xPendingTokensSchema } from "@/lib/validators/x";
import { validateTransition, type PostStatus } from "@/lib/services/post-transitions";

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function checkXConnectionStatus(): Promise<
  ActionResult<{
    configured: boolean;
    connected: boolean;
    account: {
      id: string;
      xUsername: string;
      xDisplayName: string | null;
      connectedAt: Date;
    } | null;
  }>
> {
  try {
    const userId = await getAuthenticatedUserId();
    const configured = isXApiConfigured();

    if (!configured) {
      return {
        success: true,
        data: { configured: false, connected: false, account: null },
      };
    }

    const db = getDb();
    const [account] = await db
      .select({
        id: schema.xAccounts.id,
        xUsername: schema.xAccounts.xUsername,
        xDisplayName: schema.xAccounts.xDisplayName,
        connectedAt: schema.xAccounts.connectedAt,
      })
      .from(schema.xAccounts)
      .where(eq(schema.xAccounts.userId, userId))
      .limit(1);

    return {
      success: true,
      data: {
        configured: true,
        connected: !!account,
        account: account || null,
      },
    };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

const PENDING_TOKENS_COOKIE = "x_pending_tokens";

export async function completeXManualSetup(
  input: unknown
): Promise<ActionResult> {
  try {
    const userId = await getAuthenticatedUserId();
    const parsed = xManualSetupSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const cookieStore = await cookies();
    const rawCookie = cookieStore.get(PENDING_TOKENS_COOKIE)?.value;
    if (!rawCookie) {
      return {
        success: false,
        error: "Setup session expired. Please reconnect your X account.",
      };
    }

    let tokenData: { accessToken: string; refreshToken: string | null; expiresAt: string };
    try {
      const cookieParsed = JSON.parse(rawCookie);
      const validated = xPendingTokensSchema.safeParse(cookieParsed);
      if (!validated.success) throw new Error("Invalid token data");
      tokenData = validated.data;
    } catch {
      cookieStore.delete(PENDING_TOKENS_COOKIE);
      return {
        success: false,
        error: "Invalid setup session. Please reconnect your X account.",
      };
    }

    const username = parsed.data.xUsername;
    const db = getDb();

    const [existing] = await db
      .select()
      .from(schema.xAccounts)
      .where(
        and(
          eq(schema.xAccounts.userId, userId),
          eq(schema.xAccounts.xUsername, username)
        )
      )
      .limit(1);

    if (existing) {
      await db
        .update(schema.xAccounts)
        .set({
          accessToken: tokenData.accessToken,
          refreshToken: tokenData.refreshToken,
          tokenExpiresAt: new Date(tokenData.expiresAt),
          updatedAt: new Date(),
        })
        .where(eq(schema.xAccounts.id, existing.id));
    } else {
      await db.insert(schema.xAccounts).values({
        userId,
        xUserId: `manual_${username}`,
        xUsername: username,
        xDisplayName: username,
        accessToken: tokenData.accessToken,
        refreshToken: tokenData.refreshToken,
        tokenExpiresAt: new Date(tokenData.expiresAt),
      });
    }

    cookieStore.delete(PENDING_TOKENS_COOKIE);
    revalidatePath("/settings");
    return { success: true, data: undefined };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function disconnectXAccount(
  input: unknown
): Promise<ActionResult> {
  try {
    const userId = await getAuthenticatedUserId();
    const parsed = xDisconnectSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const db = getDb();
    const [account] = await db
      .select()
      .from(schema.xAccounts)
      .where(
        and(
          eq(schema.xAccounts.id, parsed.data.xAccountId),
          eq(schema.xAccounts.userId, userId)
        )
      )
      .limit(1);

    if (!account) {
      return { success: false, error: "X account not found" };
    }

    const config = getOAuthConfig();
    if (config) {
      try {
        const token = decryptToken(account.accessToken);
        await revokeToken(config, token);
      } catch {
        // Best-effort revocation — continue with disconnect
      }
    }

    await db
      .delete(schema.xAccounts)
      .where(
        and(
          eq(schema.xAccounts.id, parsed.data.xAccountId),
          eq(schema.xAccounts.userId, userId)
        )
      );

    revalidatePath("/settings");
    return { success: true, data: undefined };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function publishPost(
  input: unknown
): Promise<ActionResult<{ xPostId: string; xPostUrl: string }>> {
  try {
    const userId = await getAuthenticatedUserId();
    const parsed = xPublishPostSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const db = getDb();

    const [post] = await db
      .select()
      .from(schema.posts)
      .where(
        and(
          eq(schema.posts.id, parsed.data.postId),
          eq(schema.posts.userId, userId)
        )
      )
      .limit(1);

    if (!post) {
      return { success: false, error: "Post not found" };
    }

    const currentStatus = post.status as PostStatus;
    if (currentStatus !== "approved" && currentStatus !== "scheduled") {
      return {
        success: false,
        error: `Post must be approved or scheduled to publish. Current status: ${currentStatus}`,
      };
    }

    validateTransition(currentStatus, "publishing");

    const [xAccount] = await db
      .select()
      .from(schema.xAccounts)
      .where(
        and(
          eq(schema.xAccounts.id, parsed.data.xAccountId),
          eq(schema.xAccounts.userId, userId)
        )
      )
      .limit(1);

    if (!xAccount) {
      return { success: false, error: "X account not found" };
    }

    await db
      .update(schema.posts)
      .set({
        status: "publishing",
        xAccountId: parsed.data.xAccountId,
        updatedAt: new Date(),
      })
      .where(eq(schema.posts.id, post.id));

    try {
      const client = await getClientForAccount(
        parsed.data.xAccountId,
        userId
      );
      const tweet = await client.createTweet(post.content);

      const xPostUrl = `https://x.com/${xAccount.xUsername}/status/${tweet.id}`;

      await db
        .update(schema.posts)
        .set({
          status: "published",
          xPostId: tweet.id,
          xPostUrl,
          publishedAt: new Date(),
          failureReason: null,
          updatedAt: new Date(),
        })
        .where(eq(schema.posts.id, post.id));

      revalidatePath("/queue");
      revalidatePath("/published");
      revalidatePath("/analytics");
      return { success: true, data: { xPostId: tweet.id, xPostUrl } };
    } catch (publishError) {
      const reason =
        publishError instanceof Error
          ? publishError.message
          : "Unknown publishing error";

      await db
        .update(schema.posts)
        .set({
          status: "failed",
          failureReason: reason.slice(0, 1000),
          retryCount: (post.retryCount || 0) + 1,
          updatedAt: new Date(),
        })
        .where(eq(schema.posts.id, post.id));

      revalidatePath("/queue");
      return { success: false, error: `Publishing failed: ${reason}` };
    }
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function fetchPostMetrics(
  input: unknown
): Promise<ActionResult<{ metricsId: string }>> {
  try {
    const userId = await getAuthenticatedUserId();
    const parsed = xFetchMetricsSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const db = getDb();

    const [post] = await db
      .select()
      .from(schema.posts)
      .where(
        and(
          eq(schema.posts.id, parsed.data.postId),
          eq(schema.posts.userId, userId)
        )
      )
      .limit(1);

    if (!post) {
      return { success: false, error: "Post not found" };
    }

    if (!post.xPostId) {
      return { success: false, error: "Post has not been published to X" };
    }

    const client = await getClientForAccount(
      parsed.data.xAccountId,
      userId
    );
    const metrics = await client.getTweetMetrics(post.xPostId);

    if (!metrics) {
      return { success: false, error: "Could not retrieve metrics from X" };
    }

    const [metricsRecord] = await db
      .insert(schema.postMetrics)
      .values({
        postId: post.id,
        impressions: metrics.impressionCount,
        likes: metrics.likeCount,
        replies: metrics.replyCount,
        reposts: metrics.repostCount,
        quotes: metrics.quoteCount,
        bookmarks: metrics.bookmarkCount,
      })
      .returning();

    revalidatePath("/analytics");
    revalidatePath("/published");
    return { success: true, data: { metricsId: metricsRecord.id } };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function getPublishedPostsWithMetrics(): Promise<
  ActionResult<
    Array<{
      post: schema.Post;
      latestMetrics: schema.PostMetric | null;
    }>
  >
> {
  try {
    const userId = await getAuthenticatedUserId();
    const db = getDb();

    const publishedPosts = await db
      .select()
      .from(schema.posts)
      .where(
        and(
          eq(schema.posts.userId, userId),
          eq(schema.posts.status, "published"),
          isNotNull(schema.posts.xPostId)
        )
      )
      .orderBy(desc(schema.posts.publishedAt));

    const results = await Promise.all(
      publishedPosts.map(async (post) => {
        const [latestMetrics] = await db
          .select()
          .from(schema.postMetrics)
          .where(eq(schema.postMetrics.postId, post.id))
          .orderBy(desc(schema.postMetrics.snapshotAt))
          .limit(1);

        return {
          post,
          latestMetrics: latestMetrics || null,
        };
      })
    );

    return { success: true, data: results };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function getUserXAccount(): Promise<
  ActionResult<{
    id: string;
    xUsername: string;
    xDisplayName: string | null;
  } | null>
> {
  try {
    const userId = await getAuthenticatedUserId();
    const db = getDb();

    const [account] = await db
      .select({
        id: schema.xAccounts.id,
        xUsername: schema.xAccounts.xUsername,
        xDisplayName: schema.xAccounts.xDisplayName,
      })
      .from(schema.xAccounts)
      .where(eq(schema.xAccounts.userId, userId))
      .limit(1);

    return { success: true, data: account || null };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}
