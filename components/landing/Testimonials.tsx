"use client";

import { m } from "@/components/landing/LandingMotion";
import { useTranslations } from "next-intl";
import { Quote } from "lucide-react";

const ids = ["0", "1", "2"] as const;

export function Testimonials() {
  const t = useTranslations("landing.testimonials");

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
        {ids.map((id, idx) => (
          <m.figure
            key={id}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.45, ease: "easeOut", delay: idx * 0.04 }}
            className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm"
          >
            <Quote className="h-5 w-5 text-primary" />
            <blockquote className="mt-4 text-sm text-muted-foreground">“{t(`items.${id}.quote`)}”</blockquote>
            <figcaption className="mt-5">
              <div className="text-sm font-semibold">{t(`items.${id}.name`)}</div>
              <div className="text-xs text-muted-foreground">{t(`items.${id}.role`)}</div>
            </figcaption>
          </m.figure>
        ))}
      </div>
    </section>
  );
}

