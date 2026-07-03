"use client";

import * as React from "react";
import { formatDistanceToNow } from "date-fns";
import { Activity } from "lucide-react";
import { useTranslations } from "next-intl";

import type { ActivityItem } from "@/lib/actions/types/dashboard";
import { EmptyState } from "@/components/shared/EmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export type RecentActivityProps = {
  items: ActivityItem[];
  loading?: boolean;
};

const typeColors: Record<string, string> = {
  scheduled: "bg-sky-500",
  idea: "bg-amber-500",
  workflow: "bg-violet-500",
  ai: "bg-fuchsia-500",
};

export function RecentActivity({ items, loading }: RecentActivityProps) {
  const t = useTranslations("dashboard.recentActivity");

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="h-4 w-4 text-violet-600 dark:text-violet-400" aria-hidden="true" />
          {t("title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>
        ) : items.length === 0 ? (
          <EmptyState icon={Activity} title={t("empty")} className="py-8" />
        ) : (
          <ul className="relative space-y-0">
            {items.map((item, idx) => (
              <li key={`${item.type}-${item.id}`} className="relative flex gap-4 pb-6 last:pb-0">
                {idx < items.length - 1 ? (
                  <span
                    className="absolute left-[7px] top-4 h-[calc(100%-0.5rem)] w-px bg-border/60"
                    aria-hidden="true"
                  />
                ) : null}
                <span
                  className={cn(
                    "relative z-10 mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full ring-4 ring-background",
                    typeColors[item.type] ?? "bg-muted-foreground"
                  )}
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.title}</p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                    <span>{t(`types.${item.type === "video" ? "scheduled" : item.type}`)}</span>
                    <span aria-hidden="true">·</span>
                    <time dateTime={item.at}>
                      {formatDistanceToNow(new Date(item.at), { addSuffix: true })}
                    </time>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
