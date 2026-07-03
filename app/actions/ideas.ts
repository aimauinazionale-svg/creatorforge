"use server";

import { generateIdeasWithGroq } from "@/lib/ai/[feature]";
import {
  CreateIdeasInputSchema,
  type CreateIdeasInput,
  type CreateIdeasResult,
} from "@/lib/actions/types/ideas";
import { isSupabaseSchemaError, logSupabaseError } from "@/lib/supabase/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function createIdeas(rawInput: CreateIdeasInput): Promise<CreateIdeasResult> {
  try {
    const parsed = CreateIdeasInputSchema.safeParse(rawInput);
    if (!parsed.success) {
      return { ok: false, error: { code: "INVALID_INPUT" } };
    }

    const supabase = createSupabaseServerClient();
    const { data: auth, error: authError } = await supabase.auth.getUser();

    if (authError) {
      return { ok: false, error: { code: "UNAUTHENTICATED" } };
    }
    const user = auth.user;
    if (!user) return { ok: false, error: { code: "UNAUTHENTICATED" } };

    const ai = await generateIdeasWithGroq({
      userId: user.id,
      topic: parsed.data.topic,
      count: parsed.data.count,
      locale: parsed.data.locale,
    });
    if (!ai.ok) return ai;

    const ideas = ai.data.ideas;
    const inserts = ideas.map((idea) => ({
      user_id: user.id,
      title: idea.title,
      description: idea.description,
      category: idea.category ?? null,
      tags: idea.tags ?? null,
    }));

    const { data: inserted, error: insertError } = await supabase
      .from("ideas")
      .insert(inserts)
      .select("id");

    if (insertError) {
      if (isSupabaseSchemaError(insertError)) {
        logSupabaseError("ideas:insert", insertError);
        return { ok: true, data: { ideas, insertedIds: [] } };
      }
      logSupabaseError("ideas:insert", insertError);
      return { ok: false, error: { code: "DB_ERROR" } };
    }

    const insertedIds = (inserted ?? []).map((row) => row.id);
    return { ok: true, data: { ideas, insertedIds } };
  } catch (err) {
    console.error("[server-action:createIdeas]", err);
    return { ok: false, error: { code: "UNKNOWN" } };
  }
}
