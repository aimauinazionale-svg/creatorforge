"use client";

import * as React from "react";
import { Flame, Plus } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { getTrendingTopicsAction } from "@/app/actions/creator-tools";
import { createIdeaAction } from "@/app/actions/ideas-bank";
import { ActionErrorAlert } from "@/components/errors/ActionErrorAlert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

type TrendingTopic = {
  title: string;
  keyword: string;
  trendScore: number;
  summary: string;
};

export function TrendingTopics() {
  const t = useTranslations("dashboard.trending");
  const locale = useLocale();
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [topics, setTopics] = React.useState<TrendingTopic[]>([]);
  const [niche, setNiche] = React.useState("");
  const [addingId, setAddingId] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await getTrendingTopicsAction({
      locale: locale as "en" | "it" | "es" | "de" | "fr" | "pt" | "ru" | "ja" | "zh",
    });
    if (!res.ok) {
      setError(res.error.code);
      setTopics([]);
      setLoading(false);
      return;
    }
    setTopics(res.data.topics);
    setNiche(res.data.niche);
    setLoading(false);
  }, [locale]);

  React.useEffect(() => {
    void load();
  }, [load]);

  async function addToIdeas(topic: TrendingTopic) {
    setAddingId(topic.title);
    const res = await createIdeaAction({
      title: topic.title,
      description: `${topic.summary}\n\nKeyword: ${topic.keyword}`,
      category: niche,
      tags: [topic.keyword],
      priority: 2,
      status: "active",
      notes: "",
    });
    setAddingId(null);
    if (!res.ok) {
      toast({ variant: "destructive", title: t("addError") });
      return;
    }
    toast({ title: t("addedToIdeas") });
  }

  if (loading) {
    return (
      <Card>
        <CardHeader><Skeleton className="h-5 w-48" /></CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return <ActionErrorAlert code={error} onRetry={() => void load()} />;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Flame className="h-4 w-4 text-orange-500" aria-hidden="true" />
          {t("title")}
        </CardTitle>
        {niche ? (
          <p className="text-xs text-muted-foreground">{t("nicheLabel", { niche })}</p>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-3">
        {topics.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("empty")}</p>
        ) : (
          topics.map((topic) => (
            <div
              key={topic.title}
              className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium">{topic.title}</p>
                  <Badge variant="secondary">{topic.trendScore}/100</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{topic.summary}</p>
                <Badge variant="outline" className="mt-1.5 text-xs">
                  {topic.keyword}
                </Badge>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0"
                disabled={addingId === topic.title}
                onClick={() => void addToIdeas(topic)}
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                {t("addToIdeas")}
              </Button>
            </div>
          ))
        )}
        <Button type="button" variant="ghost" size="sm" onClick={() => void load()}>
          {t("refresh")}
        </Button>
      </CardContent>
    </Card>
  );
}
