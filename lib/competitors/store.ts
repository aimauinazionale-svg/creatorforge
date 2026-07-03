import type { CompetitorRow } from "@/lib/actions/types/competitors";
import { readCookieJson, writeCookieJson } from "@/lib/storage/cookie-store";

const PREFIX = "cf_competitors_";
export const COMPETITOR_COOKIE_LIMIT = 5;

function cookieKey(actorId: string): string {
  return `${PREFIX}${actorId}`;
}

/** Reads tracked competitors from cookie storage for the given actor. */
export function getCompetitorsFromCookie(actorId: string): CompetitorRow[] {
  const items = readCookieJson<CompetitorRow[]>(cookieKey(actorId), []);
  return Array.isArray(items) ? items.slice(0, COMPETITOR_COOKIE_LIMIT) : [];
}

/** Persists tracked competitors to cookie storage for the given actor (max 5). */
export function saveCompetitorsToCookie(actorId: string, competitors: CompetitorRow[]): void {
  writeCookieJson(cookieKey(actorId), competitors.slice(0, COMPETITOR_COOKIE_LIMIT));
}

/** Upserts a competitor in cookie storage by YouTube channel id. */
export function upsertCompetitorInCookie(actorId: string, competitor: CompetitorRow): void {
  const existing = getCompetitorsFromCookie(actorId);
  const index = existing.findIndex((c) => c.youtubeChannelId === competitor.youtubeChannelId);
  if (index >= 0) {
    const next = [...existing];
    next[index] = competitor;
    saveCompetitorsToCookie(actorId, next);
    return;
  }
  if (existing.length >= COMPETITOR_COOKIE_LIMIT) return;
  saveCompetitorsToCookie(actorId, [...existing, competitor]);
}

/** Removes a competitor from cookie storage by id. */
export function removeCompetitorFromCookie(actorId: string, id: string): boolean {
  const existing = getCompetitorsFromCookie(actorId);
  const next = existing.filter((c) => c.id !== id);
  if (next.length === existing.length) return false;
  saveCompetitorsToCookie(actorId, next);
  return true;
}
