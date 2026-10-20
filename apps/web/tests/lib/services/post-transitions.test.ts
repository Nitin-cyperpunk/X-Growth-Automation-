import { describe, it, expect } from "vitest";
import {
  canTransition,
  getValidTransitions,
  validateTransition,
} from "@/lib/services/post-transitions";

describe("post-transitions", () => {
  describe("canTransition", () => {
    it("allows draft → pending_approval", () => {
      expect(canTransition("draft", "pending_approval")).toBe(true);
    });

    it("allows draft → scheduled", () => {
      expect(canTransition("draft", "scheduled")).toBe(true);
    });

    it("allows draft → cancelled", () => {
      expect(canTransition("draft", "cancelled")).toBe(true);
    });

    it("blocks draft → published", () => {
      expect(canTransition("draft", "published")).toBe(false);
    });

    it("allows pending_approval → approved", () => {
      expect(canTransition("pending_approval", "approved")).toBe(true);
    });

    it("allows pending_approval → draft (rejection)", () => {
      expect(canTransition("pending_approval", "draft")).toBe(true);
    });

    it("allows approved → scheduled", () => {
      expect(canTransition("approved", "scheduled")).toBe(true);
    });

    it("allows approved → publishing", () => {
      expect(canTransition("approved", "publishing")).toBe(true);
    });

    it("allows publishing → published", () => {
      expect(canTransition("publishing", "published")).toBe(true);
    });

    it("allows publishing → failed", () => {
      expect(canTransition("publishing", "failed")).toBe(true);
    });

    it("blocks published → anything", () => {
      expect(canTransition("published", "draft")).toBe(false);
      expect(canTransition("published", "cancelled")).toBe(false);
    });

    it("allows failed → draft (retry)", () => {
      expect(canTransition("failed", "draft")).toBe(true);
    });

    it("allows failed → scheduled", () => {
      expect(canTransition("failed", "scheduled")).toBe(true);
    });

    it("allows cancelled → draft", () => {
      expect(canTransition("cancelled", "draft")).toBe(true);
    });

    it("blocks cancelled → published", () => {
      expect(canTransition("cancelled", "published")).toBe(false);
    });
  });

  describe("getValidTransitions", () => {
    it("returns allowed targets for draft", () => {
      expect(getValidTransitions("draft")).toEqual([
        "pending_approval",
        "scheduled",
        "cancelled",
      ]);
    });

    it("returns empty array for published", () => {
      expect(getValidTransitions("published")).toEqual([]);
    });

    it("returns targets for failed", () => {
      expect(getValidTransitions("failed")).toEqual([
        "draft",
        "scheduled",
        "cancelled",
      ]);
    });
  });

  describe("validateTransition", () => {
    it("does not throw for valid transition", () => {
      expect(() => validateTransition("draft", "pending_approval")).not.toThrow();
    });

    it("throws for invalid transition", () => {
      expect(() => validateTransition("draft", "published")).toThrow(
        /Invalid status transition: draft → published/
      );
    });

    it("includes allowed transitions in error message", () => {
      expect(() => validateTransition("published", "draft")).toThrow(
        /Allowed: none/
      );
    });
  });
});
