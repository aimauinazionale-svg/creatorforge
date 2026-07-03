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
import { applyUserPlanUpdate, findUserIdByEmail } from "@/lib/billing/update-user-plan";
import { getBillingEnvDiagnostics, logWebhook } from "@/lib/billing/webhook-log";

export const dynamic = "force-dynamic";

const PRO_GRANT_EVENTS = new Set([
  "subscription_created",
  "order_created",
  "subscription_payment_success",
  "subscription_resumed",
]);

const PRO_REVOKE_EVENTS = new Set(["subscription_cancelled", "subscription_expired"]);

async function resolveUserId(
  payload: NonNullable<ReturnType<typeof parseWebhookPayload>>
): Promise<{ userId: string | null; source: string }> {
  const fromCustom = getUserIdFromWebhook(payload);
  if (fromCustom) return { userId: fromCustom, source: "custom_data" };

  const email = payload.data.attributes.user_email?.trim();
  if (email) {
    const userId = await findUserIdByEmail(email);
    if (userId) return { userId, source: "email" };
  }

  return { userId: null, source: "none" };
}

/** LemonSqueezy billing webhook — always returns 200 to avoid retry storms. */
export async function POST(request: Request) {
  const envDiag = getBillingEnvDiagnostics();

  try {
    const rawBody = await request.text();
    const signature = request.headers.get("X-Signature");
    const hasSignature = Boolean(signature);

    if (!verifyWebhook(rawBody, signature)) {
      logWebhook("error", "Invalid webhook signature or missing secret", {
        hasSignature,
        ...envDiag,
      });
      return NextResponse.json({ received: true });
    }

    const payload = parseWebhookPayload(rawBody);
    if (!payload) {
      logWebhook("error", "Invalid webhook payload");
      return NextResponse.json({ received: true });
    }

    const eventName = payload.meta.event_name;
    const attrs = payload.data.attributes;
    const { userId, source } = await resolveUserId(payload);

    logWebhook("info", "Webhook received", {
      eventName,
      dataType: payload.data.type,
      userSource: source,
      hasUserId: Boolean(userId),
      userEmailPresent: Boolean(attrs.user_email),
      ...envDiag,
    });

    if (!userId) {
      logWebhook("error", "Could not resolve user for event", {
        eventName,
        userEmailPresent: Boolean(attrs.user_email),
      });
      return NextResponse.json({ received: true });
    }

    const customerId = attrs.customer_id != null ? String(attrs.customer_id) : null;
    const subscriptionId =
      payload.data.type === "subscriptions" ? payload.data.id : null;

    if (PRO_GRANT_EVENTS.has(eventName)) {
      const result = await applyUserPlanUpdate(userId, PRO_PLAN, {
        customerId,
        subscriptionId,
        subscriptionStatus: attrs.status ?? "active",
      });

      if (!result.ok) {
        logWebhook("error", "Failed to grant Pro plan", {
          eventName,
          reason: result.reason,
          detail: result.message,
        });
      } else {
        logWebhook("info", "Pro plan granted", { eventName, userId, source });
      }
      return NextResponse.json({ received: true });
    }

    if (eventName === "subscription_updated") {
      const status = attrs.status ?? "unknown";
      const planType = PRO_SUBSCRIPTION_STATUSES.has(status) ? PRO_PLAN : FREE_PLAN;
      const result = await applyUserPlanUpdate(userId, planType, {
        customerId,
        subscriptionId,
        subscriptionStatus: status,
      });

      if (!result.ok) {
        logWebhook("error", "Failed to update subscription", {
          eventName,
          status,
          reason: result.reason,
          detail: result.message,
        });
      } else {
        logWebhook("info", "Subscription updated", { eventName, userId, planType, status });
      }
      return NextResponse.json({ received: true });
    }

    if (PRO_REVOKE_EVENTS.has(eventName)) {
      const result = await applyUserPlanUpdate(userId, FREE_PLAN, {
        customerId,
        subscriptionId,
        subscriptionStatus: attrs.status ?? eventName.replace("subscription_", ""),
      });

      if (!result.ok) {
        logWebhook("error", "Failed to revoke Pro plan", {
          eventName,
          reason: result.reason,
          detail: result.message,
        });
      } else {
        logWebhook("info", "Pro plan revoked", { eventName, userId });
      }
      return NextResponse.json({ received: true });
    }

    logWebhook("info", "Unhandled event (ignored)", { eventName });
  } catch (err) {
    logWebhook("error", "Handler error", {
      detail: err instanceof Error ? err.message : "unknown",
      ...envDiag,
    });
  }

  return NextResponse.json({ received: true });
}
