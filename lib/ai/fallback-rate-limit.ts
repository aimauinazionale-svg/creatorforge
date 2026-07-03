import { readCookieJson, writeCookieJson } from "@/lib/storage/cookie-store";

const COOKIE_KEY = "cf_ai_requests";

type CookieAiRequest = {
  requestType: string;
  createdAt: string;
};

type CookieAiStore = Record<string, { requests: CookieAiRequest[] }>;

function utcDayBounds(date = new Date()): { start: string; end: string } {
  const start = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0)
  );
  const end = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 1, 0, 0, 0)
  );
  return { start: start.toISOString(), end: end.toISOString() };
}

function readStore(): CookieAiStore {
  return readCookieJson<CookieAiStore>(COOKIE_KEY, {});
}

function requestsToday(userId: string): CookieAiRequest[] {
  const { start } = utcDayBounds();
  const entry = readStore()[userId];
  if (!entry) return [];
  return entry.requests.filter((r) => r.createdAt >= start);
}

/** Counts AI requests logged in the cookie fallback store for today (UTC). */
export function getCookieAiUsage(userId: string): number {
  return requestsToday(userId).length;
}

/** Records an AI request in the cookie fallback store when Supabase is unavailable. */
export function incrementCookieAiRequest(userId: string, requestType: string): void {
  const store = readStore();
  const existing = store[userId]?.requests ?? [];
  const { start } = utcDayBounds();
  const pruned = existing.filter((r) => r.createdAt >= start);
  pruned.push({ requestType, createdAt: new Date().toISOString() });
  store[userId] = { requests: pruned };
  writeCookieJson(COOKIE_KEY, store);
}
