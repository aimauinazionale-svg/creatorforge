"use client";

import Image from "next/image";
import { m } from "@/components/landing/LandingMotion";
import { useTranslations } from "next-intl";
import { ArrowRight, Sparkles } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export function Hero() {
  const t = useTranslations("landing.hero");

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute -top-32 left-1/2 h-96 w-[70rem] -translate-x-1/2 rounded-full bg-gradient-to-br from-orange-500/20 via-rose-500/15 to-transparent blur-3xl" />
        <div className="absolute -bottom-40 right-[-10rem] h-80 w-[52rem] rounded-full bg-gradient-to-tl from-orange-400/10 via-pink-500/10 to-transparent blur-3xl" />
        <div className="absolute left-[-8rem] top-1/3 h-64 w-64 rounded-full bg-rose-600/10 blur-3xl" />
      </div>

      <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
        <m.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="space-y-6"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/30 px-3 py-1 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>{t("kicker")}</span>
          </div>

          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">{t("title")}</h1>
          <p className="text-pretty text-base text-muted-foreground sm:text-lg">{t("subtitle")}</p>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
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

          <ul className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-3">
            <li className="rounded-lg border border-border/60 bg-background/40 px-3 py-2">{t("bullets.0")}</li>
            <li className="rounded-lg border border-border/60 bg-background/40 px-3 py-2">{t("bullets.1")}</li>
            <li className="rounded-lg border border-border/60 bg-background/40 px-3 py-2">{t("bullets.2")}</li>
          </ul>
        </m.div>

        <m.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.05 }}
          className="relative"
        >
          <div className="absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-b from-primary/15 via-transparent to-transparent blur-2xl" />
          <div className="overflow-hidden rounded-3xl border border-border/60 bg-muted/10 shadow-sm">
            <Image
              src="/landing-hero.svg"
              alt={t("mockAlt")}
              width={1600}
              height={1000}
              priority
              className="h-auto w-full"
            />
          </div>
        </m.div>
      </div>
    </section>
  );
}

