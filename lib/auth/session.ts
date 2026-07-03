import { createSupabaseServerClient } from "@/lib/supabase/server";

import {

  getOnboardingFromCookie,

  isOnboardingGloballyComplete,

  resolveOnboardingActorId,

} from "@/lib/onboarding/fallback";

import { isSupabaseConfigured } from "@/lib/supabase/env";



export type AppUser = {

  id: string;

  email: string | null;

  name: string | null;

  imageUrl: string | null;

};



export const GUEST_USER: AppUser = {

  id: "guest",

  email: null,

  name: null,

  imageUrl: null,

};



/** Returns the authenticated user for Server Components and actions. */

export async function getServerUser(): Promise<AppUser | null> {

  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) return null;



  const user = data.user;

  const meta = user.user_metadata as Record<string, unknown> | undefined;



  return {

    id: user.id,

    email: user.email ?? null,

    name:

      (typeof meta?.full_name === "string" && meta.full_name) ||

      (typeof meta?.name === "string" && meta.name) ||

      null,

    imageUrl: (typeof meta?.avatar_url === "string" && meta.avatar_url) || null,

  };

}



/** Loads onboarding status from DB with cookie fallback. */

export async function getOnboardingStatus(userId?: string | null): Promise<{

  completed: boolean;

  step: number;

}> {

  const actorId = resolveOnboardingActorId(userId);

  const cookieState = getOnboardingFromCookie(actorId);



  if (!userId || !isSupabaseConfigured()) {

    return {

      completed: cookieState.completed || isOnboardingGloballyComplete(),

      step: cookieState.step,

    };

  }



  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase

    .from("users")

    .select("onboarding_completed, onboarding_step")

    .eq("id", userId)

    .maybeSingle();



  if (error || !data) {

    return {

      completed: cookieState.completed || isOnboardingGloballyComplete(),

      step: cookieState.step,

    };

  }



  return {

    completed: data.onboarding_completed || cookieState.completed || isOnboardingGloballyComplete(),

    step: data.onboarding_step ?? cookieState.step,

  };

}


