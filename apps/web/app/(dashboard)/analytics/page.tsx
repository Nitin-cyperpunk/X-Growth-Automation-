import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Track your post performance and growth metrics"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Total Impressions" value="—" />
        <MetricCard label="Total Likes" value="—" />
        <MetricCard label="Total Replies" value="—" />
        <MetricCard label="Total Reposts" value="—" />
      </div>

      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5">
        <h2 className="mb-4 text-sm font-medium text-zinc-300">
          Engagement Over Time
        </h2>
        <EmptyState message="Connect your X account and publish posts to see analytics. Charts will display real metrics from the X API." />
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
