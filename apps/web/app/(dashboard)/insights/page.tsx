import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";

export default function InsightsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Insights"
        description="AI-generated analysis and recommendations for your content strategy"
      />

      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5">
        <EmptyState message="Insights will be generated once you have enough published posts with metrics data. This requires both the Gemini API and X API integrations." />
      </div>
    </div>
  );
}
