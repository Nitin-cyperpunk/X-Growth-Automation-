"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import {
  upsertWorkflowConfig,
  triggerWorkflow,
} from "@/lib/actions/workflows";
import {
  CRON_PRESETS,
  VALID_TIMEZONES_LIST,
} from "@/lib/validators/workflows";

interface WorkflowConfig {
  id: string;
  workflowType: string;
  enabled: boolean;
  schedule: string | null;
  timezone: string;
  config: Record<string, unknown> | null;
  lastTriggeredAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface WorkflowExecution {
  id: string;
  workflowType: string;
  status: string;
  idempotencyKey: string;
  errorMessage: string | null;
  retryCount: number;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
}

interface AutomationClientProps {
  configured: boolean;
  initialConfigs: WorkflowConfig[];
  initialExecutions: WorkflowExecution[];
}

const WORKFLOW_INFO: Record<
  string,
  { label: string; description: string; icon: string }
> = {
  content_preparation: {
    label: "Content Preparation",
    description:
      "Generate draft posts based on your topics and preferences on a schedule.",
    icon: "📝",
  },
  queue_processing: {
    label: "Queue Processing",
    description:
      "Process scheduled posts in the content queue for review and approval.",
    icon: "📋",
  },
  daily_ideas: {
    label: "Daily Ideas",
    description:
      "Generate fresh content ideas daily using AI based on your content pillars.",
    icon: "💡",
  },
};

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-950 text-yellow-400 border-yellow-800",
  running: "bg-blue-950 text-blue-400 border-blue-800",
  succeeded: "bg-green-950 text-green-400 border-green-800",
  failed: "bg-red-950 text-red-400 border-red-800",
  retrying: "bg-orange-950 text-orange-400 border-orange-800",
};

