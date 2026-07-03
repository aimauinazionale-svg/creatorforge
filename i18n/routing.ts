import { defineRouting } from "next-intl/routing";

export const locales = ["en", "it", "es", "de", "fr", "pt", "ru", "ja", "zh"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const routing = defineRouting({
  locales: [...locales],
  defaultLocale,
  localePrefix: "always",
});

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
