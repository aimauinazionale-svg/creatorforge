import { readCookieJson, writeCookieJson } from "@/lib/storage/cookie-store";

const COOKIE_KEY = "cf_ai_requests";

type CookieAiRequest = {
  requestType: string;
  createdAt: string;
};

type CookieAiStore = Record<string, { requests: CookieAiRequest[] }>;

function utcMonthBounds(date = new Date()): { start: string; end: string } {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 0, 0, 0));
  const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1, 0, 0, 0));
  return { start: start.toISOString(), end: end.toISOString() };
}

function readStore(): CookieAiStore {
  return readCookieJson<CookieAiStore>(COOKIE_KEY, {});
}

function requestsThisMonth(userId: string): CookieAiRequest[] {
  const { start, end } = utcMonthBounds();
  const entry = readStore()[userId];
  if (!entry) return [];
  return entry.requests.filter((r) => r.createdAt >= start && r.createdAt < end);
}

/** Counts AI requests logged in the cookie fallback store for the current month (UTC). */
export function getCookieAiUsage(userId: string): number {
  return requestsThisMonth(userId).length;
}

/** Records an AI request in the cookie fallback store when Supabase is unavailable. */
export function incrementCookieAiRequest(userId: string, requestType: string): void {
  const store = readStore();
  const existing = store[userId]?.requests ?? [];
  const { start, end } = utcMonthBounds();
  const pruned = existing.filter((r) => r.createdAt >= start && r.createdAt < end);
  pruned.push({ requestType, createdAt: new Date().toISOString() });
  store[userId] = { requests: pruned };
  writeCookieJson(COOKIE_KEY, store);
}
