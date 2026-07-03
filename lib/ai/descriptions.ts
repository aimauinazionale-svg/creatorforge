import { z } from "zod";

import { generateCompletion } from "@/lib/ai/groq";
import { generateDescriptionPrompt } from "@/lib/ai/prompts";
import { incrementAIRequest } from "@/lib/ai/rate-limit";

const DescriptionResponseSchema = z.object({
  description: z.string().min(20).max(5000),
  hashtags: z.array(z.string().min(1).max(60)).min(3).max(5),
});

export type GeneratedDescription = z.infer<typeof DescriptionResponseSchema>;

function extractLikelyJson(text: string): string {
  const trimmed = text.trim();
  const fenceMatch = /^```(?:json)?\s*([\s\S]*?)\s*```$/i.exec(trimmed);
  const candidate = fenceMatch?.[1]?.trim() ?? trimmed;
  const firstBrace = candidate.indexOf("{");
  const lastBrace = candidate.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) return candidate.slice(firstBrace, lastBrace + 1);
  return candidate;
}

export type GenerateDescriptionResult =
  | { ok: true; data: { description: string; hashtags: string[]; raw?: string } }
  | { ok: false; error: { code: "RATE_LIMITED" | "PROVIDER_ERROR" | "INVALID_JSON"; details?: string } };

export async function generateDescription(
  title: string,
  keywords: string[],
  keyPoints: string[],
  userId?: string
): Promise<GenerateDescriptionResult> {
  const prompt = generateDescriptionPrompt(title, keywords, keyPoints);
  const completion = await generateCompletion(
    [
      { role: "system", content: prompt.system },
      { role: "user", content: prompt.user },
    ],
    { userId, temperature: 0.65 }
  );

  if (!completion.ok) {
    if (completion.error.code === "RATE_LIMITED") return { ok: false, error: { code: "RATE_LIMITED" } };
    return { ok: false, error: { code: "PROVIDER_ERROR", details: completion.error.details } };
  }

  const raw = completion.data.content;
  try {
    const parsedUnknown = JSON.parse(extractLikelyJson(raw)) as unknown;
    const validated = DescriptionResponseSchema.safeParse(parsedUnknown);
    if (!validated.success) {
      const fallback = {
        description: [
          `🔥 ${title}`,
          "",
          "In this video you’ll get:",
          ...keyPoints.slice(0, 6).map((p) => `- ${p}`),
          "",
          "⏱️ Timestamps:",
          "0:00 Intro",
          "0:30 Key point 1",
          "2:00 Key point 2",
          "4:30 Wrap-up",
          "",
          "✅ If this helped, subscribe for more.",
        ].join("\n"),
        hashtags: ["#youtube", "#creator", "#content"],
      };
      if (userId) await incrementAIRequest(userId, "generate_description");
      return { ok: true, data: { ...fallback, raw } };
    }

    if (userId) await incrementAIRequest(userId, "generate_description");
    return {
      ok: true,
      data: { description: validated.data.description, hashtags: validated.data.hashtags, raw },
    };
  } catch (err) {
    return {
      ok: false,
      error: { code: "INVALID_JSON", details: err instanceof Error ? err.message : undefined },
    };
  }
}

