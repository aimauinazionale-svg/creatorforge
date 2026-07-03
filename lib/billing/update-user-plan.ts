import { FREE_PLAN, PRO_PLAN, type PlanType } from "@/lib/billing/constants";
import { ensurePublicUserRow } from "@/lib/billing/ensure-user-row";
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

  const ensured = await ensurePublicUserRow(userId);
  if (!ensured.ok) {
    return { ok: false, reason: "db_error", message: ensured.message };
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

  const { data: updated, error } = await admin
    .from("users")
    .update(patch)
    .eq("id", userId)
    .select("id")
    .maybeSingle();

  if (error) {
    return { ok: false, reason: "db_error", message: error.message };
  }

  if (!updated) {
    return {
      ok: false,
      reason: "db_error",
      message: "User row missing after ensure step.",
    };
  }

  return { ok: true, userId, planType };
}

/** Finds a user id by email (case-insensitive), backfilling public.users from auth when needed. */
export async function findUserIdByEmail(email: string): Promise<string | null> {
  const admin = tryCreateSupabaseAdminClient();
  if (!admin) return null;

  const normalized = email.trim().toLowerCase();
  const { data } = await admin
    .from("users")
    .select("id")
    .ilike("email", normalized)
    .maybeSingle();

  if (data?.id) return data.id;

  let page = 1;
  while (page <= 10) {
    const { data: listData, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error || !listData.users.length) break;

    const match = listData.users.find(
      (user) => user.email?.trim().toLowerCase() === normalized
    );
    if (match) {
      const ensured = await ensurePublicUserRow(match.id, match.email);
      return ensured.ok ? match.id : null;
    }

    if (listData.users.length < 200) break;
    page += 1;
  }

  return null;
}
