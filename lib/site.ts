const LOCALHOST_FALLBACK = "http://localhost:3000";

function normalizeUrl(url: string): string {
  return url.trim().replace(/\/$/, "");
}

function isLocalhostUrl(url: string): boolean {
  try {
    const { hostname } = new URL(url.startsWith("http") ? url : `https://${url}`);
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
  } catch {
    return false;
  }
}

function resolveVercelDeploymentUrl(): string | null {
  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (production) {
    const host = production.replace(/^https?:\/\//, "").replace(/\/$/, "");
    return `https://${host}`;
  }

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel.replace(/\/$/, "")}`;

  return null;
}

/** Resolves the public site URL for metadata, OAuth redirects, and billing. */
export function getSiteUrl(): string {
  const onVercel = Boolean(process.env.VERCEL);
  const isProduction = process.env.NODE_ENV === "production" || onVercel;

  const explicitCandidates = [
    process.env.NEXT_PUBLIC_SITE_URL?.trim(),
    process.env.NEXT_PUBLIC_APP_URL?.trim(),
  ].filter((value): value is string => Boolean(value));

  for (const candidate of explicitCandidates) {
    const normalized = normalizeUrl(candidate);
    if (!isProduction || !isLocalhostUrl(normalized)) {
      return normalized;
    }
  }

  const vercelUrl = resolveVercelDeploymentUrl();
  if (vercelUrl) return vercelUrl;

  return LOCALHOST_FALLBACK;
}

export const SITE_NAME = "Sparkroll";

export const BRAND_COLORS = {
  orange: "#F97316",
  red: "#E11D48",
  magenta: "#EC4899",
  navy: "#0a0a12",
} as const;
