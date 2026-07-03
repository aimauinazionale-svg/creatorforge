"use server";

import { z } from "zod";

import { sendChatCompletion } from "@/lib/ai/chat";
import {
  checkAiRateLimitFlexible,
  FREE_DAILY_LIMIT,
  incrementAiRequestFlexible,
  statusFromUsed,
} from "@/lib/ai/rate-limit";
import { actionErr, actionOk, type ActionResult } from "@/lib/actions/result";
import { safeAction } from "@/lib/actions/safe";
import type { ChatMessage } from "@/types/chat";

const ChatHistorySchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(8000),
});

const SendChatSchema = z.object({
  message: z.string().min(1).max(4000),
  history: z.array(ChatHistorySchema).max(30),
  locale: z.enum(["en", "it", "es", "de", "fr", "pt", "ru", "ja", "zh"]),
});

export type SendChatMessageInput = z.infer<typeof SendChatSchema>;

export type SendChatMessageResult = {
  message: ChatMessage;
  rateLimit: { used: number; limit: number; remaining: number };
};

function mapGroqError(
  code: string,
  details?: string
): ActionResult<SendChatMessageResult> {
  switch (code) {
    case "RATE_LIMITED":
      return actionErr("RATE_LIMITED");
    case "UNAUTHENTICATED":
      return actionErr("UNAUTHENTICATED");
    case "MISSING_CONFIG":
      return actionErr("MISSING_CONFIG", details);
    case "TIMEOUT":
      return actionErr("TIMEOUT");
    case "NETWORK_ERROR":
      return actionErr("NETWORK", details);
    default:
      return actionErr("UNKNOWN", details);
  }
}

/** Sends a chat message to the YouTube expert AI and returns the assistant reply. */
export async function sendChatMessageAction(
  input: SendChatMessageInput
): Promise<ActionResult<SendChatMessageResult>> {
  return safeAction(async () => {
    const parsed = SendChatSchema.safeParse(input);
    if (!parsed.success) return actionErr("INVALID_INPUT");

    const limitBefore = await checkAiRateLimitFlexible();
    if (!limitBefore.ok && limitBefore.error.code === "RATE_LIMITED") {
      return actionErr("RATE_LIMITED");
    }

    const result = await sendChatCompletion({
      userMessage: parsed.data.message,
      history: parsed.data.history,
      locale: parsed.data.locale,
    });

    if (!result.ok) {
      return mapGroqError(result.error.code, result.error.details);
    }

    await incrementAiRequestFlexible("chat");

    const usedBefore = limitBefore.ok ? limitBefore.data.used : 0;
    const used = usedBefore + 1;
    const status = statusFromUsed(used);

    const assistantMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: result.data.content,
      createdAt: new Date().toISOString(),
    };

    return actionOk({
      message: assistantMessage,
      rateLimit: {
        used: status.used,
        limit: status.limit,
        remaining: status.remaining,
      },
    });
  }, "sendChatMessage");
}

/** Returns current AI rate limit status (auth or guest cookie fallback). */
export async function getChatRateLimitAction(): Promise<
  ActionResult<{ limit: number; used: number; remaining: number; nearLimit: boolean }>
> {
  return safeAction(async () => {
    const status = await checkAiRateLimitFlexible();
    if (!status.ok) {
      if (status.error.code === "RATE_LIMITED") {
        return actionOk({
          limit: status.error.limit ?? FREE_DAILY_LIMIT,
          used: status.error.used ?? FREE_DAILY_LIMIT,
          remaining: status.error.remaining ?? 0,
          nearLimit: true,
        });
      }
      return actionOk({
        limit: FREE_DAILY_LIMIT,
        used: 0,
        remaining: FREE_DAILY_LIMIT,
        nearLimit: false,
      });
    }
    return actionOk(status.data);
  }, "getChatRateLimit");
}
