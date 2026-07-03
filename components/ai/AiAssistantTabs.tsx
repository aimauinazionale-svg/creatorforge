"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";

import { createIdeas } from "@/app/actions/ideas";
import {
  generateDescriptionAction,
  generateTagsAction,
  getAiRateLimitAction,
  optimizeTitleAction,
} from "@/app/actions/ai-features";
import { AiAssistantForm } from "@/components/ai/AiAssistantForm";
import { CopyButton } from "@/components/ui/copy-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ActionErrorAlert } from "@/components/errors/ActionErrorAlert";

export function AiAssistantTabs() {
  const t = useTranslations("ai");
  const locale = useLocale();
  const [rateLimit, setRateLimit] = React.useState<{
    used: number;
    limit: number;
    remaining: number;
    nearLimit?: boolean;
  } | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  const [titleForm, setTitleForm] = React.useState({ title: "", topic: "", keywords: "" });
  const [titleResults, setTitleResults] = React.useState<Array<{ title: string; score: number; reasoning: string }>>([]);

  const [descForm, setDescForm] = React.useState({ title: "", keywords: "", keyPoints: "" });
  const [descResult, setDescResult] = React.useState<{ description: string; hashtags: string[] } | null>(null);

  const [tagsForm, setTagsForm] = React.useState({ title: "", topic: "", description: "" });
  const [tagsResult, setTagsResult] = React.useState<string[]>([]);

  React.useEffect(() => {
    void getAiRateLimitAction().then((res) => {
      if (res.ok) setRateLimit(res.data);
    });
  }, []);

  function mapError(code: string) {
    if (code === "UNAUTHENTICATED") return t("errors.unauthenticated");
    if (code === "RATE_LIMITED") return t("errors.rateLimited");
    if (code === "INVALID_INPUT") return t("errors.invalidInput");
    return t("errors.generic", { details: "" });
  }

  return (
    <div className="space-y-4">
      {rateLimit?.nearLimit ? (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-4 text-sm">
            {t("rateLimit.nearDescription", {
              used: rateLimit.used,
              limit: rateLimit.limit,
              remaining: rateLimit.remaining,
            })}
          </CardContent>
        </Card>
      ) : null}

      {error ? <ActionErrorAlert code={error} onRetry={() => setError(null)} /> : null}

      <Tabs defaultValue="ideas">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="ideas">{t("tabs.ideas")}</TabsTrigger>
          <TabsTrigger value="title">{t("tabs.title")}</TabsTrigger>
          <TabsTrigger value="description">{t("tabs.description")}</TabsTrigger>
          <TabsTrigger value="tags">{t("tabs.tags")}</TabsTrigger>
        </TabsList>

        <TabsContent value="ideas" className="mt-4">
          <AiAssistantForm />
        </TabsContent>

        <TabsContent value="title" className="mt-4">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>{t("title.formTitle")}</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <Label>{t("title.titleLabel")}</Label>
                  <Input value={titleForm.title} onChange={(e) => setTitleForm((f) => ({ ...f, title: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>{t("title.topicLabel")}</Label>
                  <Input value={titleForm.topic} onChange={(e) => setTitleForm((f) => ({ ...f, topic: e.target.value }))} />
                </div>
                <Button
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      setError(null);
                      const res = await optimizeTitleAction({
                        title: titleForm.title,
                        topic: titleForm.topic,
                        keywords: titleForm.keywords.split(",").map((s) => s.trim()).filter(Boolean),
                      });
                      if (!res.ok) setError(res.error.code);
                      else setTitleResults(res.data.suggestions);
                    })
                  }
                >
                  {pending ? t("common.optimizing") : t("title.optimize")}
                </Button>
              </CardContent>
            </Card>
            <div className="space-y-3">
              {titleResults.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("title.empty")}</p>
              ) : (
                titleResults.map((s) => (
                  <Card key={s.title}>
                    <CardContent className="flex items-start justify-between gap-2 p-4">
                      <div>
                        <p className="font-medium">{s.title}</p>
                        <p className="text-xs text-muted-foreground">{t("title.scoreLabel", { score: s.score })}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{s.reasoning}</p>
                      </div>
                      <CopyButton value={s.title} label={t("common.copy")} />
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="description" className="mt-4">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>{t("description.formTitle")}</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Input
                  placeholder={t("description.titlePlaceholder")}
                  value={descForm.title}
                  onChange={(e) => setDescForm((f) => ({ ...f, title: e.target.value }))}
                />
                <Textarea
                  placeholder={t("description.keyPointsPlaceholder")}
                  value={descForm.keyPoints}
                  onChange={(e) => setDescForm((f) => ({ ...f, keyPoints: e.target.value }))}
                />
                <Button
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      const res = await generateDescriptionAction({
                        title: descForm.title,
                        keywords: [],
                        keyPoints: descForm.keyPoints.split("\n").filter(Boolean),
                      });
                      if (!res.ok) setError(res.error.code);
                      else setDescResult(res.data);
                    })
                  }
                >
                  {t("description.generate")}
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                {descResult ? (
                  <>
                    <pre className="whitespace-pre-wrap text-sm">{descResult.description}</pre>
                    <p className="mt-2 text-xs text-muted-foreground">{descResult.hashtags.join(" ")}</p>
                    <CopyButton value={descResult.description} label={t("common.copy")} className="mt-2" />
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">{t("description.empty")}</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tags" className="mt-4">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>{t("tags.formTitle")}</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Input value={tagsForm.title} onChange={(e) => setTagsForm((f) => ({ ...f, title: e.target.value }))} placeholder={t("tags.titlePlaceholder")} />
                <Input value={tagsForm.topic} onChange={(e) => setTagsForm((f) => ({ ...f, topic: e.target.value }))} placeholder={t("tags.topicPlaceholder")} />
                <Textarea value={tagsForm.description} onChange={(e) => setTagsForm((f) => ({ ...f, description: e.target.value }))} placeholder={t("tags.descriptionPlaceholder")} />
                <Button
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      const res = await generateTagsAction(tagsForm);
                      if (!res.ok) setError(res.error.code);
                      else setTagsResult(res.data.tags);
                    })
                  }
                >
                  {t("tags.generate")}
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex flex-wrap gap-2 p-4">
                {tagsResult.length ? (
                  tagsResult.map((tag) => (
                    <span key={tag} className="rounded-full border px-2 py-1 text-xs">
                      {tag}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">{t("tags.empty")}</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
