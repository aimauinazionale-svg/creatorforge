"use client";

import { m } from "@/components/landing/LandingMotion";
import { useTranslations } from "next-intl";
import { BarChart3, Calendar, Image as ImageIcon, Layers3, Sparkles, Swords } from "lucide-react";

import { cn } from "@/lib/utils";

const iconMap = {
  ideas: Sparkles,
  seo: BarChart3,
  competitors: Swords,
  workflow: Layers3,
  calendar: Calendar,
  thumbnails: ImageIcon,
} as const;

const ids = ["ideas", "seo", "competitors", "workflow", "calendar", "thumbnails"] as const;

export function Features() {
  const t = useTranslations("landing.features");

  return (
    <section id="features" className="border-y border-border/60 bg-muted/10">
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

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ids.map((id, idx) => {
            const Icon = iconMap[id];
            return (
              <m.div
                key={id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.45, ease: "easeOut", delay: idx * 0.03 }}
                className={cn(
                  "rounded-2xl border border-border/60 bg-background/60 p-6 shadow-sm",
                  "transition-all duration-200 hover:-translate-y-0.5 hover:bg-background hover:shadow-md"
                )}
              >
                <div className="flex items-start gap-4">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-violet-500/15 to-fuchsia-500/15 text-violet-600 dark:text-violet-400">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-base font-semibold">{t(`items.${id}.title`)}</div>
                    <p className="mt-1 text-sm text-muted-foreground">{t(`items.${id}.description`)}</p>
                  </div>
                </div>
              </m.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

