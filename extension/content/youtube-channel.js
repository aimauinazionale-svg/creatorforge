(function initCreatorForgeYouTubeChannel() {
  if (window.__CF_CHANNEL_SCRIPT_LOADED__) return;
  window.__CF_CHANNEL_SCRIPT_LOADED__ = true;

  const {
    getSettings,
    buildAppUrl,
    fetchChannelStatsApi,
    formatNumber,
    parseCompactNumber,
    log,
    updateMount,
    waitForElement,
    rafUpdate,
  } = window.CreatorForgeExt;

  const SIDEBAR_ID = "cf-channel-sidebar";
  const BADGE_ID = "cf-channel-badge";
  const MAX_RETRIES = 20;
  const RETRY_MS = 350;

  let currentChannelUrl = "";

  function getSidebarParent() {
    const browse = document.querySelector("ytd-browse");
    if (!browse) return null;

    const secondary =
      browse.querySelector("#secondary") ||
      browse.querySelector("ytd-two-column-browse-results-renderer #secondary");

    if (secondary) return secondary;

    const primary = browse.querySelector("#primary");
    if (primary) return primary;

    return browse;
  }

  function getBadgeParent() {
    return (
      document.querySelector("yt-page-header-view-model h1")?.parentElement ||
      document.querySelector("#inner-header-container #channel-header") ||
      document.querySelector("yt-dynamic-text-view-model h1")?.parentElement ||
      document.querySelector("#channel-header-container")
    );
  }

  function isDomReady(dom) {
    return dom.name !== "Channel" || dom.subscribersText.length > 0 || dom.videosText.length > 0;
  }

  /**
   * @param {object} data
   * @param {Awaited<ReturnType<typeof window.CreatorForgeSeoScorer.analyzeChannel>>} health
   * @param {string} analyzeUrl
   * @param {string} locale
   * @param {boolean} useFixed
   */
  function renderUI(data, health, analyzeUrl, locale, useFixed) {
    rafUpdate(() => {
      const panelHtml = window.CreatorForgePanel.renderChannelPanel(data, health, analyzeUrl, locale);

      if (useFixed) {
        const root = window.CreatorForgeExt.ensureRoot();
        root.classList.add("cf-root--fixed");
        root.style.display = "block";
        root.innerHTML = `<div id="${SIDEBAR_ID}" class="cf-mount">${panelHtml}</div>`;
      } else {
        updateMount(SIDEBAR_ID, panelHtml, getSidebarParent, "prepend");
      }

      const badgeHtml = window.CreatorForgePanel.renderInlineBadge(health.overall, locale, "health");
      updateMount(BADGE_ID, badgeHtml, getBadgeParent, "append");
    });
  }

  /**
   * @param {object} params
   */
  function renderToolbar(params) {
    const { locale, subscribersNum, videosNum, health, analyzeUrl } = params;
    const i18n = window.CreatorForgeI18n;

    window.CreatorForgeToolbar.render(
      {
        mode: "channel",
        subscribersDisplay: subscribersNum != null ? i18n.formatCompact(subscribersNum, locale) : "—",
        videosDisplay: videosNum != null ? i18n.formatCompact(videosNum, locale) : "—",
        avgViewsDisplay: health.avgViews != null ? i18n.formatCompact(health.avgViews, locale) : "—",
        healthScore: health.overall,
        analyzeUrl,
      },
      locale
    );
  }

  async function run(retryCount = 0) {
    const settings = await getSettings();
    const locale = settings.locale;
    await window.CreatorForgeI18n?.loadLocaleFromStorage?.();

    await waitForElement("ytd-browse", 6000);

    const dom = window.CreatorForgeDomParser.parseChannelFromDom();
    const channelUrl = dom.channelUrl;

    if (channelUrl === currentChannelUrl && document.getElementById(SIDEBAR_ID)) {
      return;
    }

    if (!isDomReady(dom) && retryCount < MAX_RETRIES) {
      log("Channel DOM not ready, retry", retryCount + 1);
      setTimeout(() => void run(retryCount + 1), RETRY_MS);
      return;
    }

    log("Rendering channel panel for", dom.name);

    let stats = null;
    if (settings.youtubeApiKey) {
      try {
        stats = await fetchChannelStatsApi(dom.channelUrl, settings.youtubeApiKey);
      } catch {
        stats = null;
      }
    }

    const subscribersNum = stats?.subscribers ?? parseCompactNumber(dom.subscribersText);
    const videosNum = stats?.videos ?? parseCompactNumber(dom.videosText);
    const viewsNum = stats?.views ?? null;

    const subscribersDisplay =
      subscribersNum != null
        ? window.CreatorForgeI18n.formatFull(subscribersNum, locale)
        : formatNumber(dom.subscribersText) || dom.subscribersText || "—";

    const videosDisplay =
      videosNum != null
        ? window.CreatorForgeI18n.formatFull(videosNum, locale)
        : formatNumber(dom.videosText) || dom.videosText || "—";

    const viewsDisplay =
      viewsNum != null ? window.CreatorForgeI18n.formatFull(viewsNum, locale) : null;
    const uploadFrequency = window.CreatorForgeDomParser.detectUploadFrequency();
    const uploadHint = window.CreatorForgeDomParser.computeUploadFrequencyHint(locale);

    const health = window.CreatorForgeSeoScorer.analyzeChannel({
      subscribers: subscribersNum,
      videos: videosNum,
      views: viewsNum,
      name: (stats && stats.name) || dom.name,
      recentUploadHint: uploadFrequency,
    });

    const analyzeUrl = await buildAppUrl("/competitors", { channelUrl: dom.channelUrl });

    currentChannelUrl = channelUrl;

    if (settings.showToolbar) {
      renderToolbar({
        locale,
        subscribersNum,
        videosNum,
        health,
        analyzeUrl,
      });
    }

    if (settings.showVphBadges) {
      rafUpdate(() => {
        window.CreatorForgeVphBadges?.injectBadges(locale);
      });
    }

    if (settings.showChannelPanel) {
      renderUI(
        {
          name: (stats && stats.name) || dom.name,
          subscribersDisplay,
          videosDisplay,
          viewsDisplay,
          uploadFrequency,
        },
        health,
        analyzeUrl,
        locale,
        settings.panelPosition === "fixed"
      );
    }
  }

  window.CreatorForgeChannel = { run, SIDEBAR_ID, BADGE_ID };
})();
