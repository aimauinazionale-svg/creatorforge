"use client";

import { Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";

import type { BestPublishingTimeRecommendation } from "@/components/calendar/types";

function pad2(n: number) {
  return n.toString().padStart(2, "0");
}

export function BestTimeBanner({ recommendation }: { recommendation: BestPublishingTimeRecommendation }) {
  const t = useTranslations("calendar");

  const day = t(`days.${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][recommendation.weekday]}`);
  const time = `${pad2(recommendation.hour)}:00`;

  return (
    <div
      role="status"
      className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm"
    >
      <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
      <div>
        <p className="font-medium">{t("schedule.bestTimeBanner", { day, time })}</p>
        <p className="text-muted-foreground">{t("sidebar.bestTime.confidence", { value: recommendation.confidence })}</p>
      </div>
    </div>
  );
}
