import { redirect } from "next/navigation";



import { AppShell } from "@/components/layout/AppShell";

import { GUEST_USER, getOnboardingStatus, getServerUser } from "@/lib/auth/session";

import { isOnboardingGloballyComplete } from "@/lib/onboarding/fallback";



export default async function AppLayout({

  children,

  params,

}: {

  children: React.ReactNode;

  params: { locale: string };

}) {

  const user = await getServerUser();



  if (!user) {

    if (!isOnboardingGloballyComplete()) {

      redirect(`/${params.locale}/onboarding`);

    }

    return <AppShell user={GUEST_USER}>{children}</AppShell>;

  }



  const onboarding = await getOnboardingStatus(user.id);

  if (!onboarding.completed) redirect(`/${params.locale}/onboarding`);



  return <AppShell user={user}>{children}</AppShell>;

}


