"use client";

import * as React from "react";
import { Layers3, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { createWorkflowFromIdeaAction } from "@/app/actions/ideas-bank";
import type { IdeaRow } from "@/lib/actions/types/ideas-bank";
import { ActionErrorAlert } from "@/components/errors/ActionErrorAlert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Link } from "@/i18n/navigation";

export type IdeaCardProps = {
  idea: IdeaRow;
  onWorkflowCreated?: (workflowId: string) => void;
};

export function IdeaCard({ idea, onWorkflowCreated }: IdeaCardProps) {
  const t = useTranslations("ideas");
  const tCommon = useTranslations("common");
  const { toast } = useToast();
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<{ code: string; details?: string } | null>(null);

  function createWorkflow() {
    setError(null);
    startTransition(async () => {
      const res = await createWorkflowFromIdeaAction(idea.id);
      if (!res.ok) {
        setError(res.error);
        toast({
          variant: "destructive",
          title: t("toast.actionFailed.title"),
          description:
            res.error.code === "YOUTUBE_NOT_CONNECTED" || res.error.code === "NOT_CONNECTED"
              ? tCommon("errors.YOUTUBE_NOT_CONNECTED")
              : t(`errors.${res.error.code}`, { details: res.error.details ?? "" }),
        });
        return;
      }
      toast({
        title: t("toast.workflowCreated.title"),
        description: t("toast.workflowCreated.description"),
      });
      onWorkflowCreated?.(res.data.workflowId);
    });
  }

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base leading-snug">{idea.title}</CardTitle>
          {idea.category ? (
            <Badge variant="secondary" className="shrink-0">
              {idea.category}
            </Badge>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-3">
        {idea.description ? (
          <p className="text-sm text-muted-foreground line-clamp-3">{idea.description}</p>
        ) : null}
        {idea.tags?.length ? (
          <div className="flex flex-wrap gap-1.5">
            {idea.tags.slice(0, 6).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        ) : null}
        {error ? (
          <ActionErrorAlert
            code={error.code}
            details={error.details}
            onRetry={createWorkflow}
            className="text-xs"
          />
        ) : null}
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2 pt-0">
        <Button type="button" size="sm" disabled={pending} onClick={createWorkflow}>
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Layers3 className="h-4 w-4" aria-hidden="true" />
          )}
          {t("actions.createWorkflow")}
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link href="/workflow">{t("actions.viewWorkflow")}</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
