"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { MessageCircle } from "lucide-react";

import { analyzeVideoCommentsAction } from "@/app/actions/comments";
import { ActionErrorAlert } from "@/components/errors/ActionErrorAlert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CommentSentimentPanel() {
  const t = useTranslations("comments");
  const [url, setUrl] = React.useState("");
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<{
    breakdown: { positive: number; neutral: number; negative: number; total: number };
    topQuestions: string[];
    comments: Array<{ text: string; author: string; sentiment: string }>;
  } | null>(null);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            {t("title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label>{t("videoUrlLabel")}</Label>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={t("videoUrlPlaceholder")}
            />
          </div>
          <Button
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                setError(null);
                const res = await analyzeVideoCommentsAction({ videoUrl: url });
                if (!res.ok) setError(res.error.code);
                else setResult(res.data);
              })
            }
          >
            {pending ? t("analyzing") : t("analyze")}
          </Button>
        </CardContent>
      </Card>

      {error ? <ActionErrorAlert code={error} onRetry={() => setError(null)} /> : null}

      {result ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="text-sm">{t("sentiment.title")}</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>{t("sentiment.positive")}: {result.breakdown.positive}%</p>
              <p>{t("sentiment.neutral")}: {result.breakdown.neutral}%</p>
              <p>{t("sentiment.negative")}: {result.breakdown.negative}%</p>
              <p className="text-muted-foreground">{t("sentiment.total", { count: result.breakdown.total })}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm">{t("questions.title")}</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {result.topQuestions.length ? (
                result.topQuestions.map((q) => <p key={q}>• {q}</p>)
              ) : (
                <p className="text-muted-foreground">{t("questions.empty")}</p>
              )}
            </CardContent>
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle className="text-sm">{t("sample.title")}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {result.comments.map((c, i) => (
                <div key={i} className="rounded-lg border p-3 text-sm">
                  <p className="font-medium">{c.author} · {c.sentiment}</p>
                  <p className="text-muted-foreground">{c.text}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
