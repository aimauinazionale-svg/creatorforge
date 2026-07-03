"use client";

import { m } from "@/components/landing/LandingMotion";
import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export function FinalCTA() {
  const t = useTranslations("landing.finalCta");

  return (
    <section className="border-t border-border/60 bg-muted/10">
      <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <m.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative overflow-hidden rounded-3xl border border-border/60 bg-background px-6 py-12 shadow-sm sm:px-10"
        >
          <div className="absolute inset-0 -z-10">
            <div className="absolute -top-24 left-1/2 h-72 w-[55rem] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
            <div className="absolute -bottom-32 right-[-10rem] h-72 w-[45rem] rounded-full bg-sky-500/10 blur-3xl" />
          </div>

          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">{t("title")}</h2>
            <p className="mt-3 text-pretty text-base text-muted-foreground sm:text-lg">{t("subtitle")}</p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button asChild size="lg" className="gap-2">
                <Link href="/dashboard">
                  {t("primaryCta")}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/#pricing">{t("secondaryCta")}</Link>
              </Button>
            </div>
          </div>
        </m.div>
      </div>
    </section>
  );
}

