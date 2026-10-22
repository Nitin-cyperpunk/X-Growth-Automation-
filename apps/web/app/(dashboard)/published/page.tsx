import { getPublishedPostsWithMetrics, getUserXAccount } from "@/lib/actions/x";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { PublishedClient } from "./published-client";

export default async function PublishedPage() {
  const [postsResult, xResult] = await Promise.all([
    getPublishedPostsWithMetrics(),
    getUserXAccount(),
  ]);

  const postsWithMetrics = postsResult.success ? postsResult.data : [];
  const xAccountId = xResult.success && xResult.data ? xResult.data.id : null;

  if (postsWithMetrics.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Published Posts"
          description="View your published posts and their performance"
        />
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5">
          <EmptyState message="No published posts yet. Posts will appear here after they are successfully published to X." />
        </div>
      </div>
    );
  }

  const serialized = postsWithMetrics.map(({ post, latestMetrics }) => ({
    post: {
      ...post,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
      publishedAt: post.publishedAt?.toISOString() ?? null,
      scheduledFor: post.scheduledFor?.toISOString() ?? null,
    },
    latestMetrics: latestMetrics
      ? {
          ...latestMetrics,
          snapshotAt: latestMetrics.snapshotAt.toISOString(),
        }
      : null,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Published Posts"
        description="View your published posts and their performance"
      />
      <PublishedClient posts={serialized} xAccountId={xAccountId} />
    </div>
  );
}
