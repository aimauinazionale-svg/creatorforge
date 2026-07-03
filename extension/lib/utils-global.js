/** Shared helpers exposed globally for content scripts (non-module). */

(function initCreatorForgeExtensionUtils(global) {
  if (global.__CF_UTILS_LOADED__) return;
  global.__CF_UTILS_LOADED__ = true;

  const DEFAULT_SITE_URL = "http://localhost:3000";
  const DEFAULT_LOCALE = "it";
  const ROOT_ID = "creatorforge-root";
  const LOG_PREFIX = "[CreatorForge]";

  let debugEnabled = false;

  async function loadDebugFlag() {
    try {
      const stored = await chrome.storage.sync.get({ debug: false });
      debugEnabled = Boolean(stored.debug);
    } catch {
      debugEnabled = false;
    }
  }

  void loadDebugFlag();

  /** @param {...unknown} args */
  function log(...args) {
    if (debugEnabled) {
      console.log(LOG_PREFIX, ...args);
    }
  }

  function detectBrowserLocale() {
    const lang = (navigator.language || "it").slice(0, 2).toLowerCase();
    const supported = ["en", "it", "es", "de", "fr", "pt", "ru", "ja", "zh"];
    return supported.includes(lang) ? lang : DEFAULT_LOCALE;
  }

  async function getSettings() {
    const stored = await chrome.storage.sync.get({
      siteUrl: DEFAULT_SITE_URL,
      locale: "",
      youtubeApiKey: "",
      debug: false,
      showVideoPanel: true,
      showChannelPanel: true,
      showToolbar: true,
      showChannelStatsBar: true,
      showInlineScore: true,
      showSearchBadges: true,
      showVphBadges: true,
      panelPosition: "sidebar",
    });
    debugEnabled = Boolean(stored.debug);
    const locale = stored.locale
      ? String(stored.locale)
      : global.CreatorForgeI18n?.detectBrowserLocale?.() || detectBrowserLocale();
    if (global.CreatorForgeI18n) {
      global.CreatorForgeI18n.setLocale(locale);
    }
    return {
      siteUrl: String(stored.siteUrl || DEFAULT_SITE_URL).replace(/\/$/, ""),
      locale,
      youtubeApiKey: String(stored.youtubeApiKey || ""),
      showVideoPanel: stored.showVideoPanel !== false,
      showChannelPanel: stored.showChannelPanel !== false,
      showToolbar: stored.showToolbar !== false && stored.showChannelStatsBar !== false,
      showInlineScore: stored.showInlineScore !== false,
      showSearchBadges: stored.showSearchBadges !== false,
      showVphBadges: stored.showVphBadges !== false,
      panelPosition: stored.panelPosition === "fixed" ? "fixed" : "sidebar",
    };
  }

  async function buildAppUrl(path, params) {
    const { siteUrl, locale } = await getSettings();
    const normalized = path.startsWith("/") ? path : `/${path}`;
    const url = new URL(`/${locale}${normalized}`, siteUrl);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value) url.searchParams.set(key, value);
      }
    }
    return url.toString();
  }

  function parseCompactNumber(text) {
    if (!text) return null;
    const cleaned = text.trim().replace(/,/g, "").replace(/\s/g, "");
    const match = cleaned.match(/^([\d.]+)\s*([KMB])?/i);
    if (!match) return null;
    const base = parseFloat(match[1]);
    if (Number.isNaN(base)) return null;
    const suffix = (match[2] || "").toUpperCase();
    if (suffix === "K") return Math.round(base * 1000);
    if (suffix === "M") return Math.round(base * 1000000);
    if (suffix === "B") return Math.round(base * 1000000000);
    return Math.round(base);
  }

  function formatNumber(text) {
    const n = parseCompactNumber(text);
    if (n == null) return text;
    return new Intl.NumberFormat("en-US").format(n);
  }

  /**
   * @param {string} videoId
   * @param {string} apiKey
   */
  async function fetchVideoDetailsApi(videoId, apiKey) {
    if (!apiKey || !videoId) return null;

    const params = new URLSearchParams({
      part: "snippet,statistics",
      id: videoId,
      key: apiKey,
    });

    const res = await fetch(`https://www.googleapis.com/youtube/v3/videos?${params}`);
    if (!res.ok) return null;

    const data = await res.json();
    const item = data.items?.[0];
    if (!item) return null;

    const snippet = item.snippet || {};
    const stats = item.statistics || {};

    return {
      title: snippet.title || "",
      description: snippet.description || "",
      tags: snippet.tags || [],
      channelName: snippet.channelTitle || "",
      uploadDate: snippet.publishedAt || null,
      views: stats.viewCount ? Number(stats.viewCount) : null,
      likes: stats.likeCount ? Number(stats.likeCount) : null,
      source: "api",
    };
  }

  async function fetchChannelStatsApi(channelUrl, apiKey) {
    if (!apiKey) return null;

    let handle = null;
    let channelId = null;

    try {
      const url = new URL(channelUrl);
      const parts = url.pathname.split("/").filter(Boolean);
      if (parts[0] && parts[0].startsWith("@")) handle = parts[0].slice(1);
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
    const item = data.items && data.items[0];
    if (!item) return null;

    const stats = item.statistics || {};

    return {
      name: (item.snippet && item.snippet.title) || "Channel",
      subscribers: stats.subscriberCount ? Number(stats.subscriberCount) : null,
      videos: stats.videoCount ? Number(stats.videoCount) : null,
      views: stats.viewCount ? Number(stats.viewCount) : null,
      source: "api",
    };
  }

  /** Single stable root container — appended once, never removed on SPA nav. */
  function ensureRoot() {
    let root = document.getElementById(ROOT_ID);
    if (!root) {
      root = document.createElement("div");
      root.id = ROOT_ID;
      root.setAttribute("data-cf-root", "true");
      document.body.appendChild(root);
      log("Root container mounted");
    }
    return root;
  }

  /**
   * Get or create a mount point inside YouTube DOM.
   * @param {string} id
   * @param {() => HTMLElement | null} getParent
   * @param {"prepend" | "append"} [position]
   */
  function ensureMount(id, getParent, position = "prepend") {
    let mount = document.getElementById(id);
    if (mount) return mount;

    const parent = getParent();
    if (!parent) return null;

    mount = document.createElement("div");
    mount.id = id;
    mount.className = "cf-mount";

    if (position === "prepend") {
      parent.insertBefore(mount, parent.firstChild);
    } else {
      parent.appendChild(mount);
    }

    log("Mount created:", id);
    return mount;
  }

  /**
   * Update mount content without recreating the mount element.
   * @param {string} id
   * @param {string} html
   * @param {() => HTMLElement | null} getParent
   * @param {"prepend" | "append"} [position]
   */
  function updateMount(id, html, getParent, position = "prepend") {
    let mount = document.getElementById(id);
    if (!mount) {
      mount = ensureMount(id, getParent, position);
    }
    if (!mount) return null;

    if (mount.innerHTML !== html) {
      mount.innerHTML = html;
    }
    return mount;
  }

  /** Remove page-specific mounts but keep #creatorforge-root. */
  function clearPageMounts() {
    const ids = [
      "cf-video-sidebar",
      "cf-video-badge",
      "cf-channel-sidebar",
      "cf-channel-badge",
    ];
    if (global.CreatorForgeToolbar) {
      global.CreatorForgeToolbar.removeToolbar();
    }
    if (global.CreatorForgeVphBadges) {
      global.CreatorForgeVphBadges.removeAll();
    }
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) el.remove();
    }
    document.querySelectorAll(".cf-thumb-badge-wrap").forEach((el) => el.remove());
    document.querySelectorAll("[data-cf-score-processed]").forEach((el) => el.removeAttribute("data-cf-score-processed"));
    const root = document.getElementById(ROOT_ID);
    if (root) {
      root.innerHTML = "";
      root.classList.remove("cf-root--fixed");
      root.style.display = "none";
    }
    log("Page mounts cleared");
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /**
   * Wait for a DOM element with timeout.
   * @param {string} selector
   * @param {number} [timeoutMs]
   */
  function waitForElement(selector, timeoutMs = 8000) {
    return new Promise((resolve) => {
      const existing = document.querySelector(selector);
      if (existing) {
        resolve(existing);
        return;
      }

      const observer = new MutationObserver(() => {
        const el = document.querySelector(selector);
        if (el) {
          observer.disconnect();
          resolve(el);
        }
      });

      observer.observe(document.documentElement, { childList: true, subtree: true });

      setTimeout(() => {
        observer.disconnect();
        resolve(document.querySelector(selector));
      }, timeoutMs);
    });
  }

  /**
   * Run callback inside requestAnimationFrame for stable DOM updates.
   * @param {() => void} fn
   */
  function rafUpdate(fn) {
    requestAnimationFrame(() => {
      requestAnimationFrame(fn);
    });
  }

  global.CreatorForgeExt = {
    ROOT_ID,
    getSettings,
    buildAppUrl,
    parseCompactNumber,
    formatNumber,
    fetchChannelStatsApi,
    fetchVideoDetailsApi,
    ensureRoot,
    ensureMount,
    updateMount,
    clearPageMounts,
    escapeHtml,
    log,
    waitForElement,
    rafUpdate,
  };
})(window);
