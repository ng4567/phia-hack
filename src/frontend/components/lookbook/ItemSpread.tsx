'use client';

import Image from 'next/image';
import { useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import type { Garment } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

type Props = {
  garment: Garment;
  index: number;
  total: number;
};

const roman = (n: number): string =>
  ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x'][n - 1] ||
  String(n);

export function ItemSpread({ garment, index, total }: Props) {
  const match = garment.phiaMatch;
  const retail = garment.retailPrice;
  const phia = match?.lowestPrice ?? retail;

  const mv = useMotionValue(retail);
  const spring = useSpring(mv, { duration: 1200, bounce: 0 });
  const rounded = useTransform(spring, (v) => formatCurrency(Math.round(v)));

  useEffect(() => {
    // start from retail and count down to phia
    mv.set(retail);
    const id = requestAnimationFrame(() => {
      mv.set(phia);
    });
    return () => cancelAnimationFrame(id);
  }, [mv, retail, phia]);

  return (
    <section className="absolute inset-0 flex">
      {/* Left column: image */}
      <div className="relative w-1/2 h-full p-10">
        <div className="relative h-full w-full overflow-hidden rounded-lg bg-black/40">
          <Image
            src={garment.imageUrl}
            alt={garment.name}
            fill
            unoptimized
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          <div className="absolute bottom-8 left-8 flex items-baseline gap-3 text-white">
            <span className="font-display italic text-5xl font-light text-accent-purple/90 leading-none">
              {roman(index)}.
            </span>
            <span className="font-display italic text-2xl font-light text-white/85 capitalize">
              {garment.category}
            </span>
          </div>
        </div>
      </div>

      {/* Right column: editorial detail */}
      <div className="relative w-1/2 h-full flex items-center">
        <motion.div
          className="px-16 py-24 w-full"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
        >
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/50">
            PIECE {String(index).padStart(2, '0')} OF{' '}
            {String(total).padStart(2, '0')} · PHIA FOUND THIS
          </span>

          <h2 className="mt-8 font-display text-7xl-display italic font-light text-ink-inverse leading-[1.02]">
            {garment.name}
          </h2>

          <p className="mt-4 font-display text-3xl font-light text-white/70">
            {garment.brand}
          </p>

          {match && (
            <div className="mt-12 flex flex-col gap-4">
              <span className="font-mono text-xs uppercase tracking-[0.16em] text-white/40 line-through">
                {formatCurrency(retail)}
              </span>
              <motion.span className="font-display text-8xl-display font-light text-white leading-none">
                {rounded}
              </motion.span>
              <motion.span
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.0, duration: 0.5 }}
                className="font-display italic text-2xl text-accent-purple"
              >
                save {match.savingsPercent}%
              </motion.span>
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-white/50">
                on {match.source}
              </span>

              <span className="mt-4 font-mono text-[10px] uppercase tracking-[0.22em] text-white/40">
                {match.condition.toUpperCase()} CONDITION
              </span>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
