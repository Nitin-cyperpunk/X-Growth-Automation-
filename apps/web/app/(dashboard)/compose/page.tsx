"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { X_MAX_CHARS } from "@/lib/validators/posts";

export default function ComposePage() {
  const [content, setContent] = useState("");
  const charCount = content.length;
  const isOverLimit = charCount > X_MAX_CHARS;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Compose"
        description="Write and publish a new post"
      />

      <div className="mx-auto max-w-2xl">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?"
            rows={6}
            className="w-full resize-none rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
          />

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
              disabled={!content.trim() || isOverLimit}
              className="rounded-md bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Save Draft
            </button>
            <button
              disabled
              title="Connect your X account to publish"
              className="rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Publish Now
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
