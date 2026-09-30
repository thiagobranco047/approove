"use client";

import { useEffect } from "react";
import {
  isGoogleAnalyticsLoaded,
  loadGoogleAnalytics,
  persistConsent,
  readConsent,
} from "@/lib/analytics-consent";
import { isAnalyticsEnabled } from "@/lib/analytics";

/**
 * Visitantes que aceitaram cookies antes da migração para cookie de servidor
 * ou em navegação client-side: garante que o GA carregue sem exigir reload.
 */
export function AnalyticsBootstrap() {
  useEffect(() => {
    if (!isAnalyticsEnabled || readConsent() !== "granted") return;

    persistConsent("granted");

    if (!isGoogleAnalyticsLoaded()) {
      loadGoogleAnalytics();
    }
  }, []);

  return null;
}
