"use server";

import { revalidatePath } from "next/cache";
import { eq, and, desc } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { getAuthenticatedUserId } from "@/lib/auth/session";
import { createIdeaSchema, updateIdeaSchema } from "@/lib/validators/ideas";

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function getIdeas(opts?: {
  status?: string;
  category?: string;
  search?: string;
}): Promise<ActionResult<schema.ContentIdea[]>> {
  try {
    const userId = await getAuthenticatedUserId();
    const db = getDb();

    const conditions = [eq(schema.contentIdeas.userId, userId)];

    if (opts?.status) {
      conditions.push(
        eq(
          schema.contentIdeas.status,
          opts.status as "new" | "developing" | "ready" | "used" | "archived"
        )
      );
    }
    if (opts?.category) {
      conditions.push(
        eq(
          schema.contentIdeas.category,
          opts.category as
            | "ai_ml"
            | "web_dev"
            | "engineering"
            | "building_in_public"
            | "experiments"
            | "career"
            | "other"
        )
      );
    }

    let rows = await db
      .select()
      .from(schema.contentIdeas)
      .where(and(...conditions))
      .orderBy(desc(schema.contentIdeas.createdAt));

    if (opts?.search) {
      const term = opts.search.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.title.toLowerCase().includes(term) ||
          r.body?.toLowerCase().includes(term)
      );
    }

    return { success: true, data: rows };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function createIdea(
  formData: FormData
): Promise<ActionResult<schema.ContentIdea>> {
  try {
    const userId = await getAuthenticatedUserId();
    const db = getDb();

    const raw = {
      title: formData.get("title") as string,
      body: (formData.get("body") as string) || undefined,
      category: (formData.get("category") as string) || "other",
      tags: formData.get("tags")
        ? (formData.get("tags") as string)
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : [],
    };

    const parsed = createIdeaSchema.safeParse(raw);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const [idea] = await db
      .insert(schema.contentIdeas)
      .values({ ...parsed.data, userId })
      .returning();

    revalidatePath("/ideas");
    return { success: true, data: idea };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function updateIdea(
  ideaId: string,
  formData: FormData
): Promise<ActionResult<schema.ContentIdea>> {
  try {
    const userId = await getAuthenticatedUserId();
    const db = getDb();

    const raw: Record<string, unknown> = {};
    const title = formData.get("title") as string | null;
    const body = formData.get("body") as string | null;
    const status = formData.get("status") as string | null;
    const category = formData.get("category") as string | null;
    const tags = formData.get("tags") as string | null;

    if (title !== null) raw.title = title;
    if (body !== null) raw.body = body || null;
    if (status !== null) raw.status = status;
    if (category !== null) raw.category = category;
    if (tags !== null)
      raw.tags = tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

    const parsed = updateIdeaSchema.safeParse(raw);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const [updated] = await db
      .update(schema.contentIdeas)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(
        and(
          eq(schema.contentIdeas.id, ideaId),
          eq(schema.contentIdeas.userId, userId)
        )
      )
      .returning();

    if (!updated) {
      return { success: false, error: "Idea not found" };
    }

    revalidatePath("/ideas");
    return { success: true, data: updated };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function deleteIdea(
  ideaId: string
): Promise<ActionResult> {
  try {
    const userId = await getAuthenticatedUserId();
    const db = getDb();

    const [deleted] = await db
      .delete(schema.contentIdeas)
      .where(
        and(
          eq(schema.contentIdeas.id, ideaId),
          eq(schema.contentIdeas.userId, userId)
        )
      )
      .returning();

    if (!deleted) {
      return { success: false, error: "Idea not found" };
    }

    revalidatePath("/ideas");
    return { success: true, data: undefined };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function convertIdeaToDraft(
  ideaId: string
): Promise<ActionResult<schema.Post>> {
  try {
    const userId = await getAuthenticatedUserId();
    const db = getDb();

    const [idea] = await db
      .select()
      .from(schema.contentIdeas)
      .where(
        and(
          eq(schema.contentIdeas.id, ideaId),
          eq(schema.contentIdeas.userId, userId)
        )
      )
      .limit(1);

    if (!idea) {
      return { success: false, error: "Idea not found" };
    }

    const content = idea.body
      ? `${idea.title}\n\n${idea.body}`
      : idea.title;

    const [post] = await db
      .insert(schema.posts)
      .values({
        userId,
        content: content.slice(0, 280),
        status: "draft",
        ideaId: idea.id,
      })
      .returning();

    await db
      .update(schema.contentIdeas)
      .set({ status: "used", updatedAt: new Date() })
      .where(eq(schema.contentIdeas.id, ideaId));

    revalidatePath("/ideas");
    revalidatePath("/queue");
    revalidatePath("/compose");
    return { success: true, data: post };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}
