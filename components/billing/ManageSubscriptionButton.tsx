"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ExternalLink, Loader2 } from "lucide-react";

import { getCustomerPortalAction } from "@/app/actions/billing";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export type ManageSubscriptionButtonProps = {
  className?: string;
};

/** Opens the LemonSqueezy customer portal for subscription management. */
export function ManageSubscriptionButton({ className }: ManageSubscriptionButtonProps) {
  const t = useTranslations("billing");
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  async function handleManage() {
    setLoading(true);
    try {
      const result = await getCustomerPortalAction();

      if (!result.ok) {
        const message =
          result.error.code === "MISSING_CONFIG"
            ? t("notConfigured")
            : result.error.code === "NOT_PRO"
              ? t("manageNotPro")
              : t("manageError");
        toast({ title: message, variant: "destructive" });
        return;
      }

      window.open(result.data.url, "_blank", "noopener,noreferrer");
    } catch {
      toast({ title: t("manageError"), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      className={cn("gap-2", className)}
      disabled={loading}
      onClick={() => void handleManage()}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        <ExternalLink className="h-4 w-4" aria-hidden="true" />
      )}
      {loading ? t("manageLoading") : t("manage")}
    </Button>
  );
}
