"use server";

import { z } from "zod";

import { generateDescription } from "@/lib/ai/descriptions";
import { optimizeTitle } from "@/lib/ai/titles";
import { generateTags } from "@/lib/ai/tags";
import { checkAiRateLimitFlexible, FREE_MONTHLY_LIMIT } from "@/lib/ai/rate-limit";
import { requireAuth } from "@/lib/actions/auth-context";
import { actionErr, actionOk, type ActionResult } from "@/lib/actions/result";
import { safeAction } from "@/lib/actions/safe";

export async function getAiRateLimitAction(): Promise<
  ActionResult<{ limit: number; used: number; remaining: number; nearLimit: boolean }>
> {
  return safeAction(async () => {
  const status = await checkAiRateLimitFlexible();
  if (!status.ok) {
    if (status.error.code === "RATE_LIMITED") {
      return actionErr("RATE_LIMITED");
    }
    return actionOk({ limit: FREE_MONTHLY_LIMIT, used: 0, remaining: FREE_MONTHLY_LIMIT, nearLimit: false });
  }
  return actionOk(status.data);

  }, "getAiRateLimitAction");}

const TitleSchema = z.object({
  title: z.string().min(2).max(200),
  topic: z.string().min(2).max(200),
  keywords: z.array(z.string()).default([]),
});

export async function optimizeTitleAction(
  input: z.infer<typeof TitleSchema>
): Promise<ActionResult<{ suggestions: Array<{ title: string; score: number; reasoning: string }> }>> {
  return safeAction(async () => {
  const ctx = await requireAuth();
  if (!ctx.ok) return ctx;

  const parsed = TitleSchema.safeParse(input);
  if (!parsed.success) return actionErr("INVALID_INPUT");

  const res = await optimizeTitle(
    parsed.data.title,
    parsed.data.topic,
    parsed.data.keywords,
    ctx.data.userId
  );
  if (!res.ok) {
    if (res.error.code === "RATE_LIMITED") return actionErr("RATE_LIMITED");
    return actionErr("INVALID_JSON", res.error.details);
  }
  return actionOk({ suggestions: res.data.suggestions });

  }, "optimizeTitleAction");}

const DescriptionSchema = z.object({
  title: z.string().min(2).max(200),
  keywords: z.array(z.string()).default([]),
  keyPoints: z.array(z.string()).default([]),
});

export async function generateDescriptionAction(
  input: z.infer<typeof DescriptionSchema>
): Promise<ActionResult<{ description: string; hashtags: string[] }>> {
  return safeAction(async () => {
  const ctx = await requireAuth();
  if (!ctx.ok) return ctx;

  const parsed = DescriptionSchema.safeParse(input);
  if (!parsed.success) return actionErr("INVALID_INPUT");

  const res = await generateDescription(
    parsed.data.title,
    parsed.data.keywords,
    parsed.data.keyPoints,
    ctx.data.userId
  );
  if (!res.ok) {
    if (res.error.code === "RATE_LIMITED") return actionErr("RATE_LIMITED");
    return actionErr("INVALID_JSON", res.error.details);
  }
  return actionOk({ description: res.data.description, hashtags: res.data.hashtags });

  }, "generateDescriptionAction");}

const TagsSchema = z.object({
  title: z.string().min(2).max(200),
  topic: z.string().min(2).max(200),
  description: z.string().min(10).max(5000),
});

export async function generateTagsAction(
  input: z.infer<typeof TagsSchema>
): Promise<ActionResult<{ tags: string[] }>> {
  return safeAction(async () => {
  const ctx = await requireAuth();
  if (!ctx.ok) return ctx;

  const parsed = TagsSchema.safeParse(input);
  if (!parsed.success) return actionErr("INVALID_INPUT");

  const res = await generateTags(
    parsed.data.title,
    parsed.data.description,
    parsed.data.topic,
    ctx.data.userId
  );
  if (!res.ok) {
    if (res.error.code === "RATE_LIMITED") return actionErr("RATE_LIMITED");
    return actionErr("INVALID_JSON", res.error.details);
  }
  return actionOk({ tags: res.data.tags });

  }, "generateTagsAction");}
