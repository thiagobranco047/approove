import { getLandingFaqs } from "@/components/landing/faq";
import { getAppBaseUrl } from "@/lib/app-url";
import { localizedText, type AppLocale } from "@/lib/locale";
import { marketingPath } from "@/lib/marketing-routes";
import { currencyForLocale, PLAN_AMOUNTS, type PaidPlan } from "@/lib/pricing";

const PAID_PLANS: PaidPlan[] = ["solo", "starter", "pro", "studio"];
const PLAN_NAMES: Record<PaidPlan, string> = {
  solo: "Solo",
  starter: "Starter",
  pro: "Pro",
  studio: "Studio",
};

export function LandingJsonLd({
  locale,
  includeFaq = true,
}: {
  locale: AppLocale;
  includeFaq?: boolean;
}) {
  const tr = (pt: string, en: string) => localizedText(locale, pt, en);
  const base = getAppBaseUrl();
  const faqs = includeFaq ? getLandingFaqs(locale) : [];
  const currency = currencyForLocale(locale);
  const pricingUrl = `${base}${marketingPath("pricing", locale)}`;
  const priceCurrency = currency.toUpperCase();
  const organizationId = `${base}/#organization`;
  const description = tr(
    "Espaço de aprovação de conteúdo para agências e times de marketing. Calendário editorial, revisão do cliente e registro do que foi aprovado.",
    "Client content approval workspace for agencies and marketing teams. Editorial calendar, client review, and a record of what was approved."
  );

  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": organizationId,
        name: "Approove",
        url: base,
        email: "contato@approove.app",
        logo: `${base}/icon`,
      },
      {
        "@type": "SoftwareApplication",
        name: "Approove",
        url: base,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        description,
        publisher: { "@id": organizationId },
        offers: [
          {
            "@type": "Offer",
            name: tr("Teste de 15 dias", "15-day trial"),
            price: "0",
            priceCurrency,
            description: tr("Sem cartão de crédito.", "No credit card."),
          },
          ...PAID_PLANS.map((plan) => ({
            "@type": "Offer",
            name: PLAN_NAMES[plan],
            price: (PLAN_AMOUNTS[plan][currency] / 100).toFixed(2),
            priceCurrency,
            url: pricingUrl,
          })),
        ],
      },
      {
        "@type": "WebSite",
        name: "Approove",
        url: base,
        inLanguage: locale === "pt-BR" ? "pt-BR" : "en",
        publisher: { "@id": organizationId },
      },
      ...(includeFaq
        ? [
            {
              "@type": "FAQPage",
              mainEntity: faqs.map((faq) => ({
                "@type": "Question",
                name: faq.question,
                acceptedAnswer: {
                  "@type": "Answer",
                  text: faq.answer,
                },
              })),
            },
          ]
        : []),
    ],
  };

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }} />
  );
}
