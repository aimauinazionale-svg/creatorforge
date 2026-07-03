/**
 * VidIQ-style VPH (Views Per Hour) badges on video thumbnails.
 */
(function initCreatorForgeVphBadges(global) {
  if (global.__CF_VPH_LOADED__) return;
  global.__CF_VPH_LOADED__ = true;

  const { parseCompactNumber, log } = global.CreatorForgeExt;
  const PROCESSED_ATTR = "data-cf-vph-processed";
  const BADGE_CLASS = "cf-vph-badge-wrap";

  const THUMBNAIL_SELECTORS = [
    "ytd-rich-item-renderer",
    "ytd-video-renderer",
    "ytd-grid-video-renderer",
    "ytd-compact-video-renderer",
    "ytd-playlist-video-renderer",
  ].join(", ");

  /**
   * @param {number} views
   * @param {number | null} daysSinceUpload
   */
  function computeVph(views, daysSinceUpload) {
    if (views == null || views <= 0) return null;
    if (daysSinceUpload == null || daysSinceUpload <= 0) {
      return Math.max(1, Math.round(views / 24));
    }
    const hours = Math.max(1, daysSinceUpload * 24);
    return Math.max(1, Math.round(views / hours));
  }

  /**
   * @param {string} text
   */
  function parseRelativeDate(text) {
    if (!text) return null;
    const relative = text.match(/(\d+)\s+(second|minute|hour|day|week|month|year)s?\s+ago/i);
    if (relative) {
      const n = parseInt(relative[1], 10);
      const unit = relative[2].toLowerCase();
      const multipliers = { second: 0.0003, minute: 0.007, hour: 0.04, day: 1, week: 7, month: 30, year: 365 };
      return Math.max(0.04, n * (multipliers[unit] || 1));
    }
    const parsed = Date.parse(text);
    if (!Number.isNaN(parsed)) {
      return Math.max(0.04, (Date.now() - parsed) / 86400000);
    }
    if (/\b(hour|ore|heure|stunde|hora)s?\b/i.test(text)) return 0.04;
    if (/\b(day|giorn|jour|tag|día)s?\b/i.test(text)) return 1;
    if (/\b(week|settim|semaine|woche|semana)s?\b/i.test(text)) return 7;
    if (/\b(month|mes|mois|monat|mese)s?\b/i.test(text)) return 30;
    if (/\b(year|ann|jahr|año)s?\b/i.test(text)) return 365;
    return null;
  }

  /**
   * @param {Element} item
   */
  function parseItemMetadata(item) {
    const spans = [
      ...item.querySelectorAll("#metadata-line span"),
      ...item.querySelectorAll("ytd-video-meta-block #metadata-line span"),
      ...item.querySelectorAll("#metadata-line yt-formatted-string"),
      ...item.querySelectorAll("span.inline-metadata-item"),
    ];

    let views = null;
    let daysSinceUpload = null;

    for (const span of spans) {
      const text = span.textContent?.trim() || "";
      if (!text) continue;

      if (views == null && /view|visual|vista|aufruf|vue|просмотр|回|观看/i.test(text)) {
        views = parseCompactNumber(text);
      }

      if (daysSinceUpload == null) {
        const days = parseRelativeDate(text);
        if (days != null) daysSinceUpload = days;
      }
    }

    return { views, daysSinceUpload };
  }

  /**
   * @param {number} vph
   * @param {string} locale
   */
  function formatVphLabel(vph, locale) {
    const i18n = global.CreatorForgeI18n;
    const formatted = i18n?.formatCompact(vph, locale) || String(vph);
    return `${formatted} ${i18n?.t("vph", locale) || "VPH"}`;
  }

  /**
   * @param {number} vph
   * @param {string} locale
   */
  function renderVphBadgeHtml(vph, locale) {
    const label = formatVphLabel(vph, locale);
    return `<span class="cf-vph-badge" title="${global.CreatorForgeExt.escapeHtml(label)}">${global.CreatorForgeExt.escapeHtml(label)}</span>`;
  }

  function getThumbContainer(item) {
    return (
      item.querySelector("ytd-thumbnail") ||
      item.querySelector("a#thumbnail") ||
      item.querySelector("#thumbnail") ||
      item.querySelector("yt-thumbnail-view-model")
    );
  }

  function getUnprocessedItems() {
    return [...document.querySelectorAll(THUMBNAIL_SELECTORS)].filter(
      (el) => !el.hasAttribute(PROCESSED_ATTR)
    );
  }

  /**
   * @param {string} locale
   * @returns {number}
   */
  function injectBadges(locale) {
    const items = getUnprocessedItems();
    let count = 0;

    for (const item of items) {
      item.setAttribute(PROCESSED_ATTR, "1");

      const thumbContainer = getThumbContainer(item);
      if (!thumbContainer || thumbContainer.querySelector(`.${BADGE_CLASS}`)) continue;

      const { views, daysSinceUpload } = parseItemMetadata(item);
      const vph = computeVph(views, daysSinceUpload);
      if (vph == null) continue;

      const wrap = document.createElement("span");
      wrap.className = BADGE_CLASS;
      wrap.innerHTML = renderVphBadgeHtml(vph, locale);

      const style = thumbContainer.style;
      if (!style.position || style.position === "static") {
        style.position = "relative";
      }
      thumbContainer.appendChild(wrap);
      count++;
    }

    if (count > 0) log("VPH badges added:", count);
    return count;
  }

  function removeAll() {
    document.querySelectorAll(`.${BADGE_CLASS}`).forEach((el) => el.remove());
    document.querySelectorAll(`[${PROCESSED_ATTR}]`).forEach((el) => el.removeAttribute(PROCESSED_ATTR));
  }

  global.CreatorForgeVphBadges = {
    computeVph,
    parseItemMetadata,
    injectBadges,
    removeAll,
    renderVphBadgeHtml,
    formatVphLabel,
  };
})(window);
