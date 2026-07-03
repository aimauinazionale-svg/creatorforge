"use server";

import { z } from "zod";

import { createIdeas } from "@/app/actions/ideas";
import { generateDescription } from "@/lib/ai/descriptions";
import { generateTags } from "@/lib/ai/tags";
import { optimizeTitle } from "@/lib/ai/titles";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fetchKeywordSuggestions, scoreKeyword } from "@/lib/youtube/api";

async function requireUserId(): Promise<
  { ok: true; userId: string } | { ok: false; error: { code: "UNAUTHENTICATED" } }
> {
  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return { ok: false, error: { code: "UNAUTHENTICATED" } };
    return { ok: true, userId: data.user.id };
  } catch (err) {
    console.error("[server-action:requireUserId]", err);
    return { ok: false, error: { code: "UNAUTHENTICATED" } };
  }
}

export async function generateTitleAction(input: {
  title: string;
  topic: string;
  keywords: string[];
}) {
  try {
    const ctx = await requireUserId();
    if (!ctx.ok) return ctx;
    return await optimizeTitle(input.title, input.topic, input.keywords, ctx.userId);
  } catch (err) {
    console.error("[server-action:generateTitle]", err);
    return {
      ok: false as const,
      error: { code: "PROVIDER_ERROR" as const, details: err instanceof Error ? err.message : undefined },
    };
  }
}

export async function generateDescriptionAction(input: {
  title: string;
  keywords: string[];
  keyPoints: string[];
}) {
  try {
    const ctx = await requireUserId();
    if (!ctx.ok) return ctx;
    return await generateDescription(input.title, input.keywords, input.keyPoints, ctx.userId);
  } catch (err) {
    console.error("[server-action:generateDescription]", err);
    return {
      ok: false as const,
      error: { code: "PROVIDER_ERROR" as const, details: err instanceof Error ? err.message : undefined },
    };
  }
}

export async function generateTagsAction(input: {
  title: string;
  description: string;
  topic: string;
}) {
  try {
    const ctx = await requireUserId();
    if (!ctx.ok) return ctx;
    return await generateTags(input.title, input.description, input.topic, ctx.userId);
  } catch (err) {
    console.error("[server-action:generateTags]", err);
    return {
      ok: false as const,
      error: { code: "PROVIDER_ERROR" as const, details: err instanceof Error ? err.message : undefined },
    };
  }
}

export async function generateIdeasAction(input: {
  topic: string;
  count?: number;
  locale?: string;
}) {
  try {
    return await createIdeas({
      topic: input.topic,
      count: input.count ?? 5,
      locale: input.locale as never,
    });
  } catch (err) {
    console.error("[server-action:generateIdeas]", err);
    return { ok: false as const, error: { code: "UNKNOWN" as const, details: err instanceof Error ? err.message : undefined } };
  }
}

const SeoSchema = z.object({ seed: z.string().min(2).max(120) });

export async function researchKeywordsAction(input: z.infer<typeof SeoSchema>) {
  try {
    const parsed = SeoSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false as const, error: { code: "INVALID_INPUT" as const } };
    }

    const suggestions = await fetchKeywordSuggestions(parsed.data.seed);
    const scored = [parsed.data.seed, ...suggestions].slice(0, 10).map((keyword) => ({
      keyword,
      ...scoreKeyword(keyword, suggestions),
    }));

    return { ok: true as const, data: { seed: parsed.data.seed, suggestions, scored } };
  } catch (err) {
    console.error("[server-action:researchKeywords]", err);
    return { ok: false as const, error: { code: "UNKNOWN" as const, details: err instanceof Error ? err.message : undefined } };
  }
}
