"use server";



import { z } from "zod";



import { createSupabaseServerClient } from "@/lib/supabase/server";

import { isSupabaseConfigured } from "@/lib/supabase/env";

import type {

  ChannelConnection,

  YouTubeActionErrorCode,

  YouTubeActionResult,

} from "@/lib/actions/types/youtube";

import { getYouTubeOAuthUrl, isYouTubeConfigured, resolveChannelStats } from "@/lib/youtube/api";

import type { YouTubeChannelStats } from "@/lib/youtube/api";

import { parseChannelInput } from "@/lib/youtube/parse";

import {

  clearChannelConnectionCookie,

  cookieToChannelConnection,

  getChannelConnectionCookie,

  saveChannelConnectionCookie,

} from "@/lib/youtube/connection-store";



function ytErr(

  code: YouTubeActionErrorCode,

  details?: string

): Extract<YouTubeActionResult<never>, { ok: false }> {

  return { ok: false, error: { code, details } };

}



function statsToCookie(stats: YouTubeChannelStats) {

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



function statsToConnection(stats: YouTubeChannelStats, channelId?: string): ChannelConnection {

  return {

    channelId: channelId ?? stats.youtubeChannelId,

    youtubeChannelId: stats.youtubeChannelId,

    title: stats.title,

    thumbnailUrl: stats.thumbnailUrl,

    subscriberCount: stats.subscriberCount,

    viewCount: stats.viewCount,

    videoCount: stats.videoCount,

  };

}



async function getOptionalAuthUser() {

  if (!isSupabaseConfigured()) {

    return { supabase: null, userId: null as string | null };

  }



  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {

    return { supabase, userId: null as string | null };

  }

  return { supabase, userId: data.user.id };

}



async function saveChannelToDb(

  supabase: NonNullable<Awaited<ReturnType<typeof getOptionalAuthUser>>["supabase"]>,

  userId: string,

  stats: YouTubeChannelStats

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

      email: (await supabase.auth.getUser()).data.user?.email ?? "",

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

    email: (await supabase.auth.getUser()).data.user?.email ?? "",

    youtube_channel_id: stats.youtubeChannelId,

  });



  return { channelId: data.id };

}



export async function getChannelConnectionAction(): Promise<

  YouTubeActionResult<{ connected: false } | { connected: true; channel: ChannelConnection }>

> {

  try {

    const cookie = getChannelConnectionCookie();

    const { supabase, userId } = await getOptionalAuthUser();



    if (supabase && userId) {

      const { data, error } = await supabase

        .from("channels")

        .select("id, youtube_channel_id, channel_data, stats_cache")

        .eq("user_id", userId)

        .maybeSingle();



      if (!error && data) {

        const stats = (data.stats_cache ?? {}) as Record<string, unknown>;

        const channelData = (data.channel_data ?? {}) as Record<string, unknown>;



        return {

          ok: true,

          data: {

            connected: true,

            channel: {

              channelId: data.id,

              youtubeChannelId: data.youtube_channel_id,

              title: (channelData.title as string) ?? "YouTube Channel",

              thumbnailUrl: (channelData.thumbnailUrl as string) ?? null,

              subscriberCount: Number(stats.subscriberCount ?? 0),

              viewCount: Number(stats.viewCount ?? 0),

              videoCount: Number(stats.videoCount ?? 0),

            },

          },

        };

      }

    }



    if (cookie) {

      return {

        ok: true,

        data: {

          connected: true,

          channel: cookieToChannelConnection(cookie),

        },

      };

    }



    return { ok: true, data: { connected: false } };

  } catch (err) {

    console.error("[server-action:getChannelConnection]", err);

    const cookie = getChannelConnectionCookie();

    if (cookie) {

      return {

        ok: true,

        data: {

          connected: true,

          channel: cookieToChannelConnection(cookie),

        },

      };

    }

    return { ok: true, data: { connected: false } };

  }

}



export async function getYouTubeConnectUrlAction(

  locale: string

): Promise<YouTubeActionResult<{ url: string | null; oauthConfigured: boolean }>> {

  try {

    const { userId } = await getOptionalAuthUser();

    if (!userId) return { ok: true, data: { url: null, oauthConfigured: false } };



    const url = getYouTubeOAuthUrl(`${userId}:${locale}`);

    return { ok: true, data: { url, oauthConfigured: Boolean(url) } };

  } catch (err) {

    console.error("[server-action:getYouTubeConnectUrl]", err);

    return { ok: true, data: { url: null, oauthConfigured: false } };

  }

}



const ConnectByUrlSchema = z.object({ channelUrl: z.string().min(3).max(500) });



