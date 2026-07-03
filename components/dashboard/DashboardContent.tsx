"use client";

import * as React from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import {
  Activity,
  ArrowRight,
  Eye,
  Heart,
  RefreshCw,
  Sparkles,
  Swords,
  Users,
  Video,
  Tv,
} from "lucide-react";

import {
  connectChannelByUrlAction,
  disconnectChannelAction,
  getChannelConnectionAction,
  refreshChannelAction,
} from "@/app/actions/youtube";
import { getDashboardDataAction, syncChannelVideosAction } from "@/app/actions/dashboard";
import type { ChannelConnection } from "@/lib/actions/types/youtube";
import type { DashboardData } from "@/lib/actions/types/dashboard";
import { Link } from "@/i18n/navigation";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { ActionErrorAlert } from "@/components/errors/ActionErrorAlert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNumber } from "@/lib/formatNumber";
import { useToast } from "@/hooks/use-toast";

export function DashboardContent() {
  const t = useTranslations("dashboard");
  const ty = useTranslations("youtube");
  const { toast } = useToast();

  const [loading, setLoading] = React.useState(true);
  const [channel, setChannel] = React.useState<ChannelConnection | null>(null);
  const [connected, setConnected] = React.useState(false);
  const [dash, setDash] = React.useState<DashboardData | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [channelUrl, setChannelUrl] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    const conn = await getChannelConnectionAction();
    if (!conn.ok) {
      setError(conn.error.code);
      setLoading(false);
      return;
    }
    if (!conn.data.connected) {
      setConnected(false);
      setChannel(null);
      setDash(null);
      setLoading(false);
      return;
    }
    setConnected(true);
    setChannel(conn.data.channel);
    const dashRes = await getDashboardDataAction();
    if (dashRes.ok) setDash(dashRes.data);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  async function onConnect() {
    if (!channelUrl.trim()) return;
    setBusy(true);
    const res = await connectChannelByUrlAction({ channelUrl });
    setBusy(false);
    if (!res.ok) {
      toast({ variant: "destructive", title: ty(`errors.${res.error.code}`) });
      return;
    }
    toast({ title: ty("card.title"), description: ty("card.connectedDescription") });
    void load();
  }

  async function onRefresh() {
    setBusy(true);
    const res = await refreshChannelAction();
    setBusy(false);
    if (res.ok) {
      toast({ title: ty("card.refreshSuccess") });
      void load();
    }
  }

  async function onSync() {
    setBusy(true);
    const res = await syncChannelVideosAction();
    setBusy(false);
    if (res.ok) toast({ title: ty("card.syncSuccess", { count: res.data.count }) });
  }

  async function onDisconnect() {
    setBusy(true);
    await disconnectChannelAction();
    setBusy(false);
    toast({ title: ty("card.disconnectedSuccess") });
    void load();
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  if (error === "UNAUTHENTICATED") {
    return (
      <div className="mx-auto max-w-lg">
        <ActionErrorAlert code="UNAUTHENTICATED" onRetry={() => void load()} />
      </div>
    );
  }

  if (!connected || !channel) {
    return (
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("notConnectedHint")}</p>
        </header>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tv className="h-5 w-5 text-red-500" />
              {ty("card.title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{ty("card.disconnectedDescription")}</p>
            <Input
              value={channelUrl}
              onChange={(e) => setChannelUrl(e.target.value)}
              placeholder={ty("fields.channelUrl.placeholder")}
            />
            <Button onClick={() => void onConnect()} disabled={busy}>
              {ty("actions.connect")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const quickActions = [
    { href: "/ai-assistant", icon: Sparkles, title: t("actions.aiAssistant.title"), desc: t("actions.aiAssistant.description") },
    { href: "/seo-lab", icon: Eye, title: t("actions.seoLab.title"), desc: t("actions.seoLab.description") },
    { href: "/competitors", icon: Swords, title: t("actions.competitors.title"), desc: t("actions.competitors.description") },
    { href: "/workflow", icon: Activity, title: t("actions.workflow.title"), desc: t("actions.workflow.description") },
  ] as const;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{channel.title}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => void onRefresh()} disabled={busy}>
            <RefreshCw className="mr-2 h-4 w-4" />
            {ty("actions.refreshChannel")}
          </Button>
          <Button variant="outline" size="sm" onClick={() => void onSync()} disabled={busy}>
            {ty("actions.syncVideos")}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => void onDisconnect()} disabled={busy}>
            {ty("actions.disconnect")}
          </Button>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard title={t("stats.subscribers")} value={formatNumber(channel.subscriberCount)} icon={Users} />
        <StatsCard title={t("stats.views")} value={formatNumber(channel.viewCount)} icon={Eye} />
        <StatsCard title={t("stats.videos")} value={formatNumber(channel.videoCount)} icon={Video} />
        <Card className="h-full border-violet-500/20 bg-violet-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Heart className="h-4 w-4 text-violet-500" />
              {t("channelHealth.title")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{dash?.healthScore ?? "—"}</div>
            <p className="text-xs text-muted-foreground">
              {dash?.healthLabel
                ? t(`channelHealth.labels.${dash.healthLabel}`)
                : t("channelHealth.fallback")}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">{t("videos.recentTitle")}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {(dash?.recentVideos ?? []).length === 0 ? (
              <Card>
                <CardContent className="p-6 text-sm text-muted-foreground">{t("videos.empty")}</CardContent>
              </Card>
            ) : (
              dash?.recentVideos.map((v) => (
                <Card key={v.youtubeVideoId}>
                  <CardContent className="flex gap-3 p-4">
                    {v.thumbnailUrl ? (
                      <Image
                        src={v.thumbnailUrl}
                        alt=""
                        width={120}
                        height={68}
                        className="rounded-md object-cover"
                      />
                    ) : null}
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="line-clamp-2 text-sm font-medium">{v.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {t("videos.metricsSummary", {
                          views: formatNumber(v.viewCount),
                          comments: formatNumber(v.commentCount),
                        })}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </section>

        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">{t("actions.title")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {quickActions.map((a) => {
                const Icon = a.icon;
                return (
                  <Link
                    key={a.href}
                    href={a.href}
                    className="flex items-center gap-3 rounded-lg border border-border/60 p-3 transition-colors hover:bg-muted/50"
                  >
                    <Icon className="h-4 w-4 text-violet-500" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{a.title}</p>
                      <p className="text-xs text-muted-foreground">{a.desc}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">{t("recentActivity.title")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(dash?.recentActivity ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("recentActivity.empty")}</p>
              ) : (
                dash?.recentActivity.map((a) => (
                  <div key={`${a.type}-${a.id}`} className="text-sm">
                    <span className="font-medium">{a.title}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {a.type === "video"
                        ? t("videos.recentTitle")
                        : t.has(`recentActivity.types.${a.type}`)
                          ? t(`recentActivity.types.${a.type}`)
                          : a.type}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
