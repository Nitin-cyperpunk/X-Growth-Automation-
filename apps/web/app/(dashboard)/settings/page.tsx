import { PageHeader } from "@/components/ui/page-header";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Configure your content preferences and integrations"
      />

      <div className="space-y-6">
        <section className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5">
          <h2 className="mb-4 text-sm font-medium text-zinc-300">
            Content Preferences
          </h2>
          <p className="text-sm text-zinc-500">
            Content strategy and writing preferences will be configurable here.
            Currently, writing guidelines are defined in skills.md.
          </p>
        </section>

        <section className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5">
          <h2 className="mb-4 text-sm font-medium text-zinc-300">
            Integrations
          </h2>
          <div className="space-y-3">
            <IntegrationRow
              name="X (Twitter)"
              description="Connect your X account to publish posts and track metrics"
              status="not_configured"
            />
            <IntegrationRow
              name="Gemini AI"
              description="AI-powered content generation and insights"
              status="not_configured"
            />
            <IntegrationRow
              name="n8n Automation"
              description="Scheduled publishing and automated workflows"
              status="not_configured"
            />
            <IntegrationRow
              name="Neon Database"
              description="PostgreSQL database for persistent storage"
              status="not_configured"
            />
          </div>
        </section>
      </div>
    </div>
  );
}

function IntegrationRow({
  name,
  description,
  status,
}: {
  name: string;
  description: string;
  status: "connected" | "not_configured" | "error";
}) {
  const statusStyles = {
    connected: "bg-green-950 text-green-400 border-green-800",
    not_configured: "bg-zinc-800 text-zinc-400 border-zinc-700",
    error: "bg-red-950 text-red-400 border-red-800",
  };

  const statusLabels = {
    connected: "Connected",
    not_configured: "Not Configured",
    error: "Error",
  };

  return (
    <div className="flex items-center justify-between rounded-md border border-zinc-800 bg-zinc-900 p-3">
      <div>
        <p className="text-sm font-medium text-white">{name}</p>
        <p className="text-xs text-zinc-500">{description}</p>
      </div>
      <span
        className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusStyles[status]}`}
      >
        {statusLabels[status]}
      </span>
    </div>
  );
}
