type WebhookLogContext = Record<string, string | number | boolean | null | undefined>;

/** Structured webhook logs — safe for production (no secrets). */
export function logWebhook(
  level: "info" | "warn" | "error",
  message: string,
  context?: WebhookLogContext
): void {
  const payload = {
    scope: "webhook:lemonsqueezy",
    level,
    message,
    ...context,
  };

  if (level === "error") {
    console.error(JSON.stringify(payload));
    return;
  }

  if (level === "warn") {
    console.warn(JSON.stringify(payload));
    return;
  }

  console.log(JSON.stringify(payload));
}

/** Env presence for diagnostics (lengths only). */
export function getBillingEnvDiagnostics(): Record<string, number | boolean> {
  return {
    webhookSecretLen: (process.env.LEMONSQUEEZY_WEBHOOK_SECRET ?? "").length,
    serviceRoleLen: (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").length,
    supabaseUrlLen: (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").length,
    apiKeyLen: (process.env.LEMONSQUEEZY_API_KEY ?? "").length,
    storeIdLen: (process.env.LEMONSQUEEZY_STORE_ID ?? "").length,
  };
}
