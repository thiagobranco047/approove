import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LandingPage } from "@/components/landing-page";

export const metadata: Metadata = {
  title: "Approove — Aprovação de conteúdo sem caos para agências",
  description:
    "Centralize o calendário editorial da sua agência. O cliente revisa, comenta direto na arte e aprova cada publicação por um link — sem criar conta, sem prints, sem retrabalho.",
};

export default async function Home() {
  const session = await auth();

  if (session) {
    redirect("/dashboard");
  }

  return <LandingPage />;
}
