import {
  CONSENT_STORAGE_KEY,
  GA_MEASUREMENT_ID,
  isAnalyticsEnabled,
} from "@/lib/analytics";

/**
 * Snippet oficial do GA4 em HTML puro. O next/script reescreve os scripts em
 * self.__next_s, e o verificador do Google não reconhece esse formato.
 */
export function GoogleAnalytics() {
  if (!isAnalyticsEnabled) return null;

  return (
    <>
      <script
        async
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
      />
      <script
        dangerouslySetInnerHTML={{
          __html: `
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
          `.trim(),
        }}
      />
    </>
  );
}
