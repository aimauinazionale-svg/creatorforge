import type { ParsedChannelRef } from "@/lib/youtube/parse";
import { getSiteUrl } from "@/lib/site";
import { CACHE_TTL, revalidateOptions } from "@/lib/utils/cache";

export type YouTubeChannelStats = {
  youtubeChannelId: string;
  title: string;
  thumbnailUrl: string | null;
  subscriberCount: number;
  viewCount: number;
  videoCount: number;
  customUrl: string | null;
};

export type YouTubeVideoSummary = {
  youtubeVideoId: string;
  title: string;
  thumbnailUrl: string | null;
  publishedAt: string | null;
  viewCount: number;
  likeCount: number;
  commentCount: number;
};

type YouTubeApiChannel = {
  id?: string;
  snippet?: {
    title?: string;
    thumbnails?: { default?: { url?: string }; medium?: { url?: string } };
    customUrl?: string;
  };
  statistics?: {
    subscriberCount?: string;
    viewCount?: string;
    videoCount?: string;
  };
};

type YouTubeApiVideo = {
  id?: string;
  snippet?: {
    title?: string;
    description?: string;
    tags?: string[];
    channelTitle?: string;
    publishedAt?: string;
    thumbnails?: { medium?: { url?: string }; default?: { url?: string } };
  };
  statistics?: {
    viewCount?: string;
    likeCount?: string;
    commentCount?: string;
  };
};

export type YouTubeVideoDetails = YouTubeVideoSummary & {
  description: string;
  tags: string[];
  channelTitle: string | null;
};

type YouTubeApiComment = {
  snippet?: {
    topLevelComment?: {
      snippet?: { textDisplay?: string; authorDisplayName?: string; likeCount?: number };
    };
  };
};

function getApiKey(): string | null {
  return process.env.YOUTUBE_API_KEY ?? process.env.NEXT_PUBLIC_YOUTUBE_API_KEY ?? null;
}

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

async function fetchChannels(params: Record<string, string>): Promise<YouTubeChannelStats | null> {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  const search = new URLSearchParams({ ...params, key: apiKey, part: "snippet,statistics" });
  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?${search.toString()}`,
    revalidateOptions(CACHE_TTL.CHANNEL_STATS)
  );

  if (!res.ok) return null;
  const json = (await res.json()) as { items?: YouTubeApiChannel[] };
  const item = json.items?.[0];
  return item ? mapChannel(item) : null;
}

/** Searches YouTube for channel IDs matching a niche query. */
export async function searchChannelsByQuery(query: string, maxResults = 5): Promise<string[]> {
  const apiKey = getApiKey();
  if (!apiKey || !query.trim()) return [];

  const search = new URLSearchParams({
    key: apiKey,
    part: "snippet",
    q: query.trim(),
    type: "channel",
    maxResults: String(Math.min(maxResults, 10)),
  });

  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/search?${search.toString()}`,
    revalidateOptions(CACHE_TTL.SEO_DATA)
  );
  if (!res.ok) return [];

  const json = (await res.json()) as {
    items?: Array<{ id?: { channelId?: string } }>;
  };
  return (json.items ?? [])
    .map((i) => i.id?.channelId)
    .filter((id): id is string => Boolean(id));
}

/** Searches YouTube for a channel ID when handle/username lookup fails. */
async function searchChannelId(query: string): Promise<string | null> {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  const q = query.startsWith("@") ? query : `@${query}`;
  const search = new URLSearchParams({
    key: apiKey,
    part: "snippet",
    q,
    type: "channel",
    maxResults: "1",
  });

  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/search?${search.toString()}`,
    revalidateOptions(CACHE_TTL.CHANNEL_STATS)
  );
  if (!res.ok) return null;

  const json = (await res.json()) as {
    items?: Array<{ id?: { channelId?: string } }>;
  };
  return json.items?.[0]?.id?.channelId ?? null;
}

/** Resolves channel stats from a parsed reference using the YouTube Data API. */
export async function resolveChannelStats(ref: ParsedChannelRef): Promise<YouTubeChannelStats | null> {
  if (!getApiKey()) return null;

  let stats: YouTubeChannelStats | null = null;

  switch (ref.type) {
    case "id":
      stats = await fetchChannels({ id: ref.value });
      break;
    case "handle":
      stats = await fetchChannels({ forHandle: ref.value });
      if (!stats) {
        const channelId = await searchChannelId(ref.value);
        if (channelId) stats = await fetchChannels({ id: channelId });
      }
      break;
    case "username":
      stats = await fetchChannels({ forUsername: ref.value });
      if (!stats) {
        const channelId = await searchChannelId(ref.value);
        if (channelId) stats = await fetchChannels({ id: channelId });
      }
      break;
    default:
      return null;
  }

  return stats;
}

/** Fetches keyword suggestions from YouTube search autocomplete (no API key). */
export async function fetchKeywordSuggestions(seed: string): Promise<string[]> {
  const q = seed.trim();
  if (q.length < 2) return [];

  try {
    const url = `https://suggestqueries.google.com/complete/search?client=youtube&ds=yt&q=${encodeURIComponent(q)}`;
    const res = await fetch(url, revalidateOptions(CACHE_TTL.KEYWORD_SUGGESTIONS));
    if (!res.ok) return [];
    const json = (await res.json()) as unknown;
    if (!Array.isArray(json) || !Array.isArray(json[1])) return [];
    return (json[1] as unknown[])
      .filter((item): item is string => typeof item === "string")
      .slice(0, 12);
  } catch {
    return [];
  }
}

