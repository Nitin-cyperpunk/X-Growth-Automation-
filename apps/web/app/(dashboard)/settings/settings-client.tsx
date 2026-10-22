"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { disconnectXAccount } from "@/lib/actions/x";

interface SettingsClientProps {
  geminiStatus: "connected" | "not_configured";
  n8nStatus: "connected" | "not_configured";
  xAccount: {
    id: string;
    xUsername: string;
    xDisplayName: string | null;
    connectedAt: string;
  } | null;
  xConfigured: boolean;
}

export function SettingsClient({
  geminiStatus,
  n8nStatus,
  xAccount,
  xConfigured,
}: SettingsClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [xMessage, setXMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
    const success = searchParams.get("x_success");
    const error = searchParams.get("x_error");
    if (success) {
      setXMessage({ type: "success", text: success });
      router.replace("/settings", { scroll: false });
    } else if (error) {
      setXMessage({ type: "error", text: error });
      router.replace("/settings", { scroll: false });
    }
  }, [searchParams, router]);

  async function handleDisconnect() {
    if (!xAccount) return;
    if (!confirm("Disconnect your X account? You can reconnect later.")) return;

    setDisconnecting(true);
    try {
      const result = await disconnectXAccount({ xAccountId: xAccount.id });
      if (result.success) {
        setXMessage({ type: "success", text: "X account disconnected" });
        router.refresh();
      } else {
        setXMessage({ type: "error", text: result.error });
      }
    } catch (e) {
      setXMessage({ type: "error", text: (e as Error).message });
    } finally {
      setDisconnecting(false);
    }
  }

  return (
    <div className="space-y-6">
      {xMessage && (
        <div
          className={`rounded-lg border p-3 text-sm ${
            xMessage.type === "success"
              ? "border-green-800 bg-green-950/50 text-green-400"
              : "border-red-800 bg-red-950/50 text-red-400"
          }`}
        >
          {xMessage.text}
        </div>
      )}

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
          <XConnectionRow
            configured={xConfigured}
            account={xAccount}
            disconnecting={disconnecting}
            onDisconnect={handleDisconnect}
          />
          <IntegrationRow
            name="Gemini AI"
            description="AI-powered content generation and insights"
            status={geminiStatus}
          />
          <IntegrationRow
            name="n8n Automation"
            description="Scheduled publishing and automated workflows"
            status={n8nStatus}
          />
          <IntegrationRow
            name="Neon Database"
            description="PostgreSQL database for persistent storage"
            status="connected"
          />
        </div>
      </section>
    </div>
  );
}

function XConnectionRow({
  configured,
  account,
  disconnecting,
  onDisconnect,
}: {
  configured: boolean;
  account: SettingsClientProps["xAccount"];
  disconnecting: boolean;
  onDisconnect: () => void;
}) {
  if (account) {
    return (
      <div className="flex items-center justify-between rounded-md border border-zinc-800 bg-zinc-900 p-3">
        <div>
          <p className="text-sm font-medium text-white">X (Twitter)</p>
          <p className="text-xs text-zinc-500">
            Connected as{" "}
            <span className="text-violet-400">@{account.xUsername}</span>
            {account.xDisplayName && ` (${account.xDisplayName})`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-green-800 bg-green-950 px-2.5 py-0.5 text-xs font-medium text-green-400">
            Connected
          </span>
          <button
            onClick={onDisconnect}
            disabled={disconnecting}
            className="rounded border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-xs text-zinc-400 hover:bg-zinc-700 hover:text-white disabled:opacity-50"
          >
            {disconnecting ? "Disconnecting..." : "Disconnect"}
          </button>
        </div>
      </div>
    );
  }

  if (configured) {
    return (
      <div className="flex items-center justify-between rounded-md border border-zinc-800 bg-zinc-900 p-3">
        <div>
          <p className="text-sm font-medium text-white">X (Twitter)</p>
          <p className="text-xs text-zinc-500">
            Connect your X account to publish posts and track metrics
          </p>
        </div>
        <a
          href="/api/x/authorize"
          className="rounded bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-500"
        >
          Connect X Account
        </a>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between rounded-md border border-zinc-800 bg-zinc-900 p-3">
      <div>
        <p className="text-sm font-medium text-white">X (Twitter)</p>
        <p className="text-xs text-zinc-500">
          Set X_CLIENT_ID, X_CLIENT_SECRET, and X_TOKEN_ENCRYPTION_KEY to enable
        </p>
      </div>
      <span className="rounded-full border border-zinc-700 bg-zinc-800 px-2.5 py-0.5 text-xs font-medium text-zinc-400">
        Not Configured
      </span>
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
