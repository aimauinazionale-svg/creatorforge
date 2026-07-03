"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Sparkles } from "lucide-react";

import { createCheckoutAction } from "@/app/actions/billing";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export type UpgradeButtonProps = {
  className?: string;
  variant?: "default" | "secondary" | "outline";
  size?: "default" | "sm" | "lg";
};

/** Opens LemonSqueezy checkout in a new tab for the Pro plan. */
export function UpgradeButton({
  className,
  variant = "default",
  size = "default",
}: UpgradeButtonProps) {
  const t = useTranslations("billing");
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  async function handleUpgrade() {
    setLoading(true);
    try {
      const result = await createCheckoutAction();

      if (!result.ok) {
        const message =
          result.error.code === "UNAUTHENTICATED"
            ? t("loginRequired")
            : result.error.code === "MISSING_CONFIG"
              ? t("notConfigured")
              : t("upgradeError");
        toast({ title: message, variant: "destructive" });
        return;
      }

      window.open(result.data.url, "_blank", "noopener,noreferrer");
    } catch {
      toast({ title: t("upgradeError"), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={cn("gap-2", className)}
      disabled={loading}
      onClick={() => void handleUpgrade()}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        <Sparkles className="h-4 w-4" aria-hidden="true" />
      )}
      {loading ? t("upgradeLoading") : t("upgrade")}
    </Button>
  );
}
