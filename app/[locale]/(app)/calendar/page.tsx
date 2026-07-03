"use client";

import * as React from "react";
import { addMonths, addDays, format, startOfMonth, startOfWeek } from "date-fns";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useTranslations } from "next-intl";

import type { BestPublishingTimeRecommendation, CalendarViewMode, ScheduledVideo } from "@/components/calendar/types";
import { MonthCalendar } from "@/components/calendar/MonthCalendar";
import { WeekCalendar } from "@/components/calendar/WeekCalendar";
import { ListView, type ListFilter } from "@/components/calendar/ListView";
import { ScheduleVideoModal, draftToIso, type ScheduleVideoDraft } from "@/components/calendar/ScheduleVideoModal";
import { VideoDetailsModal } from "@/components/calendar/VideoDetailsModal";
import { BestTimeCard } from "@/components/calendar/BestTimeCard";
import { BestTimeBanner } from "@/components/calendar/BestTimeBanner";
import { PublishingStats } from "@/components/calendar/PublishingStats";
import {
  createScheduledVideoAction,
  deleteScheduledVideoAction,
  getBestPublishingTimeAction,
  getScheduledVideosAction,
  updateScheduledVideoAction,
} from "@/app/actions/calendar";
import type { ScheduledVideoRow } from "@/lib/actions/types/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

