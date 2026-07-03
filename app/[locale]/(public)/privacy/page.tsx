import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "legalPages.privacy" });
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function PrivacyPage({ params }: { params: { locale: string } }) {
  setRequestLocale(params.locale);
  const t = await getTranslations("legalPages.privacy");

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
      <p className="mt-6 text-muted-foreground leading-relaxed">{t("body")}</p>
    </div>
  );
}
