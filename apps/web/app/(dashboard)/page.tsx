import { eq, and, desc, count, isNotNull } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { auth } from "@/lib/auth/config";
import { getDb, schema } from "@/lib/db";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const db = getDb();
  const userId = session.user.id;

  const [xAccount, postCounts, recentPosts, scheduledPosts] = await Promise.all([
    db
      .select({
        id: schema.xAccounts.id,
        xUsername: schema.xAccounts.xUsername,
        xDisplayName: schema.xAccounts.xDisplayName,
        connectedAt: schema.xAccounts.connectedAt,
      })
      .from(schema.xAccounts)
      .where(eq(schema.xAccounts.userId, userId))
      .limit(1)
      .then((rows) => rows[0] ?? null),

    db
      .select({
        status: schema.posts.status,
        count: count(),
      })
      .from(schema.posts)
      .where(eq(schema.posts.userId, userId))
      .groupBy(schema.posts.status),

    db
      .select({
        id: schema.posts.id,
        content: schema.posts.content,
        status: schema.posts.status,
        publishedAt: schema.posts.publishedAt,
        xPostUrl: schema.posts.xPostUrl,
      })
      .from(schema.posts)
      .where(eq(schema.posts.userId, userId))
      .orderBy(desc(schema.posts.updatedAt))
      .limit(5),

    db
      .select({
        id: schema.posts.id,
        content: schema.posts.content,
        scheduledFor: schema.posts.scheduledFor,
      })
      .from(schema.posts)
      .where(
        and(
          eq(schema.posts.userId, userId),
          eq(schema.posts.status, "scheduled")
        )
      )
      .orderBy(schema.posts.scheduledFor)
      .limit(5),
  ]);

  const stats = {
    total: postCounts.reduce((sum, r) => sum + r.count, 0),
    draft: postCounts.find((r) => r.status === "draft")?.count ?? 0,
    scheduled: postCounts.find((r) => r.status === "scheduled")?.count ?? 0,
    published: postCounts.find((r) => r.status === "published")?.count ?? 0,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Overview of your X Growth Engine"
      />

      {xAccount ? (
        <section className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-600 text-lg font-bold text-white">
                {(xAccount.xDisplayName || xAccount.xUsername)[0].toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-white">
                  {xAccount.xDisplayName || xAccount.xUsername}
                </p>
                <p className="text-xs text-violet-400">@{xAccount.xUsername}</p>
                <p className="text-xs text-zinc-500">
                  Connected{" "}
                  {xAccount.connectedAt.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
            <span className="rounded-full border border-green-800 bg-green-950 px-2.5 py-0.5 text-xs font-medium text-green-400">
              Connected
            </span>
          </div>
        </section>
      ) : (
        <section className="rounded-lg border border-dashed border-zinc-700 bg-zinc-900/30 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">
                Connect your X account
              </p>
              <p className="text-xs text-zinc-500">
                Link your X account to start publishing and tracking posts
              </p>
            </div>
            <Link
              href="/settings"
              className="rounded bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-500"
            >
              Go to Settings
            </Link>
          </div>
        </section>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Posts" value={String(stats.total)} />
        <StatCard label="Scheduled" value={String(stats.scheduled)} />
        <StatCard label="Published" value={String(stats.published)} />
        <StatCard label="Drafts" value={String(stats.draft)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5">
          <h2 className="mb-4 text-sm font-medium text-zinc-300">
            Recent Posts
          </h2>
          {recentPosts.length > 0 ? (
            <ul className="space-y-3">
              {recentPosts.map((post) => (
                <li
                  key={post.id}
                  className="rounded border border-zinc-800 bg-zinc-900 p-3"
                >
                  <p className="line-clamp-2 text-sm text-zinc-300">
                    {post.content}
                  </p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <StatusBadge status={post.status} />
                    {post.publishedAt && (
                      <span className="text-xs text-zinc-500">
                        {post.publishedAt.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState message="No posts yet. Start writing in Compose." />
          )}
        </section>

        <section className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5">
          <h2 className="mb-4 text-sm font-medium text-zinc-300">
            Upcoming Scheduled
          </h2>
          {scheduledPosts.length > 0 ? (
            <ul className="space-y-3">
              {scheduledPosts.map((post) => (
                <li
                  key={post.id}
                  className="rounded border border-zinc-800 bg-zinc-900 p-3"
                >
                  <p className="line-clamp-2 text-sm text-zinc-300">
                    {post.content}
                  </p>
                  {post.scheduledFor && (
                    <p className="mt-1.5 text-xs text-zinc-500">
                      {post.scheduledFor.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState message="No scheduled posts. Create one in Queue." />
          )}
        </section>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
      <p className="text-sm text-zinc-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

const statusColors: Record<string, string> = {
  draft: "bg-zinc-800 text-zinc-400 border-zinc-700",
  pending_approval: "bg-yellow-950 text-yellow-400 border-yellow-800",
  approved: "bg-blue-950 text-blue-400 border-blue-800",
  scheduled: "bg-purple-950 text-purple-400 border-purple-800",
  publishing: "bg-violet-950 text-violet-400 border-violet-800",
  published: "bg-green-950 text-green-400 border-green-800",
  failed: "bg-red-950 text-red-400 border-red-800",
  cancelled: "bg-zinc-800 text-zinc-500 border-zinc-700",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-xs font-medium ${statusColors[status] || statusColors.draft}`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}
