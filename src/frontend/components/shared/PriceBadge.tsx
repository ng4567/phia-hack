'use client';

import { motion, useInView, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { cn, formatCurrency } from '@/lib/utils';

type Props = {
  retailPrice: number;
  phiaPrice: number;
  savingsPercent: number;
  source?: string;
  layout?: 'inline' | 'stacked' | 'hero';
  className?: string;
};

export function PriceBadge({
  retailPrice,
  phiaPrice,
  savingsPercent,
  source,
  layout = 'inline',
  className,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });

  const mv = useMotionValue(retailPrice);
  const spring = useSpring(mv, { duration: 1400, bounce: 0 });
  const rounded = useTransform(spring, (latest) =>
    formatCurrency(Math.round(latest)),
  );

  useEffect(() => {
    if (inView) mv.set(phiaPrice);
  }, [inView, phiaPrice, mv]);

  if (layout === 'hero') {
    return (
      <div ref={ref} className={cn('flex flex-col items-start gap-3', className)}>
        <div className="flex items-baseline gap-4">
          <span className="font-mono text-xs uppercase tracking-[0.14em] text-ink-muted line-through">
            {formatCurrency(retailPrice)}
          </span>
          <motion.span className="font-display text-6xl-display font-light text-ink-primary">
            {rounded}
          </motion.span>
        </div>
        <motion.span
          initial={{ opacity: 0, scale: 0.9 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ delay: 0.9, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="display-italic text-xl text-accent-purple"
        >
          save {savingsPercent}%
        </motion.span>
        {source && (
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-muted">
            on {source}
          </span>
        )}
      </div>
    );
  }

  if (layout === 'stacked') {
    return (
      <div ref={ref} className={cn('flex flex-col gap-1', className)}>
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-muted line-through">
          {formatCurrency(retailPrice)} retail
        </span>
        <div className="flex items-baseline gap-2">
          <motion.span className="font-display text-2xl font-light text-ink-primary">
            {rounded}
          </motion.span>
          <span className="font-sans text-xs text-accent-purple">
            save {savingsPercent}%
          </span>
        </div>
        {source && (
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">
            {source}
          </span>
        )}
      </div>
    );
  }

  return (
    <div ref={ref} className={cn('flex items-baseline gap-3', className)}>
      <span className="font-mono text-xs text-ink-muted line-through">
        {formatCurrency(retailPrice)}
      </span>
      <motion.span className="font-sans text-base font-medium text-ink-primary">
        {rounded}
      </motion.span>
      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent-purple">
        −{savingsPercent}%
      </span>
    </div>
  );
}