/** Connects a channel using public YouTube API data (no OAuth tokens). */

export async function connectChannelByUrlAction(

  input: z.infer<typeof ConnectByUrlSchema>

): Promise<YouTubeActionResult<{ channel: ChannelConnection; savedLocally?: boolean }>> {

  try {

    const parsed = ConnectByUrlSchema.safeParse(input);

    if (!parsed.success) return ytErr("INVALID_URL");



    if (!isYouTubeConfigured()) return ytErr("NOT_CONFIGURED");



    const ref = parseChannelInput(parsed.data.channelUrl);

    if (!ref) return ytErr("INVALID_URL");



    const stats = await resolveChannelStats(ref);

    if (!stats) return ytErr("CHANNEL_NOT_FOUND");



    const cookieData = statsToCookie(stats);

    saveChannelConnectionCookie(cookieData);



    const { supabase, userId } = await getOptionalAuthUser();

    let dbChannelId: string | undefined;

    let savedLocally = !userId;



    if (supabase && userId) {

      const saved = await saveChannelToDb(supabase, userId, stats);

      if (saved) {

        dbChannelId = saved.channelId;

      } else {

        savedLocally = true;

      }

    } else if (!isSupabaseConfigured()) {

      savedLocally = true;

    } else if (!userId) {

      savedLocally = true;

    }



    return {

      ok: true,

      data: {

        channel: statsToConnection(stats, dbChannelId),

        ...(savedLocally ? { savedLocally: true } : {}),

      },

    };

  } catch (err) {

    console.error("[server-action:connectChannelByUrl]", err);

    const cookie = getChannelConnectionCookie();

    if (cookie) {

      return {

        ok: true,

        data: {

          channel: cookieToChannelConnection(cookie),

          savedLocally: true,

        },

      };

    }

    return ytErr("DB_ERROR", err instanceof Error ? err.message : undefined);

  }

}



export async function disconnectChannelAction(): Promise<

  YouTubeActionResult<{ disconnected: true }>

> {

  try {

    clearChannelConnectionCookie();



    const { supabase, userId } = await getOptionalAuthUser();

    if (supabase && userId) {

      await supabase.from("channels").delete().eq("user_id", userId);

      await supabase
        .from("users")
        .update({ youtube_channel_id: null, youtube_tokens: null })
        .eq("id", userId);

    }



    return { ok: true, data: { disconnected: true } };

  } catch (err) {

    console.error("[server-action:disconnectChannel]", err);

    clearChannelConnectionCookie();

    return { ok: true, data: { disconnected: true } };

  }

}



export async function refreshChannelAction(): Promise<

  YouTubeActionResult<{ channel: ChannelConnection }>

> {

  try {

    const { supabase, userId } = await getOptionalAuthUser();

    const cookie = getChannelConnectionCookie();



    let youtubeChannelId: string | null = null;

    let dbChannelId: string | undefined;



    if (supabase && userId) {

      const { data: row } = await supabase

        .from("channels")

        .select("id, youtube_channel_id")

        .eq("user_id", userId)

        .maybeSingle();



      if (row) {

        youtubeChannelId = row.youtube_channel_id;

        dbChannelId = row.id;

      }

    }



    if (!youtubeChannelId && cookie) {

      youtubeChannelId = cookie.youtubeChannelId;

    }



    if (!youtubeChannelId) return ytErr("NOT_CONNECTED");



    const stats = await resolveChannelStats({ type: "id", value: youtubeChannelId });

    if (!stats) return ytErr("YOUTUBE_ERROR");



    saveChannelConnectionCookie(statsToCookie(stats));



    if (supabase && userId && dbChannelId) {

      const channelData = { title: stats.title, thumbnailUrl: stats.thumbnailUrl };

      const statsCache = {

        subscriberCount: stats.subscriberCount,

        viewCount: stats.viewCount,

        videoCount: stats.videoCount,

      };



      await supabase

        .from("channels")

        .update({

          channel_data: channelData,

          stats_cache: statsCache,

          last_updated: new Date().toISOString(),

        })

        .eq("id", dbChannelId);

    }



    return {

      ok: true,

      data: {

        channel: statsToConnection(stats, dbChannelId),

      },

    };

  } catch (err) {

    console.error("[server-action:refreshChannel]", err);

    const cookie = getChannelConnectionCookie();

    if (cookie) {

      return {

        ok: true,

        data: { channel: cookieToChannelConnection(cookie) },

      };

    }

    return ytErr("YOUTUBE_ERROR", err instanceof Error ? err.message : undefined);

  }

}


