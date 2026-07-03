import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Check, Sparkles } from "lucide-react";

import { UpgradeButton } from "@/components/billing/UpgradeButton";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buildMetadata } from "@/lib/metadata";
import { cn } from "@/lib/utils";

const FEATURE_KEYS = ["0", "1", "2", "3", "4"] as const;

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "pricing.meta" });
  return buildMetadata({
    title: t("title"),
    description: t("description"),
    locale: params.locale,
    path: "/pricing",
  });
}

export default async function PricingPage({ params }: { params: { locale: string } }) {
  setRequestLocale(params.locale);
  const t = await getTranslations("pricing");

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          {t("title")}
        </h1>
        <p className="mt-3 text-pretty text-base text-muted-foreground sm:text-lg">
          {t("subtitle")}
        </p>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        <Card className="border-border/60">
          <CardHeader>
            <CardDescription>{t("free.label")}</CardDescription>
            <CardTitle className="text-3xl">{t("free.price")}</CardTitle>
            <p className="text-sm text-muted-foreground">{t("free.description")}</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <Button asChild variant="secondary" className="w-full">
              <Link href="/login">{t("free.cta")}</Link>
            </Button>
            <ul className="space-y-2 text-sm">
              {FEATURE_KEYS.map((key) => (
                <li key={key} className="flex items-start gap-2">
                  <Check
                    className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400"
                    aria-hidden="true"
                  />
                  <span className="text-muted-foreground">{t(`free.features.${key}`)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className={cn("relative border-primary/40 ring-1 ring-primary/30")}>
          <div className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            {t("highlight")}
          </div>
          <CardHeader>
            <CardDescription>{t("pro.label")}</CardDescription>
            <CardTitle className="text-3xl">{t("pro.price")}</CardTitle>
            <p className="text-sm text-muted-foreground">{t("pro.description")}</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <UpgradeButton className="w-full" />
            <ul className="space-y-2 text-sm">
              {FEATURE_KEYS.map((key) => (
                <li key={key} className="flex items-start gap-2">
                  <Check
                    className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400"
                    aria-hidden="true"
                  />
                  <span className="text-muted-foreground">{t(`pro.features.${key}`)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <p className="mt-10 text-center text-sm text-muted-foreground">{t("finePrint")}</p>
    </div>
  );
}