export function AutomationClient({
  configured,
  initialConfigs,
  initialExecutions,
}: AutomationClientProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [configs] = useState(initialConfigs);
  const [executions] = useState(initialExecutions);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  function getConfigForType(type: string): WorkflowConfig | undefined {
    return configs.find((c) => c.workflowType === type);
  }

  async function handleToggle(workflowType: string, enable: boolean) {
    setError(null);
    setSuccessMsg(null);
    setLoadingAction(`toggle-${workflowType}`);

    try {
      const config = getConfigForType(workflowType);
      const result = await upsertWorkflowConfig({
        workflowType: workflowType as "content_preparation" | "queue_processing" | "daily_ideas",
        enabled: enable,
        schedule: config?.schedule || "0 9 * * *",
        timezone: (config?.timezone || "UTC") as typeof VALID_TIMEZONES_LIST[number],
        config: config?.config || {},
      });

      if (!result.success) {
        setError(result.error);
      } else {
        setSuccessMsg(
          `${WORKFLOW_INFO[workflowType]?.label} ${enable ? "enabled" : "disabled"}`
        );
        startTransition(() => router.refresh());
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoadingAction(null);
    }
  }

  async function handleUpdateSchedule(
    workflowType: string,
    schedule: string,
    timezone: string
  ) {
    setError(null);
    setSuccessMsg(null);
    setLoadingAction(`schedule-${workflowType}`);

    try {
      const config = getConfigForType(workflowType);
      const result = await upsertWorkflowConfig({
        workflowType: workflowType as "content_preparation" | "queue_processing" | "daily_ideas",
        enabled: config?.enabled ?? false,
        schedule,
        timezone: timezone as typeof VALID_TIMEZONES_LIST[number],
        config: config?.config || {},
      });

      if (!result.success) {
        setError(result.error);
      } else {
        setSuccessMsg(`Schedule updated for ${WORKFLOW_INFO[workflowType]?.label}`);
        startTransition(() => router.refresh());
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoadingAction(null);
    }
  }

  async function handleTrigger(workflowType: string) {
    setError(null);
    setSuccessMsg(null);
    setLoadingAction(`trigger-${workflowType}`);

    try {
      const fd = new FormData();
      fd.set("workflowType", workflowType);
      const result = await triggerWorkflow(fd);

      if (!result.success) {
        setError(result.error);
      } else {
        setSuccessMsg(
          `${WORKFLOW_INFO[workflowType]?.label} triggered (${result.data.executionId.slice(0, 8)}...)`
        );
        startTransition(() => router.refresh());
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoadingAction(null);
    }
  }

  if (!configured) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Automation"
          description="Configure n8n workflows for scheduled content and queue processing"
        />
        <EmptyState
          message="n8n is not configured. Set up your n8n connection to enable automated workflows."
          action={
            <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-4 text-left text-sm">
              <p className="mb-2 font-medium text-zinc-300">Setup instructions:</p>
              <ol className="list-inside list-decimal space-y-1 text-zinc-400">
                <li>Deploy n8n (Docker, Render, or cloud)</li>
                <li>
                  Add to <code className="text-violet-400">.env.local</code>:
                </li>
              </ol>
              <pre className="mt-2 overflow-x-auto rounded bg-zinc-900 p-2 text-xs text-zinc-300">
{`N8N_BASE_URL="https://your-n8n-instance.com"
N8N_WEBHOOK_SECRET="generate-with-openssl-rand-base64-32"`}
              </pre>
              <ol start={3} className="mt-2 list-inside list-decimal space-y-1 text-zinc-400">
                <li>Import workflow templates from <code className="text-violet-400">automation/workflows/</code></li>
                <li>Configure the same webhook secret in n8n</li>
                <li>Restart the dev server</li>
              </ol>
            </div>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Automation"
        description="Configure n8n workflows for scheduled content and queue processing"
      />

      {error && (
        <div className="rounded-lg border border-red-800 bg-red-950/50 p-3 text-sm text-red-400">
          {error}
        </div>
      )}
      {successMsg && (
        <div className="rounded-lg border border-green-800 bg-green-950/50 p-3 text-sm text-green-400">
          {successMsg}
        </div>
      )}

      <div className="rounded-lg border border-green-800/50 bg-green-950/30 p-3 text-sm">
        <span className="mr-2 inline-block h-2 w-2 rounded-full bg-green-500" />
        <span className="text-green-400">n8n connected</span>
      </div>

      <section className="space-y-4">
        <h2 className="text-sm font-medium text-zinc-300">Workflows</h2>
        {Object.entries(WORKFLOW_INFO).map(([type, info]) => {
          const config = getConfigForType(type);
          const isEnabled = config?.enabled ?? false;
          const isLoading =
            loadingAction === `toggle-${type}` ||
            loadingAction === `trigger-${type}` ||
            loadingAction === `schedule-${type}`;

          return (
            <WorkflowCard
              key={type}
              info={info}
              config={config}
              isEnabled={isEnabled}
              isLoading={isLoading}
              onToggle={(enable) => handleToggle(type, enable)}
              onTrigger={() => handleTrigger(type)}
              onUpdateSchedule={(schedule, tz) =>
                handleUpdateSchedule(type, schedule, tz)
              }
            />
          );
        })}
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-medium text-zinc-300">
          Recent Executions
        </h2>
        {executions.length === 0 ? (
          <p className="text-sm text-zinc-500">
            No executions yet. Trigger a workflow to see results here.
          </p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-zinc-800">
            <table className="w-full text-sm">
              <thead className="bg-zinc-900/50">
                <tr className="text-left text-xs text-zinc-500">
                  <th className="px-4 py-2">Workflow</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Started</th>
                  <th className="px-4 py-2">Completed</th>
                  <th className="px-4 py-2">Retries</th>
                  <th className="px-4 py-2">Error</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {executions.map((exec) => (
                  <tr key={exec.id} className="text-zinc-300">
                    <td className="px-4 py-2">
                      {WORKFLOW_INFO[exec.workflowType]?.label ??
                        exec.workflowType}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`inline-block rounded-full border px-2 py-0.5 text-xs font-medium ${
                          STATUS_STYLES[exec.status] ?? STATUS_STYLES.pending
                        }`}
                      >
                        {exec.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-xs text-zinc-500">
                      {exec.startedAt
                        ? new Date(exec.startedAt).toLocaleString()
                        : "—"}
                    </td>
                    <td className="px-4 py-2 text-xs text-zinc-500">
                      {exec.completedAt
                        ? new Date(exec.completedAt).toLocaleString()
                        : "—"}
                    </td>
                    <td className="px-4 py-2 text-xs text-zinc-500">
                      {exec.retryCount}
                    </td>
                    <td className="max-w-[200px] truncate px-4 py-2 text-xs text-red-400">
                      {exec.errorMessage || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function WorkflowCard({
  info,
  config,
  isEnabled,
  isLoading,
  onToggle,
  onTrigger,
  onUpdateSchedule,
}: {
  info: { label: string; description: string; icon: string };
  config?: WorkflowConfig;
  isEnabled: boolean;
  isLoading: boolean;
  onToggle: (enable: boolean) => void;
  onTrigger: () => void;
  onUpdateSchedule: (schedule: string, timezone: string) => void;
}) {
  const [showSchedule, setShowSchedule] = useState(false);
  const [schedule, setSchedule] = useState(config?.schedule || "0 9 * * *");
  const [timezone, setTimezone] = useState(config?.timezone || "UTC");

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <span className="text-lg">{info.icon}</span>
          <div>
            <h3 className="text-sm font-medium text-white">{info.label}</h3>
            <p className="mt-0.5 text-xs text-zinc-500">{info.description}</p>
            {config?.lastTriggeredAt && (
              <p className="mt-1 text-xs text-zinc-600">
                Last run: {new Date(config.lastTriggeredAt).toLocaleString()}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggle(!isEnabled)}
            disabled={isLoading}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
              isEnabled ? "bg-violet-600" : "bg-zinc-700"
            } ${isLoading ? "opacity-50" : ""}`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                isEnabled ? "translate-x-4" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>
      </div>

      {isEnabled && (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-zinc-800 pt-3">
          <button
            onClick={() => setShowSchedule(!showSchedule)}
            className="rounded bg-zinc-800 px-2.5 py-1 text-xs text-zinc-300 hover:bg-zinc-700"
          >
            {showSchedule ? "Hide Schedule" : "Configure Schedule"}
          </button>
          <button
            onClick={onTrigger}
            disabled={isLoading}
            className="rounded bg-violet-600 px-2.5 py-1 text-xs text-white hover:bg-violet-500 disabled:opacity-50"
          >
            {isLoading ? "Triggering..." : "Run Now"}
          </button>
          {config?.schedule && (
            <span className="text-xs text-zinc-500">
              Schedule: <code className="text-zinc-400">{config.schedule}</code>{" "}
              ({config.timezone})
            </span>
          )}
        </div>
      )}

      {isEnabled && showSchedule && (
        <div className="mt-3 space-y-3 rounded-md border border-zinc-800 bg-zinc-900 p-3">
          <div>
            <label className="mb-1 block text-xs text-zinc-400">
              Schedule Preset
            </label>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(CRON_PRESETS).map(([key, cron]) => (
                <button
                  key={key}
                  onClick={() => setSchedule(cron)}
                  className={`rounded px-2 py-1 text-xs ${
                    schedule === cron
                      ? "bg-violet-600 text-white"
                      : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                  }`}
                >
                  {key.replace(/_/g, " ")}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs text-zinc-400">
              Cron Expression
            </label>
            <input
              type="text"
              value={schedule}
              onChange={(e) => setSchedule(e.target.value)}
              className="w-full rounded border border-zinc-700 bg-zinc-800 px-2.5 py-1.5 text-xs text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none"
              placeholder="0 9 * * *"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-zinc-400">
              Timezone
            </label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full rounded border border-zinc-700 bg-zinc-800 px-2.5 py-1.5 text-xs text-white focus:border-violet-500 focus:outline-none"
            >
              {VALID_TIMEZONES_LIST.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => onUpdateSchedule(schedule, timezone)}
            disabled={isLoading}
            className="rounded bg-violet-600 px-3 py-1.5 text-xs text-white hover:bg-violet-500 disabled:opacity-50"
          >
            Save Schedule
          </button>
        </div>
      )}
    </div>
  );
}
