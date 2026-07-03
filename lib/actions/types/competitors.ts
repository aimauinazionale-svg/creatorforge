export type CompetitorActionErrorCode =
  | "UNAUTHENTICATED"
  | "INVALID_URL"
  | "INVALID_NICHE"
  | "NOT_FOUND"
  | "LIMIT_REACHED"
  | "DUPLICATE"
  | "DB_ERROR"
  | "YOUTUBE_ERROR"
  | "NOT_CONFIGURED"
  | "NOT_CONNECTED";

export type CompetitorActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: CompetitorActionErrorCode; details?: string } };

export type CompetitorRow = {
  id: string;
  youtubeChannelId: string;
  channelName: string;
  channelUrl: string | null;
  subscriberCount: number;
  viewCount: number;
  videoCount: number;
  thumbnailUrl: string | null;
  trackedSince: string;
  lastUpdated: string | null;
  autoDiscovered?: boolean;
};
