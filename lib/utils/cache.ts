/** Cache TTL values in seconds (Next.js `fetch` revalidate). */
export const CACHE_TTL = {
  /** Channel stats — 6 hours */
  CHANNEL_STATS: 6 * 60 * 60,
  /** Video metrics — 1 hour */
  VIDEO_METRICS: 60 * 60,
  /** SEO / keyword data — 24 hours */
  SEO_DATA: 24 * 60 * 60,
  /** Comment threads — 30 minutes */
  COMMENTS: 30 * 60,
  /** Autocomplete suggestions — 1 hour */
  KEYWORD_SUGGESTIONS: 60 * 60,
  /** Cached AI suggestions — 7 days */
  AI_SUGGESTIONS: 7 * 24 * 60 * 60,
} as const;

/** Builds Next.js fetch options with ISR revalidation. */
export function revalidateOptions(seconds: number): { next: { revalidate: number } } {
  return { next: { revalidate: seconds } };
}
