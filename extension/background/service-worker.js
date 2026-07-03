import { getSettings } from "../lib/utils.js";

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({
    siteUrl: "http://localhost:3000",
    locale: "en",
    youtubeApiKey: "",
    showVideoPanel: true,
    showInlineScore: true,
    showChannelPanel: true,
    showToolbar: true,
    showChannelStatsBar: true,
    showSearchBadges: true,
    showVphBadges: true,
    panelPosition: "sidebar",
  });
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "GET_SETTINGS") {
    void getSettings().then(sendResponse);
    return true;
  }
  return false;
});
