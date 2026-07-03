"use client";

import { Play } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

type TutorialVideoEmbedProps = {
  youtubeVideoId?: string;
  title: string;
  className?: string;
};

export function TutorialVideoEmbed({ youtubeVideoId, title, className }: TutorialVideoEmbedProps) {
  const t = useTranslations("tutorials");

  if (youtubeVideoId) {
    return (
      <div className={cn("relative aspect-video w-full overflow-hidden rounded-lg", className)}>
        <iframe
          src={`https://www.youtube.com/embed/${youtubeVideoId}`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full border-0"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-lg",
        "border border-dashed border-violet-500/30 bg-gradient-to-br from-violet-500/10 via-background to-fuchsia-500/10",
        className
      )}
      aria-label={t("comingSoon")}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-violet-500/20 ring-1 ring-violet-500/30">
        <Play className="h-6 w-6 text-violet-400" aria-hidden="true" />
      </div>
      <p className="text-sm font-medium text-foreground">{t("comingSoon")}</p>
      <p className="max-w-xs px-4 text-center text-xs text-muted-foreground">
        {t("comingSoonDescription")}
      </p>
    </div>
  );
}
