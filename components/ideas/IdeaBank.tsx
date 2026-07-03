"use client";

import * as React from "react";
import { Download, Lightbulb, Pencil, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

import {
  createIdeaAction,
  deleteIdeaAction,
  listIdeasAction,
  updateIdeaAction,
} from "@/app/actions/ideas-bank";
import type { IdeaRow } from "@/lib/actions/types/ideas-bank";
import { ActionErrorAlert } from "@/components/errors/ActionErrorAlert";
import { IdeaCard } from "@/components/ideas/IdeaCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

export function IdeaBank() {
  const t = useTranslations("ideas");
  const { toast } = useToast();
  const [ideas, setIdeas] = React.useState<IdeaRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<{ code: string; details?: string } | null>(null);
  const [showForm, setShowForm] = React.useState(false);
  const [editing, setEditing] = React.useState<IdeaRow | null>(null);
  const [form, setForm] = React.useState({
    title: "",
    description: "",
    category: "",
    tags: "",
    notes: "",
  });

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await listIdeasAction();
    if (!res.ok) {
      setError(res.error);
      setIdeas([]);
      setLoading(false);
      return;
    }
    setIdeas(res.data.ideas.filter((i) => i.status === "active"));
    setLoading(false);
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setShowForm(true);
    setForm({ title: "", description: "", category: "", tags: "", notes: "" });
  }

  function openEdit(idea: IdeaRow) {
    setEditing(idea);
    setShowForm(true);
    setForm({
      title: idea.title,
      description: idea.description ?? "",
      category: idea.category ?? "",
      tags: (idea.tags ?? []).join(", "),
      notes: idea.notes ?? "",
    });
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify(ideas, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sparkroll-ideas-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: t("toast.exported.title"), description: t("toast.exported.description") });
  }

  async function onSave() {
    if (form.title.trim().length < 2) {
      toast({ variant: "destructive", title: t("validation.title") });
      return;
    }

    const payload = {
      title: form.title,
      description: form.description || null,
      category: form.category || null,
      tags: form.tags
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      notes: form.notes || null,
      priority: 2,
      status: "active" as const,
    };

    const res = editing
      ? await updateIdeaAction(editing.id, payload)
      : await createIdeaAction(payload);

    if (!res.ok) {
      toast({
        variant: "destructive",
        title: t("toast.actionFailed.title"),
        description: t(`errors.${res.error.code}`, { details: res.error.details ?? "" }),
      });
      return;
    }

    await load();
    setEditing(null);
    setShowForm(false);
    toast({ title: editing ? t("toast.saved.title") : t("toast.created.title") });
  }

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-48 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    );
  }

  if (error && error.code !== "DB_ERROR") {
    return <ActionErrorAlert code={error.code} details={error.details} onRetry={() => void load()} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Badge variant="secondary">{t("countBadge.title", { count: ideas.length })}</Badge>
        <div className="flex flex-wrap gap-2">
          {ideas.length > 0 ? (
            <Button type="button" variant="outline" size="sm" onClick={exportJson}>
              <Download className="h-4 w-4" aria-hidden="true" />
              {t("actions.exportJson")}
            </Button>
          ) : null}
          <Button type="button" onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t("actions.newIdea")}
          </Button>
        </div>
      </div>

      {showForm ? (
        <Card>
          <CardHeader>
            <CardTitle>{editing ? t("modal.editTitle") : t("modal.createTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="idea-title">{t("fields.title")}</Label>
              <Input
                id="idea-title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                aria-invalid={form.title.trim().length > 0 && form.title.trim().length < 2}
              />
              {form.title.trim().length > 0 && form.title.trim().length < 2 ? (
                <p className="text-sm text-destructive">{t("validation.title")}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="idea-description">{t("fields.description")}</Label>
              <Textarea
                id="idea-description"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="idea-category">{t("fields.category")}</Label>
                <Input
                  id="idea-category"
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="idea-tags">{t("fields.tags")}</Label>
                <Input
                  id="idea-tags"
                  value={form.tags}
                  onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="button" onClick={() => void onSave()} disabled={form.title.trim().length < 2}>
                {t("actions.save")}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditing(null);
                  setShowForm(false);
                }}
              >
                {t("actions.cancel")}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {ideas.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <Lightbulb className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">{t("empty.description")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {ideas.map((idea) => (
            <div key={idea.id} className="relative">
              <IdeaCard idea={idea} />
              <div className="absolute right-3 top-3 flex gap-1">
                <Button type="button" size="icon" variant="ghost" onClick={() => openEdit(idea)} aria-label={t("actions.edit")}>
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  aria-label={t("actions.delete")}
                  onClick={() =>
                    void (async () => {
                      const res = await deleteIdeaAction(idea.id);
                      if (res.ok) {
                        setIdeas((prev) => prev.filter((p) => p.id !== idea.id));
                        toast({ title: t("toast.deleted.title") });
                      } else {
                        toast({ variant: "destructive", title: t("toast.actionFailed.title") });
                      }
                    })()
                  }
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
