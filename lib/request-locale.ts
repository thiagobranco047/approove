import "server-only";

import { headers } from "next/headers";
import { isAppLocale, localeFromRequest, type AppLocale } from "@/lib/locale";

function geoLocaleFromHeaders(requestHeaders: Headers): AppLocale {
  return localeFromRequest({
    country:
      requestHeaders.get("x-approove-country") ??
      requestHeaders.get("x-vercel-ip-country") ??
      requestHeaders.get("cf-ipcountry"),
    acceptLanguage: requestHeaders.get("accept-language"),
  });
}

/** UI: URL de marketing ou cookie, senão país / Accept-Language. */
export async function getRequestLocale(): Promise<AppLocale> {
  const requestHeaders = await headers();
  const explicit = requestHeaders.get("x-approove-locale");

  if (isAppLocale(explicit)) {
    return explicit;
  }

  return geoLocaleFromHeaders(requestHeaders);
}

/** Cobrança: só geografia, para um brasileiro em `/en` continuar em BRL. */
export async function getBillingLocale(): Promise<AppLocale> {
  return geoLocaleFromHeaders(await headers());
}