function mapRowToItem(row: ScheduledVideoRow): ScheduledVideo {
  return {
    id: row.id,
    title: row.title,
    scheduledAt: row.scheduledAt,
    status: row.status,
    notes: row.notes,
    ideaId: row.ideaId,
    thumbnailUrl: row.thumbnailUrl,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export default function CalendarPage() {
  const t = useTranslations("calendar");
  const { toast } = useToast();

  const [view, setView] = React.useState<CalendarViewMode>("month");
  const [month, setMonth] = React.useState(() => startOfMonth(new Date()));
  const [items, setItems] = React.useState<ScheduledVideo[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [scheduleOpen, setScheduleOpen] = React.useState(false);
  const [detailsOpen, setDetailsOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<ScheduledVideo | null>(null);

  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  const [bestTimeLoading, setBestTimeLoading] = React.useState(true);
  const [bestTime, setBestTime] = React.useState<BestPublishingTimeRecommendation | null>(null);

  const [listFilter, setListFilter] = React.useState<ListFilter>("upcoming");

  const range = React.useMemo(() => {
    const start = startOfMonth(month);
    const end = addMonths(start, 1);
    return { start, end };
  }, [month]);

  const weekStart = React.useMemo(() => startOfWeek(new Date(), { weekStartsOn: 0 }), []);
  const weekRange = React.useMemo(() => ({ start: weekStart, end: addDays(weekStart, 7) }), [weekStart]);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await getScheduledVideosAction({ start: range.start.toISOString(), end: range.end.toISOString() });
    if (!res.ok) {
      setItems([]);
      setError(t(`errors.${res.error.code}`));
      setLoading(false);
      return;
    }
    setItems(res.data.videos.map(mapRowToItem));
    setLoading(false);
  }, [range.end, range.start, t]);

  React.useEffect(() => {
    void load();
  }, [load]);

  React.useEffect(() => {
    let mounted = true;
    async function run() {
      setBestTimeLoading(true);
      const res = await getBestPublishingTimeAction();
      if (!mounted) return;
      if (!res.ok) {
        setBestTime(null);
        setBestTimeLoading(false);
        return;
      }
      setBestTime(res.data.recommendation);
      setBestTimeLoading(false);
      toast({ title: t("toasts.bestTimeLoaded") });
    }
    void run();
    return () => {
      mounted = false;
    };
  }, [t, toast]);

  function openDetails(item: ScheduledVideo) {
    setSelected(item);
    setDetailsOpen(true);
  }

  async function onCreate(draft: ScheduleVideoDraft) {
    const iso = draftToIso(draft);
    if (!iso) return;
    setSaving(true);
    try {
      const res = await createScheduledVideoAction({
        title: draft.title,
        scheduledAt: iso,
        status: draft.status,
        notes: draft.notes,
      });
      if (!res.ok) {
        toast({
          variant: "destructive",
          title: t("errors.scheduleFailed"),
          description: t(`errors.${res.error.code}`),
        });
        return;
      }
      const item = mapRowToItem(res.data.video);
      setItems((prev) => prev.concat(item).sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()));
      toast({ title: t("toasts.scheduled") });
      setScheduleOpen(false);
    } finally {
      setSaving(false);
    }
  }

  async function onReschedule(id: string, nextDate: Date) {
    const existing = items.find((i) => i.id === id);
    if (!existing) return;
    const current = new Date(existing.scheduledAt);
    if (Number.isNaN(current.getTime())) return;
    const next = new Date(nextDate);
    next.setHours(current.getHours(), current.getMinutes(), 0, 0);

    const optimistic = { ...existing, scheduledAt: next.toISOString() };
    setItems((prev) => prev.map((p) => (p.id === id ? optimistic : p)));

    const res = await updateScheduledVideoAction(id, { scheduledAt: optimistic.scheduledAt });
    if (!res.ok) {
      setItems((prev) => prev.map((p) => (p.id === id ? existing : p)));
      toast({
        variant: "destructive",
        title: t("errors.updateFailed"),
        description: t(`errors.${res.error.code}`, { details: res.error.details ?? "" }),
      });
      return;
    }
    setItems((prev) => prev.map((p) => (p.id === id ? mapRowToItem(res.data.video) : p)));
    toast({ title: t("toasts.rescheduled") });
  }

  async function onUpdate(id: string, patch: { title: string; scheduledAt: string; status: ScheduledVideo["status"]; notes: string }) {
    setSaving(true);
    try {
      const res = await updateScheduledVideoAction(id, {
        title: patch.title,
        scheduledAt: patch.scheduledAt,
        status: patch.status,
        notes: patch.notes,
      });
      if (!res.ok) {
        toast({
          variant: "destructive",
          title: t("errors.updateFailed"),
          description: t(`errors.${res.error.code}`),
        });
        return;
      }
      const updated = mapRowToItem(res.data.video);
      setItems((prev) => prev.map((p) => (p.id === id ? updated : p)));
      setSelected(updated);
      toast({ title: t("toasts.updated") });
      setDetailsOpen(false);
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: string) {
    setDeleting(true);
    try {
      const res = await deleteScheduledVideoAction(id);
      if (!res.ok) {
        toast({
          variant: "destructive",
          title: t("errors.deleteFailed"),
          description: t(`errors.${res.error.code}`),
        });
        return;
      }
      setItems((prev) => prev.filter((p) => p.id !== id));
      toast({ title: t("toasts.deleted") });
      setDetailsOpen(false);
      setSelected(null);
    } finally {
      setDeleting(false);
    }
  }

  const monthLabel = React.useMemo(() => format(month, "LLLL yyyy"), [month]);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">{t("title")}</h1>
          <p className="text-pretty text-sm text-muted-foreground sm:text-base">{t("subtitle")}</p>
        </div>
        <Button onClick={() => setScheduleOpen(true)}>
          <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
          {t("actions.scheduleVideo")}
        </Button>
      </header>

      {bestTime ? <BestTimeBanner recommendation={bestTime} /> : null}

      {error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <section className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="icon" onClick={() => setMonth((m) => addMonths(m, -1))} aria-label={t("actions.prevMonth")}>
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </Button>
              <div className="text-sm font-semibold">{monthLabel}</div>
              <Button type="button" variant="outline" size="icon" onClick={() => setMonth((m) => addMonths(m, 1))} aria-label={t("actions.nextMonth")}>
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>

            <Tabs value={view} onValueChange={(v) => setView(v as CalendarViewMode)}>
              <TabsList className="w-full justify-start overflow-x-auto">
                <TabsTrigger value="month">{t("views.month")}</TabsTrigger>
                <TabsTrigger value="week">{t("views.week")}</TabsTrigger>
                <TabsTrigger value="list">{t("views.list")}</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <Card>
            <CardContent className="p-4">
              {loading ? (
                <div className="space-y-2">
                  <div className="h-4 w-2/3 rounded bg-muted" />
                  <div className="h-4 w-1/2 rounded bg-muted" />
                  <div className="h-4 w-3/5 rounded bg-muted" />
                </div>
              ) : items.length === 0 ? (
                <div className="text-sm text-muted-foreground">{t("empty")}</div>
              ) : (
                <Tabs value={view} onValueChange={(v) => setView(v as CalendarViewMode)}>
                  <TabsContent value="month" className="mt-0">
                    <MonthCalendar month={month} items={items} onPickItem={openDetails} onReschedule={onReschedule} />
                  </TabsContent>
                  <TabsContent value="week" className="mt-0">
                    <WeekCalendar weekStart={weekRange.start} items={items} onPickItem={openDetails} onReschedule={onReschedule} />
                  </TabsContent>
                  <TabsContent value="list" className="mt-0">
                    <ListView items={items} filter={listFilter} onFilterChange={setListFilter} onPickItem={openDetails} />
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>
        </section>

        <aside className="space-y-4">
          <BestTimeCard loading={bestTimeLoading} recommendation={bestTime} />
          <PublishingStats items={items} />
        </aside>
      </div>

      <ScheduleVideoModal
        open={scheduleOpen}
        onOpenChange={setScheduleOpen}
        initialDate={new Date()}
        bestTimeHint={bestTime ? { weekday: bestTime.weekday, hour: bestTime.hour } : null}
        saving={saving}
        onSave={(draft) => void onCreate(draft)}
      />

      <VideoDetailsModal
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        video={selected}
        saving={saving}
        deleting={deleting}
        onSave={(id, patch) => void onUpdate(id, patch)}
        onDelete={(id) => void onDelete(id)}
      />
    </div>
  );
}
