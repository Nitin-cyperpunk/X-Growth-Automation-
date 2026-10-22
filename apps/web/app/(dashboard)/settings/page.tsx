import { Suspense } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { isGeminiConfigured } from "@/lib/ai/gemini";
import { isN8nConfigured } from "@/lib/n8n/client";
import { checkXConnectionStatus } from "@/lib/actions/x";
import { SettingsClient } from "./settings-client";

export default async function SettingsPage() {
  const geminiStatus = isGeminiConfigured() ? "connected" : "not_configured";
  const n8nStatus = isN8nConfigured() ? "connected" : "not_configured";

  let xAccount: {
    id: string;
    xUsername: string;
    xDisplayName: string | null;
    connectedAt: Date;
  } | null = null;
  let xConfigured = false;

  try {
    const result = await checkXConnectionStatus();
    if (result.success) {
      xConfigured = result.data.configured;
      if (result.data.connected && result.data.account) {
        xAccount = result.data.account;
      }
    }
  } catch {
    // X status check failed — show as not configured
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Configure your content preferences and integrations"
      />

      <Suspense>
        <SettingsClient
          geminiStatus={geminiStatus}
          n8nStatus={n8nStatus}
          xAccount={xAccount ? {
            id: xAccount.id,
            xUsername: xAccount.xUsername,
            xDisplayName: xAccount.xDisplayName,
            connectedAt: xAccount.connectedAt.toISOString(),
          } : null}
          xConfigured={xConfigured}
        />
      </Suspense>
    </div>
  );
}
