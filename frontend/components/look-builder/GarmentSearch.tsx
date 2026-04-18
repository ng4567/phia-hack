'use client';

import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Garment, GarmentCategory } from '@/lib/types';
import { GarmentTile } from './GarmentTile';
import { cn } from '@/lib/utils';

type Props = {
  garments: Garment[];
};

type ChipKey = 'all' | GarmentCategory;

const CHIPS: { key: ChipKey; label: string }[] = [
  { key: 'all', label: 'ALL' },
  { key: 'top', label: 'TOP' },
  { key: 'bottom', label: 'BOTTOM' },
  { key: 'one-piece', label: 'ONE-PIECE' },
  { key: 'shoes', label: 'SHOES' },
  { key: 'outerwear', label: 'OUTERWEAR' },
  { key: 'accessory', label: 'ACCESSORY' },
];

export function GarmentSearch({ garments }: Props) {
  const [query, setQuery] = useState('');
  const [activeChip, setActiveChip] = useState<ChipKey>('all');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return garments.filter((g) => {
      if (activeChip !== 'all' && g.category !== activeChip) return false;
      if (!q) return true;
      return (
        g.name.toLowerCase().includes(q) ||
        g.brand.toLowerCase().includes(q)
      );
    });
  }, [garments, query, activeChip]);

  return (
    <div className="flex h-full flex-col">
      <div className="relative">
        <Search
          className="absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
          strokeWidth={1.5}
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search garments or brands"
          className="w-full rounded-full border-none bg-bg-secondary py-3 pl-12 pr-5 font-sans text-sm text-ink outline-none transition-colors duration-200 ease-editorial placeholder:text-ink-muted focus:bg-bg-tertiary"
        />
      </div>

      <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2">
        {CHIPS.map((chip) => {
          const active = activeChip === chip.key;
          return (
            <button
              key={chip.key}
              type="button"
              onClick={() => setActiveChip(chip.key)}
              className={cn(
                'relative py-1 font-mono text-[11px] uppercase tracking-[0.18em] transition-colors duration-200 ease-editorial',
                active ? 'text-ink' : 'text-ink-muted hover:text-ink',
              )}
            >
              {chip.label}
              {active && (
                <motion.span
                  layoutId="active-chip-underline"
                  className="absolute inset-x-0 -bottom-0.5 h-px bg-ink"
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-6 min-h-0 flex-1 overflow-y-auto pr-1">
        {filtered.length === 0 ? (
          <div className="flex h-40 items-center justify-center rounded-md border border-dashed border-line-visible">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-muted">
              NO MATCHES
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((g) => (
              <GarmentTile key={g.id} garment={g} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
