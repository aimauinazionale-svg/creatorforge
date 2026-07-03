"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Search, Sparkles } from "lucide-react";

import { optimizeVideoSeoAction, researchKeywordsAction } from "@/app/actions/seo";
import { ActionErrorAlert } from "@/components/errors/ActionErrorAlert";
import { TitleGenerator } from "@/components/seo/TitleGenerator";
import { VideoAnalyzer } from "@/components/seo/VideoAnalyzer";
import { CopyButton } from "@/components/ui/copy-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

type SeoLabProps = {
  initialVideoId?: string;
  initialTitle?: string;
};

export function SeoLab({ initialVideoId, initialTitle }: SeoLabProps) {
  const t = useTranslations("seoLab");
  const defaultTab = initialVideoId ? "analyzer" : "keywords";
  const [seed, setSeed] = React.useState("");
  const [keywords, setKeywords] = React.useState<
    Array<{ keyword: string; score: number; competition: string; reasoning: string }>
  >([]);
  const [optimizer, setOptimizer] = React.useState({
    title: initialTitle ?? "",
    topic: "",
    description: "",
  });
  const [optResult, setOptResult] = React.useState<{
    titles: Array<{ title: string; score: number; reasoning: string }>;
    tags: string[];
    checklist: Array<{ label: string; done: boolean; hint: string }>;
  } | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  return (
    <Tabs defaultValue={defaultTab}>
      <TabsList className="flex h-auto flex-wrap gap-1">
        <TabsTrigger value="keywords">{t("tabs.keywords")}</TabsTrigger>
        <TabsTrigger value="analyzer">{t("tabs.analyzer")}</TabsTrigger>
        <TabsTrigger value="titles">{t("tabs.titles")}</TabsTrigger>
        <TabsTrigger value="optimizer">{t("tabs.optimizer")}</TabsTrigger>
      </TabsList>

      {error ? <ActionErrorAlert code={error} className="mt-4" onRetry={() => setError(null)} /> : null}

      <TabsContent value="keywords" className="mt-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Search className="h-4 w-4" />
              {t("form.title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label>{t("form.seedLabel")}</Label>
              <Input
                value={seed}
                onChange={(e) => setSeed(e.target.value)}
                placeholder={t("form.seedPlaceholder")}
              />
            </div>
            <Button
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  setError(null);
                  const res = await researchKeywordsAction({ seed });
                  if (!res.ok) setError(res.error.code);
                  else setKeywords(res.data.keywords);
                })
              }
            >
              {t("form.submit")}
            </Button>
          </CardContent>
        </Card>

        <div className="grid gap-3 md:grid-cols-2">
          {keywords.map((k) => (
            <Card key={k.keyword}>
              <CardContent className="flex items-start justify-between gap-2 p-4">
                <div>
                  <p className="font-medium">{k.keyword}</p>
                  <p className="text-sm text-muted-foreground">{k.reasoning}</p>
                  <Badge variant="secondary" className="mt-2">
                    {t(`competition.${k.competition}`)} · {k.score}/100
                  </Badge>
                </div>
                <CopyButton value={k.keyword} />
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="analyzer" className="mt-4">
        <VideoAnalyzer initialVideoId={initialVideoId} initialTitle={initialTitle} />
      </TabsContent>

      <TabsContent value="titles" className="mt-4">
        <TitleGenerator />
      </TabsContent>

      <TabsContent value="optimizer" className="mt-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4" />
              {t("optimizer.title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder={t("optimizer.titlePlaceholder")}
              value={optimizer.title}
              onChange={(e) => setOptimizer((o) => ({ ...o, title: e.target.value }))}
            />
            <Input
              placeholder={t("optimizer.topicPlaceholder")}
              value={optimizer.topic}
              onChange={(e) => setOptimizer((o) => ({ ...o, topic: e.target.value }))}
            />
            <Textarea
              placeholder={t("optimizer.descriptionPlaceholder")}
              value={optimizer.description}
              onChange={(e) => setOptimizer((o) => ({ ...o, description: e.target.value }))}
            />
            <Button
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  setError(null);
                  const res = await optimizeVideoSeoAction(optimizer);
                  if (!res.ok) setError(res.error.code);
                  else setOptResult(res.data);
                })
              }
            >
              {t("optimizer.run")}
            </Button>
          </CardContent>
        </Card>

        {optResult ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-sm">{t("optimizer.suggestedTitles")}</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {optResult.titles.map((s) => (
                  <div key={s.title} className="rounded-lg border p-3 text-sm">
                    <p className="font-medium">{s.title}</p>
                    <p className="text-muted-foreground">{s.reasoning}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">{t("optimizer.checklist")}</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {optResult.checklist.map((item) => (
                  <div key={item.label} className="flex items-start gap-2 text-sm">
                    <span>{item.done ? "✅" : "⬜"}</span>
                    <div>
                      <p className="font-medium">{item.label}</p>
                      <p className="text-muted-foreground">{item.hint}</p>
                    </div>
                  </div>
                ))}
                <div className="flex flex-wrap gap-1 pt-2">
                  {optResult.tags.slice(0, 12).map((tag) => (
                    <Badge key={tag} variant="outline">{tag}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}
      </TabsContent>
    </Tabs>
  );
}
