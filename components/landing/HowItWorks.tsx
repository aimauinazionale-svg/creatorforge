"use client";

import { m } from "@/components/landing/LandingMotion";
import { useTranslations } from "next-intl";
import { CheckCircle2 } from "lucide-react";

const steps = ["connect", "build", "publish"] as const;

export function HowItWorks() {
  const t = useTranslations("landing.how");

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
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
        {steps.map((id, idx) => (
          <m.div
            key={id}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.45, ease: "easeOut", delay: idx * 0.04 }}
            className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-primary">{t(`steps.${id}.label`)}</div>
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 text-lg font-semibold">{t(`steps.${id}.title`)}</div>
            <p className="mt-2 text-sm text-muted-foreground">{t(`steps.${id}.description`)}</p>
          </m.div>
        ))}
      </div>
    </section>
  );
}

