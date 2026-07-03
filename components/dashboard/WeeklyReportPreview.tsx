"use client";

import * as React from "react";
import { BarChart3, CheckCircle2, Target, TrendingUp } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { getWeeklyReportPreviewAction } from "@/app/actions/creator-tools";
import { ActionErrorAlert } from "@/components/errors/ActionErrorAlert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNumber } from "@/lib/formatNumber";

type WeeklyReportData = {
  headline: string;
  growthSummary: string;
  highlights: string[];
  improvements: string[];
  nextWeekGoals: string[];
  estimatedGrowth: string;
  channelName: string;
  stats: { subscribers: number; views: number; videos: number };
};

export function WeeklyReportPreview() {
  const t = useTranslations("dashboard.weeklyReport");
  const locale = useLocale();
  const [loading, setLoading] = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [data, setData] = React.useState<WeeklyReportData | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    const res = await getWeeklyReportPreviewAction({
      locale: locale as "en" | "it" | "es" | "de" | "fr" | "pt" | "ru" | "ja" | "zh",
    });
    setLoading(false);
    if (!res.ok) {
      if (res.error.code === "YOUTUBE_NOT_CONNECTED") {
        setError(null);
        return;
      }
      setError(res.error.code);
      return;
    }
    setData(res.data);
    setLoaded(true);
  }

  if (!loaded && !loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-4 w-4" aria-hidden="true" />
            {t("title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">{t("description")}</p>
          <Button type="button" onClick={() => void load()} disabled={loading}>
            {t("generate")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardHeader><Skeleton className="h-5 w-48" /></CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return <ActionErrorAlert code={error} onRetry={() => void load()} />;
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">{t("notConnected")}</CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-4 w-4" aria-hidden="true" />
            {t("title")}
          </CardTitle>
          <Badge variant="outline">{t("previewBadge")}</Badge>
        </div>
        <p className="text-sm font-medium">{data.headline}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg border p-2">
            <p className="text-lg font-semibold">{formatNumber(data.stats.subscribers)}</p>
            <p className="text-xs text-muted-foreground">{t("subscribers")}</p>
          </div>
          <div className="rounded-lg border p-2">
            <p className="text-lg font-semibold">{formatNumber(data.stats.views)}</p>
            <p className="text-xs text-muted-foreground">{t("views")}</p>
          </div>
          <div className="rounded-lg border p-2">
            <p className="text-lg font-semibold">{formatNumber(data.stats.videos)}</p>
            <p className="text-xs text-muted-foreground">{t("videos")}</p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">{data.growthSummary}</p>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <CheckCircle2 className="h-4 w-4 text-green-600" aria-hidden="true" />
            {t("highlights")}
          </div>
          <ul className="space-y-1">
            {data.highlights.map((h) => (
              <li key={h} className="text-sm text-muted-foreground">• {h}</li>
            ))}
          </ul>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Target className="h-4 w-4 text-amber-600" aria-hidden="true" />
            {t("improvements")}
          </div>
          <ul className="space-y-1">
            {data.improvements.map((item) => (
              <li key={item} className="text-sm text-muted-foreground">• {item}</li>
            ))}
          </ul>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <TrendingUp className="h-4 w-4 text-primary" aria-hidden="true" />
            {t("nextWeekGoals")}
          </div>
          <ul className="space-y-1">
            {data.nextWeekGoals.map((goal) => (
              <li key={goal} className="text-sm text-muted-foreground">• {goal}</li>
            ))}
          </ul>
        </div>

        <p className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
          {t("projection")}: {data.estimatedGrowth}
        </p>

        <Button type="button" variant="outline" size="sm" onClick={() => void load()}>
          {t("refresh")}
        </Button>
      </CardContent>
    </Card>
  );
}
