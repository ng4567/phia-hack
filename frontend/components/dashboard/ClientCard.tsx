'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import type { Client } from '@/lib/types';
import { formatDaysAgo } from '@/lib/utils';

type Props = {
  client: Client;
};

export function ClientCard({ client }: Props) {
  const latestLook = client.looks
    .slice()
    .sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )[0];

  const lastEditLabel = latestLook
    ? `LAST EDIT ${formatDaysAgo(latestLook.createdAt).toUpperCase()}`
    : 'NO LOOKS YET';

  return (
    <Link href={`/clients/${client.id}`} className="group block">
      <motion.article
        initial={false}
        whileHover={{ y: -4 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="overflow-hidden rounded-md border border-line-subtle bg-bg-primary editorial-shadow"
      >
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-bg-secondary">
          <motion.div
            className="absolute inset-0"
            initial={false}
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <Image
              src={client.photoUrl}
              alt={client.name}
              fill
              sizes="(min-width: 1024px) 40vw, 80vw"
              className="object-cover"
              unoptimized
            />
          </motion.div>
        </div>

        <motion.div
          aria-hidden
          initial={{ scaleX: 0 }}
          whileHover={{ scaleX: 1 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          style={{ transformOrigin: 'left' }}
          className="h-px w-full bg-line-visible"
        />

        <div className="px-6 py-6">
          <h3 className="font-display text-3xl font-light leading-tight text-ink">
            {client.name}
          </h3>
          <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-muted">
            {client.looks.length} LOOKS · {lastEditLabel}
          </p>
        </div>
      </motion.article>
    </Link>
  );
}
