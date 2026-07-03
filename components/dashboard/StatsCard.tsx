import * as React from "react";
import { ArrowDownRight, ArrowUpRight, Minus, type LucideIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type StatsTrend = {
  value: string;
  direction?: "up" | "down" | "neutral";
  label?: string;
};

export type StatsCardProps = {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: StatsTrend;
  className?: string;
};

export function StatsCard({ title, value, icon: Icon, trend, className }: StatsCardProps) {
  const trendDirection = trend?.direction ?? "neutral";
  const TrendIcon =
    trendDirection === "up" ? ArrowUpRight : trendDirection === "down" ? ArrowDownRight : Minus;

  return (
    <Card className={cn("h-full transition-all duration-200 hover:shadow-md", className)}>
      <CardHeader className="flex-row items-center justify-between gap-4 space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10">
          <Icon className="h-4 w-4 text-violet-600 dark:text-violet-400" aria-hidden="true" />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="text-2xl font-semibold tracking-tight sm:text-3xl">{value}</div>
        {trend ? (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium",
                trendDirection === "up" && "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
                trendDirection === "down" && "bg-red-500/10 text-red-700 dark:text-red-400",
                trendDirection === "neutral" && "bg-muted text-muted-foreground"
              )}
            >
              <TrendIcon className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{trend.value}</span>
            </span>
            {trend.label ? (
              <span className="truncate text-muted-foreground">{trend.label}</span>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

