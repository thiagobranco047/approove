"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/locale-provider";
import { localizedText } from "@/lib/locale";
import { isAnalyticsEnabled, readConsent, saveConsent } from "@/lib/analytics";

export function CookieConsent() {
  const locale = useLocale();
  const tr = (pt: string, en: string) => localizedText(locale, pt, en);
  const [visible, setVisible] = useState(false);

  // Decidimos no cliente: ler o localStorage no primeiro render quebraria a
  // hidratação, já que o HTML do servidor não conhece a escolha do visitante.
  useEffect(() => {
    if (isAnalyticsEnabled && readConsent() === null) {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  function decide(choice: "granted" | "denied") {
    saveConsent(choice);
    setVisible(false);
  }

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label={tr("Aviso de cookies", "Cookie notice")}
      className="fixed inset-x-0 bottom-0 z-50 p-4 sm:p-6"
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-4 rounded-xl border bg-background p-5 shadow-lg sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {tr(
            "Usamos cookies de análise para entender como o Approove é usado. Você pode recusar sem perder nenhuma funcionalidade.",
            "We use analytics cookies to understand how Approove is used. You can decline without losing any functionality."
          )}{" "}
          <Link href="/privacidade" className="underline underline-offset-4">
            {tr("Política de privacidade", "Privacy policy")}
          </Link>
        </p>
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" size="sm" onClick={() => decide("denied")}>
            {tr("Recusar", "Decline")}
          </Button>
          <Button size="sm" onClick={() => decide("granted")}>
            {tr("Aceitar", "Accept")}
          </Button>
        </div>
      </div>
    </div>
  );
}
