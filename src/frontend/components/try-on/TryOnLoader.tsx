'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';

type Props = {
  clientFirstName?: string;
};

export function TryOnLoader({ clientFirstName = 'Sarah' }: Props) {
  const [step, setStep] = useState(0);

  const lines = [
    `Dressing ${clientFirstName}...`,
    'Checking Phia for every piece...',
    'Finding the best prices...',
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((s) => (s < lines.length - 1 ? s + 1 : s));
    }, 1000);
    return () => clearInterval(interval);
  }, [lines.length]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-primary">
      <div className="flex flex-col items-center gap-10 px-10 text-center">
        <span className="font-mono text-[11px] uppercase tracking-[0.24em] text-ink-muted">
          Phia Try-On · Generating
        </span>

        <div className="relative h-px w-40 overflow-hidden bg-line-subtle">
          <motion.div
            className="absolute inset-y-0 left-0 w-1/3 bg-accent-purple"
            initial={{ x: '-100%' }}
            animate={{ x: '300%' }}
            transition={{
              duration: 1.6,
              ease: [0.22, 1, 0.36, 1],
              repeat: Infinity,
            }}
          />
        </div>

        <div className="min-h-[88px] max-w-[620px]">
          <AnimatePresence mode="wait">
            <motion.p
              key={step}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="font-display text-6xl-display font-light text-ink-primary"
            >
              {lines[step]}
            </motion.p>
          </AnimatePresence>
        </div>

        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-muted">
          Using Phia + FASHN · Across 40,000+ sites
        </span>
      </div>
    </div>
  );
}
