/** Ordered section keys for the privacy policy page. */
export const PRIVACY_SECTIONS = [
  "dataWeCollect",
  "howWeUse",
  "legalBasis",
  "thirdParties",
  "cookies",
  "dataRetention",
  "yourRights",
  "children",
  "international",
  "changes",
] as const;

/** Ordered section keys for the terms of service page. */
export const TERMS_SECTIONS = [
  "acceptance",
  "description",
  "accounts",
  "acceptableUse",
  "youtubeAndGoogle",
  "aiFeatures",
  "subscriptions",
  "intellectualProperty",
  "disclaimer",
  "limitation",
  "termination",
  "governingLaw",
  "changes",
] as const;

export type PrivacySectionKey = (typeof PRIVACY_SECTIONS)[number];
export type TermsSectionKey = (typeof TERMS_SECTIONS)[number];
