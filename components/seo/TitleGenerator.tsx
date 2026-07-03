"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Loader2, Type } from "lucide-react";

import { generateTitleVariantsAction } from "@/app/actions/creator-tools";
import { ActionErrorAlert } from "@/components/errors/ActionErrorAlert";
import { CopyButton } from "@/components/ui/copy-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type TitleVariant = {
  title: string;
  ctrHook: string;
  predictedScore: number;
  lengthChars: number;
  usesEmoji: boolean;
  powerWords: string[];
};

export function TitleGenerator() {
  const t = useTranslations("seoLab.titleGenerator");
  const [title, setTitle] = React.useState("");
  const [topic, setTopic] = React.useState("");
  const [includeEmoji, setIncludeEmoji] = React.useState(false);
  const [powerWords, setPowerWords] = React.useState(true);
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const [variants, setVariants] = React.useState<TitleVariant[]>([]);

  function generate() {
    startTransition(async () => {
      setError(null);
      const res = await generateTitleVariantsAction({ title, topic, includeEmoji, powerWords });
      if (!res.ok) setError(res.error.code);
      else setVariants(res.data.variants);
    });
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Type className="h-4 w-4" aria-hidden="true" />
            {t("title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="gen-title">{t("currentTitle")}</Label>
            <Input
              id="gen-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("titlePlaceholder")}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="gen-topic">{t("topic")}</Label>
            <Input
              id="gen-topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={t("topicPlaceholder")}
            />
          </div>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={includeEmoji}
                onChange={(e) => setIncludeEmoji(e.target.checked)}
                className="rounded border"
              />
              {t("includeEmoji")}
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={powerWords}
                onChange={(e) => setPowerWords(e.target.checked)}
                className="rounded border"
              />
              {t("powerWords")}
            </label>
          </div>
          <Button
            type="button"
            disabled={pending || title.trim().length < 2 || topic.trim().length < 2}
            onClick={generate}
          >
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : null}
            {pending ? t("generating") : t("generate")}
          </Button>
        </CardContent>
      </Card>

      {error ? <ActionErrorAlert code={error} onRetry={() => setError(null)} /> : null}

      {variants.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2">
          {variants.map((v) => (
            <Card key={v.title}>
              <CardContent className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium">{v.title}</p>
                  <CopyButton value={v.title} />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="secondary">{v.predictedScore}/100 CTR</Badge>
                  <Badge variant="outline">{v.ctrHook}</Badge>
                  <Badge variant="outline">{v.lengthChars} {t("chars")}</Badge>
                  {v.usesEmoji ? <Badge variant="outline">{t("emoji")}</Badge> : null}
                </div>
                {v.powerWords.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {v.powerWords.map((w) => (
                      <Badge key={w} variant="outline" className="text-xs">{w}</Badge>
                    ))}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  );
}
