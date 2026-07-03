"use client";

import { HeartPulse } from "lucide-react";
import { useTranslations } from "next-intl";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type ChannelHealth = {
  score: number;
  label: "excellent" | "good" | "fair" | "needs_attention";
  factors: Array<{ key: string; met: boolean }>;
};

export type ChannelHealthScoreProps = {
  health: ChannelHealth | null;
  loading?: boolean;
};

function scoreColor(score: number): string {
  if (score >= 80) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 60) return "text-sky-600 dark:text-sky-400";
  if (score >= 40) return "text-amber-600 dark:text-amber-400";
  return "text-destructive";
}

export function ChannelHealthScore({ health, loading }: ChannelHealthScoreProps) {
  const t = useTranslations("dashboard.channelHealth");

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <HeartPulse className="h-4 w-4" aria-hidden="true" />
          {t("title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading || !health ? (
          <div className="h-16 animate-pulse rounded-lg bg-muted" />
        ) : (
          <>
            <div className="flex items-end gap-2">
              <span className={cn("text-4xl font-bold tabular-nums", scoreColor(health.score))}>
                {health.score}
              </span>
              <span className="pb-1 text-sm text-muted-foreground">/100</span>
            </div>
            <p className="text-sm font-medium">{t(`labels.${health.label}`)}</p>
            <ul className="space-y-1.5">
              {health.factors.map((factor) => (
                <li key={factor.key} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span
                    className={cn(
                      "h-2 w-2 rounded-full",
                      factor.met ? "bg-emerald-500" : "bg-muted-foreground/40"
                    )}
                    aria-hidden="true"
                  />
                  {t(`factors.${factor.key}`)}
                </li>
              ))}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  );
}
