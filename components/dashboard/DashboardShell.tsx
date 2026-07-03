"use client";

import * as React from "react";
import { useTranslations } from "next-intl";

import { getDashboardDataAction } from "@/app/actions/dashboard";
import type { ActivityItem, ChannelHealth, DashboardActivity } from "@/lib/actions/types/dashboard";
import { ChannelHealthScore } from "@/components/dashboard/ChannelHealthScore";
import { DashboardInsights } from "@/components/dashboard/DashboardInsights";
import { DashboardView } from "@/components/dashboard/DashboardView";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { TrendingTopics } from "@/components/dashboard/TrendingTopics";
import { WeeklyReportPreview } from "@/components/dashboard/WeeklyReportPreview";
import { ActionErrorAlert } from "@/components/errors/ActionErrorAlert";
import type { ActionErrorCode } from "@/lib/actions/result";
import { YOUTUBE_CONNECTION_CHANGED_EVENT } from "@/lib/youtube/events";

function mapActivity(row: DashboardActivity): ActivityItem {
  return {
    id: row.id,
    type: row.type === "video" ? "scheduled" : row.type,
    title: row.title,
    at: row.timestamp,
  };
}

function mapHealthLabel(score: number): ChannelHealth["label"] {
  if (score >= 80) return "excellent";
  if (score >= 65) return "good";
  if (score >= 50) return "fair";
  return "needs_attention";
}

export function DashboardShell() {
  const t = useTranslations("dashboard");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<ActionErrorCode | null>(null);
  const [activities, setActivities] = React.useState<ActivityItem[]>([]);
  const [health, setHealth] = React.useState<ChannelHealth | null>(null);

  const loadExtras = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await getDashboardDataAction();
    if (!res.ok) {
      setActivities([]);
      setHealth(null);
      if (
        res.error.code !== "YOUTUBE_NOT_CONNECTED" &&
        res.error.code !== "UNAUTHENTICATED"
      ) {
        setError(res.error.code);
      }
      setLoading(false);
      return;
    }
    setActivities(res.data.recentActivity.map(mapActivity));
    setHealth({
      score: res.data.healthScore,
      label: mapHealthLabel(res.data.healthScore),
      factors: [
        { key: "channelConnected", met: true },
        { key: "syncedVideos", met: res.data.recentVideos.length > 0 },
        { key: "hasIdeas", met: res.data.recentActivity.some((a) => a.type === "idea") },
        { key: "activeWorkflow", met: res.data.recentActivity.some((a) => a.type === "workflow") },
      ],
    });
    setLoading(false);
  }, []);

  React.useEffect(() => {
    void loadExtras();
  }, [loadExtras]);

  React.useEffect(() => {
    function onConnectionChanged() {
      void loadExtras();
    }
    window.addEventListener(YOUTUBE_CONNECTION_CHANGED_EVENT, onConnectionChanged);
    return () => window.removeEventListener(YOUTUBE_CONNECTION_CHANGED_EVENT, onConnectionChanged);
  }, [loadExtras]);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <header className="space-y-2">
        <h1 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
          {t("title")}
        </h1>
        <p className="text-pretty text-sm text-muted-foreground sm:text-base">
          {t("subtitle")}
        </p>
      </header>

      {error ? <ActionErrorAlert code={error} onRetry={() => void loadExtras()} /> : null}

      <DashboardView />

      <DashboardInsights />

      <div className="grid gap-4 lg:grid-cols-2">
        <TrendingTopics />
        <WeeklyReportPreview />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <RecentActivity items={activities} loading={loading} />
        <ChannelHealthScore health={health} loading={loading} />
      </div>
    </div>
  );
}
