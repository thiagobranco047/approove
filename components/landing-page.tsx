import { LandingHero } from "@/components/landing/hero";
import { LandingMarquee, LandingProblem } from "@/components/landing/problem";
import { LandingWorkflow } from "@/components/landing/workflow";
import { LandingClientExperience } from "@/components/landing/client-experience";
import {
  LandingActivity,
  LandingFeedback,
  LandingIntegrity,
  LandingInvalidation,
  LandingRoles,
  LandingVersions,
} from "@/components/landing/integrity";
import { LandingFeatures } from "@/components/landing/features";
import { LandingPricing } from "@/components/landing/pricing";
import { LandingFaq } from "@/components/landing/faq";
import { MarketingShell } from "@/components/landing/shell";
import type { AppLocale } from "@/lib/locale";

export function LandingPage({ locale }: { locale: AppLocale }) {
  return (
    <MarketingShell locale={locale} page="home">
      <LandingHero locale={locale} />
      <LandingMarquee locale={locale} />
      <LandingProblem locale={locale} />
      <LandingWorkflow locale={locale} />
      <LandingClientExperience locale={locale} />
      <LandingIntegrity locale={locale} />
      <LandingInvalidation locale={locale} />
      <LandingActivity locale={locale} />
      <LandingFeedback locale={locale} />
      <LandingVersions locale={locale} />
      <LandingRoles locale={locale} />
      <LandingFeatures locale={locale} />
      <LandingPricing locale={locale} />
      <LandingFaq locale={locale} />
    </MarketingShell>
  );
}
