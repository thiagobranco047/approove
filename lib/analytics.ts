export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "";

/**
 * Só enviamos dados em produção e quando o measurement ID está configurado,
 * para não poluir o relatório do GA com tráfego de desenvolvimento.
 */
export const isAnalyticsEnabled =
  process.env.NODE_ENV === "production" && GA_MEASUREMENT_ID.length > 0;

/** Decisão do banner de cookies (LGPD), persistida no navegador. */
export const CONSENT_STORAGE_KEY = "approove-cookie-consent";

export type ConsentChoice = "granted" | "denied";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function readConsent(): ConsentChoice | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    return stored === "granted" || stored === "denied" ? stored : null;
  } catch {
    return null;
  }
}

export function saveConsent(choice: ConsentChoice) {
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, choice);
  } catch {
    // Sem persistência o banner reaparece na próxima visita.
  }

  if (choice === "denied" && typeof window.gtag === "function") {
    window.gtag("consent", "update", { analytics_storage: "denied" });
  }
}

export function sendPageview(url: string) {
  if (!isAnalyticsEnabled || typeof window.gtag !== "function") return;

  window.gtag("config", GA_MEASUREMENT_ID, {
    page_path: url,
    page_location: window.location.href,
    page_title: document.title,
  });
}

export function trackEvent(name: string, params?: Record<string, unknown>) {
  if (!isAnalyticsEnabled || typeof window.gtag !== "function") return;

  window.gtag("event", name, params);
}
