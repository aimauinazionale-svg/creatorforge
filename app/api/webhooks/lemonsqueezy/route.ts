import { NextResponse } from "next/server";

import {
  FREE_PLAN,
  PRO_PLAN,
  PRO_SUBSCRIPTION_STATUSES,
} from "@/lib/billing/constants";
import {
  getUserIdFromWebhook,
  parseWebhookPayload,
  verifyWebhook,
} from "@/lib/billing/lemonsqueezy";
import { tryCreateSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";

export const dynamic = "force-dynamic";

type UserUpdate = Database["public"]["Tables"]["users"]["Update"];

async function findUserIdByEmail(email: string): Promise<string | null> {
  const admin = tryCreateSupabaseAdminClient();
  if (!admin) return null;

  const { data } = await admin.from("users").select("id").eq("email", email).maybeSingle();
  return data?.id ?? null;
}

async function updateUserPlan(
  userId: string,
  planType: typeof FREE_PLAN | typeof PRO_PLAN,
  extras?: {
    customerId?: string | null;
    subscriptionId?: string | null;
    subscriptionStatus?: string | null;
  }
): Promise<void> {
  const admin = tryCreateSupabaseAdminClient();
  if (!admin) {
    console.error("[webhook:lemonsqueezy] Admin client unavailable — cannot update plan.");
    return;
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
    console.error("[webhook:lemonsqueezy] Failed to update user plan:", error.message);
  }
}

async function resolveUserId(
  payload: ReturnType<typeof parseWebhookPayload> extends infer T ? NonNullable<T> : never
): Promise<string | null> {
  const fromCustom = getUserIdFromWebhook(payload);
  if (fromCustom) return fromCustom;

  const email = payload.data.attributes.user_email;
  if (email) {
    return findUserIdByEmail(email);
  }

  return null;
}

/** LemonSqueezy billing webhook — always returns 200 to avoid retry storms. */
export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("X-Signature");

    if (!verifyWebhook(rawBody, signature)) {
      console.error("[webhook:lemonsqueezy] Invalid webhook signature.");
      return NextResponse.json({ received: true });
    }

    const payload = parseWebhookPayload(rawBody);
    if (!payload) {
      console.error("[webhook:lemonsqueezy] Invalid webhook payload.");
      return NextResponse.json({ received: true });
    }

    const eventName = payload.meta.event_name;
    const attrs = payload.data.attributes;
    const userId = await resolveUserId(payload);

    if (!userId) {
      console.error("[webhook:lemonsqueezy] Could not resolve user for event:", eventName);
      return NextResponse.json({ received: true });
    }

    const customerId = attrs.customer_id != null ? String(attrs.customer_id) : null;
    const subscriptionId =
      payload.data.type === "subscriptions" ? payload.data.id : null;

    switch (eventName) {
      case "subscription_created":
      case "order_created": {
        await updateUserPlan(userId, PRO_PLAN, {
          customerId,
          subscriptionId,
          subscriptionStatus: attrs.status ?? "active",
        });
        break;
      }

      case "subscription_updated": {
        const status = attrs.status ?? "unknown";
        const planType = PRO_SUBSCRIPTION_STATUSES.has(status) ? PRO_PLAN : FREE_PLAN;
        await updateUserPlan(userId, planType, {
          customerId,
          subscriptionId,
          subscriptionStatus: status,
        });
        break;
      }

      case "subscription_cancelled":
      case "subscription_expired": {
        await updateUserPlan(userId, FREE_PLAN, {
          customerId,
          subscriptionId,
          subscriptionStatus: attrs.status ?? eventName.replace("subscription_", ""),
        });
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error(
      "[webhook:lemonsqueezy] Handler error:",
      err instanceof Error ? err.message : "unknown"
    );
  }

  return NextResponse.json({ received: true });
}
