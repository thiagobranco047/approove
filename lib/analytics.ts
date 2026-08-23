export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "";

/**
 * Só enviamos dados em produção e quando o measurement ID está configurado,
 * para não poluir o relatório do GA com tráfego de desenvolvimento.
 */
export const isAnalyticsEnabled =
  process.env.NODE_ENV === "production" && GA_MEASUREMENT_ID.length > 0;

/** Decisão do banner de cookies (LGPD/GDPR), persistida no navegador. */
export const CONSENT_STORAGE_KEY = "approove-cookie-consent";

export type ConsentChoice = "granted" | "denied";

type GtagArgs =
  | ["js", Date]
  | ["config", string, Record<string, unknown>?]
  | ["event", string, Record<string, unknown>?]
  | ["consent", "default" | "update", Record<string, unknown>];

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: GtagArgs) => void;
  }
}

export function readConsent(): ConsentChoice | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    return stored === "granted" || stored === "denied" ? stored : null;
  } catch {
    // Safari em modo privado / storage bloqueado: tratamos como sem decisão.
    return null;
  }
}

export function saveConsent(choice: ConsentChoice) {
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, choice);
  } catch {
    // Sem persistência o banner reaparece na próxima visita — aceitável.
  }

  gtagPush("consent", "update", { analytics_storage: choice });
}

/**
 * Empurra direto na fila do gtag.js. Usar `dataLayer` em vez de `window.gtag`
 * garante que eventos disparados antes do script carregar (o next/script roda
 * depois da hidratação) sejam processados assim que ele chegar.
 */
const toArguments = function (): IArguments {
  // eslint-disable-next-line prefer-rest-params
  return arguments;
} as (...values: unknown[]) => IArguments;

function gtagPush(...args: GtagArgs) {
  window.dataLayer = window.dataLayer ?? [];
  // O gtag.js só reconhece comandos empurrados como objeto `arguments`;
  // um array simples é ignorado pela fila.
  window.dataLayer.push(toArguments(...args));
}

export function pageview(url: string) {
  if (!isAnalyticsEnabled) return;

  gtagPush("event", "page_view", {
    page_path: url,
    page_location: window.location.href,
    page_title: document.title,
  });
}

export function trackEvent(name: string, params?: Record<string, unknown>) {
  if (!isAnalyticsEnabled) return;

  gtagPush("event", name, params);
}
