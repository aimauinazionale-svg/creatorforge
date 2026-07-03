import { getTranslations } from "next-intl/server";



import { ThumbnailAnalyzer } from "@/components/thumbnail/ThumbnailAnalyzer";

import { PageHeader } from "@/components/shared/PageHeader";



export default async function ThumbnailPage() {

  const t = await getTranslations("thumbnail");



  return (

    <div className="mx-auto w-full max-w-6xl space-y-6">

      <PageHeader title={t("title")} subtitle={t("subtitle")} />

      <ThumbnailAnalyzer />

    </div>

  );

}

