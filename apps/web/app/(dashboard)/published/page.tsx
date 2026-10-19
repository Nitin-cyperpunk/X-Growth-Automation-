import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";

export default function PublishedPage() {
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
