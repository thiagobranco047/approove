"use client";

import { Suspense, useEffect } from "react";
import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import {
  CONSENT_STORAGE_KEY,
  GA_MEASUREMENT_ID,
  isAnalyticsEnabled,
  pageview,
} from "@/lib/analytics";

function RouteChangeTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const query = searchParams.toString();
    pageview(query ? `${pathname}?${query}` : pathname);
  }, [pathname, searchParams]);

  return null;
}

export function GoogleAnalytics() {
  if (!isAnalyticsEnabled) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      {/*
        Consent Mode v2: negamos armazenamento por padrão e restauramos a escolha
        salva antes do primeiro `config`, para quem já respondeu ao banner não
        perder o consentimento entre visitas. Sem consentimento o GA ainda recebe
        pings sem cookies (modelagem), mas não identifica o visitante.
      */}
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          var approoveConsent = null;
          try { approoveConsent = localStorage.getItem('${CONSENT_STORAGE_KEY}'); } catch (e) {}
          gtag('consent', 'default', {
            ad_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied',
            analytics_storage: approoveConsent === 'granted' ? 'granted' : 'denied',
            wait_for_update: 500
          });
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}', { send_page_view: false });
        `}
      </Script>
      {/* useSearchParams exige Suspense para não forçar CSR nas rotas estáticas */}
      <Suspense fallback={null}>
        <RouteChangeTracker />
      </Suspense>
    </>
  );
}
