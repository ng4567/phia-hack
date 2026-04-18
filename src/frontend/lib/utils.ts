'use client';

import { useEffect, useState } from 'react';

export function cx(...xs: Array<string | false | null | undefined>): string {
  return xs.filter(Boolean).join(' ');
}

export function fmt(n: number): string {
  return '$' + Math.round(n).toLocaleString();
}

// Count-up hook — animates from 0 to target when `trigger` changes.
// Faithful port of useCountUp from shared.jsx (lines 8–23).
export function useCountUp(
  target: number,
  { duration = 900, trigger }: { duration?: number; trigger?: unknown } = {}
): number {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let raf: number;
    const start = performance.now();
    const from = 0;
    function tick(t: number) {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(from + (target - from) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, trigger, duration]);
  return val;
}
