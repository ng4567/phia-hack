'use client';

import { motion } from 'framer-motion';
import { Edit3, Heart } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { EyebrowLabel } from '@/components/shared/EyebrowLabel';
import { PillButton } from '@/components/shared/PillButton';
import { PriceBadge } from '@/components/shared/PriceBadge';
import { ShareModal } from '@/components/share-modal/ShareModal';
import type { Client, Look } from '@/lib/types';
import { cn, sum } from '@/lib/utils';

type Props = {
  client: Client;
  look: Look;
};

export function LookResult({ client, look }: Props) {
  const [shareOpen, setShareOpen] = useState(false);

  const firstName = client.name.split(' ')[0] ?? client.name;

  const { retailTotal, phiaTotal, savingsPercent, sourceCount } = useMemo(() => {
    const retail = sum(look.garments, (g) => g.retailPrice);
    const phia = sum(look.garments, (g) => g.phiaMatch?.lowestPrice ?? 0);
    const pct =
      retail > 0 ? Math.round((1 - phia / retail) * 100) : 0;
    const sources = new Set(
      look.garments
        .map((g) => g.phiaMatch?.source)
        .filter((s): s is string => Boolean(s)),
    );
    return {
      retailTotal: retail,
      phiaTotal: phia,
      savingsPercent: pct,
      sourceCount: sources.size,
    };
  }, [look.garments]);

  return (
    <div className="mx-auto max-w-[1400px] px-10 py-10">
      <div className="flex items-center justify-between">
        <Link
          href={`/clients/${client.id}`}
          className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-muted transition-colors hover:text-ink-primary"
        >
          ← {firstName}&apos;s looks
        </Link>
        <PillButton
          variant="ghost"
          size="sm"
          href={`/clients/${client.id}/looks/new`}
        >
          <Edit3 className="h-3.5 w-3.5" />
          Edit look
        </PillButton>
      </div>

      <div className="mt-8 grid grid-cols-[1.05fr_1fr] gap-12">
        {/* Left: try-on image */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="relative aspect-[4/5] overflow-hidden rounded-lg border border-line-subtle bg-bg-secondary"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#eae3ef] via-[#f8f4f0] to-[#f3d6c3]" />
          <Image
            src={client.photoUrl}
            alt={`${client.name} in look`}
            fill
            className="object-cover opacity-90 mix-blend-luminosity"
            unoptimized
          />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="absolute left-4 top-4"
          >
            <span className="rounded-full bg-bg-primary/80 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-primary backdrop-blur">
              Try-on · FASHN
            </span>
          </motion.div>
        </motion.div>

        {/* Right: breakdown */}
        <div className="flex flex-col">
          <EyebrowLabel>
            The Look{look.occasion ? ` · ${look.occasion.toUpperCase()}` : ''}
          </EyebrowLabel>
          <h2 className="mt-3 font-display text-6xl-display font-light text-ink-primary">
            {firstName}&apos;s{' '}
            <span className="display-italic">
              {look.occasion ?? 'look'}
            </span>
          </h2>

          <ul className="mt-10">
            {look.garments.map((g, i) => (
              <li
                key={g.id}
                className={cn(
                  'flex items-center gap-5 border-b border-line-subtle py-5',
                  i === 0 && 'border-t',
                )}
              >
                <div className="relative h-24 w-[72px] flex-none overflow-hidden rounded-sm bg-bg-secondary">
                  <Image
                    src={g.imageUrl}
                    alt={g.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-muted">
                    {g.brand}
                  </span>
                  <p className="mt-1 truncate font-display text-xl font-light text-ink-primary">
                    {g.name}
                  </p>
                  {g.phiaMatch && (
                    <span className="mt-1 block font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">
                      {g.phiaMatch.condition} · {g.phiaMatch.source}
                    </span>
                  )}
                </div>
                {g.phiaMatch && (
                  <PriceBadge
                    layout="stacked"
                    retailPrice={g.retailPrice}
                    phiaPrice={g.phiaMatch.lowestPrice}
                    savingsPercent={g.phiaMatch.savingsPercent}
                    source={g.phiaMatch.source}
                    className="flex-none items-end text-right"
                  />
                )}
              </li>
            ))}
          </ul>

          <div className="mt-8 border-t border-line-visible pt-8">
            <EyebrowLabel>Totals</EyebrowLabel>
            <div className="mt-4">
              <PriceBadge
                layout="hero"
                retailPrice={retailTotal}
                phiaPrice={phiaTotal}
                savingsPercent={savingsPercent}
                source={`across ${sourceCount} Phia source${
                  sourceCount === 1 ? '' : 's'
                }`}
              />
            </div>
          </div>

          <div className="mt-10 flex gap-3">
            <PillButton
              variant="accent"
              size="lg"
              onClick={() => setShareOpen(true)}
            >
              <Heart className="h-4 w-4" />
              Share with {firstName}
            </PillButton>
            <PillButton
              variant="ghost"
              size="lg"
              href={`/clients/${client.id}/looks/new`}
            >
              <Edit3 className="h-4 w-4" />
              Edit look
            </PillButton>
          </div>
        </div>
      </div>

      <ShareModal
        open={shareOpen}
        onOpenChange={setShareOpen}
        lookId={look.id}
        clientFirstName={firstName}
      />
    </div>
  );
}
