import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { getPublishedPostsWithMetrics } from "@/lib/actions/x";

export default async function AnalyticsPage() {
  const result = await getPublishedPostsWithMetrics();
  const postsWithMetrics = result.success ? result.data : [];

  const totals = postsWithMetrics.reduce(
    (acc, { latestMetrics }) => {
      if (!latestMetrics) return acc;
      return {
        impressions: acc.impressions + latestMetrics.impressions,
        likes: acc.likes + latestMetrics.likes,
        replies: acc.replies + latestMetrics.replies,
        reposts: acc.reposts + latestMetrics.reposts,
        quotes: acc.quotes + latestMetrics.quotes,
        bookmarks: acc.bookmarks + latestMetrics.bookmarks,
      };
    },
    { impressions: 0, likes: 0, replies: 0, reposts: 0, quotes: 0, bookmarks: 0 }
  );

  const hasMetrics = postsWithMetrics.some(({ latestMetrics }) => latestMetrics !== null);
  const publishedCount = postsWithMetrics.length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Track your post performance and growth metrics"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Total Impressions"
          value={hasMetrics ? totals.impressions.toLocaleString() : "—"}
        />
        <MetricCard
          label="Total Likes"
          value={hasMetrics ? totals.likes.toLocaleString() : "—"}
        />
        <MetricCard
          label="Total Replies"
          value={hasMetrics ? totals.replies.toLocaleString() : "—"}
        />
        <MetricCard
          label="Total Reposts"
          value={hasMetrics ? totals.reposts.toLocaleString() : "—"}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard
          label="Published Posts"
          value={publishedCount.toString()}
        />
        <MetricCard
          label="Total Quotes"
          value={hasMetrics ? totals.quotes.toLocaleString() : "—"}
        />
        <MetricCard
          label="Total Bookmarks"
          value={hasMetrics ? totals.bookmarks.toLocaleString() : "—"}
        />
      </div>

      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5">
        <h2 className="mb-4 text-sm font-medium text-zinc-300">
          Post Performance
        </h2>
        {!hasMetrics ? (
          <EmptyState message="Connect your X account and publish posts to see analytics. Use 'Refresh Metrics' on Published posts to pull data from X." />
        ) : (
          <div className="space-y-3">
            {postsWithMetrics
              .filter(({ latestMetrics }) => latestMetrics !== null)
              .map(({ post, latestMetrics }) => (
                <div
                  key={post.id}
                  className="rounded-md border border-zinc-800 bg-zinc-900 p-3"
                >
                  <p className="line-clamp-2 text-sm text-zinc-200">
                    {post.content}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-zinc-400">
                    <span>{latestMetrics!.impressions.toLocaleString()} impressions</span>
                    <span>{latestMetrics!.likes.toLocaleString()} likes</span>
                    <span>{latestMetrics!.replies.toLocaleString()} replies</span>
                    <span>{latestMetrics!.reposts.toLocaleString()} reposts</span>
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
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
      <p className="text-sm text-zinc-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}
