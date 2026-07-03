import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { LegalDocument } from "@/components/legal/LegalDocument";

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "legalPages.terms" });
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function TermsPage({ params }: { params: { locale: string } }) {
  setRequestLocale(params.locale);

  return <LegalDocument namespace="legalPages.terms" />;
}
