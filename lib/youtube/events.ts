export const YOUTUBE_CONNECTION_CHANGED_EVENT = "youtube-connection-changed";

/** Notifies dashboard widgets to reload channel stats after connect/disconnect. */
export function notifyYouTubeConnectionChanged(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(YOUTUBE_CONNECTION_CHANGED_EVENT));
  }
}
