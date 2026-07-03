import { cookies } from "next/headers";

import { getCookieAiUsage, incrementCookieAiRequest } from "@/lib/ai/fallback-rate-limit";
import { PLAN_COOKIE_NAME, PRO_PLAN, type PlanType } from "@/lib/billing/constants";
import { isProPlan } from "@/lib/billing/plan";
import { getOrCreateGuestId } from "@/lib/onboarding/fallback";
import { isSupabaseSchemaError, logSupabaseError } from "@/lib/supabase/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AiRateLimitError = {
  code: "RATE_LIMITED" | "UNAUTHENTICATED" | "DB_ERROR";
  details?: string;
  limit?: number;
  used?: number;
  remaining?: number;
};

export type AiRateLimitStatus = {
  limit: number;
  used: number;
  remaining: number;
  nearLimit: boolean;
  unlimited?: boolean;
};

export type AiRateLimitResult =
  | { ok: true; data: AiRateLimitStatus }
  | { ok: false; error: AiRateLimitError };

/** Free-tier AI requests per calendar month (UTC). */
export const FREE_MONTHLY_LIMIT = 100;

/** @deprecated Use FREE_MONTHLY_LIMIT */
export const FREE_DAILY_LIMIT = FREE_MONTHLY_LIMIT;

const NEAR_LIMIT_RATIO = 0.8;

function utcMonthBounds(date = new Date()): { start: string; end: string } {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 0, 0, 0));
  const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1, 0, 0, 0));
  return { start: start.toISOString(), end: end.toISOString() };
}

function unlimitedStatus(): AiRateLimitStatus {
  return {
    limit: FREE_MONTHLY_LIMIT,
    used: 0,
    remaining: FREE_MONTHLY_LIMIT,
    nearLimit: false,
    unlimited: true,
  };
}

export function statusFromUsed(used: number): AiRateLimitStatus {
  const remaining = Math.max(0, FREE_MONTHLY_LIMIT - used);
  const nearThreshold = Math.floor(FREE_MONTHLY_LIMIT * NEAR_LIMIT_RATIO);
  return {
    limit: FREE_MONTHLY_LIMIT,
    used,
    remaining,
    nearLimit: used >= nearThreshold,
  };
}

async function resolveUserHasUnlimitedAi(userId: string): Promise<boolean> {
  try {
    const cookiePlan = cookies().get(PLAN_COOKIE_NAME)?.value;
    if (cookiePlan === PRO_PLAN) return true;

    const supabase = createSupabaseServerClient();
    const { data } = await supabase
      .from("users")
      .select("plan_type")
      .eq("id", userId)
      .maybeSingle();

    const plan: PlanType = data?.plan_type === PRO_PLAN ? PRO_PLAN : "free";
    return isProPlan(plan);
  } catch {
    return false;
  }
}

async function countDbRequests(userId: string): Promise<
  | { ok: true; used: number }
  | { ok: false; useFallback: true }
  | { ok: false; useFallback: false; error: AiRateLimitError }
> {
  const supabase = createSupabaseServerClient();
  const { start, end } = utcMonthBounds();
  const { count, error } = await supabase
    .from("ai_requests")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", start)
    .lt("created_at", end);

  if (!error) return { ok: true, used: count ?? 0 };

  if (isSupabaseSchemaError(error)) {
    logSupabaseError("ai_requests:count", error);
    return { ok: false, useFallback: true };
  }

  logSupabaseError("ai_requests:count", error);
  return { ok: false, useFallback: true };
}

export async function checkAIRateLimit(userId: string): Promise<AiRateLimitResult> {
  const supabase = createSupabaseServerClient();

  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError) {
    return { ok: false, error: { code: "UNAUTHENTICATED", details: authError.message } };
  }
  if (!auth.user || auth.user.id !== userId) {
    return { ok: false, error: { code: "UNAUTHENTICATED" } };
  }

  if (await resolveUserHasUnlimitedAi(userId)) {
    return { ok: true, data: unlimitedStatus() };
  }

  const counted = await countDbRequests(userId);
  const used = counted.ok ? counted.used : getCookieAiUsage(userId);

  if (used >= FREE_MONTHLY_LIMIT) {
    const remaining = Math.max(0, FREE_MONTHLY_LIMIT - used);
    return {
      ok: false,
      error: {
        code: "RATE_LIMITED",
        limit: FREE_MONTHLY_LIMIT,
        used,
        remaining,
      },
    };
  }

  return { ok: true, data: statusFromUsed(used) };
}

export async function incrementAIRequest(
  userId: string,
  requestType: string
): Promise<{ ok: true } | { ok: false; error: AiRateLimitError }> {
  if (await resolveUserHasUnlimitedAi(userId)) {
    return { ok: true };
  }

  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from("ai_requests").insert({
    user_id: userId,
    request_type: requestType,
  });

  if (!error) return { ok: true };

  if (isSupabaseSchemaError(error)) {
    logSupabaseError("ai_requests:insert", error);
  } else {
    logSupabaseError("ai_requests:insert", error);
  }

  incrementCookieAiRequest(userId, requestType);
  return { ok: true };
}

/**
 * Kept for compatibility. Monthly limits reset automatically at UTC month boundaries.
 */
export async function resetDailyCounter(
  _userId: string
): Promise<{ ok: true; reset: false } | { ok: false; error: AiRateLimitError }> {
  return { ok: true, reset: false };
}

export type AiActor = {
  actorId: string;
  isAuthenticated: boolean;
};

/** Resolves authenticated user id or stable guest id for AI rate limiting. */
export async function resolveAiActor(): Promise<AiActor> {
  try {
    const supabase = createSupabaseServerClient();
    const { data: auth } = await supabase.auth.getUser();
    if (auth.user) {
      return { actorId: auth.user.id, isAuthenticated: true };
    }
  } catch {
    // Fall through to guest id.
  }
  return { actorId: getOrCreateGuestId(), isAuthenticated: false };
}

/** Rate limit check that works for authenticated users and guests (cookie fallback). */
export async function checkAiRateLimitFlexible(): Promise<AiRateLimitResult> {
  const { actorId, isAuthenticated } = await resolveAiActor();

  if (isAuthenticated) {
    const result = await checkAIRateLimit(actorId);
    if (result.ok || result.error.code === "RATE_LIMITED") {
      return result;
    }
    // Auth/DB issues: fall back to cookie counting for this actor.
  }

  const used = getCookieAiUsage(actorId);
  if (used >= FREE_MONTHLY_LIMIT) {
    return {
      ok: false,
      error: {
        code: "RATE_LIMITED",
        limit: FREE_MONTHLY_LIMIT,
        used,
        remaining: 0,
      },
    };
  }

  return { ok: true, data: statusFromUsed(used) };
}

/** Logs an AI request for authenticated users (DB + cookie fallback) or guests (cookie only). */
export async function incrementAiRequestFlexible(
  requestType: string
): Promise<{ ok: true } | { ok: false; error: AiRateLimitError }> {
  const { actorId, isAuthenticated } = await resolveAiActor();

  if (isAuthenticated) {
    return incrementAIRequest(actorId, requestType);
  }

  incrementCookieAiRequest(actorId, requestType);
  return { ok: true };
}
