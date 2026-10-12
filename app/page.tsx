import type { Metadata } from "next";
import { LandingPage } from "@/components/landing-page";
import { LandingJsonLd } from "@/components/landing/json-ld";
import { getAppBaseUrl } from "@/lib/app-url";
import { getRequestLocale } from "@/lib/request-locale";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const canonical = `${getAppBaseUrl()}/`;
  const isPt = locale === "pt-BR";

  const title = isPt
    ? "Approove - Aprovação de conteúdo para agências"
    : "Approove - Content approval for agencies";
  const description = isPt
    ? "Organize o calendário editorial, envie o conteúdo para revisão e saiba exatamente o que o cliente aprovou. Sem aprovação espalhada no WhatsApp, e-mail ou Drive."
    : "Organize the editorial calendar, send content for review, and know exactly what the client approved. Stop chasing approvals across WhatsApp, email, and Drive.";

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      url: canonical,
      siteName: "Approove",
      title,
      description,
      locale: isPt ? "pt_BR" : "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function Home() {
  const locale = await getRequestLocale();

  return (
    <>
      <LandingJsonLd locale={locale} />
      <LandingPage locale={locale} />
    </>
  );
}
