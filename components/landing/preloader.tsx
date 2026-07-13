"use client";

import { useEffect, useState } from "react";

const SESSION_KEY = "approove-preloader-shown";

export function Preloader() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (sessionStorage.getItem(SESSION_KEY)) return;

    sessionStorage.setItem(SESSION_KEY, "1");
    setShow(true);
    const timer = setTimeout(() => setShow(false), 1900);
    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <div className="preloader" aria-hidden>
      <div className="preloader-mark flex items-baseline text-4xl font-extrabold tracking-tight text-[#1B1917] sm:text-5xl">
        approove
        <span className="preloader-dot ml-1 inline-block h-[0.5em] w-[0.5em] rounded-full bg-[#0072E3]" />
      </div>
    </div>
  );
}
