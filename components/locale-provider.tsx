"use client";

import { createContext, useContext } from "react";
import type { AppLocale } from "@/lib/locale";

const LocaleContext = createContext<AppLocale>("en");

export function LocaleProvider({
  locale,
  children,
}: {
  locale: AppLocale;
  children: React.ReactNode;
}) {
  return (
    <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}
