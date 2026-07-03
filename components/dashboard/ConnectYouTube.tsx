"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Loader2, RefreshCw, Tv, Unplug } from "lucide-react";

import {
  connectChannelByUrlAction,
  disconnectChannelAction,
  getChannelConnectionAction,
  getYouTubeConnectUrlAction,
  refreshChannelAction,
} from "@/app/actions/youtube";
import type { ChannelConnection, YouTubeActionErrorCode } from "@/lib/actions/types/youtube";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatNumber } from "@/lib/formatNumber";
import { notifyYouTubeConnectionChanged } from "@/lib/youtube/events";
import { useToast } from "@/hooks/use-toast";

const YOUTUBE_ERROR_CODES: YouTubeActionErrorCode[] = [
  "UNAUTHENTICATED",
  "NOT_CONNECTED",
  "NOT_CONFIGURED",
  "INVALID_URL",
  "CHANNEL_NOT_FOUND",
  "DB_ERROR",
  "YOUTUBE_ERROR",
];

function isYouTubeErrorCode(code: string): code is YouTubeActionErrorCode {
  return YOUTUBE_ERROR_CODES.includes(code as YouTubeActionErrorCode);
}

export function ConnectYouTube() {
  const t = useTranslations("youtube");
  const locale = useLocale();
  const router = useRouter();
  const { toast } = useToast();
  const [channel, setChannel] = React.useState<ChannelConnection | null>(null);
  const [connected, setConnected] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [channelUrl, setChannelUrl] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [oauthConfigured, setOauthConfigured] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await getChannelConnectionAction();
      if (res.ok && res.data.connected) {
        setConnected(true);
        setChannel(res.data.channel);
      } else {
        setConnected(false);
        setChannel(null);
      }
      const oauth = await getYouTubeConnectUrlAction(locale);
      if (oauth.ok) setOauthConfigured(oauth.data.oauthConfigured);
    } catch {
      setConnected(false);
      setChannel(null);
    } finally {
      setLoading(false);
    }
  }, [locale]);

  React.useEffect(() => {
    void load();
  }, [load]);

  function showYouTubeError(code: string) {
    const title = isYouTubeErrorCode(code) ? t(`errors.${code}`) : t("errors.YOUTUBE_ERROR");
    toast({ variant: "destructive", title });
  }

  async function onConnect() {
    setBusy(true);
    try {
      if (oauthConfigured) {
        const res = await getYouTubeConnectUrlAction(locale);
        if (res.ok && res.data.url) {
          window.location.href = res.data.url;
          return;
        }
      }
      const res = await connectChannelByUrlAction({ channelUrl });
      if (!res.ok) {
        showYouTubeError(res.error.code);
        return;
      }
      setConnected(true);
      setChannel(res.data.channel);
      setChannelUrl("");
      notifyYouTubeConnectionChanged();
      router.refresh();
      toast({ title: t("card.title"), description: t("card.connectedDescription") });
    } finally {
      setBusy(false);
    }
  }

  async function onRefresh() {
    setBusy(true);
    try {
      const res = await refreshChannelAction();
      if (!res.ok) {
        showYouTubeError(res.error.code);
        return;
      }
      setChannel(res.data.channel);
      notifyYouTubeConnectionChanged();
      router.refresh();
      toast({ title: t("card.refreshSuccess") });
    } finally {
      setBusy(false);
    }
  }

  async function onDisconnect() {
    setBusy(true);
    try {
      const res = await disconnectChannelAction();
      if (!res.ok) {
        showYouTubeError(res.error.code);
        return;
      }
      setConnected(false);
      setChannel(null);
      notifyYouTubeConnectionChanged();
      router.refresh();
      toast({ title: t("card.disconnectedSuccess") });
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          …
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center gap-3 space-y-0">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-red-500/10 text-red-500">
          <Tv className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <CardTitle className="text-base">{t("card.title")}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {connected ? t("card.connectedDescription") : t("card.disconnectedDescription")}
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {connected && channel ? (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            {channel.thumbnailUrl ? (
              <Image
                src={channel.thumbnailUrl}
                alt=""
                width={64}
                height={64}
                className="rounded-full"
              />
            ) : null}
            <div className="min-w-0 flex-1 space-y-1">
              <p className="truncate font-medium">{channel.title}</p>
              <p className="text-xs text-muted-foreground">
                {t("card.channelIdLabel")} {channel.youtubeChannelId}
              </p>
              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                <span>
                  {t("card.statsLine", {
                    subscribers: formatNumber(channel.subscriberCount),
                    views: formatNumber(channel.viewCount),
                    videos: formatNumber(channel.videoCount),
                  })}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => void onRefresh()} disabled={busy}>
                <RefreshCw className="mr-2 h-4 w-4" />
                {t("actions.refreshChannel")}
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => void onDisconnect()} disabled={busy}>
                <Unplug className="mr-2 h-4 w-4" />
                {t("actions.disconnect")}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {!oauthConfigured ? (
              <div className="space-y-2">
                <Label htmlFor="channel-url">{t("fields.channelUrl.label")}</Label>
                <Input
                  id="channel-url"
                  value={channelUrl}
                  onChange={(e) => setChannelUrl(e.target.value)}
                  placeholder={t("fields.channelUrl.placeholder")}
                  aria-describedby="channel-url-hint"
                />
                <p id="channel-url-hint" className="text-xs text-muted-foreground">
                  {t("fields.channelUrl.hint")}
                </p>
              </div>
            ) : null}
            <Button type="button" onClick={() => void onConnect()} disabled={busy || (!oauthConfigured && !channelUrl.trim())}>
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {t("actions.connect")}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
