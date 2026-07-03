(function initCreatorForgeYouTubeVideo() {
  if (window.__CF_VIDEO_SCRIPT_LOADED__) return;
  window.__CF_VIDEO_SCRIPT_LOADED__ = true;

  const {
    buildAppUrl,
    log,
    getSettings,
    fetchVideoDetailsApi,
    fetchChannelStatsApi,
    updateMount,
    waitForElement,
    rafUpdate,
  } = window.CreatorForgeExt;

  const SIDEBAR_ID = "cf-video-sidebar";
  const BADGE_ID = "cf-video-badge";
  const MAX_RETRIES = 20;
  const RETRY_MS = 350;

  let currentVideoId = "";

  function getVideoId() {
    return new URLSearchParams(window.location.search).get("v");
  }

  function getSidebarParent() {
    const secondary =
      document.querySelector("ytd-watch-flexy #secondary") ||
      document.querySelector("#columns #secondary") ||
      document.querySelector("#secondary");
    return secondary;
  }

  function getBadgeParent() {
    return (
      document.querySelector("ytd-watch-metadata #title") ||
      document.querySelector("#title") ||
      document.querySelector("h1.ytd-watch-metadata")?.parentElement
    );
  }

  function isDomReady(data) {
    return data.title.length > 0 && data.title !== document.title.replace(/ - YouTube$/, "");
  }

  /**
   * @param {Awaited<ReturnType<typeof window.CreatorForgeDomParser.parseVideoFromDom>>} domData
   * @param {Awaited<ReturnType<typeof fetchVideoDetailsApi>>} apiData
   */
  function mergeVideoData(domData, apiData) {
    if (!apiData) return domData;

    let daysSinceUpload = domData.daysSinceUpload;
    if (apiData.uploadDate) {
      const parsed = Date.parse(apiData.uploadDate);
      if (!Number.isNaN(parsed)) {
        daysSinceUpload = Math.max(1, Math.floor((Date.now() - parsed) / 86400000));
      }
    }

    return {
      ...domData,
      title: apiData.title || domData.title,
      description: apiData.description || domData.description,
      tags: apiData.tags?.length ? apiData.tags : domData.tags,
      tagsEstimated: !apiData.tags?.length && domData.tagsEstimated,
      views: apiData.views ?? domData.views,
      likes: apiData.likes ?? domData.likes,
      channelName: apiData.channelName || domData.channelName,
      uploadDate: apiData.uploadDate || domData.uploadDate,
      daysSinceUpload,
      hasHashtags: domData.hasHashtags || /#\w+/.test(apiData.description || ""),
      hasTimestamps: domData.hasTimestamps || /\d{1,2}:\d{2}/.test(apiData.description || ""),
      hasLinks: domData.hasLinks || /https?:\/\//i.test(apiData.description || ""),
      source: "api",
    };
  }

  /**
   * @param {string} locale
   * @param {string} channelUrl
   * @param {string} channelName
   * @param {string} apiKey
   */
  async function renderVideoToolbar(locale, channelUrl, channelName, apiKey) {
    if (!window.CreatorForgeToolbar) return;

    let stats = null;
    if (apiKey && channelUrl) {
      try {
        stats = await fetchChannelStatsApi(channelUrl, apiKey);
      } catch {
        stats = null;
      }
    }

    const subscribersNum = stats?.subscribers ?? null;
    const videosNum = stats?.videos ?? null;
    const viewsNum = stats?.views ?? null;
    const name = stats?.name || channelName;

    const health = window.CreatorForgeSeoScorer.analyzeChannel({
      subscribers: subscribersNum,
      videos: videosNum,
      views: viewsNum,
      name,
      recentUploadHint: null,
    });

    const analyzeUrl = channelUrl
      ? await buildAppUrl("/competitors", { channelUrl })
      : await buildAppUrl("/competitors");

    const i18n = window.CreatorForgeI18n;

    window.CreatorForgeToolbar.render(
      {
        mode: "video",
        subscribersDisplay: subscribersNum != null ? i18n.formatCompact(subscribersNum, locale) : "—",
        videosDisplay: videosNum != null ? i18n.formatCompact(videosNum, locale) : "—",
        healthScore: health.overall,
        analyzeUrl,
      },
      locale
    );
  }

  /**
   * @param {string} videoId
   * @param {Awaited<ReturnType<typeof window.CreatorForgeDomParser.parseVideoFromDom>>} data
   * @param {Awaited<ReturnType<typeof window.CreatorForgeSeoScorer.analyzeVideo>>} analysis
   * @param {string} locale
   */
  async function renderUI(videoId, data, analysis, locale) {
    const settings = await getSettings();
    const links = {
      seoLab: await buildAppUrl("/seo-lab", { videoId, title: data.title }),
      aiAssistant: await buildAppUrl("/ai-assistant", { videoId, title: data.title }),
      thumbnail: await buildAppUrl("/thumbnail-analyzer", { videoId, title: data.title }),
    };

    const useFixed = settings.panelPosition === "fixed";

    rafUpdate(() => {
      if (settings.showVideoPanel) {
        const html = window.CreatorForgePanel.renderVideoPanel(data, analysis, links, locale);

        if (useFixed) {
          const root = window.CreatorForgeExt.ensureRoot();
          root.classList.add("cf-root--fixed");
          root.style.display = "block";
          root.innerHTML = `<div id="${SIDEBAR_ID}" class="cf-mount">${html}</div>`;
          window.CreatorForgePanel.setupTabInteractions(root);
        } else {
          const mount = updateMount(SIDEBAR_ID, html, getSidebarParent, "prepend");
          if (mount) {
            window.CreatorForgePanel.setupTabInteractions(mount);
          }
        }
      }

      if (settings.showInlineScore) {
        const badgeHtml = window.CreatorForgePanel.renderInlineBadge(analysis.overall, locale, "seo");
        updateMount(BADGE_ID, badgeHtml, getBadgeParent, "append");
      }
    });
  }

  async function run(retryCount = 0) {
    const videoId = getVideoId();
    if (!videoId) return;

    const settings = await getSettings();
    const locale = settings.locale;
    await window.CreatorForgeI18n?.loadLocaleFromStorage?.();

    if (!settings.showVideoPanel && !settings.showInlineScore && !settings.showToolbar) return;

    if (videoId !== currentVideoId) {
      currentVideoId = "";
    }

    await waitForElement("ytd-watch-flexy, #primary", 6000);

    if (videoId === currentVideoId && document.getElementById(SIDEBAR_ID)) {
      return;
    }

    const domData = await window.CreatorForgeDomParser.parseVideoFromDom();

    if (!isDomReady(domData) && retryCount < MAX_RETRIES) {
      log("Video DOM not ready, retry", retryCount + 1);
      setTimeout(() => void run(retryCount + 1), RETRY_MS);
      return;
    }

    let apiData = null;
    if (settings.youtubeApiKey) {
      try {
        apiData = await fetchVideoDetailsApi(videoId, settings.youtubeApiKey);
      } catch {
        apiData = null;
      }
    }

    const data = mergeVideoData(domData, apiData);
    const analysis = window.CreatorForgeSeoScorer.analyzeVideo(data);

    currentVideoId = videoId;
    log("Rendering video panel, score:", analysis.overall);

    if (settings.showToolbar) {
      const channelUrl = window.CreatorForgeDomParser.parseVideoChannelUrlFromDom();
      await renderVideoToolbar(locale, channelUrl, data.channelName, settings.youtubeApiKey);
    }

    await renderUI(videoId, data, analysis, locale);
  }

  window.CreatorForgeVideo = { run, SIDEBAR_ID, BADGE_ID };
})();
