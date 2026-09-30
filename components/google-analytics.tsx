import { cookies } from "next/headers";
import { GA_MEASUREMENT_ID, isAnalyticsEnabled } from "@/lib/analytics";
import { CONSENT_COOKIE_NAME } from "@/lib/analytics-consent";

/**
 * Só injeta o snippet oficial do GA4 quando o visitante já concedeu consentimento
 * (cookie legível no servidor). Sem Consent Mode negando analytics_storage —
 * isso impedia hits de aparecer no Tempo real e na verificação do Google.
 */
export async function GoogleAnalytics() {
  if (!isAnalyticsEnabled) return null;

  const consent = (await cookies()).get(CONSENT_COOKIE_NAME)?.value;
  if (consent !== "granted") return null;

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
gtag('js', new Date());
gtag('config', '${GA_MEASUREMENT_ID}');
          `.trim(),
        }}
      />
    </>
  );
}
