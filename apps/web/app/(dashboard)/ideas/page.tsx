"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";

interface Idea {
  id: string;
  title: string;
  body: string;
  category: string;
  status: string;
  createdAt: string;
}

export default function IdeasPage() {
  const [ideas] = useState<Idea[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("other");

  function handleAdd() {
    if (!title.trim()) return;
    // Will persist to database once connected
    setTitle("");
    setBody("");
    setCategory("other");
    setShowForm(false);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ideas Inbox"
        description="Collect and organize content ideas"
        actions={
          <button
            onClick={() => setShowForm(!showForm)}
            className="rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500"
          >
            {showForm ? "Cancel" : "New Idea"}
          </button>
        }
      />

      {showForm && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5">
          <div className="space-y-3">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Idea title"
              className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Describe your idea (optional)"
              rows={3}
              className="w-full resize-none rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
            <div className="flex items-center gap-3">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none"
              >
                <option value="ai_ml">AI & ML</option>
                <option value="web_dev">Web Dev</option>
                <option value="engineering">Engineering</option>
                <option value="building_in_public">Building in Public</option>
                <option value="experiments">Experiments</option>
                <option value="career">Career</option>
                <option value="other">Other</option>
              </select>
              <button
                onClick={handleAdd}
                disabled={!title.trim()}
                className="rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50"
              >
                Save Idea
              </button>
            </div>
          </div>
        </div>
      )}

      {ideas.length === 0 ? (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5">
          <EmptyState
            message="No ideas yet. Start collecting content ideas to fuel your posts."
          />
        </div>
      ) : (
        <div className="space-y-2">
          {ideas.map((idea) => (
            <div
              key={idea.id}
              className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-medium text-white">
                    {idea.title}
                  </h3>
                  {idea.body && (
                    <p className="mt-1 text-xs text-zinc-400">{idea.body}</p>
                  )}
                </div>
                <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
                  {idea.category.replace("_", " ")}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
