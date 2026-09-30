"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { sendPageview } from "@/lib/analytics";

/** Rastreia navegações SPA; a primeira página é enviada pelo gtag config. */
export function AnalyticsRouteTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const query = searchParams.toString();
    sendPageview(query ? `${pathname}?${query}` : pathname);
  }, [pathname, searchParams]);

  return null;
}
