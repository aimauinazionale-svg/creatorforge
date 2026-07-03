"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { ChevronRight, Plus } from "lucide-react";

import {
  createWorkflowAction,
  deleteWorkflowAction,
  listWorkflowsAction,
  updateWorkflowAction,
} from "@/app/actions/workflow";
import {
  WORKFLOW_STATUSES,
  type WorkflowCard,
  type WorkflowStatus,
} from "@/components/workflow/types";
import { ActionErrorAlert } from "@/components/errors/ActionErrorAlert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

function groupByStatus(cards: WorkflowCard[]): Record<WorkflowStatus, WorkflowCard[]> {
  const map = {} as Record<WorkflowStatus, WorkflowCard[]>;
  for (const status of WORKFLOW_STATUSES) {
    map[status] = [];
  }
  for (const card of cards) {
    map[card.status].push(card);
  }
  return map;
}

export function WorkflowBoard() {
  const t = useTranslations("workflow");
  const { toast } = useToast();
  const [cards, setCards] = React.useState<WorkflowCard[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<WorkflowCard | null>(null);
  const [createStatus, setCreateStatus] = React.useState<WorkflowStatus>("idea");
  const [form, setForm] = React.useState({ title: "", description: "", notes: "", status: "idea" as WorkflowStatus });
  const [saving, setSaving] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    const res = await listWorkflowsAction();
    if (!res.ok) {
      setError(res.error.code);
      setCards([]);
    } else {
      setCards(res.data.cards);
      setError(null);
    }
    setLoading(false);
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const grouped = React.useMemo(() => groupByStatus(cards), [cards]);

  function openCreate(status: WorkflowStatus) {
    setEditing(null);
    setCreateStatus(status);
    setForm({ title: "", description: "", notes: "", status });
    setModalOpen(true);
  }

  function openEdit(card: WorkflowCard) {
    setEditing(card);
    setForm({
      title: card.title,
      description: card.description ?? "",
      notes: card.notes ?? "",
      status: card.status,
    });
    setModalOpen(true);
  }

  async function moveCard(card: WorkflowCard, direction: "next" | "prev") {
    const idx = WORKFLOW_STATUSES.indexOf(card.status);
    const nextIdx = direction === "next" ? idx + 1 : idx - 1;
    if (nextIdx < 0 || nextIdx >= WORKFLOW_STATUSES.length) return;
    const nextStatus = WORKFLOW_STATUSES[nextIdx];
    const res = await updateWorkflowAction(card.id, { status: nextStatus });
    if (!res.ok) toast({ variant: "destructive", title: t(`errors.${res.error.code}`) });
    else setCards((prev) => prev.map((c) => (c.id === card.id ? res.data.card : c)));
  }

  async function onSave() {
    if (form.title.trim().length < 2) return;
    setSaving(true);
    if (editing) {
      const res = await updateWorkflowAction(editing.id, {
        title: form.title,
        description: form.description || null,
        notes: form.notes || null,
        status: form.status,
      });
      setSaving(false);
      if (!res.ok) {
        toast({ variant: "destructive", title: t(`errors.${res.error.code}`) });
        return;
      }
      setCards((prev) => prev.map((c) => (c.id === editing.id ? res.data.card : c)));
    } else {
      const res = await createWorkflowAction({
        title: form.title,
        status: createStatus,
        description: form.description || null,
        notes: form.notes || null,
      });
      setSaving(false);
      if (!res.ok) {
        toast({ variant: "destructive", title: t(`errors.${res.error.code}`) });
        return;
      }
      setCards((prev) => [...prev, res.data.card]);
    }
    setModalOpen(false);
  }

  async function onDelete() {
    if (!editing) return;
    setSaving(true);
    const res = await deleteWorkflowAction(editing.id);
    setSaving(false);
    if (res.ok) {
      setCards((prev) => prev.filter((c) => c.id !== editing.id));
      setModalOpen(false);
    }
  }

  if (loading) return <Skeleton className="h-64 w-full" />;
  if (error && error !== "DB_ERROR") {
    return <ActionErrorAlert code={error} onRetry={() => void load()} />;
  }

  return (
    <>
      <div className="-mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4">
        {WORKFLOW_STATUSES.map((status) => (
          <div key={status} className="min-w-[min(85vw,280px)] flex-none snap-start rounded-xl border border-border/60 bg-muted/20 p-2 sm:min-w-[240px] sm:flex-1">
            <div className="mb-2 flex items-center justify-between px-1">
              <h3 className="text-sm font-semibold">{t(`columns.${status}`)}</h3>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-11 w-11"
                onClick={() => openCreate(status)}
                aria-label={t("actions.addToColumn", { column: t(`columns.${status}`) })}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2 min-h-[120px]">
              {(grouped[status] ?? []).map((card) => (
                <Card key={card.id} className="cursor-pointer" onClick={() => openEdit(card)}>
                  <CardContent className="space-y-2 p-3">
                    <p className="text-sm font-medium line-clamp-2">{card.title}</p>
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          void moveCard(card, "prev");
                        }}
                      >
                        ←
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          void moveCard(card, "next");
                        }}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {!grouped[status]?.length ? (
                <p className="px-2 text-xs text-muted-foreground">{t("emptyColumn")}</p>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? t("modal.title") : t("create.title")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>{t("fields.title")}</Label>
              <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>{t("fields.status")}</Label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as WorkflowStatus }))}
              >
                {WORKFLOW_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {t(`status.${s}`)}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label>{t("fields.description")}</Label>
              <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="flex gap-2">
              <Button onClick={() => void onSave()} disabled={saving}>
                {saving ? t("actions.saving") : t("actions.save")}
              </Button>
              {editing ? (
                <Button variant="destructive" onClick={() => void onDelete()} disabled={saving}>
                  {t("actions.delete")}
                </Button>
              ) : null}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
