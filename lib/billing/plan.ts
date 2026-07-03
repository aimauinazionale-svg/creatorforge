import type { NextRequest } from "next/server";

import {
  FREE_PLAN,
  PLAN_COOKIE_NAME,
  PRO_PLAN,
  type PlanType,
} from "./constants";

function normalizePlanType(value: string | null | undefined): PlanType {
  return value === PRO_PLAN ? PRO_PLAN : FREE_PLAN;
}

/** Reads plan type from the middleware cookie fallback. */
export function getPlanFromCookie(request: NextRequest): PlanType | null {
  const raw = request.cookies.get(PLAN_COOKIE_NAME)?.value;
  if (raw === PRO_PLAN || raw === FREE_PLAN) return raw;
  return null;
}

/** Returns true when plan type is Pro. */
export function isProPlan(plan: PlanType): boolean {
  return plan === PRO_PLAN;
}

export function planTypeToCookieValue(plan: PlanType): string {
  return plan;
}

export function resolvePlanType(dbPlan: string | null | undefined, cookiePlan: PlanType | null): PlanType {
  if (dbPlan) return normalizePlanType(dbPlan);
  if (cookiePlan) return cookiePlan;
  return FREE_PLAN;
}
