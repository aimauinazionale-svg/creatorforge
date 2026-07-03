/** User plan stored in `users.plan_type`. */
export type PlanType = "free" | "pro";

export const PRO_PLAN: PlanType = "pro";
export const FREE_PLAN: PlanType = "free";

/** Cookie set by middleware with the authenticated user's plan (lightweight pro checks). */
export const PLAN_COOKIE_NAME = "cf_plan_type";

/**
 * App routes that require an active Pro subscription.
 * Paths are without locale prefix (e.g. `ai-assistant`, not `/en/ai-assistant`).
 */
export const PROTECTED_PRO_ROUTES = [
  "ai-assistant",
  "competitors",
  "seo-lab",
] as const;

export type ProtectedProRoute = (typeof PROTECTED_PRO_ROUTES)[number];

/** LemonSqueezy subscription statuses that grant Pro access. */
export const PRO_SUBSCRIPTION_STATUSES = new Set([
  "active",
  "on_trial",
  "paused",
  "past_due",
]);
