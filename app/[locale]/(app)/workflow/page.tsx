import { getTranslations } from "next-intl/server";



import { WorkflowBoard } from "@/components/workflow/WorkflowBoard";

import { PageHeader } from "@/components/shared/PageHeader";



export default async function WorkflowPage() {

  const t = await getTranslations("workflow");



  return (

    <div className="mx-auto w-full max-w-[1400px] space-y-6">

      <PageHeader title={t("title")} subtitle={t("subtitle")} />

      <WorkflowBoard />

    </div>

  );

}

