import OpenAI from "openai";

import { checkAIRateLimit } from "@/lib/ai/rate-limit";

export type GroqMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type GenerateCompletionOptions = {
  userId?: string;
  temperature?: number;
  maxTokens?: number;
};

export type GroqCompletionResult =
  | { ok: true; data: { content: string } }
  | {
      ok: false;
      error: {
        code:
          | "UNAUTHENTICATED"
          | "RATE_LIMITED"
          | "MISSING_CONFIG"
          | "TIMEOUT"
          | "PROVIDER_ERROR"
          | "NETWORK_ERROR";
        details?: string;
        retryable?: boolean;
        rateLimit?: { limit: number; used: number; remaining: number };
      };
    };

const GROQ_BASE_URL = "https://api.groq.com/openai/v1";
const MODEL = "llama-3.3-70b-versatile";
const TIMEOUT_MS = 30_000;
const MAX_TRIES = 3;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

function getGroqApiKey(): string {
  return process.env.GROQ_API_KEY ?? requireEnv("GROQ_API_KEY");
}

function createGroqClient(): OpenAI {
  return new OpenAI({
    apiKey: getGroqApiKey(),
    baseURL: GROQ_BASE_URL,
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableStatus(status: number | undefined): boolean {
  if (!status) return false;
  return status === 429 || status >= 500;
}

function isLikelyNetworkError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message.toLowerCase();
  return (
    msg.includes("fetch") ||
    msg.includes("network") ||
    msg.includes("econnreset") ||
    msg.includes("etimedout") ||
    msg.includes("enotfound")
  );
}

async function withTimeout<T>(
  run: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number
): Promise<{ ok: true; value: T } | { ok: false; error: { code: "TIMEOUT" } }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const value = await run(controller.signal);
    return { ok: true, value };
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return { ok: false, error: { code: "TIMEOUT" } };
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

export async function generateCompletion(
  messages: GroqMessage[],
  options?: GenerateCompletionOptions
): Promise<GroqCompletionResult> {
  if (options?.userId) {
    const limit = await checkAIRateLimit(options.userId);
    if (!limit.ok) {
      if (limit.error.code === "RATE_LIMITED") {
        return {
          ok: false,
          error: {
            code: "RATE_LIMITED",
            retryable: false,
            rateLimit: {
              limit: limit.error.limit ?? 10,
              used: limit.error.used ?? 10,
              remaining: limit.error.remaining ?? 0,
            },
          },
        };
      }
      if (limit.error.code === "UNAUTHENTICATED") {
        return { ok: false, error: { code: "UNAUTHENTICATED", retryable: false } };
      }
      // DB errors fall back to cookie rate limiting in checkAIRateLimit; continue if we get here.
    }
  }

  let client: OpenAI;
  try {
    client = createGroqClient();
  } catch (err) {
    return {
      ok: false,
      error: {
        code: "MISSING_CONFIG",
        details: err instanceof Error ? err.message : undefined,
        retryable: false,
      },
    };
  }

  let lastErr: unknown = null;

  for (let attempt = 1; attempt <= MAX_TRIES; attempt++) {
    try {
      const timed = await withTimeout(
        async (signal) =>
          client.chat.completions.create(
            {
              model: MODEL,
              messages,
              temperature: options?.temperature ?? 0.7,
              max_tokens: options?.maxTokens,
            },
            { signal }
          ),
        TIMEOUT_MS
      );

      if (!timed.ok) {
        return { ok: false, error: { code: "TIMEOUT", retryable: true } };
      }

      const content = timed.value.choices[0]?.message?.content ?? "";
      return { ok: true, data: { content } };
    } catch (err) {
      lastErr = err;
      const status =
        typeof (err as { status?: unknown }).status === "number"
          ? ((err as { status: number }).status as number)
          : undefined;

      const retryable = isRetryableStatus(status) || isLikelyNetworkError(err);
      const isLast = attempt === MAX_TRIES;

      if (!retryable || isLast) {
        return {
          ok: false,
          error: {
            code: isLikelyNetworkError(err) ? "NETWORK_ERROR" : "PROVIDER_ERROR",
            details: err instanceof Error ? err.message : undefined,
            retryable,
          },
        };
      }

      const backoffMs = 400 * 2 ** (attempt - 1) + Math.floor(Math.random() * 250);
      await sleep(backoffMs);
    }
  }

  return {
    ok: false,
    error: {
      code: "PROVIDER_ERROR",
      details: lastErr instanceof Error ? lastErr.message : undefined,
      retryable: true,
    },
  };
}

