import { redirect } from "next/navigation";

import { setRequestLocale } from "next-intl/server";



import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";

import { getOnboardingStatus, getServerUser } from "@/lib/auth/session";



export default async function OnboardingPage({ params }: { params: { locale: string } }) {

  setRequestLocale(params.locale);



  const user = await getServerUser();

  const onboarding = await getOnboardingStatus(user?.id);

  if (onboarding.completed) redirect(`/${params.locale}/dashboard`);



  return (

    <div className="min-h-dvh bg-gradient-to-b from-background via-background to-violet-500/5 px-4 py-8">

      <OnboardingWizard initialStep={onboarding.step} />

    </div>

  );

}


