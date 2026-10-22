"use server";

import { getAuthenticatedUserId } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { workflowConfigs, workflowExecutions } from "@/lib/db/schema";
import { isN8nConfigured, triggerN8nWebhook } from "@/lib/n8n/client";
import {
  workflowConfigSchema,
  updateWorkflowConfigSchema,
  triggerWorkflowSchema,
  type WorkflowConfigInput,
  WORKFLOW_TYPES,
} from "@/lib/validators/workflows";
import { eq, and, desc } from "drizzle-orm";
import { randomUUID } from "crypto";

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

const WORKFLOW_WEBHOOK_PATHS: Record<string, string> = {
  content_preparation: "content-preparation",
  queue_processing: "queue-processing",
  daily_ideas: "daily-ideas",
};

export async function checkN8nStatus(): Promise<
  ActionResult<{ configured: boolean; workflows: typeof WORKFLOW_TYPES }>
> {
  try {
    await getAuthenticatedUserId();
    return {
      success: true,
      data: {
        configured: isN8nConfigured(),
        workflows: WORKFLOW_TYPES,
      },
    };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function getWorkflowConfigs(): Promise<
  ActionResult<(typeof workflowConfigs.$inferSelect)[]>
> {
  try {
    const userId = await getAuthenticatedUserId();
    const db = getDb();

    const configs = await db
      .select()
      .from(workflowConfigs)
      .where(eq(workflowConfigs.userId, userId))
      .orderBy(workflowConfigs.workflowType);

    return { success: true, data: configs };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function upsertWorkflowConfig(
  input: WorkflowConfigInput
): Promise<ActionResult<typeof workflowConfigs.$inferSelect>> {
  try {
    const userId = await getAuthenticatedUserId();
    const db = getDb();

    const parsed = workflowConfigSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const existing = await db
      .select()
      .from(workflowConfigs)
      .where(
        and(
          eq(workflowConfigs.userId, userId),
          eq(workflowConfigs.workflowType, parsed.data.workflowType)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      const updated = await db
        .update(workflowConfigs)
        .set({
          enabled: parsed.data.enabled,
          schedule: parsed.data.schedule,
          timezone: parsed.data.timezone,
          config: parsed.data.config,
          updatedAt: new Date(),
        })
        .where(eq(workflowConfigs.id, existing[0].id))
        .returning();

      return { success: true, data: updated[0] };
    }

    const created = await db
      .insert(workflowConfigs)
      .values({
        userId,
        workflowType: parsed.data.workflowType,
        enabled: parsed.data.enabled,
        schedule: parsed.data.schedule,
        timezone: parsed.data.timezone,
        config: parsed.data.config,
      })
      .returning();

    return { success: true, data: created[0] };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function updateWorkflowConfig(
  configId: string,
  formData: FormData
): Promise<ActionResult<typeof workflowConfigs.$inferSelect>> {
  try {
    const userId = await getAuthenticatedUserId();
    const db = getDb();

    const existing = await db
      .select()
      .from(workflowConfigs)
      .where(
        and(
          eq(workflowConfigs.id, configId),
          eq(workflowConfigs.userId, userId)
        )
      )
      .limit(1);

    if (existing.length === 0) {
      return { success: false, error: "Workflow config not found" };
    }

    const raw = {
      enabled:
        formData.get("enabled") !== null
          ? formData.get("enabled") === "true"
          : undefined,
      schedule: (formData.get("schedule") as string) || undefined,
      timezone: (formData.get("timezone") as string) || undefined,
      config: formData.get("config")
        ? JSON.parse(formData.get("config") as string)
        : undefined,
    };

    const parsed = updateWorkflowConfigSchema.safeParse(raw);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (parsed.data.enabled !== undefined) updates.enabled = parsed.data.enabled;
    if (parsed.data.schedule !== undefined) updates.schedule = parsed.data.schedule;
    if (parsed.data.timezone !== undefined) updates.timezone = parsed.data.timezone;
    if (parsed.data.config !== undefined) updates.config = parsed.data.config;

    const updated = await db
      .update(workflowConfigs)
      .set(updates)
      .where(eq(workflowConfigs.id, configId))
      .returning();

    return { success: true, data: updated[0] };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function triggerWorkflow(
  formData: FormData
): Promise<ActionResult<{ executionId: string }>> {
  try {
    const userId = await getAuthenticatedUserId();
    const db = getDb();

    if (!isN8nConfigured()) {
      return {
        success: false,
        error: "n8n is not configured. Add N8N_BASE_URL and N8N_WEBHOOK_SECRET to .env.local.",
      };
    }

    const raw = {
      workflowType: formData.get("workflowType") as string,
      idempotencyKey: (formData.get("idempotencyKey") as string) || undefined,
    };

    const parsed = triggerWorkflowSchema.safeParse(raw);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const idempotencyKey =
      parsed.data.idempotencyKey || `${parsed.data.workflowType}-${userId}-${Date.now()}`;

    const existingExec = await db
      .select()
      .from(workflowExecutions)
      .where(eq(workflowExecutions.idempotencyKey, idempotencyKey))
      .limit(1);

    if (existingExec.length > 0) {
      return {
        success: true,
        data: { executionId: existingExec[0].id },
      };
    }

    const config = await db
      .select()
      .from(workflowConfigs)
      .where(
        and(
          eq(workflowConfigs.userId, userId),
          eq(workflowConfigs.workflowType, parsed.data.workflowType)
        )
      )
      .limit(1);

    const eventId = randomUUID();
    const execution = await db
      .insert(workflowExecutions)
      .values({
        userId,
        workflowConfigId: config.length > 0 ? config[0].id : null,
        workflowType: parsed.data.workflowType,
        status: "pending",
        idempotencyKey,
        payload: {
          eventId,
          eventType: parsed.data.workflowType,
          schemaVersion: 1,
        },
      })
      .returning();

    const webhookPath = WORKFLOW_WEBHOOK_PATHS[parsed.data.workflowType];
    if (!webhookPath) {
      await db
        .update(workflowExecutions)
        .set({ status: "failed", errorMessage: "Unknown workflow type", completedAt: new Date() })
        .where(eq(workflowExecutions.id, execution[0].id));
      return { success: false, error: "Unknown workflow type" };
    }

    try {
      const response = await triggerN8nWebhook(webhookPath, {
        eventId,
        eventType: parsed.data.workflowType,
        schemaVersion: 1,
        occurredAt: new Date().toISOString(),
        userId,
        data: {
          executionId: execution[0].id,
          timezone: config.length > 0 ? config[0].timezone : "UTC",
          config: config.length > 0 ? config[0].config : {},
        },
      });

      if (response.ok) {
        await db
          .update(workflowExecutions)
          .set({ status: "running", startedAt: new Date() })
          .where(eq(workflowExecutions.id, execution[0].id));
      } else {
        await db
          .update(workflowExecutions)
          .set({
            status: "failed",
            errorMessage: `n8n returned status ${response.status}`,
            completedAt: new Date(),
          })
          .where(eq(workflowExecutions.id, execution[0].id));
        return {
          success: false,
          error: `n8n rejected the request (HTTP ${response.status})`,
        };
      }

      if (config.length > 0) {
        await db
          .update(workflowConfigs)
          .set({ lastTriggeredAt: new Date(), updatedAt: new Date() })
          .where(eq(workflowConfigs.id, config[0].id));
      }

      return { success: true, data: { executionId: execution[0].id } };
    } catch (e) {
      const errorMsg = (e as Error).message.slice(0, 500);
      await db
        .update(workflowExecutions)
        .set({
          status: "failed",
          errorMessage: errorMsg,
          completedAt: new Date(),
        })
        .where(eq(workflowExecutions.id, execution[0].id));
      return { success: false, error: errorMsg };
    }
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function getWorkflowExecutions(opts?: {
  limit?: number;
  workflowType?: string;
}): Promise<ActionResult<(typeof workflowExecutions.$inferSelect)[]>> {
  try {
    const userId = await getAuthenticatedUserId();
    const db = getDb();
    const limit = Math.min(opts?.limit ?? 20, 100);

    let query = db
      .select()
      .from(workflowExecutions)
      .where(eq(workflowExecutions.userId, userId))
      .orderBy(desc(workflowExecutions.createdAt))
      .limit(limit);

    if (opts?.workflowType) {
      const validTypes = WORKFLOW_TYPES as readonly string[];
      if (!validTypes.includes(opts.workflowType)) {
        return { success: false, error: "Invalid workflow type" };
      }
      query = db
        .select()
        .from(workflowExecutions)
        .where(
          and(
            eq(workflowExecutions.userId, userId),
            eq(
              workflowExecutions.workflowType,
              opts.workflowType as (typeof WORKFLOW_TYPES)[number]
            )
          )
        )
        .orderBy(desc(workflowExecutions.createdAt))
        .limit(limit);
    }

    const results = await query;
    return { success: true, data: results };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}
