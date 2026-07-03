export type BillingActionResult<T = undefined> =
  | { ok: true; data: T }
  | {
      ok: false;
      error: {
        code:
          | "UNAUTHENTICATED"
          | "MISSING_CONFIG"
          | "NOT_PRO"
          | "NOT_FOUND"
          | "UNKNOWN";
        details?: string;
      };
    };

export type CheckoutActionData = {
  url: string;
};

export type SubscriptionStatusData = {
  planType: "free" | "pro";
  subscriptionStatus: string | null;
  customerId: string | null;
  subscriptionId: string | null;
};

export type PortalActionData = {
  url: string;
};
