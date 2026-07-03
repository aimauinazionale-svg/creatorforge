import { readCookieJson, writeCookieJson } from "@/lib/storage/cookie-store";

const PREFIX = "cf_discovery_";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

type DiscoveryCacheEntry = {
  channelId: string;
  discoveredAt: string;
  addedCount: number;
};

function cacheKey(actorId: string): string {
  return `${PREFIX}${actorId}`;
}

/** Returns the cached discovery entry for this actor, if any. */
export function getDiscoveryCacheEntry(actorId: string): DiscoveryCacheEntry | null {
  return readCookieJson<DiscoveryCacheEntry | null>(cacheKey(actorId), null);
}

/** Returns true when discovery was recently run for this channel. */
export function isDiscoveryCached(actorId: string, channelId: string): boolean {
  const entry = getDiscoveryCacheEntry(actorId);
  if (!entry || entry.channelId !== channelId) return false;
  const age = Date.now() - new Date(entry.discoveredAt).getTime();
  return age < CACHE_TTL_MS;
}

/** Records a completed discovery run for rate-limiting repeat attempts. */
export function markDiscoveryComplete(
  actorId: string,
  channelId: string,
  addedCount: number
): void {
  writeCookieJson<DiscoveryCacheEntry>(cacheKey(actorId), {
    channelId,
    discoveredAt: new Date().toISOString(),
    addedCount,
  });
}
