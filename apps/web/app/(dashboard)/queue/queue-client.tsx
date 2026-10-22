"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { updatePostStatus, deletePost } from "@/lib/actions/posts";
import { publishPost } from "@/lib/actions/x";
import { getValidTransitions } from "@/lib/services/post-transitions";
import type { PostStatus } from "@/lib/services/post-transitions";
import type { Post } from "@/lib/db/schema";

interface QueueClientProps {
  posts: Post[];
  activeTab: PostStatus;
  tabs: { label: string; status: PostStatus }[];
  xAccountId: string | null;
}

export function QueueClient({ posts, activeTab, tabs, xAccountId }: QueueClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [publishingId, setPublishingId] = useState<string | null>(null);

  async function handleStatusChange(postId: string, newStatus: PostStatus) {
    setError(null);
    const result = await updatePostStatus(postId, newStatus);
    if (result.success) {
      startTransition(() => router.refresh());
    } else {
      setError(result.error);
    }
  }

  async function handlePublish(postId: string) {
    if (!xAccountId) return;
    if (!confirm("Publish this post to X? This action cannot be undone.")) return;
    setError(null);
    setPublishingId(postId);
    try {
      const result = await publishPost({ postId, xAccountId });
      if (result.success) {
        startTransition(() => router.refresh());
      } else {
        setError(result.error);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPublishingId(null);
    }
  }

  async function handleDelete(postId: string) {
    setError(null);
    const result = await deletePost(postId);
    if (result.success) {
      startTransition(() => router.refresh());
    } else {
      setError(result.error);
    }
  }

  const statusLabels: Record<string, string> = {
    draft: "Draft",
    pending_approval: "Pending",
    approved: "Approved",
    scheduled: "Scheduled",
    publishing: "Publishing",
    published: "Published",
    failed: "Failed",
    cancelled: "Cancelled",
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Content Queue"
        description="Manage your drafts, scheduled, and pending posts"
      />

      {error && (
        <div className="rounded-md border border-red-800 bg-red-900/30 px-4 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="flex gap-2 border-b border-zinc-800 pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.status}
            onClick={() => router.push(`/queue?tab=${tab.status}`)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              activeTab === tab.status
                ? "bg-violet-600 text-white"
                : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {posts.length === 0 ? (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5">
          <EmptyState message={`No ${statusLabels[activeTab]?.toLowerCase() ?? activeTab} posts. Create a new post in Compose.`} />
        </div>
      ) : (
        <div className="space-y-2">
          {posts.map((post) => {
            const transitions = getValidTransitions(post.status as PostStatus);
            return (
              <div
                key={post.id}
                className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-3 whitespace-pre-wrap text-sm text-zinc-200">
                      {post.content}
                    </p>
                    <div className="mt-2 flex items-center gap-2 text-xs text-zinc-500">
                      <span>
                        {new Date(post.createdAt).toLocaleDateString()}
                      </span>
                      {post.scheduledFor && (
                        <span>
                          Scheduled:{" "}
                          {new Date(post.scheduledFor).toLocaleString()}
                        </span>
                      )}
                      {post.isAiGenerated && (
                        <span className="rounded bg-violet-900/30 px-1.5 py-0.5 text-violet-300">
                          AI
                        </span>
                      )}
                      {post.failureReason && (
                        <span className="text-red-400" title={post.failureReason}>
                          Error: {post.failureReason.slice(0, 50)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {xAccountId &&
                      (post.status === "approved" || post.status === "scheduled") && (
                        <button
                          onClick={() => handlePublish(post.id)}
                          disabled={isPending || publishingId === post.id}
                          className="rounded bg-violet-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-violet-500 disabled:opacity-50"
                        >
                          {publishingId === post.id ? "Publishing..." : "Publish to X"}
                        </button>
                      )}
                    {transitions
                      .filter((t) => !(xAccountId && t === "publishing"))
                      .map((t) => (
                      <button
                        key={t}
                        onClick={() => handleStatusChange(post.id, t)}
                        disabled={isPending}
                        className="rounded px-2 py-1 text-xs text-violet-400 hover:bg-violet-900/30 disabled:opacity-50"
                      >
                        {statusLabels[t] ?? t}
                      </button>
                    ))}
                    {post.status !== "published" && post.status !== "publishing" && (
                      <button
                        onClick={() => handleDelete(post.id)}
                        disabled={isPending}
                        className="rounded px-2 py-1 text-xs text-red-400 hover:bg-red-900/30 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
