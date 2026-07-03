/**
 * Extract video and channel metadata from YouTube DOM (no API required).
 */
(function initCreatorForgeDomParser(global) {
  if (global.__CF_DOM_PARSER_LOADED__) return;
  global.__CF_DOM_PARSER_LOADED__ = true;

  const { parseCompactNumber, log } = global.CreatorForgeExt;

  /** @param {string} selector */
  function textFrom(selector) {
    const el = document.querySelector(selector);
    return el?.textContent?.trim() || "";
  }

  /**
   * @param {string} label
   */
  function textFromAriaLabel(label) {
    const el = document.querySelector(`[aria-label*="${label}"]`);
    return el?.getAttribute("aria-label") || el?.textContent?.trim() || "";
  }

  /**
   * Try to expand the video description "Show more" button.
   */
  async function expandDescription() {
    const expandBtn =
      document.querySelector("#expand") ||
      document.querySelector("tp-yt-paper-button#expand") ||
      document.querySelector("#description-inline-expander #expand") ||
      [...document.querySelectorAll("button, tp-yt-paper-button")].find((el) =>
        /show more/i.test(el.textContent || "")
      );

    if (expandBtn) {
      expandBtn.click();
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  /**
   * @returns {string}
   */
  function getDescriptionText() {
    const selectors = [
      "ytd-text-inline-expander#description-inline-expander #content",
      "#description-inline-expander yt-formatted-string",
      "ytd-expandable-video-description-body-renderer #content",
      "#description yt-formatted-string",
      "ytd-watch-metadata #description",
    ];

    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el?.textContent?.trim()) return el.textContent.trim();
    }
    return "";
  }

  /**
   * @param {string} text
   */
  function parseUploadDate(text) {
    if (!text) return { uploadDate: null, daysSinceUpload: null };

    const parsed = Date.parse(text);
    if (!Number.isNaN(parsed)) {
      const days = Math.max(1, Math.floor((Date.now() - parsed) / 86400000));
      return { uploadDate: text, daysSinceUpload: days };
    }

    const relative = text.match(/(\d+)\s+(second|minute|hour|day|week|month|year)s?\s+ago/i);
    if (relative) {
      const n = parseInt(relative[1], 10);
      const unit = relative[2].toLowerCase();
      const multipliers = { second: 0, minute: 0, hour: 0, day: 1, week: 7, month: 30, year: 365 };
      const days = Math.max(1, n * (multipliers[unit] || 1));
      return { uploadDate: text, daysSinceUpload: days };
    }

    return { uploadDate: text, daysSinceUpload: null };
  }

  /**
   * Estimate tags from title when real tags aren't available.
   * @param {string} title
   */
  function estimateTagsFromTitle(title) {
    if (!title) return [];
    const stop = new Set(["the", "and", "for", "with", "from", "this", "that", "your", "how", "what", "why"]);
    return title
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 3 && !stop.has(w))
      .slice(0, 8);
  }

  /**
   * @returns {Promise<{
   *   title: string;
   *   description: string;
   *   tags: string[];
   *   tagsEstimated: boolean;
   *   views: number | null;
   *   viewsText: string;
   *   likes: number | null;
   *   likesText: string;
   *   channelName: string;
   *   uploadDate: string | null;
   *   daysSinceUpload: number | null;
   *   hasHashtags: boolean;
   *   hasTimestamps: boolean;
   *   hasLinks: boolean;
   * }>}
   */
  async function parseVideoFromDom() {
    await expandDescription();

    const title =
      textFrom("h1.ytd-watch-metadata yt-formatted-string") ||
      textFrom("h1 yt-formatted-string.ytd-watch-metadata") ||
      textFrom("#title h1 yt-formatted-string") ||
      textFrom("ytd-watch-metadata h1") ||
      document.querySelector("meta[name='title']")?.getAttribute("content") ||
      document.title.replace(/ - YouTube$/, "");

    const description = getDescriptionText();

    const viewsEl =
      document.querySelector("#info-container #count .view-count") ||
      document.querySelector("ytd-video-view-count-renderer span") ||
      document.querySelector("#info span.view-count") ||
      document.querySelector("yt-formatted-string.view-count");

    const viewsText = viewsEl?.textContent?.trim() || "";
    const views = parseCompactNumber(viewsText);

    const likesButton =
      document.querySelector("like-button-view-model button") ||
      document.querySelector("#top-level-buttons-computed like-button-view-model button") ||
      document.querySelector("ytd-toggle-button-renderer button[aria-label*='like']");

    const likesLabel = likesButton?.getAttribute("aria-label") || "";
    const likesMatch = likesLabel.match(/([\d,.]+[KMB]?)/i);
    const likesText = likesMatch?.[1] || "—";
    const likes = parseCompactNumber(likesText);

    const channelName =
      textFrom("#channel-name a") ||
      textFrom("ytd-channel-name a") ||
      textFrom("ytd-video-owner-renderer #channel-name a") ||
      "Channel";

    const dateText =
      textFrom("#info-strings yt-formatted-string") ||
      textFrom("ytd-video-primary-info-renderer #info-strings") ||
      [...document.querySelectorAll("#info-strings span, #info span")].find((el) =>
        /ago|20\d{2}/i.test(el.textContent || "")
      )?.textContent?.trim() ||
      "";

    const { uploadDate, daysSinceUpload } = parseUploadDate(dateText);

    const metaTags = document.querySelector("meta[name='keywords']")?.getAttribute("content");
    let tags = metaTags ? metaTags.split(",").map((t) => t.trim()).filter(Boolean) : [];
    let tagsEstimated = false;

    if (tags.length === 0) {
      tags = estimateTagsFromTitle(title);
      tagsEstimated = tags.length > 0;
    }

    const hasHashtags = /#\w+/.test(description);
    const hasTimestamps = /\d{1,2}:\d{2}/.test(description);
    const hasLinks = /https?:\/\//i.test(description) || document.querySelector("#description a") != null;

    log("Parsed video DOM:", { title: title.slice(0, 40), descLen: description.length, tags: tags.length });

    return {
      title,
      description,
      tags,
      tagsEstimated,
      views,
      viewsText,
      likes,
      likesText,
      channelName,
      uploadDate,
      daysSinceUpload,
      hasHashtags,
      hasTimestamps,
      hasLinks,
    };
  }

  /**
   * @returns {{ name: string; subscribersText: string; videosText: string; channelUrl: string }}
   */
  function parseChannelFromDom() {
    const name =
      textFrom("yt-dynamic-text-view-model h1 span") ||
      textFrom("#channel-name #text") ||
      textFrom("yt-page-header-view-model h1") ||
      textFrom("#inner-header-container #channel-name") ||
      document.querySelector("meta[property='og:title']")?.getAttribute("content")?.replace(/ - YouTube$/, "") ||
      "Channel";

    const subText =
      textFrom("#subscriber-count") ||
      textFrom("yt-content-metadata-view-model #subscriber-count") ||
      textFrom("#owner-sub-count") ||
      [...document.querySelectorAll("span, yt-formatted-string")].find((el) =>
        /subscriber/i.test(el.textContent || "")
      )?.textContent ||
      "";

    const videoMeta =
      [...document.querySelectorAll("span, yt-formatted-string")].find((el) =>
        /^\s*\d[\d,.KMB]*\s+videos?\s*$/i.test(el.textContent || "")
      )?.textContent ||
      [...document.querySelectorAll("span, yt-formatted-string")].find((el) =>
        /video/i.test(el.textContent || "")
      )?.textContent ||
      "";

    return {
      name,
      subscribersText: subText.replace(/subscribers?/i, "").trim(),
      videosText: videoMeta,
      channelUrl: window.location.href.split(/[?#]/)[0],
    };
  }

  /**
   * Guess upload frequency from visible video cards on channel page.
   * @returns {"active" | "inactive" | null}
   */
  function detectUploadFrequency() {
    const timeEls = [...document.querySelectorAll("ytd-grid-video-renderer #metadata-line span, ytd-rich-grid-media #metadata-line span")];
    for (const el of timeEls.slice(0, 6)) {
      const t = el.textContent || "";
      if (/\b\d+\s+(day|hour|week)s?\s+ago\b/i.test(t)) return "active";
      if (/\b\d+\s+month/i.test(t)) return "inactive";
    }
    return null;
  }

  /**
   * Compute upload frequency hint (e.g. "2 videos/week").
   * @param {string} [locale]
   * @returns {string | null}
   */
  function computeUploadFrequencyHint(locale) {
    const timeEls = [
      ...document.querySelectorAll(
        "ytd-grid-video-renderer #metadata-line span, ytd-rich-grid-media #metadata-line span, ytd-rich-item-renderer #metadata-line span"
      ),
    ];
    let recentCount = 0;

    for (const el of timeEls.slice(0, 12)) {
      const text = el.textContent || "";
      if (/\b\d+\s+hours?\s+ago\b/i.test(text)) recentCount++;
      else {
        const dayMatch = text.match(/\b(\d+)\s+days?\s+ago\b/i);
        if (dayMatch && parseInt(dayMatch[1], 10) <= 7) recentCount++;
        const weekMatch = text.match(/\b(\d+)\s+weeks?\s+ago\b/i);
        if (weekMatch && parseInt(weekMatch[1], 10) <= 1) recentCount++;
      }
    }

    const i18n = global.CreatorForgeI18n;
    const freq = detectUploadFrequency();

    if (recentCount >= 2 && i18n) {
      return i18n.t("uploadFreqPerWeek", locale, { count: recentCount });
    }
    if (freq === "active" && i18n) return i18n.t("uploadActive", locale);
    if (freq === "inactive" && i18n) return i18n.t("uploadInactive", locale);
    if (i18n) return i18n.t("uploadUnknown", locale);
    return null;
  }

  /**
   * @returns {string | null}
   */
  function parseChannelAvatarFromDom() {
    const img =
      document.querySelector("#avatar img") ||
      document.querySelector("yt-img-shadow img") ||
      document.querySelector("#channel-header-container img") ||
      document.querySelector("yt-decorated-avatar img");
    return img?.src || null;
  }

  /**
   * @returns {string | null}
   */
  function parseVideoChannelUrlFromDom() {
    const link =
      document.querySelector("#channel-name a") ||
      document.querySelector("ytd-channel-name a") ||
      document.querySelector("ytd-video-owner-renderer #channel-name a");
    return link?.href?.split(/[?#]/)[0] || null;
  }

  global.CreatorForgeDomParser = {
    parseVideoFromDom,
    parseChannelFromDom,
    detectUploadFrequency,
    computeUploadFrequencyHint,
    parseChannelAvatarFromDom,
    parseVideoChannelUrlFromDom,
    expandDescription,
  };
})(window);
