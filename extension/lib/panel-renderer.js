/**
 * VidIQ-style panel HTML builder — CreatorForge branding.
 */
(function initCreatorForgePanelRenderer() {
  if (window.__CF_PANEL_RENDERER_LOADED__) return;
  window.__CF_PANEL_RENDERER_LOADED__ = true;

  const { escapeHtml } = window.CreatorForgeExt;

  /** @param {string} key @param {string} [locale] @param {Record<string, string | number>} [vars] */
  function tr(key, locale, vars) {
    return window.CreatorForgeI18n?.t(key, locale, vars) || key;
  }

  /**
   * @param {number} score
   */
  function scoreClass(score) {
    if (score <= 40) return "cf-score--red";
    if (score <= 70) return "cf-score--yellow";
    return "cf-score--green";
  }

  /**
   * @param {number} score
   * @param {string} [label]
   * @param {"sm" | "md" | "lg"} [size]
   */
  function renderScoreCircle(score, label = "SEO", size = "md") {
    const r = size === "lg" ? 44 : size === "sm" ? 28 : 36;
    const circumference = 2 * Math.PI * r;
    const offset = circumference - (score / 100) * circumference;
    const colorClass = scoreClass(score);
    const sizeClass = size === "lg" ? "cf-circle--lg" : size === "sm" ? "cf-circle--sm" : "";

    return `
      <div class="cf-circle ${sizeClass} ${colorClass}" aria-label="${escapeHtml(label)} score ${score}">
        <svg viewBox="0 0 100 100" class="cf-circle-svg" aria-hidden="true">
          <circle class="cf-circle-bg" cx="50" cy="50" r="${r}" />
          <circle class="cf-circle-fill" cx="50" cy="50" r="${r}"
            stroke-dasharray="${circumference}"
            stroke-dashoffset="${offset}" />
        </svg>
        <div class="cf-circle-value">
          <span class="cf-circle-number">${score}</span>
          ${size !== "sm" ? `<span class="cf-circle-label">${escapeHtml(label)}</span>` : ""}
        </div>
      </div>
    `;
  }

  /**
   * @param {string} label
   * @param {number} score
   * @param {number} [weight]
   */
  function renderCategoryBar(label, score, weight, locale) {
    const colorClass = scoreClass(score);
    return `
      <div class="cf-cat-bar">
        <div class="cf-cat-bar-header">
          <span class="cf-cat-bar-label">${escapeHtml(label)}</span>
          <span class="cf-cat-bar-score ${colorClass}">${score}</span>
        </div>
        <div class="cf-cat-bar-track">
          <div class="cf-cat-bar-fill ${colorClass}" style="width:${score}%"></div>
        </div>
        ${weight != null ? `<span class="cf-cat-bar-weight">${weight}% ${escapeHtml(tr("weight", locale))}</span>` : ""}
      </div>
    `;
  }

  /**
   * @param {{ pass: boolean; label: string; display: string }} item
   */
  function renderChecklistItem(item) {
    const icon = item.pass ? "✓" : "✗";
    return `
      <div class="cf-checklist-item ${item.pass ? "cf-checklist-item--pass" : "cf-checklist-item--fail"}">
        <span class="cf-checklist-icon" aria-hidden="true">${icon}</span>
        <div class="cf-checklist-body">
          <span class="cf-checklist-label">${escapeHtml(item.label)}</span>
          <span class="cf-checklist-value">${escapeHtml(item.display)}</span>
        </div>
      </div>
    `;
  }

  function renderLogoMark() {
    return `
      <svg class="cf-logo-mark" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <defs>
          <linearGradient id="cf-grad" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
            <stop stop-color="#8b5cf6"/>
            <stop offset="0.5" stop-color="#d946ef"/>
            <stop offset="1" stop-color="#fbbf24"/>
          </linearGradient>
        </defs>
        <rect width="32" height="32" rx="8" fill="url(#cf-grad)"/>
        <path d="M9 22V10h4.2c2.4 0 3.9 1.3 3.9 3.2 0 1.4-.7 2.4-1.9 2.9l2.6 5.9h-2.5l-2.3-5.4H11.4V22H9zm2.4-7.4h1.7c1.1 0 1.7-.6 1.7-1.5s-.6-1.4-1.7-1.4h-1.7v2.9zM20.2 22l3.8-12h2.3L23.5 22h-3.3z" fill="white"/>
      </svg>
    `;
  }

  function renderPanelHeader(title = "CreatorForge") {
    return `
      <div class="cf-panel-header">
        <div class="cf-panel-brand">
          ${renderLogoMark()}
          <span class="cf-panel-brand-text">${escapeHtml(title)}</span>
        </div>
      </div>
    `;
  }

  /**
   * @param {Array<{ id: string; label: string }>} tabs
   * @param {string} activeId
   */
  function renderTabs(tabs, activeId) {
    const buttons = tabs
      .map(
        (t) =>
          `<button type="button" class="cf-tab${t.id === activeId ? " cf-tab--active" : ""}" data-tab="${t.id}">${escapeHtml(t.label)}</button>`
      )
      .join("");
    return `<div class="cf-tabs" role="tablist">${buttons}</div>`;
  }

  /**
   * @param {Awaited<ReturnType<typeof window.CreatorForgeSeoScorer.analyzeVideo>>} analysis
   */
  function renderOverviewTab(analysis, locale) {
    const cats = analysis.categories;
    const bars = [
      renderCategoryBar(cats.title.label, cats.title.score, cats.title.weight, locale),
      renderCategoryBar(cats.description.label, cats.description.score, cats.description.weight, locale),
      renderCategoryBar(cats.tags.label, cats.tags.score, cats.tags.weight, locale),
      renderCategoryBar(cats.engagement.label, cats.engagement.score, cats.engagement.weight, locale),
      renderCategoryBar(cats.metadata.label, cats.metadata.score, cats.metadata.weight, locale),
    ].join("");

    return `
      <div class="cf-tab-panel" data-panel="overview">
        <div class="cf-overview-hero">
          ${renderScoreCircle(analysis.overall, tr("seoScore", locale), "lg")}
        </div>
        <div class="cf-cat-bars">${bars}</div>
      </div>
    `;
  }

  /**
   * @param {Awaited<ReturnType<typeof window.CreatorForgeDomParser.parseVideoFromDom>>} data
   * @param {Awaited<ReturnType<typeof window.CreatorForgeSeoScorer.analyzeVideo>>} analysis
   */
  function renderTitleTab(data, analysis, locale) {
    const titleLen = data.title?.length || 0;
    const score = analysis.categories.title.score;
    return `
      <div class="cf-tab-panel" data-panel="title">
        <div class="cf-section-score">
          ${renderScoreCircle(score, tr("title", locale), "md")}
        </div>
        <div class="cf-metric-row">
          <span class="cf-metric-label">${escapeHtml(tr("characters", locale))}</span>
          <span class="cf-metric-value">${titleLen} ${escapeHtml(tr("idealChars", locale))}</span>
        </div>
        <div class="cf-metric-row">
          <span class="cf-metric-label">${escapeHtml(tr("keywords", locale))}</span>
          <span class="cf-metric-value">${analysis.categories.title.details.keywords}</span>
        </div>
        <div class="cf-metric-row">
          <span class="cf-metric-label">${escapeHtml(tr("powerWords", locale))}</span>
          <span class="cf-metric-value">${analysis.categories.title.details.powerHits}</span>
        </div>
        <p class="cf-preview-text">${escapeHtml(data.title)}</p>
      </div>
    `;
  }

  /**
   * @param {Awaited<ReturnType<typeof window.CreatorForgeDomParser.parseVideoFromDom>>} data
   * @param {Awaited<ReturnType<typeof window.CreatorForgeSeoScorer.analyzeVideo>>} analysis
   */
  function renderDescriptionTab(data, analysis, locale) {
    const descLen = data.description?.length || 0;
    const score = analysis.categories.description.score;
    const preview = (data.description || "").slice(0, 280);
    const yesNo = (v) => (v ? tr("yes", locale) : tr("no", locale));
    return `
      <div class="cf-tab-panel" data-panel="description">
        <div class="cf-section-score">
          ${renderScoreCircle(score, tr("description", locale), "md")}
        </div>
        <div class="cf-metric-row">
          <span class="cf-metric-label">${escapeHtml(tr("length", locale))}</span>
          <span class="cf-metric-value">${descLen} ${escapeHtml(tr("chars", locale))}</span>
        </div>
        <div class="cf-metric-row">
          <span class="cf-metric-label">${escapeHtml(tr("timestamps", locale))}</span>
          <span class="cf-metric-value">${escapeHtml(yesNo(data.hasTimestamps))}</span>
        </div>
        <div class="cf-metric-row">
          <span class="cf-metric-label">${escapeHtml(tr("links", locale))}</span>
          <span class="cf-metric-value">${escapeHtml(yesNo(data.hasLinks))}</span>
        </div>
        <div class="cf-metric-row">
          <span class="cf-metric-label">${escapeHtml(tr("hashtags", locale))}</span>
          <span class="cf-metric-value">${escapeHtml(yesNo(data.hasHashtags))}</span>
        </div>
        ${preview ? `<p class="cf-preview-text cf-preview-text--desc">${escapeHtml(preview)}${descLen > 280 ? "…" : ""}</p>` : ""}
      </div>
    `;
  }

  /**
   * @param {Awaited<ReturnType<typeof window.CreatorForgeDomParser.parseVideoFromDom>>} data
   * @param {Awaited<ReturnType<typeof window.CreatorForgeSeoScorer.analyzeVideo>>} analysis
   */
  function renderTagsTab(data, analysis, locale) {
    const tags = data.tags || [];
    const score = analysis.categories.tags.score;
    const tagPills = tags
      .slice(0, 20)
      .map((t) => `<span class="cf-tag-pill">${escapeHtml(t)}</span>`)
      .join("");
    const estimated = data.tagsEstimated ? `<span class="cf-tag-estimated">${escapeHtml(tr("estimatedFromTitle", locale))}</span>` : "";

    return `
      <div class="cf-tab-panel" data-panel="tags">
        <div class="cf-section-score">
          ${renderScoreCircle(score, tr("tags", locale), "md")}
        </div>
        <div class="cf-metric-row">
          <span class="cf-metric-label">${escapeHtml(tr("tagCount", locale))}</span>
          <span class="cf-metric-value">${tags.length} ${estimated}</span>
        </div>
        <div class="cf-metric-row">
          <span class="cf-metric-label">${escapeHtml(tr("relevanceHits", locale))}</span>
          <span class="cf-metric-value">${analysis.categories.tags.details.relevanceHits}</span>
        </div>
        ${tagPills ? `<div class="cf-tag-list">${tagPills}</div>` : `<p class="cf-empty-hint">${escapeHtml(tr("addApiKeyForTags", locale))}</p>`}
      </div>
    `;
  }

  /**
   * @param {Awaited<ReturnType<typeof window.CreatorForgeDomParser.parseVideoFromDom>>} data
   * @param {Awaited<ReturnType<typeof window.CreatorForgeSeoScorer.analyzeVideo>>} analysis
   */
  function renderSocialTab(data, analysis, locale) {
    const eng = analysis.categories.engagement;
    const likeRatio = eng.details.likeRatio;
    const likePct = likeRatio != null ? `${(likeRatio * 100).toFixed(2)}%` : "—";
    const viewsDisplay = data.views != null ? new Intl.NumberFormat(locale).format(data.views) : data.viewsText || "—";
    const likesDisplay = data.likes != null ? new Intl.NumberFormat(locale).format(data.likes) : data.likesText || "—";

    return `
      <div class="cf-tab-panel" data-panel="social">
        <div class="cf-section-score">
          ${renderScoreCircle(eng.score, tr("social", locale), "md")}
        </div>
        <div class="cf-stat-grid">
          <div class="cf-stat-card">
            <span class="cf-stat-card-value">${escapeHtml(viewsDisplay)}</span>
            <span class="cf-stat-card-label">${escapeHtml(tr("views", locale))}</span>
          </div>
          <div class="cf-stat-card">
            <span class="cf-stat-card-value">${escapeHtml(likesDisplay)}</span>
            <span class="cf-stat-card-label">${escapeHtml(tr("likes", locale))}</span>
          </div>
          <div class="cf-stat-card">
            <span class="cf-stat-card-value">${escapeHtml(likePct)}</span>
            <span class="cf-stat-card-label">${escapeHtml(tr("likeRatio", locale))}</span>
          </div>
          ${
            eng.details.viewsPerDay != null
              ? `<div class="cf-stat-card">
            <span class="cf-stat-card-value">${Math.round(eng.details.viewsPerDay).toLocaleString(locale)}</span>
            <span class="cf-stat-card-label">${escapeHtml(tr("viewsPerDay", locale))}</span>
          </div>`
              : ""
          }
        </div>
        <p class="cf-channel-line">${escapeHtml(data.channelName)}</p>
      </div>
    `;
  }

  /**
   * @param {Awaited<ReturnType<typeof window.CreatorForgeSeoScorer.analyzeVideo>>} analysis
   */
  function renderChecklistTab(analysis) {
    const items = analysis.metrics.map(renderChecklistItem).join("");
    return `
      <div class="cf-tab-panel" data-panel="checklist">
        <div class="cf-checklist">${items}</div>
      </div>
    `;
  }

  /**
   * @param {string[]} tips
   */
  function renderTipsTab(tips) {
    const list = tips.map((t) => `<li>${escapeHtml(t)}</li>`).join("");
    return `
      <div class="cf-tab-panel" data-panel="tips">
        <ul class="cf-tips">${list}</ul>
      </div>
    `;
  }

  /**
   * @param {{ seoLab: string; aiAssistant: string; thumbnail: string }} links
   */
  function renderActionLinks(links, locale) {
    return `
      <div class="cf-actions">
        <a class="cf-action-btn cf-action-btn--primary" href="${links.seoLab}" target="_blank" rel="noreferrer">${escapeHtml(tr("seoLab", locale))}</a>
        <a class="cf-action-btn" href="${links.aiAssistant}" target="_blank" rel="noreferrer">${escapeHtml(tr("aiAssistant", locale))}</a>
        <a class="cf-action-btn" href="${links.thumbnail}" target="_blank" rel="noreferrer">${escapeHtml(tr("thumbnail", locale))}</a>
      </div>
    `;
  }

  /**
   * @param {Awaited<ReturnType<typeof window.CreatorForgeDomParser.parseVideoFromDom>>} data
   * @param {Awaited<ReturnType<typeof window.CreatorForgeSeoScorer.analyzeVideo>>} analysis
   * @param {{ seoLab: string; aiAssistant: string; thumbnail: string }} links
   */
  function renderVideoPanel(data, analysis, links, locale = "it") {
    const tabs = [
      { id: "overview", label: tr("seo", locale) },
      { id: "title", label: tr("title", locale) },
      { id: "description", label: tr("desc", locale) },
      { id: "tags", label: tr("tags", locale) },
      { id: "social", label: tr("social", locale) },
      { id: "checklist", label: tr("checks", locale) },
      { id: "tips", label: tr("tips", locale) },
    ];

    return `
      <div class="cf-panel cf-panel--video" role="complementary" aria-label="${escapeHtml(tr("videoSeoPanel", locale))}">
        ${renderPanelHeader(tr("creatorForge", locale))}
        ${renderTabs(tabs, "overview")}
        <div class="cf-panel-body">
          ${renderOverviewTab(analysis, locale)}
          ${renderTitleTab(data, analysis, locale)}
          ${renderDescriptionTab(data, analysis, locale)}
          ${renderTagsTab(data, analysis, locale)}
          ${renderSocialTab(data, analysis, locale)}
          ${renderChecklistTab(analysis)}
          ${renderTipsTab(analysis.tips)}
        </div>
        ${renderActionLinks(links, locale)}
      </div>
    `;
  }

  /**
   * @param {{ name: string; subscribersDisplay: string; videosDisplay: string; viewsDisplay: string | null; uploadFrequency: string | null }} data
   * @param {Awaited<ReturnType<typeof window.CreatorForgeSeoScorer.analyzeChannel>>} health
   * @param {string} analyzeUrl
   */
  function renderChannelPanel(data, health, analyzeUrl, locale = "it") {
    const uploadLabel =
      data.uploadFrequency === "active"
        ? tr("uploadActive", locale)
        : data.uploadFrequency === "inactive"
          ? tr("uploadInactive", locale)
          : tr("uploadUnknown", locale);

    const avgViews =
      health.avgViews != null
        ? window.CreatorForgeI18n.formatCompact(health.avgViews, locale)
        : "—";

    return `
      <div class="cf-panel cf-panel--channel" role="complementary" aria-label="${escapeHtml(tr("channelInsights", locale))}">
        ${renderPanelHeader(tr("channel", locale))}
        <div class="cf-panel-body">
          <div class="cf-overview-hero">
            ${renderScoreCircle(health.overall, tr("health", locale), "lg")}
            <h3 class="cf-channel-name">${escapeHtml(data.name)}</h3>
          </div>
          <div class="cf-stat-grid cf-stat-grid--channel">
            <div class="cf-stat-card">
              <span class="cf-stat-card-value">${escapeHtml(data.subscribersDisplay)}</span>
              <span class="cf-stat-card-label">${escapeHtml(tr("subscribers", locale))}</span>
            </div>
            <div class="cf-stat-card">
              <span class="cf-stat-card-value">${escapeHtml(data.videosDisplay)}</span>
              <span class="cf-stat-card-label">${escapeHtml(tr("videos", locale))}</span>
            </div>
            <div class="cf-stat-card">
              <span class="cf-stat-card-value">${escapeHtml(avgViews)}</span>
              <span class="cf-stat-card-label">${escapeHtml(tr("avgViews", locale))}</span>
            </div>
            ${
              data.viewsDisplay
                ? `<div class="cf-stat-card">
              <span class="cf-stat-card-value">${escapeHtml(data.viewsDisplay)}</span>
              <span class="cf-stat-card-label">${escapeHtml(tr("totalViews", locale))}</span>
            </div>`
                : ""
            }
          </div>
          <div class="cf-metric-row">
            <span class="cf-metric-label">${escapeHtml(tr("uploadActivity", locale))}</span>
            <span class="cf-metric-value">${escapeHtml(uploadLabel)}</span>
          </div>
          ${health.tips.length > 0 ? `<ul class="cf-tips">${health.tips.map((tip) => `<li>${escapeHtml(tip)}</li>`).join("")}</ul>` : ""}
        </div>
        <div class="cf-actions">
          <a class="cf-action-btn cf-action-btn--primary" href="${analyzeUrl}" target="_blank" rel="noreferrer">${escapeHtml(tr("analyzeChannel", locale))}</a>
        </div>
      </div>
    `;
  }

  /**
   * @param {number} score
   */
  function renderInlineBadge(score, locale = "it", labelKey = "seo") {
    const colorClass = scoreClass(score);
    const label = tr(labelKey, locale);
    return `
      <div class="cf-inline-badge cf-inline-badge--compact ${colorClass}" title="CreatorForge ${escapeHtml(label)}: ${score}/100" aria-label="${escapeHtml(label)} score ${score}">
        <span class="cf-inline-badge-score">${score}</span>
      </div>
    `;
  }

  /**
   * @param {number} score
   */
  function renderThumbnailBadge(score) {
    const colorClass = scoreClass(score);
    return `<span class="cf-thumb-badge ${colorClass}" title="CreatorForge SEO: ${score}">${score}</span>`;
  }

  /**
   * @param {HTMLElement} container
   */
  function setupTabInteractions(container) {
    const tabs = container.querySelectorAll(".cf-tab");
    const panels = container.querySelectorAll(".cf-tab-panel");

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const id = tab.getAttribute("data-tab");
        if (!id) return;

        tabs.forEach((t) => t.classList.toggle("cf-tab--active", t === tab));
        panels.forEach((p) => {
          p.style.display = p.getAttribute("data-panel") === id ? "block" : "none";
        });
      });
    });

    panels.forEach((p) => {
      p.style.display = p.getAttribute("data-panel") === "overview" ? "block" : "none";
    });
  }

  window.CreatorForgePanel = {
    scoreClass,
    renderScoreCircle,
    renderVideoPanel,
    renderChannelPanel,
    renderInlineBadge,
    renderThumbnailBadge,
    setupTabInteractions,
  };
})();
