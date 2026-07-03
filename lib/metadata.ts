import type { Metadata } from "next";

import { getSiteUrl, SITE_NAME } from "@/lib/site";

type BuildMetadataOptions = {
  title?: string;
  description?: string;
  locale?: string;
  path?: string;
  noIndex?: boolean;
};

const DEFAULT_DESCRIPTION =
  "Free AI-powered YouTube creator toolkit — ideas, SEO, workflow, competitors, calendar, and thumbnails.";

/**
 * Builds consistent Next.js metadata with Open Graph and Twitter cards.
 */
export function buildMetadata({
  title,
  description = DEFAULT_DESCRIPTION,
  locale = "en",
  path = "",
  noIndex = false,
}: BuildMetadataOptions = {}): Metadata {
  const siteUrl = getSiteUrl();
  const normalizedPath = path.startsWith("/") ? path : path ? `/${path}` : "";
  const canonical = `${siteUrl}/${locale}${normalizedPath === "/" ? "" : normalizedPath}`;
  const pageTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  const ogImage = `${siteUrl}/og-image.png`;

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: SITE_NAME,
      template: `%s | ${SITE_NAME}`,
    },
    description,
    applicationName: SITE_NAME,
    manifest: "/manifest.json",
    icons: {
      icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
      apple: [{ url: "/apple-touch-icon.png", type: "image/png", sizes: "180x180" }],
    },
    alternates: {
      canonical,
      languages: {
        en: `${siteUrl}/en${normalizedPath}`,
        it: `${siteUrl}/it${normalizedPath}`,
        es: `${siteUrl}/es${normalizedPath}`,
        de: `${siteUrl}/de${normalizedPath}`,
        fr: `${siteUrl}/fr${normalizedPath}`,
        pt: `${siteUrl}/pt${normalizedPath}`,
        ru: `${siteUrl}/ru${normalizedPath}`,
        ja: `${siteUrl}/ja${normalizedPath}`,
        zh: `${siteUrl}/zh${normalizedPath}`,
      },
    },
    openGraph: {
      type: "website",
      locale,
      url: canonical,
      siteName: SITE_NAME,
      title: pageTitle,
      description,
      images: [{ url: ogImage, width: 1200, height: 630, alt: SITE_NAME }],
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description,
      images: [ogImage],
    },
    other: {
      "theme-color": "#7c3aed",
    },
    robots: noIndex ? { index: false, follow: false } : { index: true, follow: true },
  };
}
