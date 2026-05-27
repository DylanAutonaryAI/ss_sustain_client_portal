'use client';

import { useEffect, useRef, useState } from 'react';

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

// Animate a number from its previous value up (or down) to `target` with an
// ease-out, on mount and whenever `target` changes. Honours prefers-reduced-motion
// (jumps straight to the value). Drives both stat numbers and bar widths.
export function useCountUp(target: number, durationMs = 850): number {
  const [value, setValue] = useState(0); // always count up from 0 on first mount
  const fromRef = useRef(0);          // where this run starts from
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const reduce = typeof window !== 'undefined'
      && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !isFinite(target)) {
      setValue(target);
      fromRef.current = target;
      return;
    }

    const from = fromRef.current;
    const start = performance.now();
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      setValue(from + (target - from) * easeOutCubic(t));
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = target; // next run counts from here
      }
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, durationMs]);

  return value;
}

// Split a pre-formatted stat string into prefix / number / suffix, e.g.
//   "£2,220"  → { prefix: "£", num: 2220, decimals: 0, suffix: "" }
//   "100%"    → { prefix: "",  num: 100,  decimals: 0, suffix: "%" }
//   "1.0mo"   → { prefix: "",  num: 1,    decimals: 1, suffix: "mo" }
//   "£185/mo" → { prefix: "£", num: 185,  decimals: 0, suffix: "/mo" }
function parseStat(text: string) {
  const m = text.match(/^(\D*?)(\d[\d,]*(?:\.\d+)?)(.*)$/);
  if (!m) return null;
  const [, prefix, numStr, suffix] = m;
  const num = parseFloat(numStr.replace(/,/g, ''));
  if (!isFinite(num)) return null;
  const decimals = numStr.includes('.') ? numStr.split('.')[1].length : 0;
  return { prefix, num, decimals, suffix };
}

// Renders a formatted stat string with its numeric part counting up. If there's
// no number to animate (e.g. "—", "All up to date"), it just renders the text.
export default function AnimatedStat({ text }: { text: string }) {
  const parsed = parseStat(text);
  const animated = useCountUp(parsed ? parsed.num : 0);
  if (!parsed) return <>{text}</>;
  const shown = animated.toLocaleString('en-GB', {
    minimumFractionDigits: parsed.decimals,
    maximumFractionDigits: parsed.decimals,
  });
  return <>{parsed.prefix}{shown}{parsed.suffix}</>;
}
