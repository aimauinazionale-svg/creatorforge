import { getTranslations } from "next-intl/server";

import { SeoLab } from "@/components/seo/SeoLab";
import { PageHeader } from "@/components/shared/PageHeader";

type SeoLabPageProps = {
  searchParams: Promise<{ videoId?: string; title?: string }>;
};

export default async function SeoLabPage({ searchParams }: SeoLabPageProps) {
  const t = await getTranslations("seoLab");
  const params = await searchParams;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <SeoLab initialVideoId={params.videoId} initialTitle={params.title} />
    </div>
  );
}

