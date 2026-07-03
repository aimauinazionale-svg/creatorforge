"use client";

import * as React from "react";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import { DndContext, DragOverlay, PointerSensor, useDraggable, useDroppable, useSensor, useSensors } from "@dnd-kit/core";
import { addDays, format, isSameDay, isSameMonth, startOfMonth, startOfWeek } from "date-fns";

import type { ScheduledVideo } from "@/components/calendar/types";
import { cn } from "@/lib/utils";

type MonthCalendarProps = {
  month: Date;
  items: ScheduledVideo[];
  onPickItem: (item: ScheduledVideo) => void;
  onReschedule: (id: string, nextDate: Date) => void;
};

function DayCell({
  date,
  inMonth,
  isToday,
  items,
  onPickItem,
}: {
  date: Date;
  inMonth: boolean;
  isToday: boolean;
  items: ScheduledVideo[];
  onPickItem: (item: ScheduledVideo) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `day:${date.toISOString()}` });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "min-h-[88px] rounded-lg border border-border/60 bg-card p-1.5 transition-colors sm:min-h-[110px] sm:p-2",
        !inMonth && "opacity-60",
        isToday && "ring-1 ring-primary/40",
        isOver && "bg-primary/5"
      )}
    >
      <div className="text-xs font-medium">{format(date, "d")}</div>
      <div className="mt-2 space-y-1">
        {items.slice(0, 3).map((item) => (
          <MonthItem key={item.id} item={item} onPick={() => onPickItem(item)} />
        ))}
        {items.length > 3 ? <div className="text-[11px] text-muted-foreground">+{items.length - 3}</div> : null}
      </div>
    </div>
  );
}

function MonthItem({ item, onPick }: { item: ScheduledVideo; onPick: () => void }) {
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
        "w-full rounded-md border border-border/60 bg-background px-2 py-1 text-left text-xs",
        "hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isDragging && "opacity-60"
      )}
      onClick={onPick}
      {...attributes}
      {...listeners}
    >
      <span className="line-clamp-1">{item.title}</span>
    </button>
  );
}

export function MonthCalendar({ month, items, onPickItem, onReschedule }: MonthCalendarProps) {
  const gridStart = startOfWeek(startOfMonth(month), { weekStartsOn: 0 });
  const days = Array.from({ length: 42 }).map((_, i) => addDays(gridStart, i));

  const byDay = React.useMemo(() => {
    const map = new Map<string, ScheduledVideo[]>();
    for (const item of items) {
      const d = new Date(item.scheduledAt);
      if (Number.isNaN(d.getTime())) continue;
      const key = format(d, "yyyy-MM-dd");
      const list = map.get(key) ?? [];
      list.push(item);
      map.set(key, list);
    }
    for (const [key, list] of map.entries()) {
      map.set(key, list.slice().sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()));
    }
    return map;
  }, [items]);

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

  const today = new Date();

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className="overflow-x-auto">
        <div className="grid min-w-[640px] grid-cols-7 gap-1 sm:gap-2">
        {days.map((date) => {
          const key = format(date, "yyyy-MM-dd");
          return (
            <DayCell
              key={key}
              date={date}
              inMonth={isSameMonth(date, month)}
              isToday={isSameDay(date, today)}
              items={byDay.get(key) ?? []}
              onPickItem={onPickItem}
            />
          );
        })}
        </div>
      </div>

      <DragOverlay>
        {activeItem ? (
          <div className="rounded-md border border-border/60 bg-background px-2 py-1 text-xs shadow">
            {activeItem.title}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

