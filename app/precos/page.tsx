import { LandingJsonLd } from "@/components/landing/json-ld";
import { MarketingPageIntro } from "@/components/landing/page-intro";
import { LandingPricing } from "@/components/landing/pricing";
import { MarketingShell } from "@/components/landing/shell";
import { getAppBaseUrl } from "@/lib/app-url";
import { marketingPageMetadata } from "@/lib/seo";

export function generateMetadata() {
  return marketingPageMetadata({
    locale: "pt-BR",
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

export default function PrecosPage() {
  return (
    <MarketingShell locale="pt-BR" page="pricing">
      <LandingJsonLd locale="pt-BR" includeFaq={false} />
      <MarketingPageIntro
        eyebrow="Preços"
        title="Planos da aprovação de conteúdo para agências"
        description="15 dias grátis, sem cartão. Os limites crescem com a carteira de clientes, usuários da agência e revisores. Publicações são ilimitadas em todos os planos."
      />
      <LandingPricing locale="pt-BR" showHeader={false} />
    </MarketingShell>
  );
}
