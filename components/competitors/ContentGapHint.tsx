"use client";

import { Lightbulb } from "lucide-react";
import { useTranslations } from "next-intl";

import { Card, CardContent } from "@/components/ui/card";

/** Simple heuristic: suggest topics competitors may cover that you haven't explored. */
export function ContentGapHint({
  competitorTopics,
  yourTopics,
}: {
  competitorTopics: string[];
  yourTopics: string[];
}) {
  const t = useTranslations("competitors.contentGap");

  const yours = new Set(yourTopics.map((x) => x.toLowerCase().trim()).filter(Boolean));
  const gaps = competitorTopics
    .map((x) => x.trim())
    .filter((topic) => topic.length > 1 && !yours.has(topic.toLowerCase()))
    .slice(0, 5);

  if (gaps.length === 0) return null;

  return (
    <Card className="border-dashed">
      <CardContent className="flex gap-3 p-4">
        <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" aria-hidden="true" />
        <div className="space-y-2">
          <p className="text-sm font-medium">{t("title")}</p>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
          <ul className="list-inside list-disc text-sm text-muted-foreground">
            {gaps.map((gap) => (
              <li key={gap}>{gap}</li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
