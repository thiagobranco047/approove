"use client";

import { useEffect, useState } from "react";

const FIRST_SWAP_MS = 2800;
const INTERVAL_MS = 2400;

type Slot = "idle" | "in" | "out" | "wait";

/**
 * Troca a palavra em destaque do hero. A primeira entra com o rise do título;
 * as seguintes sobem no mesmo mask, uma por vez.
 */
export function RotatingWord({ words }: { words: string[] }) {
  const [cycle, setCycle] = useState<{ index: number; prev: number | null }>({
    index: 0,
    prev: null,
  });

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motion.matches || words.length < 2) return;

    const advance = () => {
      setCycle((state) => ({
        index: (state.index + 1) % words.length,
        prev: state.index,
      }));
    };

    let interval = 0;
    const start = window.setTimeout(() => {
      advance();
      interval = window.setInterval(advance, INTERVAL_MS);
    }, FIRST_SWAP_MS);

    return () => {
      window.clearTimeout(start);
      window.clearInterval(interval);
    };
  }, [words.length]);

  return (
    <span className="hero-rotator">
      {words.map((word, i) => (
        <span
          key={word}
          data-state={slotState(i, cycle.index, cycle.prev)}
          aria-hidden={i !== cycle.index}
        >
          {word}
        </span>
      ))}
    </span>
  );
}

function slotState(i: number, index: number, prev: number | null): Slot {
  if (i === index) return prev === null ? "idle" : "in";
  if (i === prev) return "out";
  return "wait";
}
