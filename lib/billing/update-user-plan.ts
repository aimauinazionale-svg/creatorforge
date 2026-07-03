import { FREE_PLAN, PRO_PLAN, type PlanType } from "@/lib/billing/constants";
import { tryCreateSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";

type UserUpdate = Database["public"]["Tables"]["users"]["Update"];

export type PlanUpdateExtras = {
  customerId?: string | null;
  subscriptionId?: string | null;
  subscriptionStatus?: string | null;
};

export type PlanUpdateResult =
  | { ok: true; userId: string; planType: PlanType }
  | { ok: false; reason: "admin_unavailable" | "db_error"; message: string };

/** Updates `users.plan_type` and LemonSqueezy fields (service role — webhooks & sync). */
export async function applyUserPlanUpdate(
  userId: string,
  planType: typeof FREE_PLAN | typeof PRO_PLAN,
  extras?: PlanUpdateExtras
): Promise<PlanUpdateResult> {
  const admin = tryCreateSupabaseAdminClient();
  if (!admin) {
    return {
      ok: false,
      reason: "admin_unavailable",
      message: "SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL missing.",
    };
  }

  const patch: UserUpdate = { plan_type: planType };

  if (extras?.customerId) {
    patch.lemonsqueezy_customer_id = extras.customerId;
  }
  if (extras?.subscriptionId) {
    patch.lemonsqueezy_subscription_id = extras.subscriptionId;
  }
  if (extras?.subscriptionStatus !== undefined) {
    patch.subscription_status = extras.subscriptionStatus;
  }

  const { error } = await admin.from("users").update(patch).eq("id", userId);

  if (error) {
    return { ok: false, reason: "db_error", message: error.message };
  }

  return { ok: true, userId, planType };
}

/** Finds a user id by email (case-insensitive). */
export async function findUserIdByEmail(email: string): Promise<string | null> {
  const admin = tryCreateSupabaseAdminClient();
  if (!admin) return null;

  const normalized = email.trim().toLowerCase();
  const { data } = await admin
    .from("users")
    .select("id")
    .ilike("email", normalized)
    .maybeSingle();

  return data?.id ?? null;
}
