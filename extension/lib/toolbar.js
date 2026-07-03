/**
 * VidIQ-style compact toolbar — injected below YouTube masthead.
 */
(function initCreatorForgeToolbar(global) {
  if (global.__CF_TOOLBAR_LOADED__) return;
  global.__CF_TOOLBAR_LOADED__ = true;

  const { escapeHtml } = global.CreatorForgeExt;
  const TOOLBAR_ID = "creatorforge-toolbar";

  /**
   * @param {number} score
   */
  function healthClass(score) {
    if (score <= 40) return "cf-score--red";
    if (score <= 70) return "cf-score--yellow";
    return "cf-score--green";
  }

  function renderLogoMark() {
    return `
      <svg class="cf-toolbar-logo" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <defs>
          <linearGradient id="cf-toolbar-grad" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
            <stop stop-color="#8b5cf6"/>
            <stop offset="0.5" stop-color="#d946ef"/>
            <stop offset="1" stop-color="#fbbf24"/>
          </linearGradient>
        </defs>
        <rect width="32" height="32" rx="6" fill="url(#cf-toolbar-grad)"/>
        <path d="M9 22V10h4.2c2.4 0 3.9 1.3 3.9 3.2 0 1.4-.7 2.4-1.9 2.9l2.6 5.9h-2.5l-2.3-5.4H11.4V22H9zm2.4-7.4h1.7c1.1 0 1.7-.6 1.7-1.5s-.6-1.4-1.7-1.4h-1.7v2.9zM20.2 22l3.8-12h2.3L23.5 22h-3.3z" fill="white"/>
      </svg>
    `;
  }

  /**
   * @param {string} label
   * @param {string} value
   * @param {string} [extraClass]
   */
  function renderCompactPill(label, value, extraClass = "") {
    return `
      <span class="cf-toolbar-pill ${extraClass}">
        <span class="cf-toolbar-pill-label">${escapeHtml(label)}:</span>
        <span class="cf-toolbar-pill-value">${escapeHtml(value)}</span>
      </span>
    `;
  }

  /**
   * @param {{
   *   mode?: "default" | "channel" | "video";
   *   name?: string;
   *   subscribersDisplay?: string;
   *   videosDisplay?: string;
   *   avgViewsDisplay?: string;
   *   healthScore?: number;
   *   analyzeUrl?: string;
   * }} data
   * @param {string} locale
   */
  function renderToolbarHtml(data, locale) {
    const i18n = global.CreatorForgeI18n;
    const t = (key, vars) => i18n.t(key, locale, vars);
    const mode = data.mode || "default";

    let centerHtml = "";
    if (mode === "channel" || mode === "video") {
      const pills = [];
      if (data.subscribersDisplay) {
        pills.push(renderCompactPill(t("subsShort"), data.subscribersDisplay));
      }
      if (data.videosDisplay) {
        pills.push(renderCompactPill(t("videos"), data.videosDisplay));
      }
      if (data.avgViewsDisplay && mode === "channel") {
        pills.push(renderCompactPill(t("avgViews"), data.avgViewsDisplay));
      }
      if (data.healthScore != null) {
        const cls = healthClass(data.healthScore);
        pills.push(
          renderCompactPill(t("health"), String(data.healthScore), `cf-toolbar-pill--health ${cls}`)
        );
      }
      centerHtml = `<div class="cf-toolbar-center">${pills.join('<span class="cf-toolbar-divider" aria-hidden="true">|</span>')}</div>`;
    }

    const analyzeLink =
      data.analyzeUrl
        ? `<a class="cf-toolbar-btn cf-toolbar-btn--link" href="${escapeHtml(data.analyzeUrl)}" target="_blank" rel="noreferrer" title="${escapeHtml(t("fullAnalysis"))}">
            <span class="cf-toolbar-btn-icon" aria-hidden="true">📈</span>
            <span class="cf-toolbar-btn-text">${escapeHtml(t("trend"))}</span>
          </a>`
        : `<button type="button" class="cf-toolbar-btn" data-cf-action="trend" title="${escapeHtml(t("trend"))}">
            <span class="cf-toolbar-btn-icon" aria-hidden="true">📈</span>
            <span class="cf-toolbar-btn-text">${escapeHtml(t("trend"))}</span>
          </button>`;

    return `
      <div class="cf-toolbar" role="toolbar" aria-label="${escapeHtml(t("toolbarAria"))}">
        <div class="cf-toolbar-inner">
          <div class="cf-toolbar-left">
            ${renderLogoMark()}
            <span class="cf-toolbar-brand">${escapeHtml(t("creatorForge"))}</span>
            <span class="cf-toolbar-sep" aria-hidden="true"></span>
            <button type="button" class="cf-toolbar-btn cf-toolbar-btn--pill" data-cf-action="filters" title="${escapeHtml(t("filters"))}">
              <span class="cf-toolbar-btn-text">${escapeHtml(t("filters"))}</span>
              <span class="cf-toolbar-chevron" aria-hidden="true">▼</span>
            </button>
          </div>
          ${centerHtml}
          <div class="cf-toolbar-right">
            <button type="button" class="cf-toolbar-btn" data-cf-action="score" title="${escapeHtml(t("seoScore"))}">
              <span class="cf-toolbar-btn-icon" aria-hidden="true">📊</span>
              <span class="cf-toolbar-btn-text">${escapeHtml(t("score"))}</span>
            </button>
            <button type="button" class="cf-toolbar-btn" data-cf-action="vph" title="${escapeHtml(t("vph"))}">
              <span class="cf-toolbar-btn-icon" aria-hidden="true">👁</span>
              <span class="cf-toolbar-btn-text">${escapeHtml(t("vph"))}</span>
            </button>
            ${analyzeLink}
            <button type="button" class="cf-toolbar-btn" data-cf-action="settings" title="${escapeHtml(t("settings"))}">
              <span class="cf-toolbar-btn-icon" aria-hidden="true">⚙</span>
              <span class="cf-toolbar-btn-text">${escapeHtml(t("settings"))}</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  function getMountPoint() {
    const masthead = document.getElementById("masthead-container");
    if (masthead?.parentElement) {
      return { parent: masthead.parentElement, after: masthead };
    }
    const mastheadEl = document.querySelector("#masthead");
    if (mastheadEl?.parentElement) {
      return { parent: mastheadEl.parentElement, after: mastheadEl };
    }
    return { parent: document.body, after: null };
  }

  /**
   * @param {string} html
   */
  function mountToolbar(html) {
    let bar = document.getElementById(TOOLBAR_ID);
    const { parent, after } = getMountPoint();

    if (!bar) {
      bar = document.createElement("div");
      bar.id = TOOLBAR_ID;
      if (after?.nextSibling) {
        parent.insertBefore(bar, after.nextSibling);
      } else if (after) {
        parent.appendChild(bar);
      } else {
        document.body.insertBefore(bar, document.body.firstChild);
      }
    } else if (bar.parentElement !== parent) {
      if (after?.nextSibling) {
        parent.insertBefore(bar, after.nextSibling);
      } else {
        parent.appendChild(bar);
      }
    }

    if (bar.innerHTML !== html) {
      bar.innerHTML = html;
      bindActions(bar);
    }

    return bar;
  }

  /**
   * @param {HTMLElement} bar
   */
  function bindActions(bar) {
    bar.querySelectorAll("[data-cf-action]").forEach((btn) => {
      if (btn.dataset.cfBound) return;
      btn.dataset.cfBound = "1";
      btn.addEventListener("click", () => {
        const action = btn.getAttribute("data-cf-action");
        if (action === "settings" && typeof chrome !== "undefined" && chrome.runtime?.openOptionsPage) {
          chrome.runtime.openOptionsPage();
        } else if (action === "vph" && typeof chrome !== "undefined" && chrome.storage?.sync) {
          void chrome.storage.sync.get({ showVphBadges: true }).then((stored) => {
            void chrome.storage.sync.set({ showVphBadges: !stored.showVphBadges });
          });
        } else if (action === "score" && typeof chrome !== "undefined" && chrome.storage?.sync) {
          void chrome.storage.sync.get({ showSearchBadges: true }).then((stored) => {
            void chrome.storage.sync.set({ showSearchBadges: !stored.showSearchBadges });
          });
        }
      });
    });
  }

  function removeToolbar() {
    const bar = document.getElementById(TOOLBAR_ID);
    if (bar) bar.remove();
  }

  /**
   * @param {Parameters<typeof renderToolbarHtml>[0]} data
   * @param {string} [locale]
   */
  function render(data, locale) {
    const loc = locale || global.CreatorForgeI18n?.getLocale() || "it";
    const html = renderToolbarHtml(data, loc);
    return mountToolbar(html);
  }

  global.CreatorForgeToolbar = {
    TOOLBAR_ID,
    render,
    removeToolbar,
    renderToolbarHtml,
    healthClass,
  };
})(window);
