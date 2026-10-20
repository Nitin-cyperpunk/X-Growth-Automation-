type PostStatus =
  | "draft"
  | "pending_approval"
  | "approved"
  | "scheduled"
  | "publishing"
  | "published"
  | "failed"
  | "cancelled";

const ALLOWED_TRANSITIONS: Record<PostStatus, PostStatus[]> = {
  draft: ["pending_approval", "scheduled", "cancelled"],
  pending_approval: ["approved", "draft", "cancelled"],
  approved: ["scheduled", "publishing", "cancelled"],
  scheduled: ["publishing", "cancelled", "draft"],
  publishing: ["published", "failed"],
  published: [],
  failed: ["draft", "scheduled", "cancelled"],
  cancelled: ["draft"],
};

export function canTransition(from: PostStatus, to: PostStatus): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

export function getValidTransitions(status: PostStatus): PostStatus[] {
  return ALLOWED_TRANSITIONS[status] ?? [];
}

export function validateTransition(from: PostStatus, to: PostStatus): void {
  if (!canTransition(from, to)) {
    throw new Error(
      `Invalid status transition: ${from} → ${to}. Allowed: ${getValidTransitions(from).join(", ") || "none"}`
    );
  }
}

export type { PostStatus };
