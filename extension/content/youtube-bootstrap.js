/**
 * YouTube SPA bootstrap — stable single-root architecture.
 * Debounced navigation, no double-render, no aggressive dismiss.
 */
(function initCreatorForgeYouTubeBootstrap() {
  if (window.__CF_BOOTSTRAP_LOADED__) return;
  window.__CF_BOOTSTRAP_LOADED__ = true;

  const { log, ensureRoot, clearPageMounts, rafUpdate } = window.CreatorForgeExt;

  const DEBOUNCE_MS = 300;
  let navigationTimer = null;
  let lastHandledUrl = "";
  let isHandling = false;

  /** @returns {"channel" | "video" | "search" | "home" | null} */
  function getPageType() {
    const path = window.location.pathname;
    const videoId = new URLSearchParams(window.location.search).get("v");

    if (path === "/watch" && videoId) return "video";

    if (/^\/@[^/]+/.test(path)) return "channel";
    if (path.startsWith("/channel/")) return "channel";
    if (path.startsWith("/c/")) return "channel";
    if (path.startsWith("/user/")) return "channel";

    if (path === "/results" || path === "/search") return "search";
    if (path === "/" && window.location.search.includes("search_query")) return "search";

    if (path === "/" || path === "/feed/subscriptions" || path === "/feed/trending") return "home";

    return null;
  }

  async function handleNavigation(force = false) {
    const currentUrl = window.location.href.split("#")[0];
    if (!force && currentUrl === lastHandledUrl) return;
    if (isHandling) return;

    isHandling = true;
    const pageType = getPageType();

    log("Navigation:", pageType || "unsupported", currentUrl);

    ensureRoot();
    clearPageMounts();

    try {
      if (pageType === "video" && window.CreatorForgeVideo) {
        await window.CreatorForgeVideo.run();
      } else if (pageType === "channel" && window.CreatorForgeChannel) {
        await window.CreatorForgeChannel.run();
      } else if (pageType === "search" && window.CreatorForgeSearch) {
        await window.CreatorForgeSearch.run();
      } else if (pageType === "home" && window.CreatorForgeHome) {
        await window.CreatorForgeHome.run();
      }
    } catch (err) {
      log("Navigation handler error:", err);
    } finally {
      lastHandledUrl = currentUrl;
      isHandling = false;
    }
  }

  function scheduleNavigation(force = false) {
    clearTimeout(navigationTimer);
    navigationTimer = setTimeout(() => {
      rafUpdate(() => {
        void handleNavigation(force);
      });
    }, DEBOUNCE_MS);
  }

  document.addEventListener("yt-navigate-finish", () => scheduleNavigation(true));
  window.addEventListener("popstate", () => scheduleNavigation(true));

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => scheduleNavigation(true));
  } else {
    scheduleNavigation(true);
  }

  if (typeof chrome !== "undefined" && chrome.storage?.onChanged) {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== "sync") return;
      if (
        changes.locale ||
        changes.showVideoPanel ||
        changes.showChannelPanel ||
        changes.showToolbar ||
        changes.showChannelStatsBar ||
        changes.showInlineScore ||
        changes.showSearchBadges ||
        changes.showVphBadges ||
        changes.panelPosition
      ) {
        lastHandledUrl = "";
        scheduleNavigation(true);
      }
    });
  }
})();
