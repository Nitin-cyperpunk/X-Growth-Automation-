import { describe, it, expect } from "vitest";
import {
  canTransition,
  getValidTransitions,
  validateTransition,
  type PostStatus,
} from "@/lib/services/post-transitions";

describe("post-transitions — exhaustive lifecycle coverage", () => {
  const ALL_STATUSES: PostStatus[] = [
    "draft",
    "pending_approval",
    "approved",
    "scheduled",
    "publishing",
    "published",
    "failed",
    "cancelled",
  ];

  it("every status has a defined transition map", () => {
    for (const status of ALL_STATUSES) {
      expect(getValidTransitions(status)).toBeDefined();
    }
  });

  it("published is a terminal state with no outgoing transitions", () => {
    for (const target of ALL_STATUSES) {
      expect(canTransition("published", target)).toBe(false);
    }
  });

  it("no status can transition to itself", () => {
    for (const status of ALL_STATUSES) {
      expect(canTransition(status, status)).toBe(false);
    }
  });

  it("draft cannot skip directly to published", () => {
    expect(canTransition("draft", "published")).toBe(false);
  });

  it("draft cannot skip directly to publishing", () => {
    expect(canTransition("draft", "publishing")).toBe(false);
  });

  it("cancelled can only return to draft", () => {
    const targets = getValidTransitions("cancelled");
    expect(targets).toEqual(["draft"]);
  });

  it("full happy path: draft → pending_approval → approved → publishing → published", () => {
    expect(canTransition("draft", "pending_approval")).toBe(true);
    expect(canTransition("pending_approval", "approved")).toBe(true);
    expect(canTransition("approved", "publishing")).toBe(true);
    expect(canTransition("publishing", "published")).toBe(true);
  });

  it("rejection path: pending_approval → draft (sent back for edits)", () => {
    expect(canTransition("pending_approval", "draft")).toBe(true);
  });

  it("retry path: failed → draft → pending_approval", () => {
    expect(canTransition("failed", "draft")).toBe(true);
    expect(canTransition("draft", "pending_approval")).toBe(true);
  });

  it("validateTransition error message contains current and target status", () => {
    try {
      validateTransition("draft", "published");
      expect.fail("should have thrown");
    } catch (e) {
      const msg = (e as Error).message;
      expect(msg).toContain("draft");
      expect(msg).toContain("published");
      expect(msg).toContain("Allowed:");
    }
  });
});
