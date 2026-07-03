import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Comparison } from "@/components/landing/Comparison";
import { LandingMotion } from "@/components/landing/LandingMotion";
import { FAQ } from "@/components/landing/FAQ";
import { Features } from "@/components/landing/Features";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Pricing } from "@/components/landing/Pricing";
import { Testimonials } from "@/components/landing/Testimonials";
import { buildMetadata } from "@/lib/metadata";

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "landing.meta" });
  return buildMetadata({
    description: t("description"),
    locale: params.locale,
  });
}

export default async function LandingPage({ params }: { params: { locale: string } }) {
  setRequestLocale(params.locale);

  return (
    <LandingMotion>
      <Hero />
      <div id="features">
        <Features />
      </div>
      <HowItWorks />
      <Comparison />
      <Testimonials />
      <div id="pricing">
        <Pricing />
      </div>
      <FAQ />
      <FinalCTA />
    </LandingMotion>
  );
}
