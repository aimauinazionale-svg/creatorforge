"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";

import { syncSubscriptionAction } from "@/app/actions/billing";
import { useToast } from "@/hooks/use-toast";

const MAX_ATTEMPTS = 8;
const POLL_MS = 2000;

/** After LemonSqueezy checkout, polls LemonSqueezy API until Pro is active in Supabase. */
export function CheckoutSuccessSync() {
  const t = useTranslations("billing");
  const router = useRouter();
  const { toast } = useToast();
  const [syncing, setSyncing] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;

    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout") !== "success") return;

    started.current = true;
    setSyncing(true);

    let attempts = 0;
    let cancelled = false;

    async function poll() {
      try {
        while (!cancelled && attempts < MAX_ATTEMPTS) {
          attempts += 1;
          const result = await syncSubscriptionAction();

          if (!result.ok) {
            toast({
              title: t("syncError"),
              description: result.error.details ?? undefined,
              variant: "destructive",
            });
            router.replace(window.location.pathname);
            setSyncing(false);
            return;
          }

          if (result.data.synced && result.data.planType === "pro") {
            toast({ title: t("checkoutSuccess") });
            router.replace(window.location.pathname);
            router.refresh();
            setSyncing(false);
            return;
          }

          await new Promise((resolve) => setTimeout(resolve, POLL_MS));
        }

        if (!cancelled) {
          toast({
            title: t("checkoutSyncPending"),
            description: t("checkoutSyncHint"),
            variant: "destructive",
          });
          router.replace(window.location.pathname);
          setSyncing(false);
        }
      } catch {
        if (!cancelled) {
          toast({ title: t("syncError"), variant: "destructive" });
          router.replace(window.location.pathname);
          setSyncing(false);
        }
      }
    }

    void poll();

    return () => {
      cancelled = true;
    };
  }, [router, t, toast]);

  if (!syncing) return null;

  return (
    <div
      className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-foreground"
      role="status"
      aria-live="polite"
    >
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      {t("checkoutSyncing")}
    </div>
  );
}
