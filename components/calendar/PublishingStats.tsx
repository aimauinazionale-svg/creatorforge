"use client";

import * as React from "react";
import { addDays, isBefore } from "date-fns";
import { useTranslations } from "next-intl";

import type { ScheduledVideo } from "@/components/calendar/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type PublishingStatsProps = {
  items: ScheduledVideo[];
};

export function PublishingStats({ items }: PublishingStatsProps) {
  const t = useTranslations("calendar");
  const now = React.useMemo(() => new Date(), []);
  const next7 = addDays(now, 7);

  const upcoming7 = items.filter((i) => {
    const d = new Date(i.scheduledAt);
    if (Number.isNaN(d.getTime())) return false;
    return !isBefore(d, now) && isBefore(d, next7);
  }).length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{t("sidebar.stats.title")}</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-border/60 bg-background p-3">
          <div className="text-xs text-muted-foreground">{t("sidebar.stats.total")}</div>
          <div className="mt-1 text-2xl font-semibold">{items.length}</div>
        </div>
        <div className="rounded-lg border border-border/60 bg-background p-3">
          <div className="text-xs text-muted-foreground">{t("sidebar.stats.upcoming7")}</div>
          <div className="mt-1 text-2xl font-semibold">{upcoming7}</div>
        </div>
      </CardContent>
    </Card>
  );
}

