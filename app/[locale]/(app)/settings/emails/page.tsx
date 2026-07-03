import { getTranslations } from "next-intl/server";



import { EmailPreferencesForm } from "@/components/settings/EmailPreferencesForm";

import { PageHeader } from "@/components/shared/PageHeader";



export default async function EmailSettingsPage() {

  const t = await getTranslations("emails.settings");



  return (

    <div className="mx-auto w-full max-w-2xl space-y-6">

      <PageHeader title={t("emailTitle")} subtitle={t("emailSubtitle")} />

      <EmailPreferencesForm />

    </div>

  );

}

