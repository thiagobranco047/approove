import Script from "next/script";
import { GA_MEASUREMENT_ID, isAnalyticsEnabled } from "@/lib/analytics";

/** Mesmo padrão do projeto dutex: GA4 carrega em todas as páginas em produção. */
export function GoogleAnalytics() {
  if (!isAnalyticsEnabled) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}');
        `}
      </Script>
    </>
  );
}
