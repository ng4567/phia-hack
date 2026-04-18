'use client';

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Client, Garment, Look, Stylist } from '@/lib/types';
import { CoverSpread } from './CoverSpread';
import { LookSpread } from './LookSpread';
import { ItemSpread } from './ItemSpread';
import { TotalsSpread } from './TotalsSpread';

type Props = {
  look: Look;
  client: Client;
  stylist: Stylist;
};

type PageEntry =
  | { kind: 'cover' }
  | { kind: 'look' }
  | { kind: 'item'; garment: Garment; itemIndex: number }
  | { kind: 'totals' };

export function LookbookShell({ look, client, stylist }: Props) {
  const pages = useMemo<PageEntry[]>(() => {
    const itemPages: PageEntry[] = look.garments.map((g, i) => ({
      kind: 'item' as const,
      garment: g,
      itemIndex: i + 1,
    }));
    return [
      { kind: 'cover' as const },
      { kind: 'look' as const },
      ...itemPages,
      { kind: 'totals' as const },
    ];
  }, [look.garments]);

  const [page, setPage] = useState(0);
  const total = pages.length;
  const totalItems = look.garments.length;

  const goPrev = () => setPage((p) => Math.max(0, p - 1));
  const goNext = () => setPage((p) => Math.min(total - 1, p + 1));

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goNext();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total]);

  const current = pages[page];

  return (
    <div
      className="fixed inset-0 bg-bg-inverse text-ink-inverse overflow-hidden"
      style={{ perspective: 1400 }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={page}
          className="absolute inset-0"
          style={{
            transformStyle: 'preserve-3d',
            transformOrigin: 'left center',
          }}
          initial={{ opacity: 0, rotateY: 30, x: 60 }}
          animate={{ opacity: 1, rotateY: 0, x: 0 }}
          exit={{ opacity: 0, rotateY: -30, x: -60 }}
          transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
        >
          {current.kind === 'cover' && (
            <CoverSpread client={client} look={look} stylist={stylist} />
          )}
          {current.kind === 'look' && (
            <LookSpread client={client} look={look} onAdvance={goNext} />
          )}
          {current.kind === 'item' && (
            <ItemSpread
              garment={current.garment}
              index={current.itemIndex}
              total={totalItems}
            />
          )}
          {current.kind === 'totals' && (
            <TotalsSpread
              look={look}
              client={client}
              onReset={() => setPage(0)}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Tap zones */}
      <button
        type="button"
        aria-label="Previous page"
        onClick={goPrev}
        className="absolute inset-y-0 left-0 w-1/3 z-20 cursor-w-resize bg-transparent"
      />
      <button
        type="button"
        aria-label="Next page"
        onClick={goNext}
        className="absolute inset-y-0 right-0 w-1/3 z-20 cursor-e-resize bg-transparent"
      />

      {/* Page counter + chevrons */}
      <div className="absolute bottom-6 right-8 z-30 flex items-center gap-4">
        <button
          type="button"
          onClick={goPrev}
          aria-label="Previous"
          className="text-ink-inverse/60 hover:text-ink-inverse transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-inverse/70 tabular-nums">
          {String(page + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
        </span>
        <button
          type="button"
          onClick={goNext}
          aria-label="Next"
          className="text-ink-inverse/60 hover:text-ink-inverse transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
