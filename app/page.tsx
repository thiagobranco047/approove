import { LandingPage } from "@/components/landing-page";
import { LandingJsonLd } from "@/components/landing/json-ld";
import { getAppBaseUrl } from "@/lib/app-url";
import { marketingHomeMetadata } from "@/lib/seo";

export function generateMetadata() {
  return marketingHomeMetadata("pt-BR", getAppBaseUrl());
}

export default function Home() {
  return (
    <>
      <LandingJsonLd locale="pt-BR" />
      <LandingPage locale="pt-BR" />
    </>
  );
}
