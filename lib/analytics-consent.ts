import { GA_MEASUREMENT_ID, isAnalyticsEnabled } from "@/lib/analytics";

export const CONSENT_COOKIE_NAME = "approove-cookie-consent";
export const CONSENT_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export type ConsentChoice = "granted" | "denied";

const GA_LOADER_ID = "approove-ga-loader";

export function readConsent(): ConsentChoice | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = window.localStorage.getItem(CONSENT_COOKIE_NAME);
    if (stored === "granted" || stored === "denied") return stored;
  } catch {
    // Safari em modo privado.
  }

  const match = document.cookie.match(
    new RegExp(`(?:^|; )${CONSENT_COOKIE_NAME}=([^;]*)`)
  );
  const cookieValue = match?.[1];

  return cookieValue === "granted" || cookieValue === "denied"
    ? cookieValue
    : null;
}

export function persistConsent(choice: ConsentChoice) {
  try {
    window.localStorage.setItem(CONSENT_COOKIE_NAME, choice);
  } catch {
    // Sem persistência o banner reaparece na próxima visita.
  }

  const secure =
    typeof window !== "undefined" && window.location.protocol === "https:"
      ? "; Secure"
      : "";

  document.cookie = `${CONSENT_COOKIE_NAME}=${choice}; Path=/; Max-Age=${CONSENT_MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
}

export function isGoogleAnalyticsLoaded() {
  return document.getElementById(GA_LOADER_ID) !== null;
}

/** Injeta o snippet oficial do GA4 após o visitante aceitar cookies. */
export function loadGoogleAnalytics() {
  if (!isAnalyticsEnabled || isGoogleAnalyticsLoaded()) return;

  const loader = document.createElement("script");
  loader.id = GA_LOADER_ID;
  loader.async = true;
  loader.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(loader);

  const config = document.createElement("script");
  config.id = "approove-ga-config";
  config.text = `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_MEASUREMENT_ID}');
  `.trim();
  document.head.appendChild(config);
}

export function saveConsent(choice: ConsentChoice) {
  persistConsent(choice);

  if (choice === "granted") {
    loadGoogleAnalytics();
    sendPageview(
      window.location.pathname + window.location.search + window.location.hash
    );
  }
}

function gtag(...args: unknown[]) {
  if (typeof window.gtag === "function") {
    window.gtag(...(args as Parameters<NonNullable<typeof window.gtag>>));
    return;
  }

  window.dataLayer = window.dataLayer ?? [];
  const toArguments = function (): IArguments {
    // eslint-disable-next-line prefer-rest-params
    return arguments;
  } as (...values: unknown[]) => IArguments;
  window.dataLayer.push(toArguments(...args));
}

export function sendPageview(url: string) {
  if (!isAnalyticsEnabled || readConsent() !== "granted") return;

  gtag("config", GA_MEASUREMENT_ID, {
    page_path: url,
    page_location: window.location.href,
    page_title: document.title,
  });
}

export function trackEvent(name: string, params?: Record<string, unknown>) {
  if (!isAnalyticsEnabled || readConsent() !== "granted") return;

  gtag("event", name, params);
}
