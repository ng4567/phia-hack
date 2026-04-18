'use client';

import { useEffect, useMemo } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Bookmark, Heart } from 'lucide-react';
import type { Client, Look } from '@/lib/types';
import { formatCurrency, sum } from '@/lib/utils';
import { EyebrowLabel } from '@/components/shared/EyebrowLabel';
import { PillButton } from '@/components/shared/PillButton';

type Props = {
  look: Look;
  client: Client;
  onReset: () => void;
};

export function TotalsSpread({ look, client: _client, onReset }: Props) {
  const retailTotal = useMemo(
    () => sum(look.garments, (g) => g.retailPrice),
    [look.garments],
  );
  const phiaTotal = useMemo(
    () =>
      sum(look.garments, (g) => g.phiaMatch?.lowestPrice ?? g.retailPrice),
    [look.garments],
  );
  const savings = retailTotal - phiaTotal;
  const savingsPct = retailTotal
    ? Math.round((savings / retailTotal) * 100)
    : 0;

  const mv = useMotionValue(retailTotal);
  const spring = useSpring(mv, { duration: 1400, bounce: 0 });
  const rounded = useTransform(spring, (v) => formatCurrency(Math.round(v)));

  useEffect(() => {
    mv.set(retailTotal);
    const id = requestAnimationFrame(() => {
      mv.set(phiaTotal);
    });
    return () => cancelAnimationFrame(id);
  }, [mv, retailTotal, phiaTotal]);

  return (
    <section className="absolute inset-0 flex items-center justify-center overflow-y-auto">
      <motion.div
        className="w-full max-w-3xl px-10 py-20 text-center flex flex-col items-center"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <EyebrowLabel className="text-white/60">
          YOUR LOOK
          {look.occasion ? ` · SARAH'S ${look.occasion.toUpperCase()}` : ''}
        </EyebrowLabel>

        <h2 className="mt-8 font-display text-6xl-display font-light text-ink-inverse leading-tight">
          styled by jess <span className="italic">· priced by phia</span>
        </h2>

        <div className="mt-16 flex flex-col items-center gap-6">
          <div className="flex flex-col items-center gap-1">
            <span className="font-display text-6xl-display font-light text-white/40 line-through leading-none">
              {formatCurrency(retailTotal)}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/40 mt-2">
              {formatCurrency(retailTotal)} retail
            </span>
          </div>

          <motion.span
            className="font-display text-8xl-display font-light text-white leading-none mt-2"
          >
            {rounded}
          </motion.span>

          <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-white/60">
            {savingsPct}% SAVINGS · ACROSS PHIA&apos;S 40,000 SITES
          </span>

          <motion.span
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="mt-4 inline-flex items-center rounded-full border border-accent-purple/50 bg-accent-purple/10 px-5 py-2 font-display italic text-xl text-accent-purple"
          >
            save {formatCurrency(savings)}
          </motion.span>
        </div>

        <div className="mt-12 flex items-center gap-4">
          <PillButton variant="accent" size="lg">
            <Heart className="w-4 h-4" />
            love it
          </PillButton>
          <PillButton variant="inverse" size="lg">
            <Bookmark className="w-4 h-4" />
            save for later
          </PillButton>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="mt-10 font-mono text-[10px] uppercase tracking-[0.28em] text-white/50 hover:text-white/80 transition-colors"
        >
          START OVER
        </button>
      </motion.div>
    </section>
  );
}
