import { buildAppUrl } from "./lib/utils.js";

/** @type {typeof window.CreatorForgeI18n} */
const i18n = window.CreatorForgeI18n;

const siteUrlEl = document.getElementById("siteUrl");
const localeEl = document.getElementById("locale");
const apiKeyEl = document.getElementById("youtubeApiKey");
const showVideoPanelEl = document.getElementById("showVideoPanel");
const showInlineScoreEl = document.getElementById("showInlineScore");
const showChannelPanelEl = document.getElementById("showChannelPanel");
const showToolbarEl = document.getElementById("showToolbar");
const showVphBadgesEl = document.getElementById("showVphBadges");
const showSearchBadgesEl = document.getElementById("showSearchBadges");
const panelPositionEl = document.getElementById("panelPosition");
const saveBtn = document.getElementById("save");
const savedEl = document.getElementById("saved");
const loginLinkEl = document.getElementById("login-link");

/**
 * @param {string} locale
 */
function applyOptionsI18n(locale) {
  document.documentElement.lang = locale;
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (key) el.textContent = i18n.t(key, locale);
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (key && el instanceof HTMLInputElement) el.placeholder = i18n.t(key, locale);
  });
  panelPositionEl.querySelectorAll("option[data-i18n]").forEach((opt) => {
    const key = opt.getAttribute("data-i18n");
    if (key) opt.textContent = i18n.t(key, locale);
  });
  document.title = i18n.t("optionsTitle", locale);
}

async function load() {
  const stored = await chrome.storage.sync.get({
    siteUrl: "http://localhost:3000",
    locale: "",
    youtubeApiKey: "",
    showVideoPanel: true,
    showInlineScore: true,
    showChannelPanel: true,
    showToolbar: true,
    showChannelStatsBar: true,
    showVphBadges: true,
    showSearchBadges: true,
    panelPosition: "sidebar",
  });

  const locale = stored.locale || i18n.detectBrowserLocale();
  i18n.setLocale(locale);
  applyOptionsI18n(locale);

  siteUrlEl.value = stored.siteUrl;
  localeEl.value = locale;
  apiKeyEl.value = stored.youtubeApiKey;
  showVideoPanelEl.checked = stored.showVideoPanel !== false;
  showInlineScoreEl.checked = stored.showInlineScore !== false;
  showChannelPanelEl.checked = stored.showChannelPanel !== false;
  showToolbarEl.checked = stored.showToolbar !== false && stored.showChannelStatsBar !== false;
  showVphBadgesEl.checked = stored.showVphBadges !== false;
  showSearchBadgesEl.checked = stored.showSearchBadges !== false;
  panelPositionEl.value = stored.panelPosition === "fixed" ? "fixed" : "sidebar";

  loginLinkEl.href = await buildAppUrl("/login");
}

localeEl.addEventListener("change", () => {
  applyOptionsI18n(localeEl.value);
});

saveBtn.addEventListener("click", async () => {
  const locale = localeEl.value;
  await chrome.storage.sync.set({
    siteUrl: siteUrlEl.value.trim().replace(/\/$/, "") || "http://localhost:3000",
    locale,
    youtubeApiKey: apiKeyEl.value.trim(),
    showVideoPanel: showVideoPanelEl.checked,
    showInlineScore: showInlineScoreEl.checked,
    showChannelPanel: showChannelPanelEl.checked,
    showToolbar: showToolbarEl.checked,
    showChannelStatsBar: showToolbarEl.checked,
    showVphBadges: showVphBadgesEl.checked,
    showSearchBadges: showSearchBadgesEl.checked,
    panelPosition: panelPositionEl.value,
  });
  i18n.setLocale(locale);
  applyOptionsI18n(locale);
  savedEl.hidden = false;
  loginLinkEl.href = await buildAppUrl("/login");
  setTimeout(() => {
    savedEl.hidden = true;
  }, 2500);
});

void load();
