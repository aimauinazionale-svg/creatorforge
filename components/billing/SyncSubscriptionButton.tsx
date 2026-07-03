"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2, RefreshCw } from "lucide-react";

import { syncSubscriptionAction } from "@/app/actions/billing";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

/** Re-fetches subscription from LemonSqueezy when webhooks were missed. */
export function SyncSubscriptionButton() {
  const t = useTranslations("billing");
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  async function handleSync() {
    setLoading(true);
    try {
      const result = await syncSubscriptionAction();
      if (!result.ok) {
        toast({
          title: t("syncError"),
          description: result.error.details ?? undefined,
          variant: "destructive",
        });
        return;
      }

      if (result.data.synced && result.data.planType === "pro") {
        toast({ title: t("checkoutSuccess") });
        router.refresh();
        return;
      }

      toast({ title: t("syncNoSubscription"), variant: "destructive" });
    } catch {
      toast({ title: t("syncError"), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="gap-2"
      disabled={loading}
      onClick={() => void handleSync()}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        <RefreshCw className="h-4 w-4" aria-hidden="true" />
      )}
      {loading ? t("syncLoading") : t("syncPlan")}
    </Button>
  );
}
