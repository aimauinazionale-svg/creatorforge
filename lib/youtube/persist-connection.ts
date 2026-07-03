import type { SupabaseClient } from "@supabase/supabase-js";

import type { YouTubeChannelStats } from "@/lib/youtube/api";
import {
  saveChannelConnectionCookie,
  type ChannelConnectionCookie,
} from "@/lib/youtube/connection-store";
import type { Database } from "@/types/database";

function statsToCookie(stats: YouTubeChannelStats): ChannelConnectionCookie {
  return {
    youtubeChannelId: stats.youtubeChannelId,
    channelTitle: stats.title,
    thumbnailUrl: stats.thumbnailUrl,
    subscriberCount: stats.subscriberCount,
    viewCount: stats.viewCount,
    videoCount: stats.videoCount,
    customUrl: stats.customUrl,
  };
}

async function saveChannelToDb(
  supabase: SupabaseClient<Database>,
  userId: string,
  stats: YouTubeChannelStats,
  userEmail?: string | null
): Promise<{ channelId: string } | null> {
  const channelData = {
    title: stats.title,
    thumbnailUrl: stats.thumbnailUrl,
    customUrl: stats.customUrl,
  };
  const statsCache = {
    subscriberCount: stats.subscriberCount,
    viewCount: stats.viewCount,
    videoCount: stats.videoCount,
  };

  const { data: existing } = await supabase
    .from("channels")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing?.id) {
    const { data, error } = await supabase
      .from("channels")
      .update({
        youtube_channel_id: stats.youtubeChannelId,
        channel_data: channelData,
        stats_cache: statsCache,
        last_updated: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .select("id")
      .single();

    if (error || !data) return null;
    await supabase.from("users").upsert({
      id: userId,
      email: userEmail ?? "",
      youtube_channel_id: stats.youtubeChannelId,
    });
    return { channelId: data.id };
  }

  const { data, error } = await supabase
    .from("channels")
    .insert({
      user_id: userId,
      youtube_channel_id: stats.youtubeChannelId,
      channel_data: channelData,
      stats_cache: statsCache,
      last_updated: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error || !data) return null;

  await supabase.from("users").upsert({
    id: userId,
    email: userEmail ?? "",
    youtube_channel_id: stats.youtubeChannelId,
  });

  return { channelId: data.id };
}

/** Persists a YouTube channel connection to cookie and optionally Supabase. */
export async function persistChannelConnection(
  stats: YouTubeChannelStats,
  options?: {
    supabase?: SupabaseClient<Database> | null;
    userId?: string | null;
    userEmail?: string | null;
  }
): Promise<{ savedToDb: boolean; channelId?: string }> {
  saveChannelConnectionCookie(statsToCookie(stats));

  const { supabase, userId, userEmail } = options ?? {};
  if (supabase && userId) {
    const saved = await saveChannelToDb(supabase, userId, stats, userEmail);
    if (saved) return { savedToDb: true, channelId: saved.channelId };
  }

  return { savedToDb: false };
}
