/**
 * YouTube homepage — VPH badges on feed thumbnails.
 */
(function initCreatorForgeYouTubeHome() {
  if (window.__CF_HOME_SCRIPT_LOADED__) return;
  window.__CF_HOME_SCRIPT_LOADED__ = true;

  const { getSettings, log, rafUpdate } = window.CreatorForgeExt;

  async function run() {
    const settings = await getSettings();
    await window.CreatorForgeI18n?.loadLocaleFromStorage?.();

    if (settings.showToolbar && window.CreatorForgeToolbar) {
      window.CreatorForgeToolbar.render({ mode: "default" }, settings.locale);
    }

    if (!settings.showVphBadges) return;

    rafUpdate(() => {
      window.CreatorForgeVphBadges?.injectBadges(settings.locale);
    });

    log("Home VPH badges processed");
  }

  window.CreatorForgeHome = { run };
})();
