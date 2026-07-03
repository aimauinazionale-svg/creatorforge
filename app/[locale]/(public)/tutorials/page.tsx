import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { TutorialsView } from "@/components/tutorials/TutorialsView";
import { buildMetadata } from "@/lib/metadata";

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "tutorials.meta" });
  return buildMetadata({
    title: t("title"),
    description: t("description"),
    locale: params.locale,
    path: "/tutorials",
  });
}

export default async function TutorialsPage({ params }: { params: { locale: string } }) {
  setRequestLocale(params.locale);

  return <TutorialsView />;
}
