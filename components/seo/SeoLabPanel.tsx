"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Loader2, Search } from "lucide-react";

import { researchKeywordsAction } from "@/app/actions/ai-tools";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ScoredKeyword = {
  keyword: string;
  score: number;
  competition: "low" | "medium" | "high";
  reasoning: string;
};

export function SeoLabPanel() {
  const t = useTranslations("seoLab");
  const [seed, setSeed] = React.useState("");
  const [results, setResults] = React.useState<ScoredKeyword[]>([]);
  const [suggestions, setSuggestions] = React.useState<string[]>([]);
  const [pending, startTransition] = React.useTransition();

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>{t("form.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="seed">{t("form.seedLabel")}</Label>
            <Input
              id="seed"
              value={seed}
              onChange={(e) => setSeed(e.target.value)}
              placeholder={t("form.seedPlaceholder")}
            />
            <p className="text-xs text-muted-foreground">{t("form.hint")}</p>
          </div>
          <Button
            type="button"
            className="gap-2"
            disabled={pending || seed.trim().length < 2}
            onClick={() =>
              startTransition(async () => {
                const res = await researchKeywordsAction({ seed });
                if (!res.ok) return;
                setResults(res.data.scored);
                setSuggestions(res.data.suggestions);
              })
            }
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            {pending ? t("form.submitting") : t("form.submit")}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("results.title")}</CardTitle>
          <p className="text-sm text-muted-foreground">{t("results.subtitle")}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {results.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("results.empty")}</p>
          ) : (
            <div className="space-y-3">
              {results.map((row) => (
                <div
                  key={row.keyword}
                  className="flex flex-col gap-2 rounded-xl border border-border/60 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium">{row.keyword}</p>
                    <p className="text-sm text-muted-foreground">{row.reasoning}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{t(`competition.${row.competition}`)}</Badge>
                    <Badge>{t("results.score", { score: row.score })}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
          {suggestions.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm font-medium">{t("results.autocomplete")}</p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s) => (
                  <Badge key={s} variant="outline">
                    {s}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
