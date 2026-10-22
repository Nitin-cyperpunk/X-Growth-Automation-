import { GoogleGenerativeAI } from "@google/generative-ai";

const MODEL_ID = "gemini-2.0-flash";
const MAX_RETRIES = 2;
const TIMEOUT_MS = 30_000;
const MAX_OUTPUT_TOKENS = 2048;

let _client: GoogleGenerativeAI | null = null;

export function getGeminiApiKey(): string | null {
  return process.env.GEMINI_API_KEY || null;
}

export function isGeminiConfigured(): boolean {
  return !!getGeminiApiKey();
}

function getClient(): GoogleGenerativeAI {
  const key = getGeminiApiKey();
  if (!key) {
    throw new Error(
      "GEMINI_API_KEY is not configured. Add it to .env.local to enable AI features."
    );
  }
  if (!_client) {
    _client = new GoogleGenerativeAI(key);
  }
  return _client;
}

export async function generateContent(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const client = getClient();
  const model = client.getGenerativeModel({
    model: MODEL_ID,
    generationConfig: {
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      temperature: 0.8,
      responseMimeType: "application/json",
    },
  });

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(
        () => controller.abort(),
        TIMEOUT_MS
      );

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        systemInstruction: { role: "model", parts: [{ text: systemPrompt }] },
      });

      clearTimeout(timeout);

      const text = result.response.text();
      if (!text || text.trim().length === 0) {
        throw new Error("Empty response from Gemini");
      }

      return text;
    } catch (e) {
      lastError = e as Error;
      const msg = lastError.message || "";

      if (msg.includes("RESOURCE_EXHAUSTED") || msg.includes("429")) {
        if (attempt < MAX_RETRIES) {
          await new Promise((r) =>
            setTimeout(r, 1000 * Math.pow(2, attempt))
          );
          continue;
        }
        throw new Error(
          "AI generation rate limit reached. Please try again in a few moments."
        );
      }

      if (msg.includes("API_KEY_INVALID") || msg.includes("403")) {
        throw new Error(
          "Gemini API key is invalid. Check your GEMINI_API_KEY in .env.local."
        );
      }

      if (msg.includes("abort") || msg.includes("timeout")) {
        throw new Error("AI generation timed out. Please try again.");
      }

      throw new Error(`AI generation failed: ${msg.slice(0, 200)}`);
    }
  }

  throw lastError || new Error("AI generation failed after retries");
}

export function getModelId(): string {
  return MODEL_ID;
}
