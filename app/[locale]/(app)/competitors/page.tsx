import { getTranslations } from "next-intl/server";



import { CompetitorsTracker } from "@/components/competitors/CompetitorsTracker";

import { PageHeader } from "@/components/shared/PageHeader";



export default async function CompetitorsPage() {

  const t = await getTranslations("competitors");



  return (

    <div className="mx-auto w-full max-w-6xl space-y-6">

      <PageHeader title={t("title")} subtitle={t("subtitle")} />

      <CompetitorsTracker />

    </div>

  );

}

