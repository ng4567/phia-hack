'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import type { Client, Look, Stylist } from '@/lib/types';
import { EyebrowLabel } from '@/components/shared/EyebrowLabel';

type Props = {
  client: Client;
  look: Look;
  stylist: Stylist;
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

export function CoverSpread({ client, look, stylist }: Props) {
  const firstName = client.name.split(' ')[0].toLowerCase();

  return (
    <section className="absolute inset-0 flex items-center justify-center overflow-hidden">
      {/* Backdrop image */}
      <div className="absolute inset-0">
        <Image
          src={client.photoUrl}
          alt=""
          fill
          unoptimized
          priority
          className="object-cover opacity-20 mix-blend-luminosity"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-[#0a0a0a]/70 to-[#0a0a0a]" />
      </div>

      {/* Centered content */}
      <motion.div
        className="relative z-10 flex flex-col items-center text-center px-10"
        initial="hidden"
        animate="show"
        variants={{
          show: { transition: { staggerChildren: 0.14, delayChildren: 0.1 } },
        }}
      >
        <motion.div variants={item} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
          <EyebrowLabel className="text-white/60">
            ISSUE 01 · PRIVATE PRESS
          </EyebrowLabel>
        </motion.div>

        <motion.span
          variants={item}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mt-14 font-mono text-[11px] uppercase tracking-[0.28em] text-white/60"
        >
          STYLED FOR
        </motion.span>

        <motion.h1
          variants={item}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="mt-6 font-display text-8xl-display italic font-light text-ink-inverse leading-none"
        >
          {firstName}
        </motion.h1>

        <motion.div
          variants={item}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mt-10 w-24 h-px bg-white/40"
        />

        <motion.p
          variants={item}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mt-6 font-display italic text-2xl font-light text-white/80"
        >
          by jess
        </motion.p>

        <motion.p
          variants={item}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mt-4 font-mono text-[10px] uppercase tracking-[0.22em] text-white/50"
        >
          {stylist.handle}
          {look.occasion ? ` · ${look.occasion}` : ''}
        </motion.p>
      </motion.div>

      {/* Bottom hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 1, 0.4, 1] }}
        transition={{ delay: 1.6, duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-14 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.28em] text-white/50"
      >
        <span>PRESS</span>
        <ArrowRight className="w-3.5 h-3.5" />
        <span>TO OPEN</span>
      </motion.div>
    </section>
  );
}
