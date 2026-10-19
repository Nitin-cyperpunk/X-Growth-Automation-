import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Overview of your X Growth Engine"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Posts" value="—" />
        <StatCard label="Scheduled" value="—" />
        <StatCard label="Published" value="—" />
        <StatCard label="Drafts" value="—" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5">
          <h2 className="mb-4 text-sm font-medium text-zinc-300">
            Recent Posts
          </h2>
          <EmptyState message="No posts yet. Start writing in Compose." />
        </section>

        <section className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5">
          <h2 className="mb-4 text-sm font-medium text-zinc-300">
            Upcoming Scheduled
          </h2>
          <EmptyState message="No scheduled posts. Create one in Queue." />
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5">
          <h2 className="mb-4 text-sm font-medium text-zinc-300">
            Post Performance
          </h2>
          <EmptyState message="Connect your X account and publish posts to see performance data." />
        </section>

        <section className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5">
          <h2 className="mb-4 text-sm font-medium text-zinc-300">
            AI Insights
          </h2>
          <EmptyState message="Insights will appear once you have published posts with metrics." />
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
