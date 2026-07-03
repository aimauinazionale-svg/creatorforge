import { z } from "zod";

import type { AiErrorCode, AiIdea } from "@/lib/ai/[feature]";

export const CreateIdeasInputSchema = z.object({
  topic: z.string().min(2).max(200),
  count: z.number().int().min(1).max(10).default(5),
  locale: z.enum(["en", "it", "es", "de", "fr", "pt", "ru", "ja", "zh"]).optional(),
});

export type CreateIdeasInput = z.infer<typeof CreateIdeasInputSchema>;

export type IdeasActionErrorCode = AiErrorCode | "INVALID_INPUT" | "DB_ERROR" | "UNKNOWN";

export type CreateIdeasResult =
  | { ok: true; data: { ideas: AiIdea[]; insertedIds: string[] } }
  | { ok: false; error: { code: IdeasActionErrorCode; details?: string } };
