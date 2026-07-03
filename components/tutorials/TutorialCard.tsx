"use client";

import { Clock } from "lucide-react";
import { useTranslations } from "next-intl";

import { TutorialVideoEmbed } from "@/components/tutorials/TutorialVideoEmbed";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Tutorial } from "@/lib/tutorials";

type TutorialCardProps = {
  tutorial: Tutorial;
};

export function TutorialCard({ tutorial }: TutorialCardProps) {
  const t = useTranslations("tutorials");

  return (
    <Card className="overflow-hidden border-border/60 bg-card/50 transition-colors hover:border-violet-500/30">
      <CardHeader className="space-y-1 p-0">
        <TutorialVideoEmbed
          youtubeVideoId={tutorial.youtubeVideoId}
          title={t(`items.${tutorial.id}.title`)}
        />
      </CardHeader>
      <CardContent className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base leading-snug">{t(`items.${tutorial.id}.title`)}</CardTitle>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-violet-500/10 px-2 py-0.5 text-xs text-violet-600 dark:text-violet-400">
            <Clock className="h-3 w-3" aria-hidden="true" />
            {t("duration", { minutes: tutorial.durationMinutes })}
          </span>
        </div>
        <CardDescription className="text-sm leading-relaxed">
          {t(`items.${tutorial.id}.description`)}
        </CardDescription>
      </CardContent>
    </Card>
  );
}
