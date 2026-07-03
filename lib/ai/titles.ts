import { z } from "zod";

import { generateCompletion } from "@/lib/ai/groq";
import { optimizeTitlePrompt } from "@/lib/ai/prompts";
import { incrementAIRequest } from "@/lib/ai/rate-limit";

const TitleSuggestionSchema = z.object({
  title: z.string().min(1).max(90),
  score: z.number().min(0).max(100),
  reasoning: z.string().min(1).max(240),
});

const TitlesResponseSchema = z.object({
  suggestions: z.array(TitleSuggestionSchema).min(1).max(5),
});

export type TitleSuggestion = z.infer<typeof TitleSuggestionSchema>;

function extractLikelyJson(text: string): string {
  const trimmed = text.trim();
  const fenceMatch = /^```(?:json)?\s*([\s\S]*?)\s*```$/i.exec(trimmed);
  const candidate = fenceMatch?.[1]?.trim() ?? trimmed;
  const firstBrace = candidate.indexOf("{");
  const lastBrace = candidate.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) return candidate.slice(firstBrace, lastBrace + 1);
  return candidate;
}

export type OptimizeTitleResult =
  | { ok: true; data: { suggestions: TitleSuggestion[]; raw?: string } }
  | { ok: false; error: { code: "RATE_LIMITED" | "PROVIDER_ERROR" | "INVALID_JSON"; details?: string } };

export async function optimizeTitle(
  title: string,
  topic: string,
  keywords: string[],
  userId?: string
): Promise<OptimizeTitleResult> {
  const prompt = optimizeTitlePrompt(title, topic, keywords);
  const completion = await generateCompletion(
    [
      { role: "system", content: prompt.system },
      { role: "user", content: prompt.user },
    ],
    { userId, temperature: 0.6 }
  );

  if (!completion.ok) {
    if (completion.error.code === "RATE_LIMITED") return { ok: false, error: { code: "RATE_LIMITED" } };
    return { ok: false, error: { code: "PROVIDER_ERROR", details: completion.error.details } };
  }

  const raw = completion.data.content;
  try {
    const parsedUnknown = JSON.parse(extractLikelyJson(raw)) as unknown;
    const validated = TitlesResponseSchema.safeParse(parsedUnknown);
    if (!validated.success) {
      const fallback: TitleSuggestion[] = [
        { title: title.slice(0, 90), score: 70, reasoning: "Keeps the original title while staying clear and specific." },
        { title: `${topic}: ${title}`.slice(0, 90), score: 74, reasoning: "Adds topic context for stronger relevance." },
        { title: `${title} (Quick Guide)`.slice(0, 90), score: 72, reasoning: "Signals value and format without overpromising." },
      ];
      if (userId) await incrementAIRequest(userId, "optimize_title");
      return { ok: true, data: { suggestions: fallback, raw } };
    }

    const suggestions = validated.data.suggestions.slice(0, 3);
    if (userId) await incrementAIRequest(userId, "optimize_title");
    return { ok: true, data: { suggestions, raw } };
  } catch (err) {
    return {
      ok: false,
      error: { code: "INVALID_JSON", details: err instanceof Error ? err.message : undefined },
    };
  }
}

