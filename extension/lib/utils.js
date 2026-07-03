/** Shared helpers for CreatorForge Chrome extension. */

export const DEFAULT_SITE_URL = "http://localhost:3000";
export const DEFAULT_LOCALE = "it";

const SUPPORTED_LOCALES = ["en", "it", "es", "de", "fr", "pt", "ru", "ja", "zh"];

/** @returns {string} */
export function detectBrowserLocale() {
  const lang = (typeof navigator !== "undefined" ? navigator.language : "it").slice(0, 2).toLowerCase();
  return SUPPORTED_LOCALES.includes(lang) ? lang : DEFAULT_LOCALE;
}

/**
 * @returns {Promise<{ siteUrl: string; locale: string; youtubeApiKey: string }>}
 */
export async function getSettings() {
  const stored = await chrome.storage.sync.get({
    siteUrl: DEFAULT_SITE_URL,
    locale: "",
    youtubeApiKey: "",
    showVideoPanel: true,
    showInlineScore: true,
    showChannelPanel: true,
    showToolbar: true,
    showChannelStatsBar: true,
    showVphBadges: true,
    showSearchBadges: true,
    panelPosition: "sidebar",
  });
  const locale = stored.locale || detectBrowserLocale();
  return {
    siteUrl: String(stored.siteUrl || DEFAULT_SITE_URL).replace(/\/$/, ""),
    locale,
    youtubeApiKey: String(stored.youtubeApiKey || ""),
    showVideoPanel: stored.showVideoPanel !== false,
    showInlineScore: stored.showInlineScore !== false,
    showChannelPanel: stored.showChannelPanel !== false,
    showToolbar: stored.showToolbar !== false && stored.showChannelStatsBar !== false,
    showVphBadges: stored.showVphBadges !== false,
    showSearchBadges: stored.showSearchBadges !== false,
    panelPosition: stored.panelPosition === "fixed" ? "fixed" : "sidebar",
  };
}

/**
 * @param {string} path
 * @param {Record<string, string>} [params]
 */
export async function buildAppUrl(path, params = {}) {
  const { siteUrl, locale } = await getSettings();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`/${locale}${normalized}`, siteUrl);
  for (const [key, value] of Object.entries(params)) {
    if (value) url.searchParams.set(key, value);
  }
  return url.toString();
}

/**
 * @param {string | null | undefined} text
 */
export function parseCompactNumber(text) {
  if (!text) return null;
  const cleaned = text.trim().replace(/,/g, "").replace(/\s/g, "");
  const match = cleaned.match(/^([\d.]+)\s*([KMB])?/i);
  if (!match) return null;
  const base = parseFloat(match[1]);
  if (Number.isNaN(base)) return null;
  const suffix = (match[2] || "").toUpperCase();
  if (suffix === "K") return Math.round(base * 1_000);
  if (suffix === "M") return Math.round(base * 1_000_000);
  if (suffix === "B") return Math.round(base * 1_000_000_000);
  return Math.round(base);
}

/**
 * @param {string} text
 */
export function formatNumber(text) {
  const n = parseCompactNumber(text);
  if (n == null) return text;
  return new Intl.NumberFormat("en-US").format(n);
}

/**
 * @param {string} channelUrl
 * @param {string} apiKey
 */
export async function fetchChannelStatsApi(channelUrl, apiKey) {
  if (!apiKey) return null;
  let handle = null;
  let channelId = null;
  try {
    const url = new URL(channelUrl);
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts[0]?.startsWith("@")) handle = parts[0].slice(1);
    if (parts[0] === "channel" && parts[1]) channelId = parts[1];
  } catch {
    return null;
  }

  const base = "https://www.googleapis.com/youtube/v3/channels";
  const params = new URLSearchParams({ part: "statistics,snippet", key: apiKey });
  if (channelId) params.set("id", channelId);
  else if (handle) params.set("forHandle", handle);
  else return null;

  const res = await fetch(`${base}?${params}`);
  if (!res.ok) return null;
  const data = await res.json();
  const item = data.items?.[0];
  if (!item) return null;
  const stats = item.statistics || {};
  return {
    name: item.snippet?.title || "Channel",
    subscribers: stats.subscriberCount ? Number(stats.subscriberCount) : null,
    videos: stats.videoCount ? Number(stats.videoCount) : null,
    views: stats.viewCount ? Number(stats.viewCount) : null,
    source: "api",
  };
}

/**
 * @param {string} id
 */
export function ensurePanel(id) {
  let panel = document.getElementById(id);
  if (panel) return panel;
  panel = document.createElement("div");
  panel.id = id;
  panel.className = "cf-extension-panel";
  panel.setAttribute("role", "complementary");
  panel.setAttribute("aria-label", "CreatorForge insights");
  document.body.appendChild(panel);
  return panel;
}
