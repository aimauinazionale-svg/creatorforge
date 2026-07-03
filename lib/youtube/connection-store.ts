import { cookies } from "next/headers";

import type { ChannelConnection } from "@/lib/actions/types/youtube";

const CONNECTION_COOKIE = "cf_youtube_connection";

const COOKIE_OPTIONS = {
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
  sameSite: "lax" as const,
};

export type ChannelConnectionCookie = {
  youtubeChannelId: string;
  channelTitle: string;
  thumbnailUrl: string | null;
  subscriberCount: number;
  viewCount: number;
  videoCount: number;
  customUrl?: string | null;
};

/** Persists a YouTube channel connection in a browser cookie (guest / DB fallback). */
export function saveChannelConnectionCookie(data: ChannelConnectionCookie): void {
  try {
    cookies().set(CONNECTION_COOKIE, JSON.stringify(data), COOKIE_OPTIONS);
  } catch {
    // Cookie writes can fail in read-only Server Component contexts.
  }
}

/** Reads the saved YouTube channel connection from cookies. */
export function getChannelConnectionCookie(): ChannelConnectionCookie | null {
  try {
    const raw = cookies().get(CONNECTION_COOKIE)?.value;
    if (!raw) return null;

    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;

    const record = parsed as Record<string, unknown>;
    const youtubeChannelId = record.youtubeChannelId;
    if (typeof youtubeChannelId !== "string" || !youtubeChannelId) return null;

    return {
      youtubeChannelId,
      channelTitle: typeof record.channelTitle === "string" ? record.channelTitle : "YouTube Channel",
      thumbnailUrl: typeof record.thumbnailUrl === "string" ? record.thumbnailUrl : null,
      subscriberCount: Number(record.subscriberCount ?? 0),
      viewCount: Number(record.viewCount ?? 0),
      videoCount: Number(record.videoCount ?? 0),
      customUrl: typeof record.customUrl === "string" ? record.customUrl : null,
    };
  } catch {
    return null;
  }
}

/** Clears the YouTube channel connection cookie. */
export function clearChannelConnectionCookie(): void {
  try {
    cookies().set(CONNECTION_COOKIE, "", { ...COOKIE_OPTIONS, maxAge: 0 });
  } catch {
    // Ignore in read-only contexts.
  }
}

/** Maps cookie storage to the shared channel connection shape. */
export function cookieToChannelConnection(
  cookie: ChannelConnectionCookie,
  dbChannelId?: string
): ChannelConnection {
  return {
    channelId: dbChannelId ?? cookie.youtubeChannelId,
    youtubeChannelId: cookie.youtubeChannelId,
    title: cookie.channelTitle,
    thumbnailUrl: cookie.thumbnailUrl,
    subscriberCount: cookie.subscriberCount,
    viewCount: cookie.viewCount,
    videoCount: cookie.videoCount,
  };
}
