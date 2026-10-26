import type { ReactNode } from "react";
import { cream, ink } from "@/components/landing/tokens";
import { Preloader } from "@/components/landing/preloader";
import { LandingNavbar } from "@/components/landing/navbar";
import { LandingFinalCta } from "@/components/landing/final-cta";
import type { AppLocale } from "@/lib/locale";
import { MARKETING_PATHS, type MarketingPage } from "@/lib/marketing-routes";

export function MarketingShell({
  locale,
  page = "home",
  children,
}: {
  locale: AppLocale;
  page?: MarketingPage;
  children: ReactNode;
}) {
  return (
    <div className="lp flex min-h-screen flex-col antialiased" style={{ backgroundColor: cream, color: ink }}>
      <Preloader />
      <LandingNavbar locale={locale} languageHref={MARKETING_PATHS[page]} />
      <main className="flex-1">{children}</main>
      <LandingFinalCta locale={locale} />
    </div>
  );
}
