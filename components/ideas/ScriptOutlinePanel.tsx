"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Copy, FileText, Loader2 } from "lucide-react";

import { generateScriptOutlineAction } from "@/app/actions/creator-tools";
import { ActionErrorAlert } from "@/components/errors/ActionErrorAlert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

type ScriptOutline = {
  hook: string;
  intro: string;
  sections: Array<{ sectionTitle: string; timeRange: string; bullets: string[] }>;
  cta: string;
  outro: string;
};

export function ScriptOutlinePanel() {
  const t = useTranslations("ideas.scriptOutline");
  const { toast } = useToast();
  const [title, setTitle] = React.useState("");
  const [duration, setDuration] = React.useState("8-10 minutes");
  const [style, setStyle] = React.useState("educational");
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const [outline, setOutline] = React.useState<ScriptOutline | null>(null);

  function generate() {
    startTransition(async () => {
      setError(null);
      const res = await generateScriptOutlineAction({ title, duration, style });
      if (!res.ok) setError(res.error.code);
      else setOutline(res.data);
    });
  }

  async function copyOutline() {
    if (!outline) return;
    const text = [
      `# ${title}`,
      "",
      `## Hook\n${outline.hook}`,
      "",
      `## Intro\n${outline.intro}`,
      "",
      ...outline.sections.map(
        (s) =>
          `## ${s.sectionTitle} (${s.timeRange})\n${s.bullets.map((b) => `- ${b}`).join("\n")}`
      ),
      "",
      `## CTA\n${outline.cta}`,
      "",
      `## Outro\n${outline.outro}`,
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: t("copied") });
    } catch {
      toast({ variant: "destructive", title: t("copyError") });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="h-4 w-4" aria-hidden="true" />
          {t("title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1 sm:col-span-1">
            <Label htmlFor="script-title">{t("videoTitle")}</Label>
            <Input
              id="script-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("titlePlaceholder")}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="script-duration">{t("duration")}</Label>
            <Input
              id="script-duration"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="script-style">{t("style")}</Label>
            <Input
              id="script-style"
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              placeholder={t("stylePlaceholder")}
            />
          </div>
        </div>

        <Button type="button" disabled={pending || title.trim().length < 2} onClick={generate}>
          {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : null}
          {pending ? t("generating") : t("generate")}
        </Button>

        {error ? <ActionErrorAlert code={error} onRetry={() => setError(null)} /> : null}

        {outline ? (
          <div className="space-y-4 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <Badge variant="secondary">{t("result")}</Badge>
              <Button type="button" variant="outline" size="sm" onClick={() => void copyOutline()}>
                <Copy className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                {t("copyAll")}
              </Button>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium uppercase text-muted-foreground">{t("hook")}</p>
              <p className="text-sm font-medium italic">&ldquo;{outline.hook}&rdquo;</p>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium uppercase text-muted-foreground">{t("intro")}</p>
              <p className="text-sm">{outline.intro}</p>
            </div>

            {outline.sections.map((section) => (
              <div key={section.sectionTitle} className="space-y-1">
                <p className="text-sm font-medium">
                  {section.sectionTitle}{" "}
                  <span className="text-xs text-muted-foreground">({section.timeRange})</span>
                </p>
                <ul className="list-inside list-disc space-y-0.5 text-sm text-muted-foreground">
                  {section.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </div>
            ))}

            <div className="space-y-1">
              <p className="text-xs font-medium uppercase text-muted-foreground">{t("cta")}</p>
              <p className="text-sm">{outline.cta}</p>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium uppercase text-muted-foreground">{t("outro")}</p>
              <p className="text-sm">{outline.outro}</p>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
