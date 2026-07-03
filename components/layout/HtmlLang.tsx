"use client";

import { useEffect } from "react";

import type { Locale } from "@/i18n/routing";

export type HtmlLangProps = {
  locale: Locale;
};

/** Syncs the document `lang` attribute with the active locale. */
export function HtmlLang({ locale }: HtmlLangProps) {
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return null;
}
