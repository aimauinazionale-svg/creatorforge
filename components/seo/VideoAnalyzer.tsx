"use client";

import * as React from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Loader2, Search, Sparkles } from "lucide-react";

import { analyzeVideoSeoAction } from "@/app/actions/creator-tools";
import { ActionErrorAlert } from "@/components/errors/ActionErrorAlert";
import { CopyButton } from "@/components/ui/copy-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type VideoAnalyzerProps = {
  initialVideoId?: string;
  initialTitle?: string;
};

type AnalysisResult = {
  video: {
    title: string;
    description: string;
    tags: string[];
    viewCount: number;
    likeCount: number;
    thumbnailUrl: string | null;
  };
  analysis: {
    overallScore: number;
    titleScore: number;
    descriptionScore: number;
    tagsScore: number;
    suggestedTitle: string;
    suggestedDescription: string;
    suggestedTags: string[];
    improvements: Array<{ area: string; issue: string; fix: string }>;
  };
};

function ScoreBar({ label, score }: { label: string; score: number }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span className="font-medium">{score}/100</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
        />
      </div>
    </div>
  );
}

export function VideoAnalyzer({ initialVideoId, initialTitle }: VideoAnalyzerProps) {
  const t = useTranslations("seoLab.analyzer");
  const [videoInput, setVideoInput] = React.useState(
    initialVideoId ? `https://youtube.com/watch?v=${initialVideoId}` : ""
  );
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<AnalysisResult | null>(null);

  React.useEffect(() => {
    if (initialVideoId && !result) {
      startTransition(async () => {
        setError(null);
        const res = await analyzeVideoSeoAction({
          videoInput: initialVideoId.includes("http")
            ? initialVideoId
            : `https://youtube.com/watch?v=${initialVideoId}`,
        });
        if (!res.ok) setError(res.error.code);
        else setResult(res.data);
      });
    }
  }, [initialVideoId, result]);

  React.useEffect(() => {
    if (initialTitle && result) {
      setResult((prev) =>
        prev
          ? {
              ...prev,
              video: { ...prev.video, title: initialTitle },
            }
          : prev
      );
    }
  }, [initialTitle, result]);

  function runAnalysis() {
    startTransition(async () => {
      setError(null);
      const res = await analyzeVideoSeoAction({ videoInput });
      if (!res.ok) setError(res.error.code);
      else setResult(res.data);
    });
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Search className="h-4 w-4" aria-hidden="true" />
            {t("title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="video-url">{t("urlLabel")}</Label>
            <Input
              id="video-url"
              value={videoInput}
              onChange={(e) => setVideoInput(e.target.value)}
              placeholder={t("urlPlaceholder")}
            />
            <p className="text-xs text-muted-foreground">{t("urlHint")}</p>
          </div>
          <Button type="button" disabled={pending || !videoInput.trim()} onClick={runAnalysis}>
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : null}
            {pending ? t("analyzing") : t("analyze")}
          </Button>
        </CardContent>
      </Card>

      {error ? <ActionErrorAlert code={error} onRetry={() => setError(null)} /> : null}

      {result ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">{t("currentVideo")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {result.video.thumbnailUrl ? (
                <Image
                  src={result.video.thumbnailUrl}
                  alt={result.video.title}
                  width={320}
                  height={180}
                  className="rounded-lg border object-cover"
                  unoptimized
                />
              ) : null}
              <p className="font-medium">{result.video.title}</p>
              <div className="text-center">
                <p className="text-4xl font-bold">{result.analysis.overallScore}</p>
                <p className="text-sm text-muted-foreground">{t("overallScore")}</p>
              </div>
              <div className="space-y-3">
                <ScoreBar label={t("titleScore")} score={result.analysis.titleScore} />
                <ScoreBar label={t("descriptionScore")} score={result.analysis.descriptionScore} />
                <ScoreBar label={t("tagsScore")} score={result.analysis.tagsScore} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                {t("suggestions")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">{t("currentTitle")}</p>
                <p className="rounded border p-2 text-sm">{result.video.title}</p>
                <p className="text-xs font-medium text-muted-foreground">{t("suggestedTitle")}</p>
                <div className="flex items-start justify-between gap-2 rounded border border-primary/30 bg-primary/5 p-2">
                  <p className="text-sm font-medium">{result.analysis.suggestedTitle}</p>
                  <CopyButton value={result.analysis.suggestedTitle} />
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium">{t("improvements")}</p>
                {result.analysis.improvements.map((imp) => (
                  <div key={`${imp.area}-${imp.issue}`} className="rounded border p-2 text-sm">
                    <Badge variant="outline" className="mb-1">{imp.area}</Badge>
                    <p className="text-muted-foreground">{imp.issue}</p>
                    <p className="mt-1 font-medium">{imp.fix}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-1">
                {result.analysis.suggestedTags.slice(0, 12).map((tag) => (
                  <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
