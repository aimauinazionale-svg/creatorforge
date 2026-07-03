import OpenAI from "openai";
import { z } from "zod";

import { checkAIRateLimit, incrementAIRequest } from "@/lib/ai/rate-limit";

export type AiErrorCode =
  | "UNAUTHENTICATED"
  | "RATE_LIMITED"
  | "MISSING_CONFIG"
  | "TIMEOUT"
  | "PROVIDER_ERROR"
  | "INVALID_JSON"
  | "INTERNAL";

export type AiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: AiErrorCode; details?: string } };

const IdeaSchema = z.object({
  title: z.string().min(1).max(140),
  description: z.string().min(1).max(600),
  category: z.string().min(1).max(80).optional(),
  tags: z.array(z.string().min(1).max(40)).max(12).optional(),
});

const IdeasResponseSchema = z.object({
  ideas: z.array(IdeaSchema).min(1).max(10),
});

export type AiIdea = z.infer<typeof IdeaSchema>;
export type AiIdeasResponse = z.infer<typeof IdeasResponseSchema>;

export const GenerateIdeasInputSchema = z.object({
  userId: z.string().min(1),
  topic: z.string().min(2).max(200),
  count: z.number().int().min(1).max(10).default(5),
  locale: z
    .enum(["en", "it", "es", "de", "fr", "pt", "ru", "ja", "zh"])
    .optional(),
});

export type GenerateIdeasInput = z.infer<typeof GenerateIdeasInputSchema>;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

function getGroqApiKey(): string {
  return (
    process.env.GROQ_API_KEY ??
    process.env.NEXT_PUBLIC_GROQ_API_KEY ??
    requireEnv("GROQ_API_KEY")
  );
}

function createGroqClient(): OpenAI {
  return new OpenAI({
    apiKey: getGroqApiKey(),
    baseURL: "https://api.groq.com/openai/v1",
  });
}

function extractLikelyJson(text: string): string {
  const trimmed = text.trim();
  const fenceMatch = /^```(?:json)?\s*([\s\S]*?)\s*```$/i.exec(trimmed);
  const candidate = fenceMatch?.[1]?.trim() ?? trimmed;

  const firstBrace = candidate.indexOf("{");
  const lastBrace = candidate.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return candidate.slice(firstBrace, lastBrace + 1);
  }
  return candidate;
}

function safeJsonParseObject(value: string): unknown {
  const json = extractLikelyJson(value);
  return JSON.parse(json) as unknown;
}

async function withTimeout<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number
): Promise<{ ok: true; value: T } | { ok: false; code: "TIMEOUT" }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const value = await fn(controller.signal);
    return { ok: true, value };
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") return { ok: false, code: "TIMEOUT" };
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

function buildPrompt(input: GenerateIdeasInput): { system: string; user: string } {
  const locale = input.locale ?? "en";

  const system =
    "You are a helpful assistant that returns ONLY valid JSON. No markdown, no code fences, no extra keys.";

  const user = JSON.stringify(
    {
      task: "Generate YouTube video ideas for a creator.",
      constraints: {
        locale,
        count: input.count,
        output_schema: {
          ideas: [
            {
              title: "string",
              description: "string",
              category: "string (optional)",
              tags: ["string (optional)"],
            },
          ],
        },
      },
      topic: input.topic,
    },
    null,
    2
  );

  return { system, user };
}

/**
 * Groq-powered idea generation with per-user monthly limiting (UTC).
 * Also logs every successful attempt into `ai_requests`.
 */
export async function generateIdeasWithGroq(
  rawInput: GenerateIdeasInput
): Promise<AiResult<AiIdeasResponse>> {
  const parsedInput = GenerateIdeasInputSchema.safeParse(rawInput);
  if (!parsedInput.success) {
    return {
      ok: false,
      error: { code: "INTERNAL", details: parsedInput.error.message },
    };
  }
  const input = parsedInput.data;

  try {
    const limit = await checkAIRateLimit(input.userId);
    if (!limit.ok) {
      if (limit.error.code === "RATE_LIMITED") {
        return { ok: false, error: { code: "RATE_LIMITED" } };
      }
      if (limit.error.code === "UNAUTHENTICATED") {
        return { ok: false, error: { code: "UNAUTHENTICATED" } };
      }
      return { ok: false, error: { code: "INTERNAL" } };
    }

    let client: OpenAI;
    try {
      client = createGroqClient();
    } catch (e) {
      return {
        ok: false,
        error: {
          code: "MISSING_CONFIG",
          details: e instanceof Error ? e.message : undefined,
        },
      };
    }

    const prompt = buildPrompt(input);

    const completion = await withTimeout(
      async (signal) =>
        client.chat.completions.create(
          {
            model: "llama-3.3-70b-versatile",
            temperature: 0.7,
            messages: [
              { role: "system", content: prompt.system },
              { role: "user", content: prompt.user },
            ],
          },
          { signal }
        ),
      20_000
    );

    if (!completion.ok) return { ok: false, error: { code: "TIMEOUT" } };

    const text = completion.value.choices[0]?.message?.content ?? "";
    let jsonUnknown: unknown;
    try {
      jsonUnknown = safeJsonParseObject(text);
    } catch (e) {
      return {
        ok: false,
        error: { code: "INVALID_JSON", details: e instanceof Error ? e.message : undefined },
      };
    }

    const validated = IdeasResponseSchema.safeParse(jsonUnknown);
    if (!validated.success) {
      return {
        ok: false,
        error: { code: "INVALID_JSON", details: validated.error.message },
      };
    }

    await incrementAIRequest(input.userId, "idea_generation");

    return { ok: true, data: validated.data };
  } catch (e) {
    return {
      ok: false,
      error: {
        code: "PROVIDER_ERROR",
      },
    };
  }
}

