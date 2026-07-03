"use client";

import * as React from "react";
import { useTranslations } from "next-intl";

import type { ScheduledVideo } from "@/components/calendar/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type VideoDetailsModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  video: ScheduledVideo | null;
  saving: boolean;
  deleting: boolean;
  onSave: (id: string, patch: { title: string; scheduledAt: string; status: ScheduledVideo["status"]; notes: string }) => void;
  onDelete: (id: string) => void;
};

function pad2(n: number) {
  return n.toString().padStart(2, "0");
}

function toLocalDateValue(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function toLocalTimeValue(d: Date) {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function statusKeys(): ScheduledVideo["status"][] {
  return ["planned", "draft", "scheduled", "published", "canceled"];
}

export function VideoDetailsModal({ open, onOpenChange, video, saving, deleting, onSave, onDelete }: VideoDetailsModalProps) {
  const t = useTranslations("calendar");

  const [title, setTitle] = React.useState("");
  const [date, setDate] = React.useState("");
  const [time, setTime] = React.useState("");
  const [status, setStatus] = React.useState<ScheduledVideo["status"]>("planned");
  const [notes, setNotes] = React.useState("");

  React.useEffect(() => {
    if (!open || !video) return;
    const d = new Date(video.scheduledAt);
    setTitle(video.title);
    setDate(Number.isNaN(d.getTime()) ? "" : toLocalDateValue(d));
    setTime(Number.isNaN(d.getTime()) ? "" : toLocalTimeValue(d));
    setStatus(video.status);
    setNotes(video.notes ?? "");
  }, [open, video]);

  const scheduledAt = React.useMemo(() => {
    if (!date) return null;
    const tValue = time && time.length ? time : "00:00";
    const combined = `${date}T${tValue}:00`;
    const d = new Date(combined);
    if (Number.isNaN(d.getTime())) return null;
    return d.toISOString();
  }, [date, time]);

  const validationError = React.useMemo(() => {
    if (!video) return null;
    if (title.trim().length < 2) return t("validation.title");
    if (!date) return t("validation.dateRequired");
    if (!scheduledAt) return t("validation.dateRequired");
    return null;
  }, [date, scheduledAt, t, title, video]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("details.title")}</DialogTitle>
          <DialogDescription>{video ? `${t("details.subtitle")} ${video.title}` : t("details.empty")}</DialogDescription>
        </DialogHeader>

        {video ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("fields.title")}</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("fields.date")}</label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("fields.time")}</label>
                <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t("fields.status")}</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ScheduledVideo["status"])}
                className={cn(
                  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                )}
              >
                {statusKeys().map((s) => (
                  <option key={s} value={s}>
                    {t(`status.${s}`)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t("fields.notes")}</label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>

            {validationError ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{validationError}</div>
            ) : null}
          </div>
        ) : (
          <div className="rounded-xl border border-border/60 bg-card p-6 text-sm text-muted-foreground">{t("details.empty")}</div>
        )}

        <DialogFooter>
          {video ? (
            <Button type="button" variant="destructive" onClick={() => onDelete(video.id)} disabled={deleting || saving}>
              {deleting ? t("details.deleting") : t("details.delete")}
            </Button>
          ) : null}
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving || deleting}>
            {t("common.close")}
          </Button>
          {video ? (
            <Button
              type="button"
              onClick={() => (scheduledAt ? onSave(video.id, { title, scheduledAt, status, notes }) : null)}
              disabled={saving || deleting || Boolean(validationError) || !scheduledAt}
            >
              {saving ? t("common.saving") : t("common.save")}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

