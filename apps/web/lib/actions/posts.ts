"use server";

import { revalidatePath } from "next/cache";
import { eq, and, desc } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { getAuthenticatedUserId } from "@/lib/auth/session";
import { createPostSchema, updatePostSchema } from "@/lib/validators/posts";
import { validateTransition, type PostStatus } from "@/lib/services/post-transitions";

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function getPostsByStatus(
  status: PostStatus | PostStatus[]
): Promise<ActionResult<schema.Post[]>> {
  try {
    const userId = await getAuthenticatedUserId();
    const db = getDb();

    const statuses = Array.isArray(status) ? status : [status];
    const allPosts = await db
      .select()
      .from(schema.posts)
      .where(eq(schema.posts.userId, userId))
      .orderBy(desc(schema.posts.createdAt));

    const filtered = allPosts.filter((p) =>
      statuses.includes(p.status as PostStatus)
    );

    return { success: true, data: filtered };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function createPost(
  formData: FormData
): Promise<ActionResult<schema.Post>> {
  try {
    const userId = await getAuthenticatedUserId();
    const db = getDb();

    const raw = {
      content: formData.get("content") as string,
      scheduledFor: (formData.get("scheduledFor") as string) || undefined,
    };

    const parsed = createPostSchema.safeParse(raw);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const status = parsed.data.scheduledFor ? "scheduled" : "draft";

    const [post] = await db
      .insert(schema.posts)
      .values({
        userId,
        content: parsed.data.content,
        status,
        scheduledFor: parsed.data.scheduledFor
          ? new Date(parsed.data.scheduledFor)
          : null,
      })
      .returning();

    revalidatePath("/queue");
    revalidatePath("/compose");
    return { success: true, data: post };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function updatePost(
  postId: string,
  formData: FormData
): Promise<ActionResult<schema.Post>> {
  try {
    const userId = await getAuthenticatedUserId();
    const db = getDb();

    const [existing] = await db
      .select()
      .from(schema.posts)
      .where(
        and(eq(schema.posts.id, postId), eq(schema.posts.userId, userId))
      )
      .limit(1);

    if (!existing) {
      return { success: false, error: "Post not found" };
    }

    const raw: Record<string, unknown> = {};
    const content = formData.get("content") as string | null;
    const status = formData.get("status") as string | null;
    const scheduledFor = formData.get("scheduledFor") as string | null;

    if (content !== null) raw.content = content;
    if (status !== null) raw.status = status;
    if (scheduledFor !== null)
      raw.scheduledFor = scheduledFor || null;

    const parsed = updatePostSchema.safeParse(raw);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    if (parsed.data.status) {
      validateTransition(
        existing.status as PostStatus,
        parsed.data.status as PostStatus
      );
    }

    const updateData: Record<string, unknown> = {
      ...parsed.data,
      updatedAt: new Date(),
    };
    if (parsed.data.scheduledFor) {
      updateData.scheduledFor = new Date(parsed.data.scheduledFor);
    } else if (parsed.data.scheduledFor === null) {
      updateData.scheduledFor = null;
    }

    const [updated] = await db
      .update(schema.posts)
      .set(updateData)
      .where(
        and(eq(schema.posts.id, postId), eq(schema.posts.userId, userId))
      )
      .returning();

    revalidatePath("/queue");
    revalidatePath("/published");
    revalidatePath("/compose");
    return { success: true, data: updated };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function deletePost(
  postId: string
): Promise<ActionResult> {
  try {
    const userId = await getAuthenticatedUserId();
    const db = getDb();

    const [existing] = await db
      .select()
      .from(schema.posts)
      .where(
        and(eq(schema.posts.id, postId), eq(schema.posts.userId, userId))
      )
      .limit(1);

    if (!existing) {
      return { success: false, error: "Post not found" };
    }

    if (existing.status === "published" || existing.status === "publishing") {
      return {
        success: false,
        error: "Cannot delete a published or publishing post",
      };
    }

    await db
      .delete(schema.posts)
      .where(
        and(eq(schema.posts.id, postId), eq(schema.posts.userId, userId))
      );

    revalidatePath("/queue");
    return { success: true, data: undefined };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function updatePostStatus(
  postId: string,
  newStatus: PostStatus
): Promise<ActionResult<schema.Post>> {
  try {
    const userId = await getAuthenticatedUserId();
    const db = getDb();

    const [existing] = await db
      .select()
      .from(schema.posts)
      .where(
        and(eq(schema.posts.id, postId), eq(schema.posts.userId, userId))
      )
      .limit(1);

    if (!existing) {
      return { success: false, error: "Post not found" };
    }

    validateTransition(existing.status as PostStatus, newStatus);

    const updateData: Record<string, unknown> = {
      status: newStatus,
      updatedAt: new Date(),
    };

    if (newStatus === "published") {
      updateData.publishedAt = new Date();
    }

    const [updated] = await db
      .update(schema.posts)
      .set(updateData)
      .where(
        and(eq(schema.posts.id, postId), eq(schema.posts.userId, userId))
      )
      .returning();

    revalidatePath("/queue");
    revalidatePath("/published");
    return { success: true, data: updated };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function getPost(
  postId: string
): Promise<ActionResult<schema.Post>> {
  try {
    const userId = await getAuthenticatedUserId();
    const db = getDb();

    const [post] = await db
      .select()
      .from(schema.posts)
      .where(
        and(eq(schema.posts.id, postId), eq(schema.posts.userId, userId))
      )
      .limit(1);

    if (!post) {
      return { success: false, error: "Post not found" };
    }

    return { success: true, data: post };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}
