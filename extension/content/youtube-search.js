/**
 * Search results — VPH pills + optional SEO score badges on thumbnails.
 */
(function initCreatorForgeYouTubeSearch() {
  if (window.__CF_SEARCH_SCRIPT_LOADED__) return;
  window.__CF_SEARCH_SCRIPT_LOADED__ = true;

  const { getSettings, log, rafUpdate } = window.CreatorForgeExt;

  const PROCESSED_ATTR = "data-cf-score-processed";

  function getSearchThumbnails() {
    return [
      ...document.querySelectorAll("ytd-video-renderer"),
      ...document.querySelectorAll("ytd-grid-video-renderer"),
      ...document.querySelectorAll("ytd-rich-item-renderer"),
    ].filter((el) => !el.hasAttribute(PROCESSED_ATTR));
  }

  /**
   * @param {string} title
   */
  function estimateScoreFromTitle(title) {
    if (!title) return 40;
    const data = {
      title,
      description: title.repeat(3),
      tags: title.toLowerCase().split(/\s+/).filter((w) => w.length > 3).slice(0, 8),
      views: null,
      likes: null,
      uploadDate: null,
      hasHashtags: /#\w+/.test(title),
      hasTimestamps: false,
      hasLinks: false,
      channelName: "Channel",
      daysSinceUpload: null,
    };
    return window.CreatorForgeSeoScorer.analyzeVideo(data).overall;
  }

  function processScoreBadges() {
    const thumbnails = getSearchThumbnails();
    if (thumbnails.length === 0) return;

    for (const item of thumbnails) {
      item.setAttribute(PROCESSED_ATTR, "1");

      const titleEl =
        item.querySelector("#video-title") ||
        item.querySelector("a#video-title-link") ||
        item.querySelector("yt-formatted-string#video-title");

      const title = titleEl?.textContent?.trim() || "";
      if (!title) continue;

      const thumbContainer =
        item.querySelector("ytd-thumbnail") ||
        item.querySelector("#thumbnail") ||
        item.querySelector("a#thumbnail");

      if (!thumbContainer || thumbContainer.querySelector(".cf-thumb-badge-wrap")) continue;

      const score = estimateScoreFromTitle(title);
      const badge = document.createElement("span");
      badge.className = "cf-thumb-badge-wrap";
      badge.innerHTML = window.CreatorForgePanel.renderThumbnailBadge(score);
      thumbContainer.style.position = "relative";
      thumbContainer.appendChild(badge);
    }

    log("Search score badges added:", thumbnails.length);
  }

  async function run() {
    const settings = await getSettings();
    await window.CreatorForgeI18n?.loadLocaleFromStorage?.();

    if (settings.showToolbar && window.CreatorForgeToolbar) {
      window.CreatorForgeToolbar.render({ mode: "default" }, settings.locale);
    }

    rafUpdate(() => {
      if (settings.showVphBadges) {
        window.CreatorForgeVphBadges?.injectBadges(settings.locale);
      }
      if (settings.showSearchBadges) {
        processScoreBadges();
      }
    });
  }

  window.CreatorForgeSearch = { run };
})();
