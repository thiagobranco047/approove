import Script from "next/script";
import {
  CONSENT_STORAGE_KEY,
  GA_MEASUREMENT_ID,
  isAnalyticsEnabled,
} from "@/lib/analytics";

/**
 * Scripts no HTML inicial (beforeInteractive) para o verificador do GA e o
 * gtag.js enxergarem a tag sem depender da hidratação do React.
 */
export function GoogleAnalytics() {
  if (!isAnalyticsEnabled) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="beforeInteractive"
      />
      <Script id="google-analytics" strategy="beforeInteractive">
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
          gtag('config', '${GA_MEASUREMENT_ID}');
        `}
      </Script>
    </>
  );
}
