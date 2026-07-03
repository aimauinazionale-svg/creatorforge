import { getOrCreateGuestId } from "@/lib/onboarding/fallback";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export type ActorContext = {
  actorId: string;
  supabase: SupabaseClient<Database>;
  isGuest: boolean;
};

/** Resolves a stable actor id (auth user or guest) for cookie-scoped storage. */
export async function resolveActor(): Promise<ActorContext> {
  try {
    const supabase = createSupabaseServerClient();
    const { data: auth, error } = await supabase.auth.getUser();
    if (!error && auth.user) {
      return { actorId: auth.user.id, supabase, isGuest: false };
    }
    return { actorId: getOrCreateGuestId(), supabase, isGuest: true };
  } catch {
    return {
      actorId: getOrCreateGuestId(),
      supabase: createSupabaseServerClient(),
      isGuest: true,
    };
  }
}
