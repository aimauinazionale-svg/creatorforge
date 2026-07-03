export type YouTubeActionErrorCode =
  | "UNAUTHENTICATED"
  | "NOT_CONNECTED"
  | "NOT_CONFIGURED"
  | "INVALID_URL"
  | "CHANNEL_NOT_FOUND"
  | "DB_ERROR"
  | "YOUTUBE_ERROR";

export type YouTubeActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: YouTubeActionErrorCode; details?: string } };

export type ChannelConnection = {
  channelId: string;
  youtubeChannelId: string;
  title: string;
  thumbnailUrl: string | null;
  subscriberCount: number;
  viewCount: number;
  videoCount: number;
};
