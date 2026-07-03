"use client";

import { useTranslations } from "next-intl";
import { Eye, Sparkles, Swords, Users, Video } from "lucide-react";

import { ConnectYouTube } from "@/components/dashboard/ConnectYouTube";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";

const QUICK_ACTIONS = [
  { href: "/ai-assistant", icon: Sparkles, key: "aiAssistant" },
  { href: "/seo-lab", icon: Eye, key: "seoLab" },
  { href: "/competitors", icon: Swords, key: "competitors" },
  { href: "/workflow", icon: Video, key: "workflow" },
] as const;

/** Static dashboard UI when the server page fails — never throws. */
export function DashboardFallback() {
  const t = useTranslations("dashboard");

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <header className="space-y-2">
        <h1 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
          {t("title")}
        </h1>
        <p className="text-pretty text-sm text-muted-foreground sm:text-base">{t("subtitle")}</p>
      </header>

      <ConnectYouTube />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatsCard title={t("stats.subscribers")} value="—" icon={Users} />
        <StatsCard title={t("stats.views")} value="—" icon={Eye} />
        <StatsCard title={t("stats.videos")} value="—" icon={Video} />
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{t("actions.title")}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.href} href={action.href}>
                <Card className="h-full transition-colors hover:bg-muted/40">
                  <CardHeader className="pb-2">
                    <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                    <CardTitle className="text-sm">{t(`actions.${action.key}.title`)}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">
                      {t(`actions.${action.key}.description`)}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
