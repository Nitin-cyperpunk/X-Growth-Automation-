"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { createIdea, updateIdea, deleteIdea, convertIdeaToDraft } from "@/lib/actions/ideas";
import type { ContentIdea } from "@/lib/db/schema";

const CATEGORIES = [
  { value: "ai_ml", label: "AI & ML" },
  { value: "web_dev", label: "Web Dev" },
  { value: "engineering", label: "Engineering" },
  { value: "building_in_public", label: "Building in Public" },
  { value: "experiments", label: "Experiments" },
  { value: "career", label: "Career" },
  { value: "other", label: "Other" },
];

const STATUSES = [
  { value: "new", label: "New" },
  { value: "developing", label: "Developing" },
  { value: "ready", label: "Ready" },
  { value: "used", label: "Used" },
  { value: "archived", label: "Archived" },
];

interface IdeasClientProps {
  ideas: ContentIdea[];
  filters: { status?: string; category?: string; search?: string };
}

export function IdeasClient({ ideas, filters }: IdeasClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function updateFilters(key: string, value: string) {
    const params = new URLSearchParams();
    const current = { ...filters, [key]: value };
    Object.entries(current).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    router.push(`/ideas?${params.toString()}`);
  }

  async function handleCreate(formData: FormData) {
    setError(null);
    const result = await createIdea(formData);
    if (result.success) {
      setShowForm(false);
      startTransition(() => router.refresh());
    } else {
      setError(result.error);
    }
  }

  async function handleUpdate(ideaId: string, formData: FormData) {
    setError(null);
    const result = await updateIdea(ideaId, formData);
    if (result.success) {
      setEditingId(null);
      startTransition(() => router.refresh());
    } else {
      setError(result.error);
    }
  }

  async function handleDelete(ideaId: string) {
    setError(null);
    const result = await deleteIdea(ideaId);
    if (result.success) {
      startTransition(() => router.refresh());
    } else {
      setError(result.error);
    }
  }

  async function handleConvertToDraft(ideaId: string) {
    setError(null);
    const result = await convertIdeaToDraft(ideaId);
    if (result.success) {
      startTransition(() => router.refresh());
    } else {
      setError(result.error);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ideas Inbox"
        description="Collect and organize content ideas"
        actions={
          <button
            onClick={() => {
              setShowForm(!showForm);
              setEditingId(null);
            }}
            className="rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500"
          >
            {showForm ? "Cancel" : "New Idea"}
          </button>
        }
      />

      {error && (
        <div className="rounded-md border border-red-800 bg-red-900/30 px-4 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Search ideas..."
          defaultValue={filters.search ?? ""}
          onChange={(e) => {
            const val = e.target.value;
            if (val.length === 0 || val.length >= 2) {
              updateFilters("search", val);
            }
          }}
          className="w-48 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none"
        />
        <select
          value={filters.status ?? ""}
          onChange={(e) => updateFilters("status", e.target.value)}
          className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-white focus:border-violet-500 focus:outline-none"
        >
          <option value="">All Statuses</option>
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <select
          value={filters.category ?? ""}
          onChange={(e) => updateFilters("category", e.target.value)}
          className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-white focus:border-violet-500 focus:outline-none"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      {/* Create form */}
      {showForm && (
        <form
          action={handleCreate}
          className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5"
        >
          <div className="space-y-3">
            <input
              type="text"
              name="title"
              placeholder="Idea title"
              required
              className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
            <textarea
              name="body"
              placeholder="Describe your idea (optional)"
              rows={3}
              className="w-full resize-none rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
            <div className="flex items-center gap-3">
              <select
                name="category"
                defaultValue="other"
                className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
              <input
                type="text"
                name="tags"
                placeholder="Tags (comma-separated)"
                className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none"
              />
              <button
                type="submit"
                className="rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500"
              >
                Save Idea
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Ideas list */}
      {ideas.length === 0 ? (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5">
          <EmptyState message="No ideas yet. Start collecting content ideas to fuel your posts." />
        </div>
      ) : (
        <div className="space-y-2">
          {ideas.map((idea) =>
            editingId === idea.id ? (
              <EditIdeaForm
                key={idea.id}
                idea={idea}
                onSubmit={handleUpdate}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <IdeaCard
                key={idea.id}
                idea={idea}
                onEdit={() => setEditingId(idea.id)}
                onDelete={() => handleDelete(idea.id)}
                onConvertToDraft={() => handleConvertToDraft(idea.id)}
                isPending={isPending}
              />
            )
          )}
        </div>
      )}
    </div>
  );
}

function IdeaCard({
  idea,
  onEdit,
  onDelete,
  onConvertToDraft,
  isPending,
}: {
  idea: ContentIdea;
  onEdit: () => void;
  onDelete: () => void;
  onConvertToDraft: () => void;
  isPending: boolean;
}) {
  const statusColors: Record<string, string> = {
    new: "bg-blue-900/40 text-blue-300",
    developing: "bg-yellow-900/40 text-yellow-300",
    ready: "bg-green-900/40 text-green-300",
    used: "bg-zinc-800 text-zinc-400",
    archived: "bg-zinc-800 text-zinc-500",
  };

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-medium text-white">
              {idea.title}
            </h3>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${statusColors[idea.status] ?? "bg-zinc-800 text-zinc-400"}`}
            >
              {idea.status}
            </span>
          </div>
          {idea.body && (
            <p className="mt-1 line-clamp-2 text-xs text-zinc-400">
              {idea.body}
            </p>
          )}
          <div className="mt-2 flex items-center gap-2">
            <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs text-zinc-500">
              {idea.category.replace(/_/g, " ")}
            </span>
            {(idea.tags as string[])?.map((tag) => (
              <span
                key={tag}
                className="rounded bg-violet-900/30 px-1.5 py-0.5 text-xs text-violet-300"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {idea.status !== "used" && idea.status !== "archived" && (
            <button
              onClick={onConvertToDraft}
              disabled={isPending}
              title="Convert to draft post"
              className="rounded px-2 py-1 text-xs text-violet-400 hover:bg-violet-900/30 disabled:opacity-50"
            >
              Draft
            </button>
          )}
          <button
            onClick={onEdit}
            className="rounded px-2 py-1 text-xs text-zinc-400 hover:bg-zinc-800"
          >
            Edit
          </button>
          <button
            onClick={onDelete}
            disabled={isPending}
            className="rounded px-2 py-1 text-xs text-red-400 hover:bg-red-900/30 disabled:opacity-50"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function EditIdeaForm({
  idea,
  onSubmit,
  onCancel,
}: {
  idea: ContentIdea;
  onSubmit: (id: string, formData: FormData) => Promise<void>;
  onCancel: () => void;
}) {
  return (
    <form
      action={(formData) => onSubmit(idea.id, formData)}
      className="rounded-lg border border-violet-800 bg-zinc-900/50 p-4"
    >
      <div className="space-y-3">
        <input
          type="text"
          name="title"
          defaultValue={idea.title}
          required
          className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
        />
        <textarea
          name="body"
          defaultValue={idea.body ?? ""}
          rows={3}
          className="w-full resize-none rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
        />
        <div className="flex items-center gap-3">
          <select
            name="status"
            defaultValue={idea.status}
            className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none"
          >
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <select
            name="category"
            defaultValue={idea.category}
            className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          <input
            type="text"
            name="tags"
            defaultValue={(idea.tags as string[])?.join(", ") ?? ""}
            placeholder="Tags"
            className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500"
          >
            Save
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-700"
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
}
