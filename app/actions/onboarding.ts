"use server";

import { actionErr, actionOk, type ActionResult } from "@/lib/actions/result";
import { safeAction } from "@/lib/actions/safe";
import {
  getOnboardingFromCookie,
  resolveOnboardingActorId,
  saveOnboardingStepToCookie,
  setOnboardingCompleteInCookie,
} from "@/lib/onboarding/fallback";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { OnboardingDataSchema, type OnboardingData } from "@/lib/actions/types/onboarding";
import { isSupabaseConfigured } from "@/lib/supabase/env";

const defaultOnboardingData = (): OnboardingData => OnboardingDataSchema.parse({});

type OnboardingSaveResult = { step: number; savedLocally?: boolean };

async function getOnboardingActor() {
  const supabase = createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id ?? null;
  const actorId = resolveOnboardingActorId(userId);
  return { supabase, userId, actorId };
}

/** Returns saved onboarding state, or cookie fallback when the DB is unavailable. */
export async function getOnboardingStateAction(): Promise<
  ActionResult<{ completed: boolean; step: number; data: OnboardingData }>
> {
  return safeAction(async () => {
    const { supabase, userId, actorId } = await getOnboardingActor();
    const cookieState = getOnboardingFromCookie(actorId);

    if (!isSupabaseConfigured() || !userId) {
      const parsed = OnboardingDataSchema.safeParse(cookieState.data);
      return actionOk({
        completed: cookieState.completed,
        step: cookieState.step,
        data: parsed.success ? parsed.data : defaultOnboardingData(),
      });
    }

    const { data, error } = await supabase
      .from("users")
      .select("onboarding_completed, onboarding_step, onboarding_data")
      .eq("id", userId)
      .maybeSingle();

    if (error || !data) {
      const parsed = OnboardingDataSchema.safeParse(cookieState.data);
      return actionOk({
        completed: cookieState.completed,
        step: cookieState.step,
        data: parsed.success ? parsed.data : defaultOnboardingData(),
      });
    }

    const raw = (data.onboarding_data ?? {}) as Record<string, unknown>;
    const parsed = OnboardingDataSchema.safeParse(raw);

    return actionOk({
      completed: data.onboarding_completed || cookieState.completed,
      step: data.onboarding_step ?? cookieState.step,
      data: parsed.success ? parsed.data : defaultOnboardingData(),
    });
  }, "getOnboardingState");
}

export async function saveOnboardingStepAction(
  step: number,
  patch: OnboardingData
): Promise<ActionResult<OnboardingSaveResult>> {
  return safeAction(async () => {
    if (step < 0 || step > 5) return actionErr("INVALID_INPUT");

    const parsed = OnboardingDataSchema.safeParse(patch);
    if (!parsed.success) return actionErr("INVALID_INPUT");

    const { supabase, userId, actorId } = await getOnboardingActor();
    const cookieState = getOnboardingFromCookie(actorId);
    const merged = {
      ...cookieState.data,
      ...parsed.data,
    };

    if (!isSupabaseConfigured() || !userId) {
      saveOnboardingStepToCookie(actorId, step, merged);
      return actionOk({ step, savedLocally: true });
    }

    const { data: existing } = await supabase
      .from("users")
      .select("onboarding_data, email")
      .eq("id", userId)
      .maybeSingle();

    const dbMerged = {
      ...((existing?.onboarding_data ?? {}) as Record<string, unknown>),
      ...parsed.data,
    };

    const email = existing?.email || (await supabase.auth.getUser()).data.user?.email || "";

    const { error } = await supabase.from("users").upsert({
      id: userId,
      email,
      onboarding_step: step,
      onboarding_data: dbMerged,
    });

    if (error) {
      saveOnboardingStepToCookie(actorId, step, merged);
      return actionOk({ step, savedLocally: true });
    }

    return actionOk({ step });
  }, "saveOnboardingStep");
}

export async function completeOnboardingAction(
  data: OnboardingData
): Promise<ActionResult<{ completed: true; savedLocally?: boolean }>> {
  return safeAction(async () => {
    const parsed = OnboardingDataSchema.safeParse(data);
    if (!parsed.success) return actionErr("INVALID_INPUT");

    const { supabase, userId, actorId } = await getOnboardingActor();

    setOnboardingCompleteInCookie(actorId);
    saveOnboardingStepToCookie(actorId, 5, parsed.data);

    if (!isSupabaseConfigured() || !userId) {
      return actionOk({ completed: true, savedLocally: true });
    }

    const { data: userRow } = await supabase
      .from("users")
      .select("email")
      .eq("id", userId)
      .maybeSingle();

    const email = userRow?.email ?? (await supabase.auth.getUser()).data.user?.email ?? "";
    const freq = parsed.data.emailFrequency ?? "weekly";

    const { error } = await supabase.from("users").upsert({
      id: userId,
      email,
      onboarding_completed: true,
      onboarding_step: 5,
      onboarding_data: parsed.data,
    });

    if (error) {
      return actionOk({ completed: true, savedLocally: true });
    }

    if (email) {
      await supabase.from("email_preferences").upsert({
        user_id: userId,
        email,
        weekly_digest_frequency: freq === "weekly" || freq === "monthly" ? "weekly" : "weekly",
        onboarding_enabled: freq !== "never",
        weekly_digest_enabled: freq !== "never",
      });
    }

    return actionOk({ completed: true });
  }, "completeOnboarding");
}
