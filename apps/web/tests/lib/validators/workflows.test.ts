import { describe, it, expect } from "vitest";
import {
  workflowConfigSchema,
  updateWorkflowConfigSchema,
  triggerWorkflowSchema,
  webhookCallbackSchema,
  WORKFLOW_TYPES,
  EXECUTION_STATUSES,
  CRON_PRESETS,
  VALID_TIMEZONES_LIST,
} from "@/lib/validators/workflows";

describe("workflow validators", () => {
  describe("workflowConfigSchema", () => {
    it("accepts valid config with all fields", () => {
      const result = workflowConfigSchema.safeParse({
        workflowType: "content_preparation",
        enabled: true,
        schedule: "0 9 * * *",
        timezone: "UTC",
        config: { maxPosts: 3 },
      });
      expect(result.success).toBe(true);
    });

    it("applies default timezone and config", () => {
      const result = workflowConfigSchema.safeParse({
        workflowType: "daily_ideas",
        enabled: false,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.timezone).toBe("UTC");
        expect(result.data.config).toEqual({});
      }
    });

    it("accepts all valid workflow types", () => {
      for (const type of WORKFLOW_TYPES) {
        const result = workflowConfigSchema.safeParse({
          workflowType: type,
          enabled: false,
        });
        expect(result.success).toBe(true);
      }
    });

    it("rejects invalid workflow type", () => {
      const result = workflowConfigSchema.safeParse({
        workflowType: "invalid_workflow",
        enabled: true,
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid cron expression", () => {
      const result = workflowConfigSchema.safeParse({
        workflowType: "content_preparation",
        enabled: true,
        schedule: "not a cron",
      });
      expect(result.success).toBe(false);
    });

    it("accepts all cron presets", () => {
      for (const cron of Object.values(CRON_PRESETS)) {
        const result = workflowConfigSchema.safeParse({
          workflowType: "content_preparation",
          enabled: true,
          schedule: cron,
        });
        expect(result.success).toBe(true);
      }
    });

    it("accepts all valid timezones", () => {
      for (const tz of VALID_TIMEZONES_LIST) {
        const result = workflowConfigSchema.safeParse({
          workflowType: "daily_ideas",
          enabled: false,
          timezone: tz,
        });
        expect(result.success).toBe(true);
      }
    });

    it("rejects invalid timezone", () => {
      const result = workflowConfigSchema.safeParse({
        workflowType: "daily_ideas",
        enabled: false,
        timezone: "Mars/Olympus",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("updateWorkflowConfigSchema", () => {
    it("accepts partial update with only enabled", () => {
      const result = updateWorkflowConfigSchema.safeParse({
        enabled: true,
      });
      expect(result.success).toBe(true);
    });

    it("accepts partial update with schedule and timezone", () => {
      const result = updateWorkflowConfigSchema.safeParse({
        schedule: "0 18 * * 1-5",
        timezone: "America/New_York",
      });
      expect(result.success).toBe(true);
    });

    it("accepts empty object", () => {
      const result = updateWorkflowConfigSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });

  describe("triggerWorkflowSchema", () => {
    it("accepts valid trigger without idempotency key", () => {
      const result = triggerWorkflowSchema.safeParse({
        workflowType: "queue_processing",
      });
      expect(result.success).toBe(true);
    });

    it("accepts valid trigger with idempotency key", () => {
      const result = triggerWorkflowSchema.safeParse({
        workflowType: "content_preparation",
        idempotencyKey: "prep-user1-1698000000000",
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid workflow type", () => {
      const result = triggerWorkflowSchema.safeParse({
        workflowType: "hack_the_planet",
      });
      expect(result.success).toBe(false);
    });

    it("rejects idempotency key longer than 255 chars", () => {
      const result = triggerWorkflowSchema.safeParse({
        workflowType: "daily_ideas",
        idempotencyKey: "x".repeat(256),
      });
      expect(result.success).toBe(false);
    });
  });

  describe("webhookCallbackSchema", () => {
    it("accepts valid succeeded callback", () => {
      const result = webhookCallbackSchema.safeParse({
        eventId: "550e8400-e29b-41d4-a716-446655440000",
        executionId: "660e8400-e29b-41d4-a716-446655440001",
        status: "succeeded",
        result: { postsGenerated: 3 },
      });
      expect(result.success).toBe(true);
    });

    it("accepts valid failed callback with error", () => {
      const result = webhookCallbackSchema.safeParse({
        eventId: "550e8400-e29b-41d4-a716-446655440000",
        executionId: "660e8400-e29b-41d4-a716-446655440001",
        status: "failed",
        errorMessage: "Rate limit exceeded",
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid status", () => {
      const result = webhookCallbackSchema.safeParse({
        eventId: "550e8400-e29b-41d4-a716-446655440000",
        executionId: "660e8400-e29b-41d4-a716-446655440001",
        status: "running",
      });
      expect(result.success).toBe(false);
    });

    it("rejects non-UUID eventId", () => {
      const result = webhookCallbackSchema.safeParse({
        eventId: "not-a-uuid",
        executionId: "660e8400-e29b-41d4-a716-446655440001",
        status: "succeeded",
      });
      expect(result.success).toBe(false);
    });

    it("rejects error message over 1000 chars", () => {
      const result = webhookCallbackSchema.safeParse({
        eventId: "550e8400-e29b-41d4-a716-446655440000",
        executionId: "660e8400-e29b-41d4-a716-446655440001",
        status: "failed",
        errorMessage: "x".repeat(1001),
      });
      expect(result.success).toBe(false);
    });
  });

  describe("constants", () => {
    it("exports expected workflow types", () => {
      expect(WORKFLOW_TYPES).toContain("content_preparation");
      expect(WORKFLOW_TYPES).toContain("queue_processing");
      expect(WORKFLOW_TYPES).toContain("daily_ideas");
      expect(WORKFLOW_TYPES).toHaveLength(3);
    });

    it("exports expected execution statuses", () => {
      expect(EXECUTION_STATUSES).toContain("pending");
      expect(EXECUTION_STATUSES).toContain("running");
      expect(EXECUTION_STATUSES).toContain("succeeded");
      expect(EXECUTION_STATUSES).toContain("failed");
      expect(EXECUTION_STATUSES).toContain("retrying");
      expect(EXECUTION_STATUSES).toHaveLength(5);
    });
  });
});
