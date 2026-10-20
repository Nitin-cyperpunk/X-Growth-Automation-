"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";

const CONTENT_STYLES = [
  { value: "informative", label: "Informative", description: "Clear, factual, educational" },
  { value: "conversational", label: "Conversational", description: "Casual, relatable, engaging" },
  { value: "provocative", label: "Provocative", description: "Bold, opinion-driven, debate-sparking" },
  { value: "storytelling", label: "Storytelling", description: "Narrative, personal, experiential" },
] as const;

const VARIATION_ANGLES = [
  "Hook-first",
  "Question-led",
  "Data-backed",
  "Hot take",
  "Thread opener",
  "Listicle",
] as const;

export default function AiWriterPage() {
  const [prompt, setPrompt] = useState("");
  const [style] = useState<string>("informative");
  const [selectedAngles, setSelectedAngles] = useState<string[]>([]);
  const hasGeminiKey = false;

  function toggleAngle(angle: string) {
    setSelectedAngles((prev) =>
      prev.includes(angle)
        ? prev.filter((a) => a !== angle)
        : prev.length < 3
          ? [...prev, angle]
          : prev
    );
  }

  if (!hasGeminiKey) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="AI Writer"
          description="Generate post variations with Gemini AI"
        />

        <div className="mx-auto max-w-2xl space-y-6">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5">
            <EmptyState message="AI Writer requires a configured Gemini API key. Add GEMINI_API_KEY to your environment to enable AI content generation." />
          </div>

          {/* Show the UI structure even without the key for preview */}
          <div className="rounded-lg border border-dashed border-zinc-700 bg-zinc-900/30 p-5 opacity-60">
            <p className="mb-4 text-xs font-medium uppercase tracking-wider text-zinc-500">
              Preview — Available when Gemini is configured
            </p>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm text-zinc-400">
                  Topic or prompt
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe what you want to write about..."
                  rows={3}
                  disabled
                  className="w-full resize-none rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder-zinc-500 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-zinc-400">
                  Content style
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {CONTENT_STYLES.map((s) => (
                    <button
                      key={s.value}
                      disabled
                      className={`rounded-md border px-3 py-2 text-left text-sm ${
                        style === s.value
                          ? "border-violet-600 bg-violet-900/30 text-white"
                          : "border-zinc-700 bg-zinc-900 text-zinc-400"
                      }`}
                    >
                      <span className="font-medium">{s.label}</span>
                      <span className="mt-0.5 block text-xs text-zinc-500">
                        {s.description}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm text-zinc-400">
                  Variation angles (pick up to 3)
                </label>
                <div className="flex flex-wrap gap-2">
                  {VARIATION_ANGLES.map((angle) => (
                    <button
                      key={angle}
                      disabled
                      onClick={() => toggleAngle(angle)}
                      className={`rounded-full border px-3 py-1 text-xs ${
                        selectedAngles.includes(angle)
                          ? "border-violet-600 bg-violet-900/30 text-violet-300"
                          : "border-zinc-700 text-zinc-500"
                      }`}
                    >
                      {angle}
                    </button>
                  ))}
                </div>
              </div>

              <button
                disabled
                className="w-full rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white opacity-50"
              >
                Generate Variations
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
