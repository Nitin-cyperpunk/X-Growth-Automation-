"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { fetchPostMetrics } from "@/lib/actions/x";

interface SerializedPost {
  id: string;
  content: string;
  publishedAt: string | null;
  xPostId: string | null;
  xPostUrl: string | null;
  isAiGenerated: boolean;
}

interface SerializedMetrics {
  impressions: number;
  likes: number;
  replies: number;
  reposts: number;
  quotes: number;
  bookmarks: number;
  snapshotAt: string;
}

interface PublishedClientProps {
  posts: Array<{
    post: SerializedPost;
    latestMetrics: SerializedMetrics | null;
  }>;
  xAccountId: string | null;
}

export function PublishedClient({ posts, xAccountId }: PublishedClientProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [fetchingId, setFetchingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFetchMetrics(postId: string) {
    if (!xAccountId) return;
    setError(null);
    setFetchingId(postId);
    try {
      const result = await fetchPostMetrics({ postId, xAccountId });
      if (result.success) {
        startTransition(() => router.refresh());
      } else {
        setError(result.error);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setFetchingId(null);
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-md border border-red-800 bg-red-900/30 px-4 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      {posts.map(({ post, latestMetrics }) => (
        <div
          key={post.id}
          className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4"
        >
          <p className="whitespace-pre-wrap text-sm text-zinc-200">
            {post.content}
          </p>

          <div className="mt-2 flex items-center gap-3 text-xs text-zinc-500">
            {post.publishedAt && (
              <span>
                Published: {new Date(post.publishedAt).toLocaleString()}
              </span>
            )}
            {post.xPostUrl && (
              <a
                href={post.xPostUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-violet-400 hover:underline"
              >
                View on X
              </a>
            )}
            {post.isAiGenerated && (
              <span className="rounded bg-violet-900/30 px-1.5 py-0.5 text-violet-300">
                AI Generated
              </span>
            )}
          </div>

          {latestMetrics && (
            <div className="mt-3 grid grid-cols-3 gap-2 rounded-md border border-zinc-800 bg-zinc-900 p-3 sm:grid-cols-6">
              <MetricCell label="Impressions" value={latestMetrics.impressions} />
              <MetricCell label="Likes" value={latestMetrics.likes} />
              <MetricCell label="Replies" value={latestMetrics.replies} />
              <MetricCell label="Reposts" value={latestMetrics.reposts} />
              <MetricCell label="Quotes" value={latestMetrics.quotes} />
              <MetricCell label="Bookmarks" value={latestMetrics.bookmarks} />
            </div>
          )}

          {xAccountId && post.xPostId && (
            <div className="mt-2 flex items-center gap-2">
              <button
                onClick={() => handleFetchMetrics(post.id)}
                disabled={fetchingId === post.id}
                className="rounded bg-zinc-800 px-2.5 py-1 text-xs text-zinc-300 hover:bg-zinc-700 disabled:opacity-50"
              >
                {fetchingId === post.id ? "Fetching..." : "Refresh Metrics"}
              </button>
              {latestMetrics && (
                <span className="text-xs text-zinc-600">
                  Last updated: {new Date(latestMetrics.snapshotAt).toLocaleString()}
                </span>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function MetricCell({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <p className="text-sm font-medium text-white">
        {value.toLocaleString()}
      </p>
      <p className="text-xs text-zinc-500">{label}</p>
    </div>
  );
}
