import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { AuthForm } from "@/components/auth/AuthForm";
import { getOnboardingStatus, getServerUser } from "@/lib/auth/session";
import { SITE_NAME } from "@/lib/site";

export default async function RegisterPage({ params }: { params: { locale: string } }) {
  const user = await getServerUser();
  if (user) {
    const onboarding = await getOnboardingStatus(user.id);
    redirect(onboarding.completed ? `/${params.locale}/dashboard` : `/${params.locale}/onboarding`);
  }

  const t = await getTranslations("register");

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-b from-background via-background to-violet-500/5 px-4 py-12">
      <div className="mb-8 text-center">
        <p className="text-sm font-medium uppercase tracking-widest text-violet-500">{SITE_NAME}</p>
        <h1 className="mt-2 text-balance text-3xl font-semibold tracking-tight">{t("pageTitle")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("pageSubtitle")}</p>
      </div>
      <AuthForm mode="register" />
    </div>
  );
}
