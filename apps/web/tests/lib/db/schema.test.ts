import { describe, it, expect } from "vitest";
import * as schema from "@/lib/db/schema";

describe("database schema definitions", () => {
  it("exports all expected table objects", () => {
    expect(schema.users).toBeDefined();
    expect(schema.xAccounts).toBeDefined();
    expect(schema.contentIdeas).toBeDefined();
    expect(schema.posts).toBeDefined();
    expect(schema.aiGenerations).toBeDefined();
    expect(schema.postMetrics).toBeDefined();
    expect(schema.auditLogs).toBeDefined();
  });

  it("exports all enum definitions", () => {
    expect(schema.postStatusEnum).toBeDefined();
    expect(schema.ideaStatusEnum).toBeDefined();
    expect(schema.ideaCategoryEnum).toBeDefined();
  });

  it("post status enum contains all expected values", () => {
    const values = schema.postStatusEnum.enumValues;
    expect(values).toContain("draft");
    expect(values).toContain("pending_approval");
    expect(values).toContain("approved");
    expect(values).toContain("scheduled");
    expect(values).toContain("publishing");
    expect(values).toContain("published");
    expect(values).toContain("failed");
    expect(values).toContain("cancelled");
    expect(values).toHaveLength(8);
  });

  it("idea status enum contains all expected values", () => {
    const values = schema.ideaStatusEnum.enumValues;
    expect(values).toContain("new");
    expect(values).toContain("developing");
    expect(values).toContain("ready");
    expect(values).toContain("used");
    expect(values).toContain("archived");
    expect(values).toHaveLength(5);
  });

  it("idea category enum contains all expected values", () => {
    const values = schema.ideaCategoryEnum.enumValues;
    expect(values).toContain("ai_ml");
    expect(values).toContain("web_dev");
    expect(values).toContain("engineering");
    expect(values).toContain("building_in_public");
    expect(values).toContain("experiments");
    expect(values).toContain("career");
    expect(values).toContain("other");
    expect(values).toHaveLength(7);
  });

  it("users table has expected columns", () => {
    const cols = Object.keys(schema.users);
    expect(cols).toContain("id");
    expect(cols).toContain("email");
    expect(cols).toContain("name");
    expect(cols).toContain("passwordHash");
    expect(cols).toContain("createdAt");
    expect(cols).toContain("updatedAt");
  });

  it("posts table has expected columns including foreign keys", () => {
    const cols = Object.keys(schema.posts);
    expect(cols).toContain("id");
    expect(cols).toContain("userId");
    expect(cols).toContain("xAccountId");
    expect(cols).toContain("ideaId");
    expect(cols).toContain("content");
    expect(cols).toContain("status");
    expect(cols).toContain("scheduledFor");
    expect(cols).toContain("publishedAt");
    expect(cols).toContain("xPostId");
    expect(cols).toContain("xPostUrl");
    expect(cols).toContain("failureReason");
    expect(cols).toContain("retryCount");
    expect(cols).toContain("isAiGenerated");
    expect(cols).toContain("createdAt");
    expect(cols).toContain("updatedAt");
  });

  it("content_ideas table has expected columns", () => {
    const cols = Object.keys(schema.contentIdeas);
    expect(cols).toContain("id");
    expect(cols).toContain("userId");
    expect(cols).toContain("title");
    expect(cols).toContain("body");
    expect(cols).toContain("status");
    expect(cols).toContain("category");
    expect(cols).toContain("tags");
    expect(cols).toContain("createdAt");
    expect(cols).toContain("updatedAt");
  });

  it("ai_generations table has expected columns", () => {
    const cols = Object.keys(schema.aiGenerations);
    expect(cols).toContain("id");
    expect(cols).toContain("userId");
    expect(cols).toContain("postId");
    expect(cols).toContain("prompt");
    expect(cols).toContain("model");
    expect(cols).toContain("generatedContent");
    expect(cols).toContain("scores");
    expect(cols).toContain("averageScore");
    expect(cols).toContain("variationAngle");
    expect(cols).toContain("tokenUsage");
  });

  it("audit_logs table has expected columns", () => {
    const cols = Object.keys(schema.auditLogs);
    expect(cols).toContain("id");
    expect(cols).toContain("userId");
    expect(cols).toContain("action");
    expect(cols).toContain("entityType");
    expect(cols).toContain("entityId");
    expect(cols).toContain("metadata");
    expect(cols).toContain("createdAt");
  });
});
