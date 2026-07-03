import { getSiteUrl, SITE_NAME } from "@/lib/site";

import crypto from "node:crypto";

import {
  createCheckout,
  getCustomer,
  getSubscription,
  lemonSqueezySetup,
} from "@lemonsqueezy/lemonsqueezy.js";

/** Lemon Squeezy checkout/API failure (safe to log server-side). */
export class LemonSqueezyCheckoutError extends Error {
  readonly statusCode: number | null;
  readonly apiDetail: string;

  constructor(message: string, statusCode: number | null, apiDetail: string) {
    super(message);
    this.name = "LemonSqueezyCheckoutError";
    this.statusCode = statusCode;
    this.apiDetail = apiDetail;
  }
}

function formatLemonSqueezyApiDetail(cause: unknown): string {
  if (!cause) return "unknown";
  if (typeof cause === "string") return cause.slice(0, 200);
  if (Array.isArray(cause)) {
    const first = cause[0] as { title?: string; detail?: string; status?: string } | undefined;
    if (first?.detail) return first.detail.slice(0, 200);
    if (first?.title) return first.title.slice(0, 200);
  }
  if (cause instanceof Error) return cause.message.slice(0, 200);
  return "unknown";
}

let isConfigured = false;

function getBillingConfig() {
  const apiKey = process.env.LEMONSQUEEZY_API_KEY;
  const storeId = process.env.LEMONSQUEEZY_STORE_ID;
  const variantId = process.env.LEMONSQUEEZY_VARIANT_ID;
  const webhookSecret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;

  return {
    apiKey,
    storeId,
    variantId,
    webhookSecret,
    isConfigured: Boolean(apiKey && storeId && variantId),
  };
}

/** Initializes the LemonSqueezy SDK (idempotent). */
export function configureLemonSqueezy(): void {
  if (isConfigured) return;

  const { apiKey } = getBillingConfig();
  if (!apiKey) {
    throw new Error("LEMONSQUEEZY_API_KEY is not configured.");
  }

  lemonSqueezySetup({
    apiKey,
    onError: (error) => {
      console.error("[lemonsqueezy]", error);
    },
  });

  isConfigured = true;
}

export function isLemonSqueezyConfigured(): boolean {
  return getBillingConfig().isConfigured;
}

/**
 * Creates a personalized checkout URL for the Pro plan variant.
 */
export async function getCheckoutUrl(
  variantId: string,
  userEmail: string,
  userId: string
): Promise<string> {
  configureLemonSqueezy();

  const { storeId } = getBillingConfig();
  if (!storeId) {
    throw new Error("LEMONSQUEEZY_STORE_ID is not configured.");
  }

  const siteUrl = getSiteUrl();

  const checkout = await createCheckout(storeId, variantId, {
    checkoutData: {
      email: userEmail,
      custom: {
        user_id: userId,
      },
    },
    productOptions: {
      redirectUrl: `${siteUrl}/settings/billing?checkout=success`,
      receiptButtonText: "Go to billing",
      receiptThankYouNote: `Thank you for upgrading to ${SITE_NAME} Pro!`,
    },
  });

  if (checkout.error) {
    const apiDetail = formatLemonSqueezyApiDetail(checkout.error.cause);
    console.error("[lemonsqueezy] createCheckout failed", {
      statusCode: checkout.statusCode,
      storeIdLen: storeId.length,
      variantIdLen: variantId.length,
      apiDetail,
    });
    throw new LemonSqueezyCheckoutError(
      "Lemon Squeezy checkout creation failed.",
      checkout.statusCode,
      apiDetail
    );
  }

  const url = checkout.data?.data.attributes.url;
  if (!url) {
    throw new LemonSqueezyCheckoutError(
      "Checkout URL missing from LemonSqueezy response.",
      checkout.statusCode,
      "empty checkout url"
    );
  }

  return url;
}

/** Default Pro variant from environment. */
export function getDefaultVariantId(): string {
  const { variantId } = getBillingConfig();
  if (!variantId) {
    throw new Error("LEMONSQUEEZY_VARIANT_ID is not configured.");
  }
  return variantId;
}

/**
 * Verifies LemonSqueezy webhook HMAC signature (`X-Signature` header).
 */
export function verifyWebhook(body: string, signature: string | null): boolean {
  const { webhookSecret } = getBillingConfig();
  if (!webhookSecret || !signature) return false;

  const hmac = crypto.createHmac("sha256", webhookSecret);
  const digest = Buffer.from(hmac.update(body).digest("hex"), "utf8");
  const signatureBuffer = Buffer.from(signature, "utf8");

  if (digest.length !== signatureBuffer.length) return false;
  return crypto.timingSafeEqual(digest, signatureBuffer);
}

/**
 * Returns the customer portal URL for subscription management.
 * Prefers subscription URLs when a subscription id is available.
 */
export async function getCustomerPortalUrl(
  customerId: string,
  subscriptionId?: string | null
): Promise<string> {
  configureLemonSqueezy();

  if (subscriptionId) {
    const subscription = await getSubscription(subscriptionId);
    const portalUrl = subscription.data?.data.attributes.urls?.customer_portal;
    if (portalUrl) return portalUrl;
  }

  const customer = await getCustomer(customerId);
  const portalUrl = customer.data?.data.attributes.urls?.customer_portal;
  if (!portalUrl) {
    throw new Error("Customer portal URL missing from LemonSqueezy response.");
  }

  return portalUrl;
}

// ---------------------------------------------------------------------------
// Webhook payload types (LemonSqueezy API v1)
// ---------------------------------------------------------------------------

export type LemonSqueezyWebhookMeta = {
  event_name: string;
  custom_data?: Record<string, string | number | boolean | null>;
};

export type LemonSqueezyWebhookDataAttributes = {
  store_id?: number;
  customer_id?: number;
  order_id?: number;
  product_id?: number;
  variant_id?: number;
  status?: string;
  user_email?: string;
  first_order_item?: {
    product_id?: number;
    variant_id?: number;
  };
};

export type LemonSqueezyWebhookPayload = {
  meta: LemonSqueezyWebhookMeta;
  data: {
    id: string;
    type: string;
    attributes: LemonSqueezyWebhookDataAttributes;
  };
};

export function parseWebhookPayload(body: string): LemonSqueezyWebhookPayload | null {
  try {
    const parsed = JSON.parse(body) as LemonSqueezyWebhookPayload;
    if (!parsed?.meta?.event_name || !parsed?.data?.attributes) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Extracts CreatorForge user id from webhook custom data. */
export function getUserIdFromWebhook(payload: LemonSqueezyWebhookPayload): string | null {
  const custom = payload.meta.custom_data;
  const fromCustom = custom?.user_id;
  if (typeof fromCustom === "string" && fromCustom.length > 0) return fromCustom;
  if (typeof fromCustom === "number") return String(fromCustom);
  return null;
}