/** Scores a keyword for YouTube SEO heuristics (0–100). */
export function scoreKeyword(keyword: string, suggestions: string[]): {
  score: number;
  competition: "low" | "medium" | "high";
  reasoning: string;
} {
  const words = keyword.trim().split(/\s+/).filter(Boolean);
  const lengthScore = words.length <= 4 ? 85 : words.length <= 6 ? 70 : 55;
  const specificity = keyword.length >= 12 ? 10 : 0;
  const suggestionOverlap = suggestions.filter((s) => s.toLowerCase().includes(keyword.toLowerCase())).length;
  const competition =
    suggestionOverlap >= 6 ? "high" : suggestionOverlap >= 3 ? "medium" : "low";
  const competitionPenalty = competition === "high" ? 15 : competition === "medium" ? 8 : 0;
  const score = Math.max(20, Math.min(100, lengthScore + specificity - competitionPenalty));

  return {
    score,
    competition,
    reasoning:
      competition === "low"
        ? "Niche phrase with lower autocomplete competition."
        : competition === "medium"
          ? "Moderate competition—pair with a specific angle."
          : "Broad term—consider a long-tail variant.",
  };
}

export function isYouTubeConfigured(): boolean {
  return Boolean(getApiKey());
}

function mapVideo(item: YouTubeApiVideo): YouTubeVideoSummary | null {
  if (!item.id) return null;
  return {
    youtubeVideoId: item.id,
    title: item.snippet?.title ?? "Untitled",
    thumbnailUrl:
      item.snippet?.thumbnails?.medium?.url ?? item.snippet?.thumbnails?.default?.url ?? null,
    publishedAt: item.snippet?.publishedAt ?? null,
    viewCount: toNumber(item.statistics?.viewCount),
    likeCount: toNumber(item.statistics?.likeCount),
    commentCount: toNumber(item.statistics?.commentCount),
  };
}

/** Fetches recent uploads for a channel. */
export async function fetchChannelVideos(
  channelId: string,
  maxResults = 8
): Promise<YouTubeVideoSummary[]> {
  const apiKey = getApiKey();
  if (!apiKey) return [];

  const search = new URLSearchParams({
    key: apiKey,
    part: "snippet",
    channelId,
    order: "date",
    type: "video",
    maxResults: String(Math.min(maxResults, 25)),
  });

  const searchRes = await fetch(
    `https://www.googleapis.com/youtube/v3/search?${search.toString()}`,
    revalidateOptions(CACHE_TTL.VIDEO_METRICS)
  );
  if (!searchRes.ok) return [];

  const searchJson = (await searchRes.json()) as {
    items?: Array<{ id?: { videoId?: string } }>;
  };
  const ids = (searchJson.items ?? [])
    .map((i) => i.id?.videoId)
    .filter((id): id is string => Boolean(id));
  if (!ids.length) return [];

  const videoParams = new URLSearchParams({
    key: apiKey,
    part: "snippet,statistics",
    id: ids.join(","),
  });
  const videoRes = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?${videoParams.toString()}`,
    revalidateOptions(CACHE_TTL.VIDEO_METRICS)
  );
  if (!videoRes.ok) return [];

  const videoJson = (await videoRes.json()) as { items?: YouTubeApiVideo[] };
  return (videoJson.items ?? []).map(mapVideo).filter((v): v is YouTubeVideoSummary => Boolean(v));
}

function mapVideoDetails(item: YouTubeApiVideo): YouTubeVideoDetails | null {
  const base = mapVideo(item);
  if (!base) return null;
  return {
    ...base,
    description: item.snippet?.description ?? "",
    tags: item.snippet?.tags ?? [],
    channelTitle: item.snippet?.channelTitle ?? null,
  };
}

/** Fetches full metadata for a single YouTube video. */
export async function fetchVideoDetails(videoId: string): Promise<YouTubeVideoDetails | null> {
  const apiKey = getApiKey();
  if (!apiKey || !videoId.trim()) return null;

  const params = new URLSearchParams({
    key: apiKey,
    part: "snippet,statistics",
    id: videoId.trim(),
  });

  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?${params.toString()}`,
    revalidateOptions(CACHE_TTL.VIDEO_METRICS)
  );
  if (!res.ok) return null;

  const json = (await res.json()) as { items?: YouTubeApiVideo[] };
  const item = json.items?.[0];
  return item ? mapVideoDetails(item) : null;
}

