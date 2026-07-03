/** Public site URL used for metadata, OAuth redirects, and extension deep links. */
export function getSiteUrl(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (url) return url.replace(/\/$/, "");
  return "http://localhost:3000";
}

export const SITE_NAME = "CreatorForge";

export const BRAND_COLORS = {
  violet: "#7c3aed",
  fuchsia: "#d946ef",
  amber: "#fbbf24",
} as const;
