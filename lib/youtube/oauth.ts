import type { YouTubeChannelStats } from "@/lib/youtube/api";

type YouTubeApiChannel = {
  id?: string;
  snippet?: {
    title?: string;
    description?: string;
    thumbnails?: { default?: { url?: string }; medium?: { url?: string } };
    customUrl?: string;
  };
  statistics?: {
    subscriberCount?: string;
    viewCount?: string;
    videoCount?: string;
  };
};

function toNumber(value: string | undefined): number {
  const n = Number(value ?? "0");
  return Number.isFinite(n) ? n : 0;
}

function mapChannel(item: YouTubeApiChannel): YouTubeChannelStats | null {
  if (!item.id) return null;
  return {
    youtubeChannelId: item.id,
    title: item.snippet?.title ?? "Unknown channel",
    thumbnailUrl:
      item.snippet?.thumbnails?.medium?.url ?? item.snippet?.thumbnails?.default?.url ?? null,
    subscriberCount: toNumber(item.statistics?.subscriberCount),
    viewCount: toNumber(item.statistics?.viewCount),
    videoCount: toNumber(item.statistics?.videoCount),
    customUrl: item.snippet?.customUrl ?? null,
  };
}

/** Fetches the authenticated user's YouTube channel using an OAuth access token. */
export async function fetchMyYouTubeChannel(accessToken: string): Promise<YouTubeChannelStats | null> {
  const search = new URLSearchParams({ part: "snippet,statistics", mine: "true" });
  const res = await fetch(`https://www.googleapis.com/youtube/v3/channels?${search.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!res.ok) return null;
  const json = (await res.json()) as { items?: YouTubeApiChannel[] };
  const item = json.items?.[0];
  return item ? mapChannel(item) : null;
}
