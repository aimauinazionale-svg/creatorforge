"use client";

import * as React from "react";
import { Lightbulb, ListChecks, Sparkles, TrendingUp } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { getDashboardInsightsAction } from "@/app/actions/creator-tools";
import { ActionErrorAlert } from "@/components/errors/ActionErrorAlert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNumber } from "@/lib/formatNumber";

type InsightsData = {
  dailyTip: string;
  focusArea: string;
  actionItems: string[];
  bestVideoHint: string;
  topVideo: { title: string; views: number } | null;
};

export function DashboardInsights() {
  const t = useTranslations("dashboard.insights");
  const locale = useLocale();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [data, setData] = React.useState<InsightsData | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await getDashboardInsightsAction({
      locale: locale as "en" | "it" | "es" | "de" | "fr" | "pt" | "ru" | "ja" | "zh",
    });
    if (!res.ok) {
      if (res.error.code === "YOUTUBE_NOT_CONNECTED") {
        setData(null);
        setLoading(false);
        return;
      }
      setError(res.error.code);
      setLoading(false);
      return;
    }
    setData(res.data);
    setLoading(false);
  }, [locale]);

  React.useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
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
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
          {t("title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-amber-500" aria-hidden="true" />
            <span className="text-sm font-medium">{t("dailyTip")}</span>
            <Badge variant="secondary">{data.focusArea}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{data.dailyTip}</p>
        </div>

        {data.topVideo ? (
          <div className="flex items-start gap-2 rounded-lg border bg-muted/30 p-3">
            <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-green-600" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground">{t("topVideo")}</p>
              <p className="truncate text-sm font-medium">{data.topVideo.title}</p>
              <p className="text-xs text-muted-foreground">
                {formatNumber(data.topVideo.views)} {t("views")}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{data.bestVideoHint}</p>
            </div>
          </div>
        ) : null}

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <ListChecks className="h-4 w-4" aria-hidden="true" />
            <span className="text-sm font-medium">{t("actionItems")}</span>
          </div>
          <ul className="space-y-1.5">
            {data.actionItems.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <Button type="button" variant="outline" size="sm" onClick={() => void load()}>
          {t("refresh")}
        </Button>
      </CardContent>
    </Card>
  );
}
