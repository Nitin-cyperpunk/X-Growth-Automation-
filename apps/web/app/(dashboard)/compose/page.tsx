"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { X_MAX_CHARS } from "@/lib/validators/posts";
import { createPost } from "@/lib/actions/posts";

export default function ComposePage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const charCount = content.length;
  const isOverLimit = charCount > X_MAX_CHARS;

  async function handleSaveDraft() {
    setError(null);
    setSuccess(null);
    const formData = new FormData();
    formData.set("content", content);

    const result = await createPost(formData);
    if (result.success) {
      setContent("");
      setSuccess("Draft saved successfully");
      startTransition(() => router.refresh());
    } else {
      setError(result.error);
    }
  }

  async function handleSubmitForApproval() {
    setError(null);
    setSuccess(null);
    const formData = new FormData();
    formData.set("content", content);

    const result = await createPost(formData);
    if (result.success) {
      const { updatePostStatus } = await import("@/lib/actions/posts");
      const statusResult = await updatePostStatus(
        result.data.id,
        "pending_approval"
      );
      if (statusResult.success) {
        setContent("");
        setSuccess("Post submitted for approval");
        startTransition(() => router.refresh());
      } else {
        setError(statusResult.error);
      }
    } else {
      setError(result.error);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Compose"
        description="Write and publish a new post"
      />

      <div className="mx-auto max-w-2xl">
        {error && (
          <div className="mb-4 rounded-md border border-red-800 bg-red-900/30 px-4 py-2 text-sm text-red-300">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 rounded-md border border-green-800 bg-green-900/30 px-4 py-2 text-sm text-green-300">
            {success}
          </div>
        )}

        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?"
            rows={6}
            className="w-full resize-none rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
          />

          {/* Preview */}
          {content.trim() && (
            <div className="mt-3 rounded-md border border-zinc-700 bg-zinc-950 p-3">
              <p className="text-xs font-medium text-zinc-500">Preview</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-200">
                {content}
              </p>
            </div>
          )}

          <div className="mt-2 flex items-center justify-between">
            <span
              className={`text-xs ${
                isOverLimit ? "text-red-400" : "text-zinc-500"
              }`}
            >
              {charCount}/{X_MAX_CHARS}
            </span>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={handleSaveDraft}
              disabled={!content.trim() || isOverLimit || isPending}
              className="rounded-md bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending ? "Saving..." : "Save Draft"}
            </button>
            <button
              onClick={handleSubmitForApproval}
              disabled={!content.trim() || isOverLimit || isPending}
              className="rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Submit for Approval
            </button>
            <button
              disabled
              title="Scheduling will be available once the automation workflow is connected"
              className="rounded-md border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Schedule
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
