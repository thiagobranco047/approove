import "server-only";

import { headers } from "next/headers";
import { localeFromRequest, type AppLocale } from "@/lib/locale";

export async function getRequestLocale(): Promise<AppLocale> {
  const requestHeaders = await headers();

  return localeFromRequest({
    country:
      requestHeaders.get("x-approove-country") ??
      requestHeaders.get("x-vercel-ip-country") ??
      requestHeaders.get("cf-ipcountry"),
    acceptLanguage: requestHeaders.get("accept-language"),
  });
}
