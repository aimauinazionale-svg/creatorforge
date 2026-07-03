"use client";

import { m } from "@/components/landing/LandingMotion";
import { useTranslations } from "next-intl";
import { Check, X } from "lucide-react";

const rows = ["freeTools", "aiCredits", "workflow", "competitors", "calendar", "thumbnails"] as const;

function Yes() {
  return (
    <span className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600 dark:text-emerald-400">
      <Check className="h-4 w-4" />
    </span>
  );
}

function No() {
  return (
    <span className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground">
      <X className="h-4 w-4" />
    </span>
  );
}

export function Comparison() {
  const t = useTranslations("landing.comparison");

  const vidPulse = {
    freeTools: true,
    aiCredits: true,
    workflow: true,
    competitors: true,
    calendar: true,
    thumbnails: true,
  } as const;

  const alternatives = {
    freeTools: false,
    aiCredits: false,
    workflow: false,
    competitors: false,
    calendar: false,
    thumbnails: false,
  } as const;

  return (
    <section className="border-y border-border/60 bg-muted/10">
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

        <m.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mt-10 overflow-x-auto rounded-2xl border border-border/60 bg-background/60 shadow-sm"
        >
          <div className="min-w-[320px]">
          <div className="grid grid-cols-3 gap-0 border-b border-border/60 bg-muted/20 text-xs font-semibold sm:text-sm">
            <div className="px-4 py-3">{t("table.feature")}</div>
            <div className="px-4 py-3">{t("table.vidPulse")}</div>
            <div className="px-4 py-3">{t("table.alternatives")}</div>
          </div>
          <div className="divide-y divide-border/60">
            {rows.map((r) => (
              <div key={r} className="grid grid-cols-3 gap-0">
                <div className="px-4 py-4 text-sm font-medium">{t(`rows.${r}`)}</div>
                <div className="px-4 py-4">{vidPulse[r] ? <Yes /> : <No />}</div>
                <div className="px-4 py-4">{alternatives[r] ? <Yes /> : <No />}</div>
              </div>
            ))}
          </div>
          </div>
        </m.div>
      </div>
    </section>
  );
}

