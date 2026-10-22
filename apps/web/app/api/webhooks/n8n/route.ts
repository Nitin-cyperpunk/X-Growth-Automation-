import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { workflowExecutions } from "@/lib/db/schema";
import { getN8nConfig, verifyHmacSignature } from "@/lib/n8n/client";
import { webhookCallbackSchema } from "@/lib/validators/workflows";
import { eq, and } from "drizzle-orm";

export async function POST(request: NextRequest) {
  const config = getN8nConfig();
  if (!config) {
    return NextResponse.json(
      { error: "Webhook endpoint not configured" },
      { status: 503 }
    );
  }

  const signature = request.headers.get("x-webhook-signature");
  const timestampStr = request.headers.get("x-webhook-timestamp");

  if (!signature || !timestampStr) {
    return NextResponse.json(
      { error: "Missing authentication headers" },
      { status: 401 }
    );
  }

  const timestamp = parseInt(timestampStr, 10);
  if (isNaN(timestamp)) {
    return NextResponse.json(
      { error: "Invalid timestamp" },
      { status: 401 }
    );
  }

  let body: string;
  try {
    body = await request.text();
  } catch {
    return NextResponse.json(
      { error: "Failed to read request body" },
      { status: 400 }
    );
  }

  const verification = verifyHmacSignature(
    body,
    signature,
    config.webhookSecret,
    timestamp
  );

  if (!verification.valid) {
    return NextResponse.json(
      { error: verification.error || "Signature verification failed" },
      { status: 401 }
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const validated = webhookCallbackSchema.safeParse(parsed);
  if (!validated.success) {
    return NextResponse.json(
      { error: `Validation failed: ${validated.error.issues[0].message}` },
      { status: 400 }
    );
  }

  const { executionId, status, result, errorMessage } = validated.data;

  try {
    const db = getDb();

    const existing = await db
      .select()
      .from(workflowExecutions)
      .where(eq(workflowExecutions.id, executionId))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: "Execution not found" },
        { status: 404 }
      );
    }

    const execution = existing[0];

    if (execution.status === "succeeded" || execution.status === "failed") {
      return NextResponse.json({ received: true, note: "Execution already in terminal state" });
    }

    const updates: Record<string, unknown> = {
      status,
      completedAt: new Date(),
    };

    if (result) {
      updates.result = result;
    }

    if (errorMessage) {
      updates.errorMessage = errorMessage.slice(0, 1000);
    }

    await db
      .update(workflowExecutions)
      .set(updates)
      .where(
        and(
          eq(workflowExecutions.id, executionId),
        )
      );

    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
