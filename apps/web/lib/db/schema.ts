import {
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
  integer,
  boolean,
  pgEnum,
  jsonb,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

// --- Enums ---

export const postStatusEnum = pgEnum("post_status", [
  "draft",
  "pending_approval",
  "approved",
  "scheduled",
  "publishing",
  "published",
  "failed",
  "cancelled",
]);

export const ideaStatusEnum = pgEnum("idea_status", [
  "new",
  "developing",
  "ready",
  "used",
  "archived",
]);

export const ideaCategoryEnum = pgEnum("idea_category", [
  "ai_ml",
  "web_dev",
  "engineering",
  "building_in_public",
  "experiments",
  "career",
  "other",
]);

// --- Tables ---

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const xAccounts = pgTable("x_accounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  xUserId: varchar("x_user_id", { length: 255 }).notNull(),
  xUsername: varchar("x_username", { length: 255 }).notNull(),
  xDisplayName: varchar("x_display_name", { length: 255 }),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token"),
  tokenExpiresAt: timestamp("token_expires_at", { withTimezone: true }),
  connectedAt: timestamp("connected_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex("x_accounts_user_x_user_idx").on(table.userId, table.xUserId),
]);

export const contentIdeas = pgTable("content_ideas", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 500 }).notNull(),
  body: text("body"),
  status: ideaStatusEnum("status").default("new").notNull(),
  category: ideaCategoryEnum("category").default("other").notNull(),
  tags: jsonb("tags").$type<string[]>().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("content_ideas_user_status_idx").on(table.userId, table.status),
]);

export const posts = pgTable("posts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  xAccountId: uuid("x_account_id")
    .references(() => xAccounts.id, { onDelete: "set null" }),
  ideaId: uuid("idea_id")
    .references(() => contentIdeas.id, { onDelete: "set null" }),
  content: text("content").notNull(),
  status: postStatusEnum("status").default("draft").notNull(),
  scheduledFor: timestamp("scheduled_for", { withTimezone: true }),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  xPostId: varchar("x_post_id", { length: 255 }),
  xPostUrl: text("x_post_url"),
  failureReason: text("failure_reason"),
  retryCount: integer("retry_count").default(0).notNull(),
  isAiGenerated: boolean("is_ai_generated").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("posts_user_status_idx").on(table.userId, table.status),
  index("posts_scheduled_idx").on(table.status, table.scheduledFor),
  uniqueIndex("posts_x_post_id_idx").on(table.xPostId),
]);

export const aiGenerations = pgTable("ai_generations", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  postId: uuid("post_id")
    .references(() => posts.id, { onDelete: "set null" }),
  prompt: text("prompt").notNull(),
  model: varchar("model", { length: 100 }).notNull(),
  generatedContent: text("generated_content").notNull(),
  scores: jsonb("scores").$type<Record<string, number>>(),
  averageScore: integer("average_score"),
  variationAngle: varchar("variation_angle", { length: 255 }),
  tokenUsage: jsonb("token_usage").$type<{ input: number; output: number }>(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const postMetrics = pgTable("post_metrics", {
  id: uuid("id").defaultRandom().primaryKey(),
  postId: uuid("post_id")
    .notNull()
    .references(() => posts.id, { onDelete: "cascade" }),
  impressions: integer("impressions").default(0).notNull(),
  likes: integer("likes").default(0).notNull(),
  replies: integer("replies").default(0).notNull(),
  reposts: integer("reposts").default(0).notNull(),
  quotes: integer("quotes").default(0).notNull(),
  bookmarks: integer("bookmarks").default(0).notNull(),
  urlClicks: integer("url_clicks").default(0).notNull(),
  profileVisits: integer("profile_visits").default(0).notNull(),
  snapshotAt: timestamp("snapshot_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("post_metrics_post_snapshot_idx").on(table.postId, table.snapshotAt),
]);

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "set null" }),
  action: varchar("action", { length: 100 }).notNull(),
  entityType: varchar("entity_type", { length: 100 }),
  entityId: uuid("entity_id"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("audit_logs_user_created_idx").on(table.userId, table.createdAt),
]);

// --- Workflow Enums ---

export const workflowTypeEnum = pgEnum("workflow_type", [
  "content_preparation",
  "queue_processing",
  "daily_ideas",
]);

export const executionStatusEnum = pgEnum("execution_status", [
  "pending",
  "running",
  "succeeded",
  "failed",
  "retrying",
]);

// --- Workflow Tables ---

export const workflowConfigs = pgTable("workflow_configs", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  workflowType: workflowTypeEnum("workflow_type").notNull(),
  enabled: boolean("enabled").default(false).notNull(),
  schedule: varchar("schedule", { length: 100 }),
  timezone: varchar("timezone", { length: 100 }).default("UTC").notNull(),
  config: jsonb("config").$type<Record<string, unknown>>().default({}),
  lastTriggeredAt: timestamp("last_triggered_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex("workflow_configs_user_type_idx").on(table.userId, table.workflowType),
]);

export const workflowExecutions = pgTable("workflow_executions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  workflowConfigId: uuid("workflow_config_id")
    .references(() => workflowConfigs.id, { onDelete: "set null" }),
  workflowType: workflowTypeEnum("workflow_type").notNull(),
  status: executionStatusEnum("status").default("pending").notNull(),
  idempotencyKey: varchar("idempotency_key", { length: 255 }).notNull(),
  payload: jsonb("payload").$type<Record<string, unknown>>(),
  result: jsonb("result").$type<Record<string, unknown>>(),
  errorMessage: text("error_message"),
  retryCount: integer("retry_count").default(0).notNull(),
  maxRetries: integer("max_retries").default(3).notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("workflow_executions_user_idx").on(table.userId, table.createdAt),
  index("workflow_executions_status_idx").on(table.status, table.createdAt),
  uniqueIndex("workflow_executions_idempotency_idx").on(table.idempotencyKey),
]);

// --- Type Exports ---

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type XAccount = typeof xAccounts.$inferSelect;
export type ContentIdea = typeof contentIdeas.$inferSelect;
export type NewContentIdea = typeof contentIdeas.$inferInsert;
export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
export type AiGeneration = typeof aiGenerations.$inferSelect;
export type PostMetric = typeof postMetrics.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type WorkflowConfig = typeof workflowConfigs.$inferSelect;
export type NewWorkflowConfig = typeof workflowConfigs.$inferInsert;
export type WorkflowExecution = typeof workflowExecutions.$inferSelect;
export type NewWorkflowExecution = typeof workflowExecutions.$inferInsert;
