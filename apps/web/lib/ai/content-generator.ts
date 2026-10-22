import { generateContent, getModelId } from "./gemini";
import {
  generationResponseSchema,
  improvementResponseSchema,
  type GeneratePostInput,
  type ImproveContentInput,
  type GenerationResponse,
  type ImprovementResponse,
} from "@/lib/validators/ai";

const PILLAR_LABELS: Record<string, string> = {
  ai_ml: "AI & Machine Learning",
  web_dev: "Web Development",
  engineering: "Engineering Lessons",
  building_in_public: "Building in Public",
  experiments: "Technical Experiments",
  career: "Career & Learning",
};

const FORMAT_INSTRUCTIONS: Record<string, string> = {
  short: "A punchy single post under the character limit. One strong idea.",
  story: "Setup → tension → resolution → lesson. Keep it real and personal.",
  technical: "Problem → approach → result → what you'd do differently.",
  thread_opener: "A compelling opening post that makes people want to read more.",
  listicle: "A numbered or bulleted list of concise, useful points.",
  question: "Lead with an engaging question that invites discussion.",
};

function buildSystemPrompt(): string {
  return `You are an AI writing assistant for a developer who shares authentic technical content on X (Twitter).

IDENTITY:
- Role: Developer and builder sharing authentic technical experiences
- Audience: Software engineers, indie hackers, AI practitioners, tech professionals
- Voice: Authentic, concise, technically accurate but accessible, opinionated but honest, conversational

RULES:
- Every sentence must earn its place. Cut filler words.
- Hooks must be truthful — no clickbait, no misleading claims.
- Lead with insight, surprising results, or real problems.
- Never fabricate statistics, quotes, case studies, or sources.
- Never use engagement bait ("You won't believe..."), fake controversy, or spam.
- Prefer practical, specific, valuable content over generic motivational posts.
- Each variation must take a meaningfully different angle — not just rephrased copies.

SCORING (1-10 scale):
- relevance: Fits content pillars and target audience
- originality: Fresh angle, not rehashed common advice
- clarity: Easy to understand on first read
- engagement_potential: Invites responses, saves, or shares naturally
- authenticity: Sounds like a real person, not a template
- actionability: Reader gains something useful

QUALITY GATES:
- Minimum average score: 6.0
- Any single criterion below 4.0 means the post should be regenerated

You MUST respond with valid JSON matching the requested schema. No markdown, no explanation outside the JSON.`;
}

function buildGeneratePrompt(input: GeneratePostInput): string {
  const pillarLabel = PILLAR_LABELS[input.pillar] ?? input.pillar;
  const formatGuide = FORMAT_INSTRUCTIONS[input.format] ?? "";

  return `Generate ${input.variationCount} post variation(s) for X (Twitter).

TOPIC: ${input.topic}
CONTENT PILLAR: ${pillarLabel}
FORMAT: ${input.format} — ${formatGuide}
TONE: ${input.tone}
CHARACTER LIMIT: ${input.charLimit} characters per post
${input.audience ? `TARGET AUDIENCE: ${input.audience}` : ""}
${input.instructions ? `ADDITIONAL INSTRUCTIONS: ${input.instructions}` : ""}

Each variation must have a meaningfully different hook, structure, or angle.

Respond with this exact JSON structure:
{
  "posts": [
    {
      "content": "the post text (must be under ${input.charLimit} characters)",
      "hook_type": "type of hook used (e.g., question, statistic, counterintuitive, story)",
      "content_pillar": "${pillarLabel}",
      "scores": {
        "relevance": <1-10>,
        "originality": <1-10>,
        "clarity": <1-10>,
        "engagement_potential": <1-10>,
        "authenticity": <1-10>,
        "actionability": <1-10>
      },
      "average_score": <average of all scores, 1 decimal>,
      "variation_angle": "brief description of this variation's unique angle"
    }
  ]
}`;
}

function buildImprovePrompt(input: ImproveContentInput): string {
  const typeInstructions: Record<string, string> = {
    improve_hook: "Rewrite the opening to be more compelling. Lead with insight, a specific result, or a relatable problem.",
    make_clearer: "Simplify the writing. Remove jargon, shorten sentences, improve flow.",
    make_specific: "Replace vague statements with specific examples, numbers, or concrete details.",
    make_natural: "Make it sound more conversational and human. Remove robotic phrasing.",
    thread_outline: "Convert this into a thread outline: an opening hook post, 2-4 supporting posts, and a conclusion. Each under 280 characters.",
    adapt_pillar: `Adapt this content to fit the ${input.pillar ? PILLAR_LABELS[input.pillar] ?? input.pillar : "selected"} content pillar while preserving the core message.`,
  };

  return `Improve this X (Twitter) post.

ORIGINAL CONTENT:
${input.content}

IMPROVEMENT TYPE: ${input.improvementType}
INSTRUCTIONS: ${typeInstructions[input.improvementType] ?? "Improve the content."}
${input.instructions ? `ADDITIONAL INSTRUCTIONS: ${input.instructions}` : ""}

CHARACTER LIMIT: 280 characters for the improved version.

Respond with this exact JSON structure:
{
  "improved_content": "the improved post text (under 280 characters)",
  "changes_made": "brief description of what was changed and why",
  "scores": {
    "relevance": <1-10>,
    "originality": <1-10>,
    "clarity": <1-10>,
    "engagement_potential": <1-10>,
    "authenticity": <1-10>,
    "actionability": <1-10>
  },
  "average_score": <average of all scores, 1 decimal>
}`;
}

export async function generatePosts(
  input: GeneratePostInput
): Promise<GenerationResponse> {
  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildGeneratePrompt(input);

  const raw = await generateContent(systemPrompt, userPrompt);

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("AI returned invalid JSON. Please try again.");
  }

  const validated = generationResponseSchema.safeParse(parsed);
  if (!validated.success) {
    throw new Error(
      `AI response failed validation: ${validated.error.issues[0].message}`
    );
  }

  for (const post of validated.data.posts) {
    if (post.content.length > input.charLimit) {
      post.content = post.content.slice(0, input.charLimit);
    }
  }

  return validated.data;
}

export async function improveContent(
  input: ImproveContentInput
): Promise<ImprovementResponse> {
  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildImprovePrompt(input);

  const raw = await generateContent(systemPrompt, userPrompt);

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("AI returned invalid JSON. Please try again.");
  }

  const validated = improvementResponseSchema.safeParse(parsed);
  if (!validated.success) {
    throw new Error(
      `AI response failed validation: ${validated.error.issues[0].message}`
    );
  }

  if (validated.data.improved_content.length > 280) {
    validated.data.improved_content = validated.data.improved_content.slice(0, 280);
  }

  return validated.data;
}

export { getModelId };
