import {
  fetchChannelVideos,
  resolveChannelStats,
  searchChannelsByQuery,
  type YouTubeChannelStats,
} from "@/lib/youtube/api";

const STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "your",
  "youtube",
  "channel",
  "video",
  "videos",
  "official",
  "subscribe",
  "new",
  "best",
  "how",
  "what",
  "why",
  "this",
  "that",
  "from",
  "about",
]);

const DEFAULT_LIMIT = 5;

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s@#]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

function buildSearchQueries(
  channelTitle: string,
  videoTitles: string[],
  description?: string | null
): string[] {
  const queries = new Set<string>();

  const titleTokens = tokenize(channelTitle);
  if (titleTokens.length >= 2) {
    queries.add(titleTokens.slice(0, 4).join(" "));
  } else if (titleTokens.length === 1) {
    queries.add(titleTokens[0]);
  }

  for (const vt of videoTitles.slice(0, 3)) {
    const tokens = tokenize(vt);
    if (tokens.length >= 2) queries.add(tokens.slice(0, 5).join(" "));
  }

  if (description) {
    const descTokens = tokenize(description);
    if (descTokens.length >= 3) queries.add(descTokens.slice(0, 5).join(" "));
  }

  return Array.from(queries).slice(0, 4);
}

function channelUrl(stats: YouTubeChannelStats): string {
  if (stats.customUrl) {
    const handle = stats.customUrl.startsWith("@") ? stats.customUrl : `@${stats.customUrl}`;
    return `https://www.youtube.com/${handle}`;
  }
  return `https://www.youtube.com/channel/${stats.youtubeChannelId}`;
}

function scoreCandidate(
  candidate: YouTubeChannelStats,
  ownSubscribers: number
): number {
  const subs = candidate.subscriberCount;
  if (subs <= 0) return 0;

  const ratio = subs / Math.max(ownSubscribers, 1);
  const sizeScore =
    ratio >= 0.2 && ratio <= 5 ? 40 : ratio >= 0.05 && ratio <= 20 ? 25 : 10;

  const activityScore = Math.min(30, candidate.videoCount);
  const reachScore = Math.min(30, Math.log10(subs + 1) * 5);

  return sizeScore + activityScore + reachScore;
}

export type DiscoveredCompetitor = YouTubeChannelStats & {
  channelUrl: string;
  discoveryScore: number;
};

export type ChannelDiscoveryResult = {
  competitors: DiscoveredCompetitor[];
  nicheDetected: boolean;
};

function hasDetectableNiche(
  channelTitle: string,
  videoTitles: string[],
  description?: string | null
): boolean {
  if (videoTitles.length > 0) return true;
  if (tokenize(channelTitle).length > 0) return true;
  if (description && tokenize(description).length >= 3) return true;
  return false;
}

async function resolveCandidates(
  candidateIds: Iterable<string>,
  excludeChannelId: string | null,
  ownSubscribers: number,
  limit: number
): Promise<DiscoveredCompetitor[]> {
  const candidates: DiscoveredCompetitor[] = [];

  for (const id of candidateIds) {
    if (excludeChannelId && id === excludeChannelId) continue;

    const stats = await resolveChannelStats({ type: "id", value: id });
    if (!stats || (excludeChannelId && stats.youtubeChannelId === excludeChannelId)) continue;

    candidates.push({
      ...stats,
      channelUrl: channelUrl(stats),
      discoveryScore: scoreCandidate(stats, ownSubscribers),
    });
  }

  return candidates.sort((a, b) => b.discoveryScore - a.discoveryScore).slice(0, limit);
}

/**
 * Discovers similar YouTube channels based on niche keywords from the connected channel.
 * Uses channel title, description, and recent video topics for search queries.
 */
export async function discoverCompetitorsForChannel(
  youtubeChannelId: string,
  limit = DEFAULT_LIMIT
): Promise<ChannelDiscoveryResult> {
  const ownChannel = await resolveChannelStats({ type: "id", value: youtubeChannelId });
  if (!ownChannel) return { competitors: [], nicheDetected: false };

  const videos = await fetchChannelVideos(youtubeChannelId, 5);
  const videoTitles = videos.map((v) => v.title);
  const nicheDetected = hasDetectableNiche(ownChannel.title, videoTitles);
  const queries = buildSearchQueries(ownChannel.title, videoTitles);

  if (queries.length === 0 && ownChannel.title.trim()) {
    queries.push(ownChannel.title.trim());
  }

  if (queries.length === 0) {
    return { competitors: [], nicheDetected: false };
  }

  const candidateIds = new Set<string>();

  for (const query of queries) {
    const results = await searchChannelsByQuery(query, 6);
    for (const id of results) {
      if (id !== youtubeChannelId) candidateIds.add(id);
    }
  }

  if (candidateIds.size === 0) {
    return { competitors: [], nicheDetected };
  }

  const competitors = await resolveCandidates(
    candidateIds,
    youtubeChannelId,
    ownChannel.subscriberCount,
    limit
  );

  return { competitors, nicheDetected };
}

/**
 * Discovers YouTube channels from a user-provided niche keyword.
 */
export async function discoverCompetitorsByNiche(
  niche: string,
  excludeChannelId: string | null,
  limit = DEFAULT_LIMIT
): Promise<DiscoveredCompetitor[]> {
  const query = niche.trim();
  if (!query) return [];

  const results = await searchChannelsByQuery(query, 10);
  const candidateIds = results.filter((id) => id !== excludeChannelId);
  if (candidateIds.length === 0) return [];

  const ownSubscribers =
    excludeChannelId != null
      ? (await resolveChannelStats({ type: "id", value: excludeChannelId }))?.subscriberCount ?? 1
      : 1;

  return resolveCandidates(candidateIds, excludeChannelId, ownSubscribers, limit);
}
