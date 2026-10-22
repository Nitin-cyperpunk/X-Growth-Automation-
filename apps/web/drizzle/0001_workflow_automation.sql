CREATE TYPE "public"."workflow_type" AS ENUM('content_preparation', 'queue_processing', 'daily_ideas');--> statement-breakpoint
CREATE TYPE "public"."execution_status" AS ENUM('pending', 'running', 'succeeded', 'failed', 'retrying');--> statement-breakpoint
CREATE TABLE "workflow_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"workflow_type" "workflow_type" NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"schedule" varchar(100),
	"timezone" varchar(100) DEFAULT 'UTC' NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb,
	"last_triggered_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workflow_executions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"workflow_config_id" uuid,
	"workflow_type" "workflow_type" NOT NULL,
	"status" "execution_status" DEFAULT 'pending' NOT NULL,
	"idempotency_key" varchar(255) NOT NULL,
	"payload" jsonb,
	"result" jsonb,
	"error_message" text,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"max_retries" integer DEFAULT 3 NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "workflow_configs" ADD CONSTRAINT "workflow_configs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_executions" ADD CONSTRAINT "workflow_executions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_executions" ADD CONSTRAINT "workflow_executions_workflow_config_id_workflow_configs_id_fk" FOREIGN KEY ("workflow_config_id") REFERENCES "public"."workflow_configs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "workflow_configs_user_type_idx" ON "workflow_configs" USING btree ("user_id","workflow_type");--> statement-breakpoint
CREATE INDEX "workflow_executions_user_idx" ON "workflow_executions" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "workflow_executions_status_idx" ON "workflow_executions" USING btree ("status","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "workflow_executions_idempotency_idx" ON "workflow_executions" USING btree ("idempotency_key");
