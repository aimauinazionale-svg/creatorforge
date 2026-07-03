"use client";

import * as React from "react";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import { DndContext, DragOverlay, PointerSensor, useDraggable, useDroppable, useSensor, useSensors } from "@dnd-kit/core";
import { addDays, format, isSameDay, startOfWeek } from "date-fns";
import { useTranslations } from "next-intl";

import type { ScheduledVideo } from "@/components/calendar/types";
import { cn } from "@/lib/utils";

type WeekCalendarProps = {
  weekStart: Date;
  items: ScheduledVideo[];
  onPickItem: (item: ScheduledVideo) => void;
  onReschedule: (id: string, nextDate: Date) => void;
};

function DayColumn({
  day,
  items,
  onPickItem,
}: {
  day: Date;
  items: ScheduledVideo[];
  onPickItem: (item: ScheduledVideo) => void;
}) {
  const t = useTranslations("calendar");
  const { setNodeRef, isOver } = useDroppable({ id: `day:${day.toISOString()}` });

  return (
    <div
      ref={setNodeRef}
      className={cn("rounded-xl border border-border/60 bg-card p-3", isOver && "bg-primary/5")}
    >
      <div className="text-sm font-semibold">{format(day, "EEE d")}</div>
      <div className="mt-3 space-y-2">
        {items.length === 0 ? (
          <div className="text-sm text-muted-foreground">{t("week.emptyDay")}</div>
        ) : (
          items.map((item) => <WeekItem key={item.id} item={item} onPick={() => onPickItem(item)} />)
        )}
      </div>
    </div>
  );
}

function WeekItem({ item, onPick }: { item: ScheduledVideo; onPick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `item:${item.id}`,
    data: { id: item.id },
  });
  const style: React.CSSProperties | undefined = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <button
      type="button"
      ref={setNodeRef}
      style={style}
      className={cn(
        "w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-left",
        "hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isDragging && "opacity-60"
      )}
      onClick={onPick}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="line-clamp-1 text-sm font-medium">{item.title}</span>
        <span className="shrink-0 text-xs text-muted-foreground">{format(new Date(item.scheduledAt), "p")}</span>
      </div>
      {item.notes ? <div className="mt-1 line-clamp-1 text-xs text-muted-foreground">{item.notes}</div> : null}
    </button>
  );
}

export function WeekCalendar({ weekStart, items, onPickItem, onReschedule }: WeekCalendarProps) {
  const t = useTranslations("calendar");
  const start = startOfWeek(weekStart, { weekStartsOn: 0 });
  const days = Array.from({ length: 7 }).map((_, i) => addDays(start, i));

  const byDay = React.useMemo(() => {
    const map = new Map<string, ScheduledVideo[]>();
    for (const item of items) {
      const d = new Date(item.scheduledAt);
      if (Number.isNaN(d.getTime())) continue;
      const day = days.find((x) => isSameDay(x, d));
      if (!day) continue;
      const key = format(day, "yyyy-MM-dd");
      const list = map.get(key) ?? [];
      list.push(item);
      map.set(key, list);
    }
    for (const [key, list] of map.entries()) {
      map.set(key, list.slice().sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()));
    }
    return map;
  }, [items, days]);

  const [activeId, setActiveId] = React.useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  function onDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function onDragEnd(event: DragEndEvent) {
    const active = String(event.active.id);
    const over = event.over ? String(event.over.id) : null;
    setActiveId(null);
    if (!over) return;
    if (!active.startsWith("item:")) return;
    if (!over.startsWith("day:")) return;

    const itemId = active.replace("item:", "");
    const targetIso = over.replace("day:", "");
    const target = new Date(targetIso);
    if (Number.isNaN(target.getTime())) return;
    onReschedule(itemId, target);
  }

  const activeItem =
    activeId && activeId.startsWith("item:") ? items.find((i) => i.id === activeId.replace("item:", "")) ?? null : null;

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className="grid gap-3 md:grid-cols-7">
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          return <DayColumn key={key} day={day} items={byDay.get(key) ?? []} onPickItem={onPickItem} />;
        })}
      </div>

      <DragOverlay>
        {activeItem ? (
          <div className="rounded-lg border border-border/60 bg-background px-3 py-2 text-sm shadow">{activeItem.title}</div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

