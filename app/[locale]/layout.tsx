import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { HtmlLang } from "@/components/layout/HtmlLang";
import { Providers } from "@/components/layout/Providers";
import { isLocale, locales } from "@/i18n/routing";
import { buildMetadata } from "@/lib/metadata";

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  if (!isLocale(params.locale)) return {};
  const t = await getTranslations({ locale: params.locale, namespace: "meta" });
  return buildMetadata({
    title: undefined,
    description: t("description"),
    locale: params.locale,
  });
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const { locale } = params;

  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages} key={locale}>
      <HtmlLang locale={locale} />
      <Providers>{children}</Providers>
    </NextIntlClientProvider>
  );
}
