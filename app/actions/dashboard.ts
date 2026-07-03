"use server";

import { requireAuth, requireChannel } from "@/lib/actions/auth-context";
import { safeAction } from "@/lib/actions/safe";
import { actionErr, actionOk, type ActionResult } from "@/lib/actions/result";
import type {
  ActivityItem,
  ChannelHealth,
  DashboardActivity,
  DashboardData,
} from "@/lib/actions/types/dashboard";
import { getChannelConnectionCookie } from "@/lib/youtube/connection-store";
import { fetchChannelVideos } from "@/lib/youtube/api";
import { getCompetitorsFromCookie } from "@/lib/competitors/store";
import { resolveActor } from "@/lib/storage/actor";

function computeHealthScore(stats: {
  subscriberCount: number;
  viewCount: number;
  videoCount: number;
  recentUploads: number;
}): { score: number; label: ChannelHealth["label"] } {
  let score = 50;
  if (stats.videoCount >= 10) score += 10;
  if (stats.videoCount >= 50) score += 5;
  if (stats.subscriberCount >= 1000) score += 10;
  if (stats.subscriberCount >= 10000) score += 10;
  if (stats.viewCount >= 10000) score += 10;
  if (stats.recentUploads >= 2) score += 10;
  if (stats.recentUploads >= 4) score += 5;
  score = Math.min(100, score);

  const label: ChannelHealth["label"] =
    score >= 80 ? "excellent" : score >= 65 ? "good" : score >= 50 ? "fair" : "needs_attention";
  return { score, label };
}

export async function getDashboardDataAction(): Promise<ActionResult<DashboardData>> {
  return safeAction(async () => {
  const ctx = await requireChannel();
  if (!ctx.ok) return ctx;

  let youtubeChannelId = ctx.data.youtubeChannelId;
  let stats: Record<string, number>;

  if (ctx.data.fromCookie) {
    const cookie = getChannelConnectionCookie();
    if (!cookie) return actionErr("YOUTUBE_NOT_CONNECTED");
    youtubeChannelId = cookie.youtubeChannelId;
    stats = {
      subscriberCount: cookie.subscriberCount,
      viewCount: cookie.viewCount,
      videoCount: cookie.videoCount,
    };
  } else {
    const { data: channel } = await ctx.data.supabase
      .from("channels")
      .select("youtube_channel_id, stats_cache")
      .eq("id", ctx.data.channelId)
      .single();

    youtubeChannelId = channel?.youtube_channel_id ?? youtubeChannelId;
    stats = (channel?.stats_cache ?? {}) as Record<string, number>;
  }

  const videos = youtubeChannelId ? await fetchChannelVideos(youtubeChannelId, 6) : [];

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentUploads = videos.filter(
    (v) => v.publishedAt && new Date(v.publishedAt) >= thirtyDaysAgo
  ).length;

  const health = computeHealthScore({
    subscriberCount: Number(stats.subscriberCount ?? 0),
    viewCount: Number(stats.viewCount ?? 0),
    videoCount: Number(stats.videoCount ?? 0),
    recentUploads,
  });

  const [{ data: ideas }, { data: workflows }] = ctx.data.fromCookie
    ? [{ data: [] as Array<{ id: string; title: string; created_at: string }> }, { data: [] as Array<{ id: string; title: string; created_at: string }> }]
    : await Promise.all([
        ctx.data.supabase
          .from("ideas")
          .select("id, title, created_at")
          .eq("user_id", ctx.data.userId)
          .order("created_at", { ascending: false })
          .limit(3),
        ctx.data.supabase
          .from("workflows")
          .select("id, title, created_at")
          .eq("channel_id", ctx.data.channelId)
          .order("created_at", { ascending: false })
          .limit(3),
      ]);

  const activity: DashboardActivity[] = [
    ...(videos.slice(0, 2).map((v) => ({
      id: v.youtubeVideoId,
      type: "video" as const,
      title: v.title,
      timestamp: v.publishedAt ?? new Date().toISOString(),
    })) ?? []),
    ...(ideas ?? []).map((i) => ({
      id: i.id,
      type: "idea" as const,
      title: i.title,
      timestamp: i.created_at,
    })),
    ...(workflows ?? []).map((w) => ({
      id: w.id,
      type: "workflow" as const,
      title: w.title,
      timestamp: w.created_at,
    })),
  ]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 6);

  return actionOk({
    healthScore: health.score,
    healthLabel: health.label,
    recentVideos: videos,
    recentActivity: activity,
  });
  }, "getDashboardData");
}

