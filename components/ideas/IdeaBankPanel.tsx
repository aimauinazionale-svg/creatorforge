"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Download, Layers, Lightbulb, Plus, Search } from "lucide-react";

import {
  bulkDeleteIdeasAction,
  bulkUpdateIdeasAction,
  createIdeaAction,
  createWorkflowFromIdeaAction,
  deleteIdeaAction,
  exportIdeasAction,
  listIdeasAction,
  updateIdeaAction,
} from "@/app/actions/ideas-bank";
import type { IdeaRow } from "@/lib/actions/types/ideas-bank";
import { ActionErrorAlert } from "@/components/errors/ActionErrorAlert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

export function IdeaBankPanel() {
  const t = useTranslations("ideas");
  const { toast } = useToast();
  const [ideas, setIdeas] = React.useState<IdeaRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"all" | "active" | "archived">("active");
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<IdeaRow | null>(null);
  const [form, setForm] = React.useState({
    title: "",
    description: "",
    category: "",
    tags: "",
    priority: 2,
    status: "active" as "active" | "archived",
    notes: "",
  });

  const load = React.useCallback(async () => {
    setLoading(true);
    const res = await listIdeasAction();
    if (!res.ok) {
      setError(res.error.code);
      setIdeas([]);
    } else {
      setIdeas(res.data.ideas);
      setError(null);
    }
    setLoading(false);
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const filtered = ideas.filter((i) => {
    if (statusFilter !== "all" && i.status !== statusFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      i.title.toLowerCase().includes(q) ||
      (i.description ?? "").toLowerCase().includes(q) ||
      i.tags?.some((tag) => tag.toLowerCase().includes(q))
    );
  });

  function openCreate() {
    setEditing(null);
    setForm({ title: "", description: "", category: "", tags: "", priority: 2, status: "active", notes: "" });
    setModalOpen(true);
  }

  function openEdit(idea: IdeaRow) {
    setEditing(idea);
    setForm({
      title: idea.title,
      description: idea.description ?? "",
      category: idea.category ?? "",
      tags: (idea.tags ?? []).join(", "),
      priority: idea.priority,
      status: idea.status as "active" | "archived",
      notes: idea.notes ?? "",
    });
    setModalOpen(true);
  }

  async function onSave() {
    const payload = {
      title: form.title,
      description: form.description || null,
      category: form.category || null,
      tags: form.tags.split(/[,;\n]/).map((s) => s.trim()).filter(Boolean),
      priority: Math.min(2, Math.max(0, form.priority - 1)),
      status: form.status,
      notes: form.notes || null,
    };
    const res = editing
      ? await updateIdeaAction(editing.id, payload)
      : await createIdeaAction(payload);
    if (!res.ok) {
      toast({ variant: "destructive", title: t(`errors.${res.error.code}`) });
      return;
    }
    toast({ title: editing ? t("toast.saved.title") : t("toast.created.title") });
    setModalOpen(false);
    void load();
  }

  async function onExport() {
    const res = await listIdeasAction();
    if (!res.ok) return;
    const blob = new Blob([JSON.stringify(res.data.ideas, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "creatorforge-ideas.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function onBulkArchive() {
    const ids = [...selected];
    if (!ids.length) return;
    await Promise.all(ids.map((id) => updateIdeaAction(id, { status: "archived" })));
    setSelected(new Set());
    void load();
  }

  async function onBulkDelete() {
    const ids = [...selected];
    if (!ids.length) return;
    await Promise.all(ids.map((id) => deleteIdeaAction(id)));
    setSelected(new Set());
    void load();
  }

  if (loading) return <Skeleton className="h-64 w-full" />;
  if (error && error !== "DB_ERROR") return <ActionErrorAlert code={error} onRetry={() => void load()} />;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder={t("filters.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label={t("filters.searchAria")}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          >
            <option value="active">{t("filters.status.active")}</option>
            <option value="archived">{t("filters.status.archived")}</option>
            <option value="all">{t("filters.status.all")}</option>
          </select>
          <Button variant="outline" size="sm" onClick={() => void onExport()}>
            <Download className="mr-2 h-4 w-4" aria-hidden="true" />
            {t("actions.exportJson")}
          </Button>
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            {t("actions.newIdea")}
          </Button>
        </div>
      </div>

      {selected.size > 0 ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border/60 bg-muted/30 p-3">
          <span className="text-sm">{t("bulk.selectedCount", { count: selected.size })}</span>
          <Button size="sm" variant="outline" onClick={() => void onBulkArchive()}>
            {t("bulk.archive")}
          </Button>
          <Button size="sm" variant="destructive" onClick={() => void onBulkDelete()}>
            {t("bulk.delete")}
          </Button>
        </div>
      ) : null}

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
            <Lightbulb className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{t("empty.description")}</p>
            <Button onClick={openCreate}>{t("actions.newIdea")}</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((idea) => (
            <Card key={idea.id} className="h-full">
              <CardHeader className="pb-2">
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={selected.has(idea.id)}
                    onChange={(e) => {
                      const next = new Set(selected);
                      if (e.target.checked) next.add(idea.id);
                      else next.delete(idea.id);
                      setSelected(next);
                    }}
                    aria-label={t("bulk.selectOne", { title: idea.title })}
                  />
                  <CardTitle className="flex-1 cursor-pointer text-base" onClick={() => openEdit(idea)}>
                    {idea.title}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {idea.description ? (
                  <p className="line-clamp-2 text-sm text-muted-foreground">{idea.description}</p>
                ) : null}
                <div className="flex flex-wrap gap-1">
                  {idea.tags?.slice(0, 4).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      void createWorkflowFromIdeaAction(idea.id).then((res) => {
                        if (res.ok) {
                          toast({
                            title: t("toast.workflowCreated.title"),
                            description: t("toast.workflowCreated.description"),
                          });
                        } else {
                          toast({ variant: "destructive", title: t("toast.actionFailed.title") });
                        }
                      })
                    }
                  >
                    <Layers className="mr-1 h-3 w-3" aria-hidden="true" />
                    {t("actions.createWorkflow")}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => void deleteIdeaAction(idea.id).then(() => load())}
                  >
                    {t("actions.delete")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? t("modal.editTitle") : t("modal.createTitle")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>{t("fields.title")}</Label>
              <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>{t("fields.description")}</Label>
              <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>{t("fields.tags")}</Label>
              <Input value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))} />
            </div>
            <Button onClick={() => void onSave()}>{t("actions.save")}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
