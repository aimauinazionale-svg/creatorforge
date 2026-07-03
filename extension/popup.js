import { buildAppUrl, getSettings } from "./lib/utils.js";

/** @type {typeof window.CreatorForgeI18n} */
const i18n = window.CreatorForgeI18n;

const statusEl = document.getElementById("status");
const dashboardEl = document.getElementById("dashboard");
const pageTypeEl = document.getElementById("page-type");
const videoCardEl = document.getElementById("video-card");
const videoLinkEl = document.getElementById("video-link");

/**
 * @returns {Promise<{ type: string; videoId?: string }>}
 */
async function getActiveTabInfo() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const tab = tabs[0];
  if (!tab?.url) return { type: "unknown" };

  try {
    const url = new URL(tab.url);
    if (!url.hostname.includes("youtube.com")) return { type: "not-youtube" };

    const videoId = url.searchParams.get("v");
    if (url.pathname === "/watch" && videoId) return { type: "video", videoId };

    if (/^\/@[^/]+/.test(url.pathname) || url.pathname.startsWith("/channel/")) {
      return { type: "channel" };
    }

    if (url.pathname === "/results" || url.searchParams.has("search_query")) {
      return { type: "search" };
    }

    return { type: "youtube" };
  } catch {
    return { type: "unknown" };
  }
}

/** @param {string} locale */
function applyPopupI18n(locale) {
  document.documentElement.lang = locale;
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (key) el.textContent = i18n.t(key, locale);
  });
}

/** @param {string} type @param {string} locale */
function pageLabel(type, locale) {
  const map = {
    video: "pageVideo",
    channel: "pageChannel",
    search: "pageSearch",
    youtube: "pageYoutube",
    "not-youtube": "pageNotYoutube",
    unknown: "pageUnknown",
  };
  return i18n.t(map[type] || "pageUnknown", locale);
}

async function init() {
  const settings = await getSettings();
  const locale = settings.locale || i18n.detectBrowserLocale();
  i18n.setLocale(locale);
  applyPopupI18n(locale);

  const dashboardUrl = await buildAppUrl("/dashboard");
  dashboardEl.href = dashboardUrl;

  pageTypeEl.textContent = i18n.t("checking", locale);

  const tabInfo = await getActiveTabInfo();
  pageTypeEl.textContent = pageLabel(tabInfo.type, locale);

  if (tabInfo.type === "video" && tabInfo.videoId) {
    videoCardEl.classList.remove("cf-popup-card--hidden");
    const seoLabUrl = await buildAppUrl("/seo-lab", { videoId: tabInfo.videoId });
    videoLinkEl.href = seoLabUrl;
  }

  statusEl.textContent = `${i18n.t("connectedTo", locale)} ${settings.siteUrl} · ${locale}`;
}

void init();
