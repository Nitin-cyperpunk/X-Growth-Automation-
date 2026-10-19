import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";

export default function AiWriterPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Writer"
        description="Generate post variations with Gemini AI"
      />

      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5">
        <EmptyState
          message="AI Writer requires a configured Gemini API key. Add GEMINI_API_KEY to your environment to enable AI content generation."
        />
      </div>
    </div>
  );
}
