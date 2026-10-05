import { getLandingFaqs } from "@/components/landing/faq";
import { getAppBaseUrl } from "@/lib/app-url";
import { localizedText, type AppLocale } from "@/lib/locale";

export function LandingJsonLd({ locale }: { locale: AppLocale }) {
  const tr = (pt: string, en: string) => localizedText(locale, pt, en);
  const base = getAppBaseUrl();
  const faqs = getLandingFaqs(locale);

  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        name: "Approove",
        url: base,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        description: tr(
          "Espaço de aprovação de conteúdo para agências e times de marketing. Calendário editorial, revisão do cliente e registro do que foi aprovado.",
          "Client content approval workspace for agencies and marketing teams. Editorial calendar, client review, and a record of what was approved."
        ),
      },
      {
        "@type": "WebSite",
        name: "Approove",
        url: base,
        inLanguage: locale === "pt-BR" ? "pt-BR" : "en",
      },
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
    ],
  };

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }} />
  );
}
