'use client';

import { useCountUp } from '@/components/ui/CountUp';

export interface DonutSegment {
  value: number;
  color: string;
}

// A lightweight animated donut (pure SVG, no deps). The ring sweeps in clockwise
// from the top on mount via a 0→1 progress count-up, drawing each segment in
// order. Honours reduced-motion (the count-up jumps straight to full). Center
// content is passed as children.
export default function Donut({
  segments,
  size = 150,
  stroke = 18,
  children,
}: {
  segments: DonutSegment[];
  size?: number;
  stroke?: number;
  children?: React.ReactNode;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  const p = useCountUp(total > 0 ? 1 : 0, 900); // sweep progress 0→1
  const r = (size - stroke) / 2;
  const C = 2 * Math.PI * r;
  const c = size / 2;

  let start = 0; // cumulative fraction already drawn
  const arcs = segments.map((seg, i) => {
    const frac = total > 0 ? seg.value / total : 0;
    const drawn = Math.max(0, Math.min(frac, p - start)); // progressive reveal
    const node = (
      <circle
        key={i}
        cx={c}
        cy={c}
        r={r}
        fill="none"
        stroke={seg.color}
        strokeWidth={stroke}
        strokeDasharray={`${drawn * C} ${C}`}
        strokeDashoffset={-start * C}
      />
    );
    start += frac;
    return node;
  });

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={c} cy={c} r={r} fill="none" stroke="var(--bg3)" strokeWidth={stroke} />
        {total > 0 && arcs}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {children}
      </div>
    </div>
  );
}
