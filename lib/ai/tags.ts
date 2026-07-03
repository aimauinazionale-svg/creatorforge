import { z } from "zod";

import { generateCompletion } from "@/lib/ai/groq";
import { generateTagsPrompt } from "@/lib/ai/prompts";
import { incrementAIRequest } from "@/lib/ai/rate-limit";

const TagsResponseSchema = z.object({
  tags: z.array(z.string().min(1).max(40)).min(10).max(30),
});

export type GenerateTagsResult =
  | { ok: true; data: { tags: string[]; raw?: string } }
  | { ok: false; error: { code: "RATE_LIMITED" | "PROVIDER_ERROR" | "INVALID_JSON"; details?: string } };

function extractLikelyJson(text: string): string {
  const trimmed = text.trim();
  const fenceMatch = /^```(?:json)?\s*([\s\S]*?)\s*```$/i.exec(trimmed);
  const candidate = fenceMatch?.[1]?.trim() ?? trimmed;
  const firstBrace = candidate.indexOf("{");
  const lastBrace = candidate.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) return candidate.slice(firstBrace, lastBrace + 1);
  return candidate;
}

function normalizeTags(tags: string[]): string[] {
  const cleaned = tags
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => t.replace(/^#/, ""))
    .map((t) => t.replace(/\s+/g, " "));

  const seen = new Set<string>();
  const unique: string[] = [];
  for (const t of cleaned) {
    const key = t.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(t);
  }
  return unique;
}

export async function generateTags(
  title: string,
  description: string,
  topic: string,
  userId?: string
): Promise<GenerateTagsResult> {
  const prompt = generateTagsPrompt(title, description, topic);
  const completion = await generateCompletion(
    [
      { role: "system", content: prompt.system },
      { role: "user", content: prompt.user },
    ],
    { userId, temperature: 0.4 }
  );

  if (!completion.ok) {
    if (completion.error.code === "RATE_LIMITED") return { ok: false, error: { code: "RATE_LIMITED" } };
    return { ok: false, error: { code: "PROVIDER_ERROR", details: completion.error.details } };
  }

  const raw = completion.data.content;
  try {
    const parsedUnknown = JSON.parse(extractLikelyJson(raw)) as unknown;
    const validated = TagsResponseSchema.safeParse(parsedUnknown);
    if (!validated.success) {
      const fallback = normalizeTags(
        [topic, ...title.split(/\W+/).slice(0, 8), "youtube", "creator", "content"]
          .filter(Boolean)
          .slice(0, 18)
      );
      if (userId) await incrementAIRequest(userId, "generate_tags");
      return { ok: true, data: { tags: fallback, raw } };
    }

    const tags = normalizeTags(validated.data.tags).slice(0, 20);
    if (userId) await incrementAIRequest(userId, "generate_tags");
    return { ok: true, data: { tags, raw } };
  } catch (err) {
    return {
      ok: false,
      error: { code: "INVALID_JSON", details: err instanceof Error ? err.message : undefined },
    };
  }
}

