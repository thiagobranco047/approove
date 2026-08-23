import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LandingPage } from "@/components/landing-page";
import { getRequestLocale } from "@/lib/request-locale";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();

  return locale === "pt-BR"
    ? {
        title: "Approove — Aprovação de conteúdo sem caos para agências",
        description: "Centralize o calendário editorial da sua agência. O cliente revisa, comenta direto na arte e aprova cada publicação por um link — sem criar conta, sem prints, sem retrabalho.",
      }
    : {
        title: "Approove — Content approval without agency chaos",
        description: "Centralize your agency’s editorial calendar. Clients review, comment directly on creatives, and approve each post through a simple link.",
      };
}

export default async function Home() {
  const [session, locale] = await Promise.all([auth(), getRequestLocale()]);

  if (session) {
    redirect("/dashboard");
  }

  return <LandingPage locale={locale} />;
}
