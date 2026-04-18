'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import type { Client, Look } from '@/lib/types';
import { EyebrowLabel } from '@/components/shared/EyebrowLabel';
import { formatCurrency } from '@/lib/utils';

type Props = {
  client: Client;
  look: Look;
  onAdvance: () => void;
};

const roman = (n: number): string =>
  ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x'][n - 1] ||
  String(n);

export function LookSpread({ client, look, onAdvance: _onAdvance }: Props) {
  const firstName = client.name.split(' ')[0].toLowerCase();

  return (
    <section className="absolute inset-0 flex">
      {/* Left column: try-on */}
      <div className="relative w-[60%] h-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#201626] via-[#2a1f36] to-[#150f1d]" />
        <Image
          src={client.photoUrl}
          alt=""
          fill
          unoptimized
          priority
          className="object-cover opacity-80 mix-blend-luminosity"
        />
        <div className="absolute top-8 left-8 z-10">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur px-4 py-2 font-mono text-[10px] uppercase tracking-[0.22em] text-white/80 border border-white/15">
            TRY-ON · FASHN
          </span>
        </div>
      </div>

      {/* Right column: editorial list */}
      <div className="relative w-[40%] h-full overflow-y-auto">
        <motion.div
          className="pt-24 px-14 pb-16"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
        >
          <EyebrowLabel className="text-white/60">
            THE LOOK{look.occasion ? ` · ${look.occasion.toUpperCase()}` : ''}
          </EyebrowLabel>

          <h2 className="mt-6 font-display text-6xl-display font-light text-ink-inverse leading-tight">
            for <span className="italic">{firstName}</span>
          </h2>

          <div className="mt-12">
            {look.garments.map((g, i) => (
              <motion.div
                key={g.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.6,
                  ease: [0.22, 1, 0.36, 1],
                  delay: 0.4 + i * 0.1,
                }}
                className="py-4 border-b border-white/10"
              >
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/50">
                  {roman(i + 1)}. THE {g.category.toUpperCase()}
                </span>
                <h3 className="font-display text-3xl font-light mt-1 text-ink-inverse">
                  {g.name}
                </h3>
                {g.phiaMatch && (
                  <p className="font-mono text-[11px] text-white/60 uppercase tracking-[0.14em] mt-1">
                    {g.brand} · {formatCurrency(g.retailPrice)} →{' '}
                    {formatCurrency(g.phiaMatch.lowestPrice)}
                  </p>
                )}
              </motion.div>
            ))}
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              duration: 0.8,
              delay: 0.4 + look.garments.length * 0.1 + 0.2,
            }}
            className="mt-12 font-mono text-[10px] uppercase tracking-[0.24em] text-white/50"
          >
            TURN THE PAGE TO SEE EACH PIECE
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}
