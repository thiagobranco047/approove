"use client";

import { useEffect, useRef } from "react";

interface ScrollFillProps {
  text: string;
  className?: string;
  /** Palavra exata → cor quando acesa (ex.: { "risco.": "#FF5C38" }) */
  accents?: Record<string, string>;
  dimColor?: string;
  litColor?: string;
}

/**
 * Título cujas palavras "acendem" progressivamente conforme o scroll
 * (efeito de preenchimento por scroll do poetic.com). Sem JS, o texto
 * fica na cor acesa — nunca ilegível.
 */
export function ScrollFill({
  text,
  className = "",
  accents = {},
  dimColor = "rgba(244,233,225,0.16)",
  litColor = "#F4E9E1",
}: ScrollFillProps) {
  const ref = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const words = Array.from(el.querySelectorAll<HTMLElement>("[data-sf]"));
    let raf = 0;

    const update = () => {
      raf = 0;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const progress = Math.min(1, Math.max(0, (vh * 0.85 - rect.top) / (vh * 0.55)));
      const lit = Math.round(progress * words.length);
      words.forEach((word, i) => {
        word.style.color =
          i < lit ? word.dataset.accent || litColor : dimColor;
      });
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [dimColor, litColor]);

  return (
    <h2 ref={ref} className={className}>
      {text.split(" ").map((word, i) => (
        <span
          key={i}
          data-sf
          data-accent={accents[word]}
          className="sf-word"
          style={{ color: accents[word] || litColor }}
        >
          {word}{" "}
        </span>
      ))}
    </h2>
  );
}
