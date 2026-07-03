import { getCookieAiUsage, incrementCookieAiRequest } from "@/lib/ai/fallback-rate-limit";
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
};

export type AiRateLimitResult =
  | { ok: true; data: AiRateLimitStatus }
  | { ok: false; error: AiRateLimitError };

export const FREE_DAILY_LIMIT = 10;

function utcDayBounds(date = new Date()): { start: string; end: string } {
  const start = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0)
  );
  const end = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 1, 0, 0, 0)
  );
  return { start: start.toISOString(), end: end.toISOString() };
}

export function statusFromUsed(used: number): AiRateLimitStatus {
  const remaining = Math.max(0, FREE_DAILY_LIMIT - used);
  return {
    limit: FREE_DAILY_LIMIT,
    used,
    remaining,
    nearLimit: used >= 8,
  };
}

async function countDbRequests(userId: string): Promise<
  | { ok: true; used: number }
  | { ok: false; useFallback: true }
  | { ok: false; useFallback: false; error: AiRateLimitError }
> {
  const supabase = createSupabaseServerClient();
  const { start, end } = utcDayBounds();
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

  const counted = await countDbRequests(userId);
  const used =
    counted.ok ? counted.used : getCookieAiUsage(userId);

  if (used >= FREE_DAILY_LIMIT) {
    const remaining = Math.max(0, FREE_DAILY_LIMIT - used);
    return {
      ok: false,
      error: {
        code: "RATE_LIMITED",
        limit: FREE_DAILY_LIMIT,
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
 * If the system counts rows by day, there is nothing to reset.
 * This is kept for compatibility and future quota implementations.
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
  if (used >= FREE_DAILY_LIMIT) {
    return {
      ok: false,
      error: {
        code: "RATE_LIMITED",
        limit: FREE_DAILY_LIMIT,
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
