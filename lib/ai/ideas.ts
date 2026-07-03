import { z } from "zod";

import { generateCompletion } from "@/lib/ai/groq";
import { generateVideoIdeasPrompt } from "@/lib/ai/prompts";
import { incrementAIRequest } from "@/lib/ai/rate-limit";

const DifficultySchema = z.enum(["low", "medium", "high"]);

const IdeaSchema = z.object({
  title: z.string().min(1).max(90),
  description: z.string().min(1).max(500),
  targetKeywords: z.array(z.string().min(1).max(40)).min(1).max(10),
  estimatedDifficulty: DifficultySchema,
  uniqueAngle: z.string().min(1).max(200),
});

const IdeasResponseSchema = z.object({
  ideas: z.array(IdeaSchema).min(1).max(10),
});

export type VideoIdea = z.infer<typeof IdeaSchema>;

function extractLikelyJson(text: string): string {
  const trimmed = text.trim();
  const fenceMatch = /^```(?:json)?\s*([\s\S]*?)\s*```$/i.exec(trimmed);
  const candidate = fenceMatch?.[1]?.trim() ?? trimmed;

  const firstBrace = candidate.indexOf("{");
  const lastBrace = candidate.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) return candidate.slice(firstBrace, lastBrace + 1);
  return candidate;
}

function safeParseJson(text: string): unknown {
  return JSON.parse(extractLikelyJson(text)) as unknown;
}

function buildFallbackIdeas(topic: string, niche: string, audience: string, count: number): VideoIdea[] {
  const base = `${topic}${niche ? ` (${niche})` : ""}`;
  const who = audience ? ` for ${audience}` : "";
  const templates = [
    `The 5-Step Framework: ${base}${who}`,
    `Do This Before You Start: ${base}${who}`,
    `I Tried ${base} for 7 Days${who}`,
    `The Biggest Mistakes in ${base}${who}`,
    `${base}: The Beginner-to-Pro Roadmap${who}`,
    `My Honest Workflow: ${base}${who}`,
    `How I’d Start ${base} in 2026${who}`,
  ];

  return Array.from({ length: count }).map((_, i) => {
    const title = templates[i % templates.length]!;
    return {
      title: title.slice(0, 90),
      description: `A clear, actionable video idea about ${topic}${niche ? ` in the ${niche} niche` : ""}${
        audience ? ` tailored to ${audience}` : ""
      }.`,
      targetKeywords: [topic, niche, audience].filter(Boolean).slice(0, 3) as string[],
      estimatedDifficulty: i % 3 === 0 ? "low" : i % 3 === 1 ? "medium" : "high",
      uniqueAngle: "Structured, step-by-step with a concrete deliverable by the end.",
    };
  });
}

export type GenerateVideoIdeasResult =
  | { ok: true; data: { ideas: VideoIdea[]; raw?: string } }
  | { ok: false; error: { code: "RATE_LIMITED" | "PROVIDER_ERROR" | "INVALID_JSON"; details?: string } };

export async function generateVideoIdeas(
  topic: string,
  niche: string,
  targetAudience: string,
  count = 5,
  userId?: string
): Promise<GenerateVideoIdeasResult> {
  const prompt = generateVideoIdeasPrompt(topic, niche, targetAudience);
  const completion = await generateCompletion(
    [
      { role: "system", content: prompt.system },
      { role: "user", content: prompt.user },
    ],
    { userId, temperature: 0.75 }
  );

  if (!completion.ok) {
    if (completion.error.code === "RATE_LIMITED") {
      return { ok: false, error: { code: "RATE_LIMITED" } };
    }
    return { ok: false, error: { code: "PROVIDER_ERROR", details: completion.error.details } };
  }

  const raw = completion.data.content;

  try {
    const parsedUnknown = safeParseJson(raw);
    const validated = IdeasResponseSchema.safeParse(parsedUnknown);
    if (!validated.success) {
      const fallback = buildFallbackIdeas(topic, niche, targetAudience, Math.max(1, Math.min(10, count)));
      if (userId) await incrementAIRequest(userId, "video_ideas");
      return { ok: true, data: { ideas: fallback, raw } };
    }

    const ideas = validated.data.ideas.slice(0, Math.max(1, Math.min(10, count)));
    if (userId) await incrementAIRequest(userId, "video_ideas");
    return { ok: true, data: { ideas, raw } };
  } catch (err) {
    const fallback = buildFallbackIdeas(topic, niche, targetAudience, Math.max(1, Math.min(10, count)));
    if (userId) await incrementAIRequest(userId, "video_ideas");
    return {
      ok: true,
      data: { ideas: fallback, raw },
    };
  }
}

