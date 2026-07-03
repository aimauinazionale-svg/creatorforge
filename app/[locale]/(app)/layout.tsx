import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/AppShell";
import { getOnboardingStatus, getServerUser } from "@/lib/auth/session";

export default async function AppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const user = await getServerUser();

  if (!user) {
    redirect(`/${params.locale}/login`);
  }

  const onboarding = await getOnboardingStatus(user.id);
  if (!onboarding.completed) redirect(`/${params.locale}/onboarding`);

  return <AppShell user={user}>{children}</AppShell>;
}
