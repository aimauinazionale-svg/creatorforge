"use server";

import { z } from "zod";

import { requireAuth } from "@/lib/actions/auth-context";
import { actionErr, actionOk, type ActionResult } from "@/lib/actions/result";
import { safeAction } from "@/lib/actions/safe";
import { fetchKeywordSuggestions, scoreKeyword } from "@/lib/youtube/api";
import { optimizeTitle } from "@/lib/ai/titles";
import { generateTags } from "@/lib/ai/tags";
import type { KeywordResult } from "@/lib/actions/types/seo";

const KeywordSchema = z.object({ seed: z.string().min(2).max(120) });

export async function researchKeywordsAction(
  input: z.infer<typeof KeywordSchema>
): Promise<ActionResult<{ keywords: KeywordResult[]; suggestions: string[] }>> {
  return safeAction(async () => {
  const ctx = await requireAuth();
  if (!ctx.ok) return ctx;

  const parsed = KeywordSchema.safeParse(input);
  if (!parsed.success) return actionErr("INVALID_INPUT");

  const suggestions = await fetchKeywordSuggestions(parsed.data.seed);
  const seeds = [parsed.data.seed, ...suggestions.slice(0, 8)];
  const keywords = seeds.map((keyword) => {
    const scored = scoreKeyword(keyword, suggestions);
    return { keyword, ...scored };
  });

  return actionOk({ keywords, suggestions });

  }, "researchKeywordsAction");}

const OptimizeVideoSchema = z.object({
  title: z.string().min(2).max(200),
  topic: z.string().min(2).max(200),
  description: z.string().max(5000).optional(),
});

export async function optimizeVideoSeoAction(
  input: z.infer<typeof OptimizeVideoSchema>
): Promise<
  ActionResult<{
    titles: Array<{ title: string; score: number; reasoning: string }>;
    tags: string[];
    checklist: Array<{ label: string; done: boolean; hint: string }>;
  }>
> {
  return safeAction(async () => {
  const ctx = await requireAuth();
  if (!ctx.ok) return ctx;

  const parsed = OptimizeVideoSchema.safeParse(input);
  if (!parsed.success) return actionErr("INVALID_INPUT");

  const titleRes = await optimizeTitle(
    parsed.data.title,
    parsed.data.topic,
    [],
    ctx.data.userId
  );
  if (!titleRes.ok) {
    if (titleRes.error.code === "RATE_LIMITED") return actionErr("RATE_LIMITED");
    return actionErr("PROVIDER_ERROR", titleRes.error.details);
  }

  const desc = parsed.data.description ?? `${parsed.data.title} — ${parsed.data.topic}`;
  const tagsRes = await generateTags(parsed.data.title, desc, parsed.data.topic, ctx.data.userId);
  if (!tagsRes.ok) {
    if (tagsRes.error.code === "RATE_LIMITED") return actionErr("RATE_LIMITED");
    return actionErr("PROVIDER_ERROR", tagsRes.error.details);
  }

  const checklist = [
    {
      label: "Title length",
      done: parsed.data.title.length >= 40 && parsed.data.title.length <= 70,
      hint: "Aim for 40–70 characters for mobile readability.",
    },
    {
      label: "Topic in title",
      done: parsed.data.title.toLowerCase().includes(parsed.data.topic.toLowerCase().split(" ")[0] ?? ""),
      hint: "Include your main topic early in the title.",
    },
    {
      label: "Tag count",
      done: tagsRes.data.tags.length >= 10,
      hint: "Use 10–20 relevant tags mixing broad and niche terms.",
    },
    {
      label: "Description hooks",
      done: Boolean(parsed.data.description && parsed.data.description.length > 120),
      hint: "Lead with value in the first 2 lines (above the fold).",
    },
  ];

  return actionOk({
    titles: titleRes.data.suggestions,
    tags: tagsRes.data.tags,
    checklist,
  });

  }, "optimizeVideoSeoAction");}
