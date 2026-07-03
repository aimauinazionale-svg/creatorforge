import { cookies } from "next/headers";

const DONE_PREFIX = "cf_onboarding_done_";
const STEP_PREFIX = "cf_onboarding_step_";
const DATA_PREFIX = "cf_onboarding_data_";
const GUEST_ID_COOKIE = "cf_guest_id";
export const ONBOARDING_COMPLETED_COOKIE = "onboarding_completed";

const COOKIE_OPTIONS = {
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
  sameSite: "lax" as const,
};

function doneCookieName(actorId: string): string {
  return `${DONE_PREFIX}${actorId}`;
}

function stepCookieName(actorId: string): string {
  return `${STEP_PREFIX}${actorId}`;
}

function dataCookieName(actorId: string): string {
  return `${DATA_PREFIX}${actorId}`;
}

/** Stable id for guest/demo onboarding when auth is unavailable. */
export function getOrCreateGuestId(): string {
  try {
    const store = cookies();
    const existing = store.get(GUEST_ID_COOKIE)?.value;
    if (existing) return existing;

    const id = crypto.randomUUID();
    try {
      store.set(GUEST_ID_COOKIE, id, COOKIE_OPTIONS);
    } catch {
      // Cookie writes can fail in read-only Server Component contexts.
    }
    return id;
  } catch {
    return "guest-fallback";
  }
}

/** Actor key for cookie persistence (auth user id or guest id). */
export function resolveOnboardingActorId(userId: string | null | undefined): string {
  return userId ?? getOrCreateGuestId();
}

export type OnboardingCookieState = {
  completed: boolean;
  step: number;
  data: Record<string, unknown>;
};

/** Whether onboarding was completed via cookie fallback. */
export function isOnboardingCompleteInCookie(actorId: string): boolean {
  const store = cookies();
  return (
    store.get(ONBOARDING_COMPLETED_COOKIE)?.value === "true" ||
    store.get(doneCookieName(actorId))?.value === "1"
  );
}

/** Global onboarding completion flag (guest/demo and authenticated fallback). */
export function isOnboardingGloballyComplete(): boolean {
  return cookies().get(ONBOARDING_COMPLETED_COOKIE)?.value === "true";
}

/** Reads step/data/completion from cookie fallback storage. */
export function getOnboardingFromCookie(actorId: string): OnboardingCookieState {
  const store = cookies();
  const completed = isOnboardingCompleteInCookie(actorId);
  const stepRaw = store.get(stepCookieName(actorId))?.value;
  const parsedStep = stepRaw ? Number.parseInt(stepRaw, 10) : 0;
  const step = completed ? 5 : Number.isFinite(parsedStep) ? parsedStep : 0;

  const dataRaw = store.get(dataCookieName(actorId))?.value;
  if (!dataRaw) {
    return { completed, step, data: {} };
  }

  try {
    const parsed = JSON.parse(dataRaw) as unknown;
    return {
      completed,
      step,
      data: parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : {},
    };
  } catch {
    return { completed, step, data: {} };
  }
}

/** Persists onboarding step progress when Supabase is unavailable or DB writes fail. */
export function saveOnboardingStepToCookie(
  actorId: string,
  step: number,
  data: Record<string, unknown>
): void {
  try {
    const store = cookies();
    store.set(stepCookieName(actorId), String(step), COOKIE_OPTIONS);
    store.set(dataCookieName(actorId), JSON.stringify(data), COOKIE_OPTIONS);
  } catch {
    // Cookie writes can fail in read-only contexts; caller still returns success.
  }
}

/** Persists onboarding completion when Supabase is unavailable or DB writes fail. */
export function setOnboardingCompleteInCookie(actorId: string): void {
  try {
    const store = cookies();
    store.set(doneCookieName(actorId), "1", COOKIE_OPTIONS);
    store.set(ONBOARDING_COMPLETED_COOKIE, "true", COOKIE_OPTIONS);
    store.set(stepCookieName(actorId), "5", COOKIE_OPTIONS);
  } catch {
    // Cookie writes can fail in read-only contexts; caller still returns success.
  }
}
