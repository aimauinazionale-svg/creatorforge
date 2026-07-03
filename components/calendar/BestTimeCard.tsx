"use client";

import { useTranslations } from "next-intl";

import type { BestPublishingTimeRecommendation } from "@/components/calendar/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type BestTimeCardProps = {
  loading: boolean;
  recommendation: BestPublishingTimeRecommendation | null;
};

function pad2(n: number) {
  return n.toString().padStart(2, "0");
}

export function BestTimeCard({ loading, recommendation }: BestTimeCardProps) {
  const t = useTranslations("calendar");

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{t("sidebar.bestTime.title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        ) : !recommendation ? (
          <p className="text-sm text-muted-foreground">{t("sidebar.bestTime.empty")}</p>
        ) : (
          <div className="space-y-2">
            <div className="text-sm font-semibold">{t("sidebar.bestTime.recommended")}</div>
            <div className="text-sm">
              {t("sidebar.bestTime.dayTime", {
                day: t(`days.${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][recommendation.weekday]}`),
                time: `${pad2(recommendation.hour)}:00`,
              })}
            </div>
            <div className="text-xs text-muted-foreground">{t("sidebar.bestTime.confidence", { value: recommendation.confidence })}</div>
            <div className="text-xs text-muted-foreground">{t("sidebar.bestTime.updated")}</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

