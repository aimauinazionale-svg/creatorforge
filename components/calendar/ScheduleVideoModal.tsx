"use client";

import * as React from "react";
import { useTranslations } from "next-intl";

import type { ScheduledVideo, ScheduledVideoStatus } from "@/components/calendar/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export type ScheduleVideoDraft = {
  title: string;
  date: string; // yyyy-MM-dd
  time: string; // HH:mm
  status: ScheduledVideoStatus;
  notes: string;
};

type ScheduleVideoModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialDate?: Date | null;
  bestTimeHint?: { weekday: number; hour: number } | null;
  saving: boolean;
  onSave: (draft: ScheduleVideoDraft) => void;
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

function statusKeys(): ScheduledVideoStatus[] {
  return ["planned", "draft", "scheduled", "published", "canceled"];
}

export function ScheduleVideoModal({
  open,
  onOpenChange,
  initialDate,
  bestTimeHint,
  saving,
  onSave,
}: ScheduleVideoModalProps) {
  const t = useTranslations("calendar");

  const [draft, setDraft] = React.useState<ScheduleVideoDraft>(() => {
    const base = initialDate ?? new Date();
    return {
      title: "",
      date: toLocalDateValue(base),
      time: toLocalTimeValue(base),
      status: "planned",
      notes: "",
    };
  });

  React.useEffect(() => {
    if (!open) return;
    const base = initialDate ?? new Date();
    setDraft((prev) => ({
      ...prev,
      date: toLocalDateValue(base),
      time: toLocalTimeValue(base),
    }));
  }, [open, initialDate]);

  const validationError = React.useMemo(() => {
    if (draft.title.trim().length < 2) return t("validation.title");
    if (!draft.date) return t("validation.dateRequired");
    return null;
  }, [draft.date, draft.title, t]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("schedule.title")}</DialogTitle>
          <DialogDescription>{t("schedule.subtitle")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("fields.title")}</label>
            <Input
              value={draft.title}
              onChange={(e) => setDraft((p) => ({ ...p, title: e.target.value }))}
              placeholder={t("placeholders.title")}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("fields.date")}</label>
              <Input type="date" value={draft.date} onChange={(e) => setDraft((p) => ({ ...p, date: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("fields.time")}</label>
              <div className="flex gap-2">
                <Input type="time" value={draft.time} onChange={(e) => setDraft((p) => ({ ...p, time: e.target.value }))} />
                <Button
                  type="button"
                  variant="outline"
                  disabled={!bestTimeHint}
                  onClick={() => (bestTimeHint ? setDraft((p) => ({ ...p, time: `${pad2(bestTimeHint.hour)}:00` })) : null)}
                >
                  {t("schedule.useBestTime")}
                </Button>
              </div>
              {bestTimeHint ? (
                <p className="text-xs text-muted-foreground">
                  {t("schedule.bestTimeBanner", {
                    day: t(`days.${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][bestTimeHint.weekday]}`),
                    time: `${pad2(bestTimeHint.hour)}:00`,
                  })}
                </p>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{t("fields.status")}</label>
            <select
              value={draft.status}
              onChange={(e) => setDraft((p) => ({ ...p, status: e.target.value as ScheduledVideoStatus }))}
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
            <Textarea value={draft.notes} onChange={(e) => setDraft((p) => ({ ...p, notes: e.target.value }))} placeholder={t("placeholders.notes")} />
          </div>

          {validationError ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{validationError}</div>
          ) : null}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            {t("common.cancel")}
          </Button>
          <Button type="button" onClick={() => onSave(draft)} disabled={saving || Boolean(validationError)}>
            {saving ? t("common.saving") : t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function draftToIso(draft: Pick<ScheduleVideoDraft, "date" | "time">): string | null {
  if (!draft.date) return null;
  const time = draft.time && draft.time.length ? draft.time : "00:00";
  const combined = `${draft.date}T${time}:00`;
  const d = new Date(combined);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export function scheduledVideoToDraft(video: ScheduledVideo): ScheduleVideoDraft {
  const d = new Date(video.scheduledAt);
  const date = Number.isNaN(d.getTime()) ? "" : toLocalDateValue(d);
  const time = Number.isNaN(d.getTime()) ? "" : toLocalTimeValue(d);
  return { title: video.title, date, time, status: video.status, notes: video.notes ?? "" };
}

