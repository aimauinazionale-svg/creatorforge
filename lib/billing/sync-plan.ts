import { listSubscriptions } from "@lemonsqueezy/lemonsqueezy.js";

import {
  FREE_PLAN,
  PRO_PLAN,
  PRO_SUBSCRIPTION_STATUSES,
  type PlanType,
} from "@/lib/billing/constants";
import { configureLemonSqueezy, getBillingConfig } from "@/lib/billing/lemonsqueezy";
import { applyUserPlanUpdate } from "@/lib/billing/update-user-plan";

export type SyncPlanResult =
  | { ok: true; planType: PlanType; subscriptionId: string | null; subscriptionStatus: string | null }
  | {
      ok: false;
      planType: PlanType;
      reason: "not_configured" | "api_error" | "no_subscription" | "admin_unavailable" | "db_error";
      message?: string;
    };

/**
 * Pulls the user's LemonSqueezy subscription and writes plan fields to Supabase.
 * Used after checkout and as a webhook fallback.
 */
export async function syncUserPlanFromLemonSqueezy(
  userId: string,
  email: string
): Promise<SyncPlanResult> {
  const { storeId, isConfigured } = getBillingConfig();
  if (!isConfigured || !storeId) {
    return { ok: false, planType: FREE_PLAN, reason: "not_configured" };
  }

  configureLemonSqueezy();

  const response = await listSubscriptions({
    filter: {
      storeId: Number(storeId),
      userEmail: email.trim(),
    },
  });

  if (response.error) {
    const message =
      typeof response.error === "object" && response.error && "message" in response.error
        ? String((response.error as { message?: string }).message)
        : "LemonSqueezy API error";
    return { ok: false, planType: FREE_PLAN, reason: "api_error", message };
  }

  const subscriptions = response.data?.data ?? [];
  if (subscriptions.length === 0) {
    return { ok: false, planType: FREE_PLAN, reason: "no_subscription" };
  }

  const active =
    subscriptions.find((sub) => PRO_SUBSCRIPTION_STATUSES.has(sub.attributes.status)) ??
    subscriptions[0];

  const status = active.attributes.status ?? "unknown";
  const planType = PRO_SUBSCRIPTION_STATUSES.has(status) ? PRO_PLAN : FREE_PLAN;
  const customerId =
    active.attributes.customer_id != null ? String(active.attributes.customer_id) : null;

  const update = await applyUserPlanUpdate(userId, planType, {
    customerId,
    subscriptionId: active.id,
    subscriptionStatus: status,
  });

  if (!update.ok) {
    return {
      ok: false,
      planType: FREE_PLAN,
      reason: update.reason,
      message: update.message,
    };
  }

  return {
    ok: true,
    planType,
    subscriptionId: active.id,
    subscriptionStatus: status,
  };
}
