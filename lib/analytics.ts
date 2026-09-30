export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "";

/**
 * Só enviamos dados em produção e quando o measurement ID está configurado,
 * para não poluir o relatório do GA com tráfego de desenvolvimento.
 */
export const isAnalyticsEnabled =
  process.env.NODE_ENV === "production" && GA_MEASUREMENT_ID.length > 0;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}