export async function syncChannelVideosAction(): Promise<ActionResult<{ count: number }>> {
  return safeAction(async () => {
  const ctx = await requireChannel();
  if (!ctx.ok) return ctx;

  if (ctx.data.fromCookie) {
    const videos = await fetchChannelVideos(ctx.data.youtubeChannelId, 20);
    return actionOk({ count: videos.length });
  }

  const { data: channel } = await ctx.data.supabase
    .from("channels")
    .select("youtube_channel_id")
    .eq("id", ctx.data.channelId)
    .single();

  if (!channel?.youtube_channel_id) return actionErr("YOUTUBE_NOT_CONNECTED");

  const videos = await fetchChannelVideos(channel.youtube_channel_id, 20);
  if (!videos.length) return actionOk({ count: 0 });

  const rows = videos.map((v) => ({
    channel_id: ctx.data.channelId,
    youtube_video_id: v.youtubeVideoId,
    title: v.title,
    published_at: v.publishedAt,
    metrics: {
      viewCount: v.viewCount,
      likeCount: v.likeCount,
      commentCount: v.commentCount,
      thumbnailUrl: v.thumbnailUrl,
    },
  }));

  const videoIds = rows.map((r) => r.youtube_video_id);
  const { data: existingRows } = await ctx.data.supabase
    .from("videos")
    .select("id, youtube_video_id")
    .eq("channel_id", ctx.data.channelId)
    .in("youtube_video_id", videoIds);

  const existingByYoutubeId = new Map(
    (existingRows ?? []).map((r) => [r.youtube_video_id, r.id] as const)
  );

  await Promise.all(
    rows.map((row) => {
      const existingId = existingByYoutubeId.get(row.youtube_video_id);
      if (existingId) {
        return ctx.data.supabase.from("videos").update(row).eq("id", existingId);
      }
      return ctx.data.supabase.from("videos").insert(row);
    })
  );

  return actionOk({ count: rows.length });
  }, "syncChannelVideos");
}

export async function getDashboardExtrasAction(): Promise<
  ActionResult<{ activities: ActivityItem[]; health: ChannelHealth | null }>
> {
  return safeAction(async () => {
  const res = await getDashboardDataAction();
  if (!res.ok) return res;

  return actionOk({
    activities: res.data.recentActivity.map((a): ActivityItem => ({
      id: a.id,
      type: a.type === "video" ? "scheduled" : a.type,
      title: a.title,
      at: a.timestamp,
    })),
    health: {
      score: res.data.healthScore,
      label: (res.data.healthLabel as ChannelHealth["label"]) ?? "fair",
      factors: [
        { key: "channelConnected", met: true },
        { key: "syncedVideos", met: res.data.recentVideos.length > 0 },
        { key: "hasIdeas", met: res.data.recentActivity.some((a) => a.type === "idea") },
        { key: "activeWorkflow", met: res.data.recentActivity.some((a) => a.type === "workflow") },
      ],
    },
  });
  }, "getDashboardExtras");
}

export async function getContentGapHintsAction(): Promise<
  ActionResult<{ hints: string[] }>
> {
  return safeAction(async () => {
    const { actorId } = await resolveActor();
    const cookieCompetitors = getCompetitorsFromCookie(actorId);

    const ctx = await requireAuth();
    let competitors: Array<{ channel_name?: string | null; stats_cache?: unknown }> = [];

    if (ctx.ok) {
      const { data, error } = await ctx.data.supabase
        .from("competitors")
        .select("channel_name, stats_cache")
        .eq("user_id", ctx.data.userId)
        .limit(5);

      if (!error && (data ?? []).length > 0) {
        competitors = data ?? [];
      }
    }

    if (!competitors.length && cookieCompetitors.length > 0) {
      competitors = cookieCompetitors.map((c) => ({
        channel_name: c.channelName,
        stats_cache: {
          videoCount: c.videoCount,
        },
      }));
    }

    if (!competitors.length) {
      return actionOk({
        hints: ["Add competitors to discover content gaps and trending topics in your niche."],
      });
    }

    const hints = competitors.map((c) => {
      const stats = (c.stats_cache ?? {}) as Record<string, number>;
      const videos = Number(stats.videoCount ?? 0);
      return `Compare your upload cadence with ${c.channel_name ?? "a competitor"} (${videos} videos). Consider series or reaction formats they haven't covered recently.`;
    });

    return actionOk({ hints: hints.slice(0, 3) });
  }, "getContentGapHints");
}
