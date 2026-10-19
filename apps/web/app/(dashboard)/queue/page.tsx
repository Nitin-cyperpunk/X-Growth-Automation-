import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";

const tabs = [
  { label: "Drafts", status: "draft" },
  { label: "Pending", status: "pending_approval" },
  { label: "Scheduled", status: "scheduled" },
  { label: "Failed", status: "failed" },
] as const;

export default function QueuePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Content Queue"
        description="Manage your drafts, scheduled, and pending posts"
      />

      <div className="flex gap-2 border-b border-zinc-800 pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.status}
            className="rounded-md px-3 py-1.5 text-sm font-medium text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5">
        <EmptyState message="No posts in queue. Create a new post in Compose." />
      </div>
    </div>
  );
}
