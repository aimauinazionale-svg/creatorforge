"use client";

import * as React from "react";
import { format, isAfter, isBefore, startOfWeek } from "date-fns";
import { useTranslations } from "next-intl";

import type { ScheduledVideo } from "@/components/calendar/types";
import { cn } from "@/lib/utils";

export type ListFilter = "upcoming" | "past" | "all";

type ListViewProps = {
  items: ScheduledVideo[];
  filter: ListFilter;
  onFilterChange: (filter: ListFilter) => void;
  onPickItem: (item: ScheduledVideo) => void;
};

function groupByWeek(items: ScheduledVideo[]) {
  const map = new Map<string, ScheduledVideo[]>();
  for (const item of items) {
    const d = new Date(item.scheduledAt);
    if (Number.isNaN(d.getTime())) continue;
    const week = startOfWeek(d, { weekStartsOn: 0 });
    const key = format(week, "yyyy-MM-dd");
    const list = map.get(key) ?? [];
    list.push(item);
    map.set(key, list);
  }
  const sorted = Array.from(map.entries()).sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime());
  return sorted.map(([weekKey, list]) => ({
    weekKey,
    weekStart: new Date(weekKey),
    items: list.slice().sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()),
  }));
}

export function ListView({ items, filter, onFilterChange, onPickItem }: ListViewProps) {
  const t = useTranslations("calendar");
  const now = React.useMemo(() => new Date(), []);

  const filtered = React.useMemo(() => {
    if (filter === "all") return items;
    if (filter === "upcoming") return items.filter((i) => !isBefore(new Date(i.scheduledAt), now));
    return items.filter((i) => isAfter(new Date(i.scheduledAt), now));
  }, [filter, items, now]);

  const groups = React.useMemo(() => groupByWeek(filtered), [filtered]);

  return (
    <div className="space-y-3">
      <div className="inline-flex rounded-lg border border-border/60 bg-background p-1">
        {(["upcoming", "past", "all"] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => onFilterChange(k)}
            className={cn(
              "rounded-md px-3 py-1 text-sm transition-colors",
              filter === k ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            )}
          >
            {t(`list.filters.${k}`)}
          </button>
        ))}
      </div>

      {groups.length === 0 ? (
        <div className="rounded-xl border border-border/60 bg-card p-6 text-sm text-muted-foreground">{t("list.empty")}</div>
      ) : (
        <div className="space-y-4">
          {groups.map((g) => (
            <section key={g.weekKey} className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">
                {t("list.weekOf", { date: format(g.weekStart, "PPP") })}
              </h3>
              <div className="space-y-2">
                {g.items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onPickItem(item)}
                    className={cn(
                      "w-full rounded-xl border border-border/60 bg-card p-4 text-left",
                      "hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    )}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-semibold">{item.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {t("list.when", { date: format(new Date(item.scheduledAt), "PP • p") })}
                      </span>
                    </div>
                    {item.notes ? <div className="mt-2 line-clamp-2 text-sm text-muted-foreground">{item.notes}</div> : null}
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

