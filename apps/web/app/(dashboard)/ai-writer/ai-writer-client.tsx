"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { generatePostAction, improveContentAction } from "@/lib/actions/ai";
import { createPost } from "@/lib/actions/posts";
import { X_MAX_CHARS } from "@/lib/validators/posts";
import type { GeneratedPost, ImprovementResponse } from "@/lib/validators/ai";

const PILLARS = [
  { value: "ai_ml", label: "AI & ML" },
  { value: "web_dev", label: "Web Dev" },
  { value: "engineering", label: "Engineering" },
  { value: "building_in_public", label: "Building in Public" },
  { value: "experiments", label: "Experiments" },
  { value: "career", label: "Career" },
];

const FORMATS = [
  { value: "short", label: "Short post" },
  { value: "story", label: "Story" },
  { value: "technical", label: "Technical" },
  { value: "thread_opener", label: "Thread opener" },
  { value: "listicle", label: "Listicle" },
  { value: "question", label: "Question" },
];

const TONES = [
  { value: "informative", label: "Informative" },
  { value: "conversational", label: "Conversational" },
  { value: "provocative", label: "Provocative" },
  { value: "storytelling", label: "Storytelling" },
];

const IMPROVEMENTS = [
  { value: "improve_hook", label: "Improve hook" },
  { value: "make_clearer", label: "Make clearer" },
  { value: "make_specific", label: "More specific" },
  { value: "make_natural", label: "More natural" },
  { value: "thread_outline", label: "Thread outline" },
  { value: "adapt_pillar", label: "Adapt to pillar" },
];

interface AiWriterClientProps {
  configured: boolean;
}

