import { LandingJsonLd } from "@/components/landing/json-ld";
import { MarketingPageIntro } from "@/components/landing/page-intro";
import { LandingPricing } from "@/components/landing/pricing";
import { MarketingShell } from "@/components/landing/shell";
import { getAppBaseUrl } from "@/lib/app-url";
import { marketingPageMetadata } from "@/lib/seo";

export function generateMetadata() {
  return marketingPageMetadata({
    locale: "en",
    baseUrl: getAppBaseUrl(),
    pathPt: "/precos",
    pathEn: "/en/pricing",
    titlePt: "Preços - Approove",
    titleEn: "Pricing - Approove",
    descriptionPt:
      "Planos Solo, Starter, Pro e Studio para aprovação de conteúdo. 15 dias grátis, sem cartão. Publicações ilimitadas.",
    descriptionEn:
      "Solo, Starter, Pro, and Studio plans for content approval. 15 days free, no credit card. Unlimited posts.",
  });
}

export default function PricingPage() {
  return (
    <MarketingShell locale="en" page="pricing">
      <LandingJsonLd locale="en" includeFaq={false} />
      <MarketingPageIntro
        eyebrow="Pricing"
        title="Plans for agency content approval"
        description="15 days free, no credit card. Limits grow with your client roster, agency seats, and reviewers. Posts are unlimited on every plan."
      />
      <LandingPricing locale="en" showHeader={false} />
    </MarketingShell>
  );
}