export type NicheTrendingVideo = {
  videoId: string;
  title: string;
  channelTitle: string;
  viewCount: number;
  publishedAt: string | null;
  thumbnailUrl: string | null;
};

/** Searches recent videos in a niche for trending topic discovery. */
export async function searchNicheTrending(
  query: string,
  maxResults = 5
): Promise<NicheTrendingVideo[]> {
  const apiKey = getApiKey();
  if (!apiKey || !query.trim()) return [];

  const search = new URLSearchParams({
    key: apiKey,
    part: "snippet",
    q: query.trim(),
    type: "video",
    order: "viewCount",
    publishedAfter: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    maxResults: String(Math.min(maxResults, 10)),
  });

  const searchRes = await fetch(
    `https://www.googleapis.com/youtube/v3/search?${search.toString()}`,
    revalidateOptions(CACHE_TTL.SEO_DATA)
  );
  if (!searchRes.ok) return [];

  const searchJson = (await searchRes.json()) as {
    items?: Array<{
      id?: { videoId?: string };
      snippet?: {
        title?: string;
        channelTitle?: string;
        publishedAt?: string;
        thumbnails?: { medium?: { url?: string }; default?: { url?: string } };
      };
    }>;
  };

  const ids = (searchJson.items ?? [])
    .map((i) => i.id?.videoId)
    .filter((id): id is string => Boolean(id));
  if (!ids.length) return [];

  const videoParams = new URLSearchParams({
    key: apiKey,
    part: "statistics",
    id: ids.join(","),
  });
  const videoRes = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?${videoParams.toString()}`,
    revalidateOptions(CACHE_TTL.VIDEO_METRICS)
  );

  const statsMap = new Map<string, number>();
  if (videoRes.ok) {
    const videoJson = (await videoRes.json()) as { items?: YouTubeApiVideo[] };
    for (const v of videoJson.items ?? []) {
      if (v.id) statsMap.set(v.id, toNumber(v.statistics?.viewCount));
    }
  }

  return (searchJson.items ?? [])
    .map((item) => {
      const videoId = item.id?.videoId;
      if (!videoId) return null;
      return {
        videoId,
        title: item.snippet?.title ?? "Untitled",
        channelTitle: item.snippet?.channelTitle ?? "Unknown",
        viewCount: statsMap.get(videoId) ?? 0,
        publishedAt: item.snippet?.publishedAt ?? null,
        thumbnailUrl:
          item.snippet?.thumbnails?.medium?.url ??
          item.snippet?.thumbnails?.default?.url ??
          null,
      };
    })
    .filter((v): v is NicheTrendingVideo => Boolean(v));
}

/** Fetches top-level comments for sentiment analysis. */
export async function fetchVideoComments(
  videoId: string,
  maxResults = 50
): Promise<Array<{ text: string; author: string; likeCount: number }>> {
  const apiKey = getApiKey();
  if (!apiKey) return [];

  const params = new URLSearchParams({
    key: apiKey,
    part: "snippet",
    videoId,
    maxResults: String(Math.min(maxResults, 100)),
    order: "relevance",
    textFormat: "plainText",
  });

  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/commentThreads?${params.toString()}`,
    revalidateOptions(CACHE_TTL.COMMENTS)
  );
  if (!res.ok) return [];

  const json = (await res.json()) as { items?: YouTubeApiComment[] };
  return (json.items ?? [])
    .map((item) => {
      const snippet = item.snippet?.topLevelComment?.snippet;
      if (!snippet?.textDisplay) return null;
      return {
        text: snippet.textDisplay,
        author: snippet.authorDisplayName ?? "Anonymous",
        likeCount: snippet.likeCount ?? 0,
      };
    })
    .filter((c): c is { text: string; author: string; likeCount: number } => Boolean(c));
}

export function isYouTubeOAuthConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      (process.env.YOUTUBE_REDIRECT_URI || getSiteUrl())
  );
}

export function getYouTubeOAuthUrl(state: string): string | null {
  if (!isYouTubeOAuthConfigured()) return null;
  const clientId = process.env.GOOGLE_CLIENT_ID!;
  const redirectUri =
    process.env.YOUTUBE_REDIRECT_URI ??
    `${getSiteUrl()}/auth/youtube/callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/youtube.readonly",
      "https://www.googleapis.com/auth/userinfo.email",
    ].join(" "),
    state,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}
