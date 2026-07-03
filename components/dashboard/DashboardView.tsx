"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Eye, Sparkles, Swords, Users, Video } from "lucide-react";

import { ConnectYouTube } from "@/components/dashboard/ConnectYouTube";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { getChannelConnectionAction } from "@/app/actions/youtube";
import type { ChannelConnection } from "@/lib/actions/types/youtube";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { formatNumber } from "@/lib/formatNumber";
import { YOUTUBE_CONNECTION_CHANGED_EVENT } from "@/lib/youtube/events";
import { Skeleton } from "@/components/ui/skeleton";

const QUICK_ACTIONS = [
  { href: "/ai-assistant", icon: Sparkles, key: "aiAssistant" },
  { href: "/seo-lab", icon: Sparkles, key: "seoLab" },
  { href: "/competitors", icon: Swords, key: "competitors" },
  { href: "/workflow", icon: Video, key: "workflow" },
] as const;

export function DashboardView() {
  const t = useTranslations("dashboard");
  const [loading, setLoading] = React.useState(true);
  const [channel, setChannel] = React.useState<ChannelConnection | null>(null);

  React.useEffect(() => {
    void getChannelConnectionAction().then((res) => {
      if (res.ok && res.data.connected) {
        setChannel(res.data.channel);
      } else {
        setChannel(null);
      }
      setLoading(false);
    }).catch(() => {
      setChannel(null);
      setLoading(false);
    });
  }, []);

  React.useEffect(() => {
    function onConnectionChanged() {
      void getChannelConnectionAction().then((res) => {
        if (res.ok && res.data.connected) {
          setChannel(res.data.channel);
        } else {
          setChannel(null);
        }
      });
    }
    window.addEventListener(YOUTUBE_CONNECTION_CHANGED_EVENT, onConnectionChanged);
    return () => window.removeEventListener(YOUTUBE_CONNECTION_CHANGED_EVENT, onConnectionChanged);
  }, []);

  return (
    <div className="space-y-6">
      <ConnectYouTube />

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatsCard
            title={t("stats.subscribers")}
            value={channel ? formatNumber(channel.subscriberCount) : "—"}
            icon={Users}
          />
          <StatsCard
            title={t("stats.views")}
            value={channel ? formatNumber(channel.viewCount) : "—"}
            icon={Eye}
          />
          <StatsCard
            title={t("stats.videos")}
            value={channel ? formatNumber(channel.videoCount) : "—"}
            icon={Video}
          />
        </div>
      )}

      {!loading && !channel ? (
        <p className="text-sm text-muted-foreground">{t("notConnectedHint")}</p>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{t("actions.title")}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.href} href={action.href}>
                <Card className="h-full transition-colors hover:bg-muted/40">
                  <CardHeader className="pb-2">
                    <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                    <CardTitle className="text-sm">{t(`actions.${action.key}.title`)}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">
                      {t(`actions.${action.key}.description`)}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
