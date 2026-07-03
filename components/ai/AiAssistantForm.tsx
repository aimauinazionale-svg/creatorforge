"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";

import { createIdeas } from "@/app/actions/ideas";
import type { CreateIdeasResult } from "@/lib/actions/types/ideas";
import { ActionErrorAlert } from "@/components/errors/ActionErrorAlert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CopyButton } from "@/components/ui/copy-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { AiIdea } from "@/lib/ai/[feature]";
import { toUserFacingCode } from "@/lib/actions/result";

const FormSchema = z.object({
  topic: z.string().min(2).max(200),
  count: z.number().int().min(1).max(10).default(5),
});

type FormValues = z.input<typeof FormSchema>;

export function AiAssistantForm() {
  const t = useTranslations("aiAssistant");
  const locale = useLocale();
  const { toast } = useToast();

  const [result, setResult] = React.useState<CreateIdeasResult | null>(null);
  const [ideas, setIdeas] = React.useState<AiIdea[] | null>(null);
  const [isPending, startTransition] = React.useTransition();

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: { topic: "", count: 5 },
    mode: "onSubmit",
  });

  const onSubmit = (values: FormValues) => {
    setResult(null);
    setIdeas(null);
    startTransition(async () => {
      const res = await createIdeas({
        topic: values.topic,
        count: values.count ?? 5,
        locale: locale as never,
      });
      setResult(res);
      if (res.ok) {
        setIdeas(res.data.ideas.slice(0, 5));
        toast({ title: t("toast.success") });
        return;
      }
      const code = toUserFacingCode(res.error.code);
      const userDetails = code === "MISSING_CONFIG" ? (res.error.details ?? "") : "";
      toast({
        variant: "destructive",
        title: t("toast.error"),
        description: t(`errors.${code}`, { details: userDetails }),
      });
    });
  };

  const errorCode = result && !result.ok ? toUserFacingCode(result.error.code) : null;

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>{t("form.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" aria-busy={isPending}>
            <div className="space-y-2">
              <Label htmlFor="topic">{t("form.topicLabel")}</Label>
              <Input
                id="topic"
                placeholder={t("form.topicPlaceholder")}
                {...form.register("topic")}
                aria-invalid={Boolean(form.formState.errors.topic)}
              />
              {form.formState.errors.topic ? (
                <p className="text-sm text-destructive">{t("form.validation.topic")}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="count">{t("form.countLabel")}</Label>
              <Input
                id="count"
                type="number"
                min={1}
                max={10}
                {...form.register("count", { valueAsNumber: true })}
                aria-invalid={Boolean(form.formState.errors.count)}
              />
              {form.formState.errors.count ? (
                <p className="text-sm text-destructive">{t("form.validation.count")}</p>
              ) : (
                <p className="text-xs text-muted-foreground">{t("form.countHint")}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? t("form.submitting") : t("form.submit")}
            </Button>
          </form>

          {errorCode ? (
            <ActionErrorAlert
              code={errorCode}
              onRetry={() => void form.handleSubmit(onSubmit)()}
            />
          ) : null}
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div>
          <div className="text-sm font-medium">{t("results.title")}</div>
          <p className="mt-1 text-sm text-muted-foreground">{t("results.subtitle")}</p>
        </div>

        {!ideas ? (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">{t("results.empty")}</CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {ideas.map((idea, idx) => {
              const copyText = [idea.title, idea.description, idea.tags?.join(", ")].filter(Boolean).join("\n\n");
              return (
                <Card key={`${idea.title}-${idx}`} className="h-full">
                  <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
                    <CardTitle className="text-base">{idea.title}</CardTitle>
                    <CopyButton value={copyText} />
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">{idea.description}</p>
                    {idea.tags?.length ? (
                      <div className="flex flex-wrap gap-2">
                        {idea.tags.slice(0, 8).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full border border-border/60 bg-background px-2 py-0.5 text-xs text-muted-foreground"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
