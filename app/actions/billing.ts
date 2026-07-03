"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getServerUser } from "@/lib/auth/session";
import {
  getCheckoutUrl,
  getCustomerPortalUrl,
  getDefaultVariantId,
  isLemonSqueezyConfigured,
  LemonSqueezyCheckoutError,
} from "@/lib/billing/lemonsqueezy";
import { PRO_PLAN, type PlanType } from "@/lib/billing/constants";
import { ensurePublicUserRow } from "@/lib/billing/ensure-user-row";
import { syncUserPlanFromLemonSqueezy } from "@/lib/billing/sync-plan";
import type {
  BillingActionResult,
  CheckoutActionData,
  PortalActionData,
  SubscriptionStatusData,
} from "@/lib/actions/types/billing";

function billingErr<T>(
  code: Extract<BillingActionResult<T>, { ok: false }>["error"]["code"],
  details?: string
): BillingActionResult<T> {
  return { ok: false, error: { code, details } };
}

function normalizePlanType(value: string | null | undefined): PlanType {
  return value === PRO_PLAN ? PRO_PLAN : "free";
}

/** Creates a LemonSqueezy checkout session for the authenticated user. */
export async function createCheckoutAction(): Promise<BillingActionResult<CheckoutActionData>> {
  try {
    const envLengths = {
      apiKey: (process.env.LEMONSQUEEZY_API_KEY ?? "").length,
      storeId: (process.env.LEMONSQUEEZY_STORE_ID ?? "").length,
      variantId: (process.env.LEMONSQUEEZY_VARIANT_ID ?? "").length,
    };

    if (!isLemonSqueezyConfigured()) {
      console.error("[server-action:createCheckoutAction] MISSING_CONFIG", envLengths);
      return billingErr("MISSING_CONFIG");
    }

    const user = await getServerUser();
    if (!user?.email) {
      return billingErr("UNAUTHENTICATED");
    }

    const variantId = getDefaultVariantId();
    const url = await getCheckoutUrl(variantId, user.email, user.id);

    return { ok: true, data: { url } };
  } catch (err) {
    if (err instanceof LemonSqueezyCheckoutError) {
      console.error("[server-action:createCheckoutAction] CHECKOUT_FAILED", {
        statusCode: err.statusCode,
        apiDetail: err.apiDetail,
      });
      return billingErr("CHECKOUT_FAILED", err.apiDetail);
    }
    console.error("[server-action:createCheckoutAction]", err);
    return billingErr("UNKNOWN", err instanceof Error ? err.message : undefined);
  }
}

/** Returns the current user's subscription plan from Supabase. */
export async function getUserSubscriptionStatus(): Promise<
  BillingActionResult<SubscriptionStatusData>
> {
  try {
    const user = await getServerUser();
    if (!user) {
      return billingErr("UNAUTHENTICATED");
    }

    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("users")
      .select(
        "plan_type, subscription_status, lemonsqueezy_customer_id, lemonsqueezy_subscription_id"
      )
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      return billingErr("UNKNOWN", error.message);
    }

    return {
      ok: true,
      data: {
        planType: normalizePlanType(data?.plan_type),
        subscriptionStatus: data?.subscription_status ?? null,
        customerId: data?.lemonsqueezy_customer_id ?? null,
        subscriptionId: data?.lemonsqueezy_subscription_id ?? null,
      },
    };
  } catch (err) {
    console.error("[server-action:getUserSubscriptionStatus]", err);
    return billingErr("UNKNOWN", err instanceof Error ? err.message : undefined);
  }
}

export type SyncSubscriptionData = {
  planType: PlanType;
  subscriptionStatus: string | null;
  synced: boolean;
};

/**
 * Pulls subscription state from LemonSqueezy and updates Supabase.
 * Called after checkout success when the webhook may be delayed or misconfigured.
 */
export async function syncSubscriptionAction(): Promise<BillingActionResult<SyncSubscriptionData>> {
  try {
    if (!isLemonSqueezyConfigured()) {
      return billingErr("MISSING_CONFIG");
    }

    const user = await getServerUser();
    if (!user?.email) {
      return billingErr("UNAUTHENTICATED");
    }

    const ensured = await ensurePublicUserRow(user.id, user.email);
    if (!ensured.ok) {
      return billingErr("UNKNOWN", ensured.message);
    }

    const sync = await syncUserPlanFromLemonSqueezy(user.id, user.email);

    if (!sync.ok) {
      if (sync.reason === "no_subscription") {
        const status = await getUserSubscriptionStatus();
        if (status.ok) {
          return {
            ok: true,
            data: {
              planType: status.data.planType,
              subscriptionStatus: status.data.subscriptionStatus,
              synced: false,
            },
          };
        }
      }
      return billingErr("UNKNOWN", sync.message ?? sync.reason);
    }

    return {
      ok: true,
      data: {
        planType: sync.planType,
        subscriptionStatus: sync.subscriptionStatus,
        synced: true,
      },
    };
  } catch (err) {
    console.error("[server-action:syncSubscriptionAction]", err);
    return billingErr("UNKNOWN", err instanceof Error ? err.message : undefined);
  }
}

/** Returns the LemonSqueezy customer portal URL for Pro subscribers. */
export async function getCustomerPortalAction(): Promise<BillingActionResult<PortalActionData>> {
  try {
    if (!isLemonSqueezyConfigured()) {
      return billingErr("MISSING_CONFIG");
    }

    const user = await getServerUser();
    if (!user) {
      return billingErr("UNAUTHENTICATED");
    }

    const status = await getUserSubscriptionStatus();
    if (!status.ok) return status;

    if (status.data.planType !== PRO_PLAN) {
      return billingErr("NOT_PRO");
    }

    const customerId = status.data.customerId;
    if (!customerId) {
      return billingErr(
        "NOT_FOUND",
        "No LemonSqueezy customer id on file. Contact support if you recently subscribed."
      );
    }

    const url = await getCustomerPortalUrl(customerId, status.data.subscriptionId);
    return { ok: true, data: { url } };
  } catch (err) {
    console.error("[server-action:getCustomerPortalAction]", err);
    return billingErr("UNKNOWN", err instanceof Error ? err.message : undefined);
  }
}
