import { eq, and } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { encryptToken, decryptToken } from "./encryption";
import { getOAuthConfig, refreshAccessToken, type TokenResponse } from "./oauth";

const X_API_BASE = "https://api.x.com/2";

export interface XUser {
  id: string;
  name: string;
  username: string;
  profileImageUrl?: string;
}

export interface XTweet {
  id: string;
  text: string;
}

export interface XTweetMetrics {
  impressionCount: number;
  likeCount: number;
  replyCount: number;
  repostCount: number;
  quoteCount: number;
  bookmarkCount: number;
}

export interface XTweetWithMetrics {
  id: string;
  text: string;
  publicMetrics: XTweetMetrics;
  createdAt: string;
}

class XApiClient {
  private accessToken: string;
  private refreshToken: string | null;
  private onTokenRefresh?: (tokens: TokenResponse) => Promise<void>;

  constructor(
    accessToken: string,
    refreshToken: string | null,
    onTokenRefresh?: (tokens: TokenResponse) => Promise<void>
  ) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.onTokenRefresh = onTokenRefresh;
  }

  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${X_API_BASE}${path}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
      signal: AbortSignal.timeout(15_000),
    });

    if (response.status === 401 && this.refreshToken) {
      const refreshed = await this.tryRefresh();
      if (refreshed) {
        const retryResponse = await fetch(url, {
          ...options,
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
            ...options.headers,
          },
          signal: AbortSignal.timeout(15_000),
        });
        return this.handleResponse<T>(retryResponse);
      }
    }

    return this.handleResponse<T>(response);
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      let detail = errorBody.slice(0, 300);
      try {
        const parsed = JSON.parse(errorBody);
        detail = parsed.detail || parsed.title || detail;
      } catch {
        // body was not JSON
      }

      if (response.status === 429) {
        const resetAt = response.headers.get("x-rate-limit-reset");
        throw new Error(
          `X API rate limit exceeded. ${resetAt ? `Resets at ${new Date(Number(resetAt) * 1000).toISOString()}` : "Try again later."}`
        );
      }

      throw new Error(
        `X API error (${response.status}): ${detail}`
      );
    }

    return response.json();
  }

  private async tryRefresh(): Promise<boolean> {
    if (!this.refreshToken) return false;

    const config = getOAuthConfig();
    if (!config) return false;

    try {
      const tokens = await refreshAccessToken(config, this.refreshToken);
      this.accessToken = tokens.access_token;
      if (tokens.refresh_token) {
        this.refreshToken = tokens.refresh_token;
      }
      if (this.onTokenRefresh) {
        await this.onTokenRefresh(tokens);
      }
      return true;
    } catch {
      return false;
    }
  }

  async getMe(): Promise<XUser> {
    const response = await this.request<{
      data: { id: string; name: string; username: string; profile_image_url?: string };
    }>("/users/me?user.fields=profile_image_url");
    const d = response.data;
    return {
      id: d.id,
      name: d.name,
      username: d.username,
      profileImageUrl: d.profile_image_url,
    };
  }

  async createTweet(text: string): Promise<XTweet> {
    if (!text || text.length === 0) {
      throw new Error("Tweet text cannot be empty");
    }
    if (text.length > 280) {
      throw new Error("Tweet text exceeds 280 character limit");
    }

    const response = await this.request<{
      data: { id: string; text: string };
    }>("/tweets", {
      method: "POST",
      body: JSON.stringify({ text }),
    });
    return { id: response.data.id, text: response.data.text };
  }

  async getTweet(tweetId: string): Promise<XTweetWithMetrics> {
    const response = await this.request<{
      data: {
        id: string;
        text: string;
        created_at?: string;
        public_metrics?: Record<string, number>;
      };
    }>(
      `/tweets/${encodeURIComponent(tweetId)}?tweet.fields=public_metrics,created_at`
    );

    const d = response.data;
    const pm = d.public_metrics || {};

    return {
      id: d.id,
      text: d.text,
      createdAt: d.created_at || "",
      publicMetrics: {
        impressionCount: pm.impression_count ?? 0,
        likeCount: pm.like_count ?? 0,
        replyCount: pm.reply_count ?? 0,
        repostCount: pm.retweet_count ?? 0,
        quoteCount: pm.quote_count ?? 0,
        bookmarkCount: pm.bookmark_count ?? 0,
      },
    };
  }

  async getTweetMetrics(tweetId: string): Promise<XTweetMetrics | null> {
    try {
      const tweet = await this.getTweet(tweetId);
      return tweet.publicMetrics;
    } catch {
      return null;
    }
  }
}

export async function getClientForAccount(
  xAccountId: string,
  userId: string
): Promise<XApiClient> {
  const db = getDb();
  const [account] = await db
    .select()
    .from(schema.xAccounts)
    .where(
      and(
        eq(schema.xAccounts.id, xAccountId),
        eq(schema.xAccounts.userId, userId)
      )
    )
    .limit(1);

  if (!account) {
    throw new Error("X account not found");
  }

  const accessToken = decryptToken(account.accessToken);
  const refreshToken = account.refreshToken
    ? decryptToken(account.refreshToken)
    : null;

  const onTokenRefresh = async (tokens: TokenResponse) => {
    const newExpiresAt = new Date(Date.now() + tokens.expires_in * 1000);
    await db
      .update(schema.xAccounts)
      .set({
        accessToken: encryptToken(tokens.access_token),
        refreshToken: tokens.refresh_token
          ? encryptToken(tokens.refresh_token)
          : account.refreshToken,
        tokenExpiresAt: newExpiresAt,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(schema.xAccounts.id, xAccountId),
          eq(schema.xAccounts.userId, userId)
        )
      );
  };

  return new XApiClient(accessToken, refreshToken, onTokenRefresh);
}

export function createXApiClient(
  accessToken: string,
  refreshToken: string | null,
  onTokenRefresh?: (tokens: TokenResponse) => Promise<void>
): XApiClient {
  return new XApiClient(accessToken, refreshToken, onTokenRefresh);
}
