import { getTranslations } from "next-intl/server";



import { IdeaBankPanel } from "@/components/ideas/IdeaBankPanel";
import { ScriptOutlinePanel } from "@/components/ideas/ScriptOutlinePanel";
import { PageHeader } from "@/components/shared/PageHeader";

export default async function IdeasPage() {
  const t = await getTranslations("ideas");

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <ScriptOutlinePanel />
      <IdeaBankPanel />
    </div>
  );
}

