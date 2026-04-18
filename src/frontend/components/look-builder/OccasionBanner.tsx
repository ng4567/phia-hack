'use client';

import Link from 'next/link';
import type { Client } from '@/lib/types';
import { useLookBuilder } from '@/stores/useLookBuilder';

type Props = {
  client: Client;
};

export function OccasionBanner({ client }: Props) {
  const occasion = useLookBuilder((s) => s.occasion);
  const setOccasion = useLookBuilder((s) => s.setOccasion);

  const firstName = client.name.split(/\s+/)[0];
  const today = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-8 border-b border-line-subtle px-10 py-6">
      <div className="justify-self-start">
        <Link
          href={`/clients/${client.id}`}
          className="group inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-ink-muted transition-colors duration-200 ease-editorial hover:text-ink"
        >
          <span aria-hidden>&larr;</span>
          <span>BACK TO {firstName.toUpperCase()}</span>
        </Link>
      </div>

      <div className="justify-self-center">
        <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-muted">
          STYLING FOR &middot; {client.name.toUpperCase()}
        </span>
      </div>

      <div className="flex items-baseline justify-end gap-3 justify-self-end">
        <input
          type="text"
          value={occasion}
          onChange={(e) => setOccasion(e.target.value)}
          placeholder="untitled occasion"
          aria-label="Occasion"
          className="w-80 border-b border-line-subtle bg-transparent pb-1 text-right font-display text-2xl font-light italic text-ink outline-none transition-colors duration-200 ease-editorial placeholder:text-ink-disabled focus:border-ink"
        />
        <span className="whitespace-nowrap font-mono text-[11px] uppercase tracking-[0.2em] text-ink-muted">
          &middot; {today}
        </span>
      </div>
    </div>
  );
}
