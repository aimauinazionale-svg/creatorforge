/** Resolves the public site URL for metadata, OAuth redirects, and billing. */
export function getSiteUrl(): string {
  const explicit =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (explicit) return explicit.replace(/\/$/, "");

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel.replace(/\/$/, "")}`;

  return "http://localhost:3000";
}

export const SITE_NAME = "Sparkroll";

export const BRAND_COLORS = {
  violet: "#7c3aed",
  fuchsia: "#d946ef",
  amber: "#fbbf24",
} as const;