export function AiWriterClient({ configured }: AiWriterClientProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [topic, setTopic] = useState("");
  const [pillar, setPillar] = useState("web_dev");
  const [format, setFormat] = useState("short");
  const [tone, setTone] = useState("conversational");
  const [instructions, setInstructions] = useState("");
  const [variationCount, setVariationCount] = useState(3);
  const [results, setResults] = useState<GeneratedPost[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  // Improve mode
  const [improveContent, setImproveContent] = useState("");
  const [improveType, setImproveType] = useState("improve_hook");
  const [improveResult, setImproveResult] = useState<ImprovementResponse | null>(null);
  const [activeTab, setActiveTab] = useState<"generate" | "improve">("generate");

  async function handleGenerate() {
    if (!topic.trim() || isGenerating) return;
    setError(null);
    setResults([]);
    setSavedMessage(null);
    setIsGenerating(true);

    const formData = new FormData();
    formData.set("topic", topic);
    formData.set("pillar", pillar);
    formData.set("format", format);
    formData.set("tone", tone);
    formData.set("variationCount", String(variationCount));
    if (instructions.trim()) formData.set("instructions", instructions);

    const result = await generatePostAction(formData);
    setIsGenerating(false);

    if (result.success) {
      setResults(result.data.posts);
    } else {
      setError(result.error);
    }
  }

  async function handleImprove() {
    if (!improveContent.trim() || isGenerating) return;
    setError(null);
    setImproveResult(null);
    setSavedMessage(null);
    setIsGenerating(true);

    const formData = new FormData();
    formData.set("content", improveContent);
    formData.set("improvementType", improveType);
    formData.set("pillar", pillar);

    const result = await improveContentAction(formData);
    setIsGenerating(false);

    if (result.success) {
      setImproveResult(result.data);
    } else {
      setError(result.error);
    }
  }

  async function handleSaveAsDraft(content: string) {
    setSavedMessage(null);
    setError(null);
    const formData = new FormData();
    formData.set("content", content);
    const result = await createPost(formData);
    if (result.success) {
      setSavedMessage("Saved as draft!");
      startTransition(() => router.refresh());
    } else {
      setError(result.error);
    }
  }

  if (!configured) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="AI Writer"
          description="Generate post variations with Gemini AI"
        />
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5">
          <EmptyState message="AI Writer requires a configured Gemini API key. Add GEMINI_API_KEY to your .env.local file to enable AI content generation." />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Writer"
        description="Generate post variations with Gemini AI"
      />

      {error && (
        <div className="rounded-md border border-red-800 bg-red-900/30 px-4 py-2 text-sm text-red-300">
          {error}
        </div>
      )}
      {savedMessage && (
        <div className="rounded-md border border-green-800 bg-green-900/30 px-4 py-2 text-sm text-green-300">
          {savedMessage}
        </div>
      )}

      <div className="mx-auto max-w-3xl">
        {/* Tabs */}
        <div className="mb-6 flex gap-2 border-b border-zinc-800 pb-2">
          <button
            onClick={() => setActiveTab("generate")}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              activeTab === "generate"
                ? "bg-violet-600 text-white"
                : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
            }`}
          >
            Generate
          </button>
          <button
            onClick={() => setActiveTab("improve")}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              activeTab === "improve"
                ? "bg-violet-600 text-white"
                : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
            }`}
          >
            Improve
          </button>
        </div>

        {activeTab === "generate" ? (
          <div className="space-y-4">
            {/* Topic */}
            <div>
              <label className="mb-1 block text-sm text-zinc-400">
                Topic or idea
              </label>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Describe what you want to write about..."
                rows={3}
                maxLength={1000}
                className="w-full resize-none rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
            </div>

            {/* Pillar + Format + Tone */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="mb-1 block text-sm text-zinc-400">Pillar</label>
                <select
                  value={pillar}
                  onChange={(e) => setPillar(e.target.value)}
                  className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none"
                >
                  {PILLARS.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm text-zinc-400">Format</label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none"
                >
                  {FORMATS.map((f) => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm text-zinc-400">Tone</label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none"
                >
                  {TONES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Variations + Instructions */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm text-zinc-400">
                  Variations ({variationCount})
                </label>
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={variationCount}
                  onChange={(e) => setVariationCount(Number(e.target.value))}
                  className="w-full accent-violet-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-zinc-400">
                  Extra instructions (optional)
                </label>
                <input
                  type="text"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="e.g. Focus on React patterns"
                  maxLength={500}
                  className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={!topic.trim() || isGenerating}
              className="w-full rounded-md bg-violet-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isGenerating ? "Generating..." : `Generate ${variationCount} variation${variationCount > 1 ? "s" : ""}`}
            </button>

            {/* Results */}
            {results.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-zinc-300">
                  Generated variations
                </h3>
                {results.map((post, i) => (
                  <PostCard
                    key={i}
                    post={post}
                    onSaveAsDraft={() => handleSaveAsDraft(post.content)}
                    onUseInImprove={() => {
                      setImproveContent(post.content);
                      setActiveTab("improve");
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Content to improve */}
            <div>
              <label className="mb-1 block text-sm text-zinc-400">
                Content to improve
              </label>
              <textarea
                value={improveContent}
                onChange={(e) => setImproveContent(e.target.value)}
                placeholder="Paste or write the content you want to improve..."
                rows={4}
                maxLength={2000}
                className="w-full resize-none rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
              <div className="mt-1 text-right text-xs text-zinc-500">
                {improveContent.length}/2000
              </div>
            </div>

            {/* Improvement type */}
            <div className="flex flex-wrap gap-2">
              {IMPROVEMENTS.map((imp) => (
                <button
                  key={imp.value}
                  onClick={() => setImproveType(imp.value)}
                  className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                    improveType === imp.value
                      ? "border-violet-600 bg-violet-900/30 text-violet-300"
                      : "border-zinc-700 text-zinc-500 hover:border-zinc-600 hover:text-zinc-400"
                  }`}
                >
                  {imp.label}
                </button>
              ))}
            </div>

            <button
              onClick={handleImprove}
              disabled={!improveContent.trim() || isGenerating}
              className="w-full rounded-md bg-violet-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isGenerating ? "Improving..." : "Improve content"}
            </button>

            {/* Improvement result */}
            {improveResult && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-zinc-300">
                  Improved version
                </h3>
                <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
                  <p className="whitespace-pre-wrap text-sm text-zinc-200">
                    {improveResult.improved_content}
                  </p>
                  <div className="mt-2 flex items-center justify-between text-xs text-zinc-500">
                    <span>{improveResult.improved_content.length}/{X_MAX_CHARS} chars</span>
                    <span>Score: {improveResult.average_score.toFixed(1)}/10</span>
                  </div>
                  <p className="mt-2 text-xs text-zinc-500">
                    {improveResult.changes_made}
                  </p>
                  <ScoreBar scores={improveResult.scores} />
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => handleSaveAsDraft(improveResult.improved_content)}
                      className="rounded-md bg-zinc-800 px-3 py-1.5 text-xs text-zinc-200 hover:bg-zinc-700"
                    >
                      Save as draft
                    </button>
                    <button
                      onClick={() => {
                        setImproveContent(improveResult.improved_content);
                        setImproveResult(null);
                      }}
                      className="rounded-md border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 hover:bg-zinc-800"
                    >
                      Iterate further
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function PostCard({
  post,
  onSaveAsDraft,
  onUseInImprove,
}: {
  post: GeneratedPost;
  onSaveAsDraft: () => void;
  onUseInImprove: () => void;
}) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
      <p className="whitespace-pre-wrap text-sm text-zinc-200">{post.content}</p>
      <div className="mt-2 flex items-center justify-between text-xs text-zinc-500">
        <div className="flex items-center gap-2">
          <span>{post.content.length}/{X_MAX_CHARS} chars</span>
          <span className="rounded bg-zinc-800 px-1.5 py-0.5">{post.hook_type}</span>
          <span className="rounded bg-zinc-800 px-1.5 py-0.5">{post.variation_angle}</span>
        </div>
        <span>Score: {post.average_score.toFixed(1)}/10</span>
      </div>
      <ScoreBar scores={post.scores} />
      <div className="mt-3 flex gap-2">
        <button
          onClick={onSaveAsDraft}
          className="rounded-md bg-zinc-800 px-3 py-1.5 text-xs text-zinc-200 hover:bg-zinc-700"
        >
          Save as draft
        </button>
        <button
          onClick={onUseInImprove}
          className="rounded-md border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 hover:bg-zinc-800"
        >
          Improve
        </button>
      </div>
    </div>
  );
}

function ScoreBar({ scores }: { scores: Record<string, number> }) {
  const labels: Record<string, string> = {
    relevance: "Rel",
    originality: "Orig",
    clarity: "Clar",
    engagement_potential: "Eng",
    authenticity: "Auth",
    actionability: "Act",
  };

  return (
    <div className="mt-2 flex gap-1">
      {Object.entries(scores).map(([key, value]) => (
        <div key={key} className="flex flex-col items-center">
          <div
            className={`h-1.5 w-8 rounded-full ${
              value >= 7
                ? "bg-green-500"
                : value >= 5
                  ? "bg-yellow-500"
                  : "bg-red-500"
            }`}
            style={{ opacity: value / 10 }}
          />
          <span className="mt-0.5 text-[10px] text-zinc-600">
            {labels[key] ?? key}
          </span>
        </div>
      ))}
    </div>
  );
}
