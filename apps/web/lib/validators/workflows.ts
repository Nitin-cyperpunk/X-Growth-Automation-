import { z } from "zod";

export const WORKFLOW_TYPES = [
  "content_preparation",
  "queue_processing",
  "daily_ideas",
] as const;

export const EXECUTION_STATUSES = [
  "pending",
  "running",
  "succeeded",
  "failed",
  "retrying",
] as const;

const VALID_TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Sao_Paulo",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Kolkata",
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Asia/Singapore",
  "Asia/Dubai",
  "Australia/Sydney",
  "Pacific/Auckland",
] as const;

export const CRON_PRESETS = {
  "every_morning_9am": "0 9 * * *",
  "every_evening_6pm": "0 18 * * *",
  "twice_daily": "0 9,18 * * *",
  "weekdays_morning": "0 9 * * 1-5",
  "weekdays_evening": "0 18 * * 1-5",
} as const;

const cronRegex = /^(\*|[0-5]?\d)(\s+(\*|([01]?\d|2[0-3])(,([01]?\d|2[0-3]))*))(\s+(\*|[12]?\d|3[01]))(\s+(\*|[1-9]|1[0-2]))(\s+(\*|[0-6](-[0-6])?(,[0-6](-[0-6])?)*))$/;

export const workflowConfigSchema = z.object({
  workflowType: z.enum(WORKFLOW_TYPES),
  enabled: z.boolean(),
  schedule: z
    .string()
    .max(100)
    .refine((s) => cronRegex.test(s), { message: "Invalid cron schedule format" })
    .optional(),
  timezone: z.enum(VALID_TIMEZONES).default("UTC"),
  config: z
    .record(z.unknown())
    .optional()
    .default({}),
});

export const updateWorkflowConfigSchema = z.object({
  enabled: z.boolean().optional(),
  schedule: z
    .string()
    .max(100)
    .refine((s) => cronRegex.test(s), { message: "Invalid cron schedule format" })
    .optional(),
  timezone: z.enum(VALID_TIMEZONES).optional(),
  config: z.record(z.unknown()).optional(),
});

export const triggerWorkflowSchema = z.object({
  workflowType: z.enum(WORKFLOW_TYPES),
  idempotencyKey: z
    .string()
    .min(1)
    .max(255)
    .optional(),
});

export const webhookCallbackSchema = z.object({
  eventId: z.string().uuid(),
  executionId: z.string().uuid(),
  status: z.enum(["succeeded", "failed"]),
  result: z.record(z.unknown()).optional(),
  errorMessage: z.string().max(1000).optional(),
});

export const VALID_TIMEZONES_LIST = VALID_TIMEZONES;

export type WorkflowConfigInput = z.infer<typeof workflowConfigSchema>;
export type UpdateWorkflowConfigInput = z.infer<typeof updateWorkflowConfigSchema>;
export type TriggerWorkflowInput = z.infer<typeof triggerWorkflowSchema>;
export type WebhookCallbackInput = z.infer<typeof webhookCallbackSchema>;
