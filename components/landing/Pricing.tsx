"use client";

import { m } from "@/components/landing/LandingMotion";
import { useTranslations } from "next-intl";
import { Check, Sparkles } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const plans = ["free", "pro", "creator"] as const;

export function Pricing() {
  const t = useTranslations("landing.pricing");

  return (
    <section id="pricing" className="border-y border-border/60 bg-muted/10">
      <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <m.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">{t("title")}</h2>
          <p className="mt-3 text-pretty text-base text-muted-foreground sm:text-lg">{t("subtitle")}</p>
        </m.div>

        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {plans.map((p, idx) => {
            const highlighted = p === "pro";
            return (
              <m.div
                key={p}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.45, ease: "easeOut", delay: idx * 0.04 }}
                className={cn(
                  "relative rounded-2xl border border-border/60 bg-background/70 p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
                  highlighted ? "ring-1 ring-primary/40" : ""
                )}
              >
                {highlighted ? (
                  <div className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                    <Sparkles className="h-3.5 w-3.5" />
                    {t("highlight")}
                  </div>
                ) : null}

                <div className="text-sm font-semibold text-muted-foreground">{t(`plans.${p}.label`)}</div>
                <div className="mt-2 text-3xl font-semibold tracking-tight">{t(`plans.${p}.price`)}</div>
                <div className="mt-2 text-sm text-muted-foreground">{t(`plans.${p}.description`)}</div>

                <Button asChild className="mt-6 w-full" variant={highlighted ? "default" : "secondary"}>
                  <Link href="/dashboard">{t(`plans.${p}.cta`)}</Link>
                </Button>

                <ul className="mt-6 space-y-2 text-sm">
                  {[0, 1, 2, 3].map((i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-muted-foreground">{t(`plans.${p}.features.${i}`)}</span>
                    </li>
                  ))}
                </ul>
              </m.div>
            );
          })}
        </div>

        <div className="mt-10 rounded-2xl border border-border/60 bg-background/60 p-6 text-center text-sm text-muted-foreground">
          {t("finePrint")}
        </div>
      </div>
    </section>
  );
}

