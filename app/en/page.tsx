import { LandingPage } from "@/components/landing-page";
import { LandingJsonLd } from "@/components/landing/json-ld";
import { getAppBaseUrl } from "@/lib/app-url";
import { marketingHomeMetadata } from "@/lib/seo";

export function generateMetadata() {
  return marketingHomeMetadata("en", getAppBaseUrl());
}

export default function EnglishHome() {
  return (
    <>
      <LandingJsonLd locale="en" />
      <LandingPage locale="en" />
    </>
  );
}
