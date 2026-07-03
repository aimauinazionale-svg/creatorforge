import { getTranslations } from "next-intl/server";
import { Crown } from "lucide-react";

import { getUserSubscriptionStatus } from "@/app/actions/billing";
import { CheckoutSuccessSync } from "@/components/billing/CheckoutSuccessSync";
import { ManageSubscriptionButton } from "@/components/billing/ManageSubscriptionButton";
import { UpgradeButton } from "@/components/billing/UpgradeButton";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function BillingSettingsPage() {
  const t = await getTranslations("billing");
  const status = await getUserSubscriptionStatus();

  const planType = status.ok ? status.data.planType : "free";
  const subscriptionStatus = status.ok ? status.data.subscriptionStatus : null;
  const isPro = planType === "pro";

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />

      <CheckoutSuccessSync />

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Crown
                className="h-5 w-5 text-amber-500"
                aria-hidden="true"
              />
              {t("currentPlan")}
            </CardTitle>
            <CardDescription>
              {isPro ? t("planProDescription") : t("planFreeDescription")}
            </CardDescription>
          </div>
          <Badge variant={isPro ? "default" : "secondary"}>
            {isPro ? t("planPro") : t("planFree")}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          {subscriptionStatus ? (
            <p className="text-sm text-muted-foreground">
              {t("statusLabel")}:{" "}
              <span className="font-medium text-foreground">{subscriptionStatus}</span>
            </p>
          ) : null}

          <div className="flex flex-wrap gap-3">
            {isPro ? <ManageSubscriptionButton /> : <UpgradeButton />}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("includedTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {[0, 1, 2, 3].map((i) => (
              <li key={i}>{t(`included.${i}`)}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
