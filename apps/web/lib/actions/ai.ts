"use server";

import { getAuthenticatedUserId } from "@/lib/auth/session";
import { isGeminiConfigured } from "@/lib/ai/gemini";
import { generatePosts, improveContent, getModelId } from "@/lib/ai/content-generator";
import {
  generatePostSchema,
  improveContentSchema,
  type GenerationResponse,
  type ImprovementResponse,
} from "@/lib/validators/ai";

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function checkAiAvailability(): Promise<
  ActionResult<{ configured: boolean }>
> {
  try {
    await getAuthenticatedUserId();
    return { success: true, data: { configured: isGeminiConfigured() } };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function generatePostAction(
  formData: FormData
): Promise<ActionResult<GenerationResponse>> {
  try {
    await getAuthenticatedUserId();

    if (!isGeminiConfigured()) {
      return {
        success: false,
        error:
          "Gemini API key is not configured. Add GEMINI_API_KEY to .env.local.",
      };
    }

    const raw = {
      topic: formData.get("topic") as string,
      pillar: formData.get("pillar") as string,
      format: formData.get("format") as string || "short",
      tone: formData.get("tone") as string || "conversational",
      instructions: (formData.get("instructions") as string) || undefined,
      audience: (formData.get("audience") as string) || undefined,
      charLimit: Number(formData.get("charLimit") || 280),
      variationCount: Number(formData.get("variationCount") || 1),
    };

    const parsed = generatePostSchema.safeParse(raw);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const result = await generatePosts(parsed.data);
    return { success: true, data: result };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function improveContentAction(
  formData: FormData
): Promise<ActionResult<ImprovementResponse>> {
  try {
    await getAuthenticatedUserId();

    if (!isGeminiConfigured()) {
      return {
        success: false,
        error:
          "Gemini API key is not configured. Add GEMINI_API_KEY to .env.local.",
      };
    }

    const raw = {
      content: formData.get("content") as string,
      improvementType: formData.get("improvementType") as string,
      pillar: (formData.get("pillar") as string) || undefined,
      instructions: (formData.get("instructions") as string) || undefined,
    };

    const parsed = improveContentSchema.safeParse(raw);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const result = await improveContent(parsed.data);
    return { success: true, data: result };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function getAiModelInfo(): Promise<
  ActionResult<{ model: string; configured: boolean }>
> {
  try {
    await getAuthenticatedUserId();
    return {
      success: true,
      data: { model: getModelId(), configured: isGeminiConfigured() },
    };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}
