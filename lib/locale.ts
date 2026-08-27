export const SUPPORTED_LOCALES = ["en", "pt-BR"] as const;

export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: AppLocale = "en";

export function localeFromRequest({
  country,
  acceptLanguage,
}: {
  country?: string | null;
  acceptLanguage?: string | null;
}): AppLocale {
  const normalizedCountry = country?.trim().toUpperCase();

  if (normalizedCountry) {
    return normalizedCountry === "BR" ? "pt-BR" : DEFAULT_LOCALE;
  }

  const preferredLanguage = acceptLanguage
    ?.split(",")[0]
    ?.trim()
    .toLowerCase();

  return preferredLanguage?.startsWith("pt") ? "pt-BR" : DEFAULT_LOCALE;
}

export function isBrazilianLocale(locale: AppLocale) {
  return locale === "pt-BR";
}

export function localizedText(locale: AppLocale, portuguese: string, english: string) {
  return isBrazilianLocale(locale) ? portuguese : english;
}
