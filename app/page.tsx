import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { defaultLocale, locales, type Locale } from "@/i18n/routing";

function pickLocaleFromAcceptLanguage(value: string | null): Locale {
  if (!value) return defaultLocale;

  const supported = new Set<string>(locales as unknown as string[]);

  const candidates = value
    .split(",")
    .map((part) => part.trim())
    .map((part) => {
      const [tagRaw, ...params] = part.split(";").map((s) => s.trim());
      const qParam = params.find((p) => p.toLowerCase().startsWith("q="));
      const q = qParam ? Number(qParam.slice(2)) : 1;
      const tag = (tagRaw ?? "").toLowerCase();
      return { tag, q: Number.isFinite(q) ? q : 0 };
    })
    .filter((c) => c.tag.length > 0)
    .sort((a, b) => b.q - a.q);

  for (const { tag } of candidates) {
    const base = tag.split("-")[0] ?? tag;
    if (supported.has(tag)) return tag as Locale;
    if (supported.has(base)) return base as Locale;
  }

  return defaultLocale;
}

export default function RootPage() {
  const acceptLanguage = headers().get("accept-language");
  const locale = pickLocaleFromAcceptLanguage(acceptLanguage);
  redirect(`/${locale}`);
}

