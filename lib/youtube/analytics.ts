/**
 * YouTube Analytics API surface (requires OAuth).
 * Dashboard MVP uses Data API stats from `channels.ts` / `videos.ts`.
 */

export type YouTubeAnalyticsSummary = {
  watchTimeMinutes: number;
  averageViewDurationSeconds: number;
  impressions: number;
  clickThroughRate: number;
};

/** Returns true when OAuth analytics endpoints are wired. */
export function isAnalyticsAvailable(): boolean {
  return false;
}
